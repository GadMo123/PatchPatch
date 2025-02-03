// src/game/betting/BettingManager.ts
import { Game } from "../Game";
import { ActionValidator } from "./ActionValidator";
import { BettingState, TableConfig, PlayerAction } from "./BettingTypes";
import { PlayerInGame } from "../types/PlayerInGame";
import {
  findFirstPlayerToAct,
  findNextPlayerToAct,
} from "../utils/PositionsUtils";
import { GameActionTimerManager } from "../utils/GameActionTimerManager";
import { BettingRoundPotManager } from "./BettingRoundPotManager";
import { Mutex } from "async-mutex";
import { Position } from "shared";

export class BettingManager {
  private _awaitingPlayersAction: any;
  private _bettingState: BettingState;
  private _currentPlayerToAct: PlayerInGame;
  private _actionValidator: ActionValidator;
  private _processingAction: Mutex;
  private _timerManager: GameActionTimerManager;
  private _biggestBetToCall: number; // The amount a player have to complate to the pot to call (reducing previous contributions)
  private _potManager: BettingRoundPotManager;
  // This is a marker pointing to the last player to take an aggresive action, if the action returns to him without more aggrestion - we know the betting round ends.
  private _roundEndsCondition: PlayerInGame;

  constructor(
    private _game: Game,
    tableConfig: TableConfig,
    private _onBettingRoundComplete: (winner: PlayerInGame | null) => void,
    isPreflop: boolean
  ) {
    this._actionValidator = new ActionValidator(tableConfig);
    this._currentPlayerToAct = findFirstPlayerToAct(this._game);
    this._roundEndsCondition = this._currentPlayerToAct;
    this._biggestBetToCall = 0;
    this._processingAction = new Mutex();
    this._awaitingPlayersAction = false;

    this._bettingState = {
      timeRemaining: 0,
      timeCookiesUsedThisRound: 0,
      playerValidActions: [],
      playerToAct: this._currentPlayerToAct.getId(),
      potContributions: new Map(
        Array.from(_game.getPlayersInGame()!.values())
          .filter((player) => player?.isActive())
          .map((player) => [player!, 0])
      ),
    };
    this._potManager = new BettingRoundPotManager();
    const timebanksPerRound = parseInt(process.env.COOKIES_PER_ROUND ?? "3");
    this._timerManager = new GameActionTimerManager({
      duration: tableConfig.timePerAction,
      networkBuffer: 1000,
      timeCookieEffect: tableConfig.timeCookieEffect,
      maxCookiesPerRound: timebanksPerRound,
      updateTimeRemianing: (timeRemaining: number) =>
        this.updateBettingState({ timeRemaining: timeRemaining }),
      onTimeout: this.doDefualtActionOnTimeout.bind(this),
      onComplete: this.cleanupTimerState.bind(this),
    });
    if (isPreflop) {
      this._potManager.takeBlinds(
        _game.getPlayerInPosition(Position.SB)!,
        _game.getPlayerInPosition(Position.BB)!,
        tableConfig.sbAmount,
        tableConfig.bbAmount
      );
      this._biggestBetToCall = tableConfig.bbAmount; // for the current scope, we force the BB player (in hand preparation) to have at least 1BB in order to play a hand.
    }
  }

  startNextPlayerTurn() {
    this._bettingState.playerValidActions =
      this._actionValidator.getValidActions(
        this._bettingState,
        this._currentPlayerToAct,
        this._biggestBetToCall
      );
    console.log("starting player turn " + this._currentPlayerToAct.getId());
    this._timerManager.start();
    this._awaitingPlayersAction = true;
    this.broadcastBettingState();
  }

  async handlePlayerAction(
    playerId: string,
    action: PlayerAction,
    amount?: number
  ): Promise<boolean> {
    await this._processingAction.acquire();
    try {
      if (
        this._currentPlayerToAct.getId() !== playerId ||
        !this._awaitingPlayersAction
      )
        return false;
      const validActions = this._actionValidator.getValidActions(
        this._bettingState,
        this._currentPlayerToAct,
        this._biggestBetToCall
      );

      // Calculate call amount in case of 'call' action
      if (action === "call")
        amount = this._potManager.getRemainingToCall(this._currentPlayerToAct);

      const validation = this._actionValidator.validateAction(
        action,
        amount,
        this._currentPlayerToAct,
        validActions
      );

      if (!validation.isValid) {
        console.log(`Invalid action: ${validation.error}`);
        action = validActions.includes("check") ? "check" : "fold"; // take default action
        amount = 0;
      }

      this._potManager.addContribution(this._currentPlayerToAct, amount || 0);

      // When a player raise or bet a valid amount, he has the new biggest bet this round.
      if ((amount ?? 0 > 0) && (action == "raise" || action == "bet")) {
        this._roundEndsCondition = this._currentPlayerToAct;
        this._biggestBetToCall = this._bettingState.potContributions.get(
          this._currentPlayerToAct
        )!;
      }

      if (action == "fold")
        this._currentPlayerToAct.updatePlayerPublicState({ isFolded: true });

      // Update betting state with latest pot contributions
      this.updateBettingState({
        potContributions: this._potManager.getContributions(),
      });

      this._timerManager.handleAction(); // Signal timer that we recived a valid action from the player

      this._awaitingPlayersAction = false;
      this._processingAction.release();
      // Run after returning true
      setImmediate(() => this.onPlayerActionDone());
      return true;
    } catch (error) {
      return false;
    } finally {
      this._processingAction.release();
    }
  }

  private cleanupTimerState() {
    this.updateBettingState({
      timeRemaining: 0,
      timeCookiesUsedThisRound: 0,
    });
  }

  private onPlayerActionDone() {
    console.log("onPlayerActionDone ");
    const lastPlayer = this._currentPlayerToAct;
    this.switchToNextPlayer();
    if (this.isBettingRoundComplete()) {
      const winner =
        this._currentPlayerToAct === lastPlayer ? lastPlayer : null;
      this._onBettingRoundComplete(winner);
    } else this.startNextPlayerTurn();
  }

  private doDefualtActionOnTimeout(): void {
    console.log("doDefualtActionOnTimeout ");
    const defaultAction = this._actionValidator
      .getValidActions(
        this._bettingState,
        this._currentPlayerToAct,
        this._biggestBetToCall
      )
      .includes("check")
      ? "check"
      : "fold";
    this.handlePlayerAction(this._currentPlayerToAct.getId(), defaultAction);
  }

  private isBettingRoundComplete(): boolean {
    const activePlayers = Array.from(
      this._bettingState.potContributions.keys()
    ).filter((player) => player.isActive());

    // Round is complete if:
    // 1. Only one player remains (others folded or allin)
    // 2. action is back to the last aggresor (or first player to act in case there is no aggresion behind)
    return (
      activePlayers.length <= 1 ||
      this._currentPlayerToAct === this._roundEndsCondition
    );
  }

  private switchToNextPlayer() {
    this._currentPlayerToAct = findNextPlayerToAct(
      this._currentPlayerToAct.getPosition(),
      this._game
    );
    this.updateBettingState({ playerToAct: this._currentPlayerToAct.getId() });
  }

  private updateBettingState(partialUpdate: Partial<BettingState>) {
    this._bettingState = {
      ...this._bettingState,
      ...partialUpdate,
    };
  }

  private broadcastBettingState() {
    this._game.updateGameStateAndBroadcast(
      { bettingState: this._bettingState },
      null
    );
  }

  getCurrentPlayerToAct() {
    return this._currentPlayerToAct;
  }
}
