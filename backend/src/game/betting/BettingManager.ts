// src/game/betting/BettingManager.ts - Handles a single betting round start logic to finish, timings, actions, broadcasting changes, pot updates ect.
import { Game } from "../Game";
import { ActionValidator } from "./ActionValidator";
import { BettingState, TableConfig } from "./BettingTypes";
import { PlayerInGame } from "../types/PlayerInGame";
import {
  findFirstPlayerToAct,
  findNextPlayerToAct,
} from "../utils/PokerPositionsUtils";
import { GameActionTimerManager } from "../utils/GameActionTimerManager";
import { BettingRoundPotManager } from "./BettingRoundPotManager";
import { Mutex } from "async-mutex";
import { BettingTypes, Position } from "@patchpatch/shared";

export class BettingManager {
  private _awaitingPlayersAction: any;
  private _bettingState: BettingState;
  private _currentPlayerToAct: PlayerInGame;
  private _actionValidator: ActionValidator;
  private _processingAction: Mutex;
  private _timerManager: GameActionTimerManager;
  private _bettingRoundPotManager: BettingRoundPotManager;
  // This is a marker pointing to the last player to take an aggresive action, if the action returns to him without more aggrestion - we know the betting round ends.
  private _roundEndsCondition: PlayerInGame;
  private _isFirstTurn;

  constructor(
    private _game: Game,
    private _onBettingRoundComplete: (winner: PlayerInGame | null) => void,
    isPreflop: boolean
  ) {
    this._actionValidator = new ActionValidator(_game.getTableConfig());
    this._currentPlayerToAct = findFirstPlayerToAct(this._game);
    this._roundEndsCondition = this._currentPlayerToAct; // when a full round goes without bet or raise, we know the round ends.
    this._isFirstTurn = true;
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
    this._bettingRoundPotManager = new BettingRoundPotManager();
    const timebanksPerRound = parseInt(process.env.COOKIES_PER_ROUND ?? "3");
    this._timerManager = new GameActionTimerManager({
      duration: _game.getTableConfig().timePerAction,
      networkBuffer: 1000,
      timeCookieEffect: _game.getTableConfig().timeCookieEffect,
      maxCookiesPerRound: timebanksPerRound,
      updateTimeRemianing: (timeRemaining: number) =>
        this.updateBettingState({ timeRemaining: timeRemaining }),
      onTimeout: this.doDefualtActionOnTimeout.bind(this),
      onComplete: this.cleanupTimerState.bind(this),
    });
    if (isPreflop) {
      this._bettingRoundPotManager.takeBlinds(
        _game.getPlayerInPosition(Position.SB)!,
        _game.getPlayerInPosition(Position.BB)!,
        _game.getTableConfig().sbAmount,
        _game.getTableConfig().bbAmount
      );
    }
  }

  startNextPlayerTurn() {
    this._bettingState.callAmount =
      this._bettingRoundPotManager.getRemainingToCall(this._currentPlayerToAct);
    console.log(
      "starting player turn " +
        this._currentPlayerToAct.getId() +
        "call amount " +
        this._bettingState.callAmount
    );
    this._bettingState.playerValidActions =
      this._actionValidator.getValidActions(
        this._bettingState,
        this._currentPlayerToAct,
        this._bettingState.callAmount
      );
    this._timerManager.start();
    this._awaitingPlayersAction = true;
    this.broadcastBettingState();
  }

  async handlePlayerAction(
    playerId: string,
    action: BettingTypes,
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
        this._bettingState.callAmount || 0
      );

      // Calculate call amount in case of 'call' action
      if (action === "call") amount = this._bettingState.callAmount;

      const validation = this._actionValidator.validateAction(
        action,
        amount,
        this._currentPlayerToAct,
        validActions
      );

      if (!validation.isValid) {
        console.log(`Invalid action: ${validation.error}`);
        action = validActions.includes(BettingTypes.CHECK)
          ? BettingTypes.CHECK
          : BettingTypes.FOLD; // take default action
        amount = 0;
        console.log("taking default action " + action);
      }

      this._bettingRoundPotManager.addContribution(
        this._currentPlayerToAct,
        amount || 0
      );

      // When a player raise or bet a valid amount, he has the new biggest bet this round.
      if (
        (amount ?? 0 > 0) &&
        (action == BettingTypes.RAISE || action == BettingTypes.BET)
      ) {
        this._roundEndsCondition = this._currentPlayerToAct;
      }

      if (action == BettingTypes.FOLD)
        this._currentPlayerToAct.updatePlayerPublicState({ isFolded: true });

      // Update betting state with latest pot contributions
      this.updateBettingState({
        potContributions: this._bettingRoundPotManager.getContributions(),
      });

      this._timerManager.handleAction(); // Signal timer that we recived a valid action from the player

      this._awaitingPlayersAction = false;
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
    const lastPlayer = this._currentPlayerToAct;
    this.switchToNextPlayer();
    if (this.isBettingRoundComplete()) {
      // Winner? if so, pass it on.
      const winner =
        this._currentPlayerToAct === lastPlayer ? lastPlayer : null;

      // Collect all pot contributions made this round and add them to the game main and side pots accordingly, update all states. (Todo - rake?).
      this._game
        .getPotManager()
        .processBettingRound(this._bettingRoundPotManager.getContributions());
      this._onBettingRoundComplete(winner);
    } else this.startNextPlayerTurn();
  }

  private doDefualtActionOnTimeout(): void {
    console.log("doDefualtActionOnTimeout ");
    const defaultAction = this._actionValidator
      .getValidActions(
        this._bettingState,
        this._currentPlayerToAct,
        this._bettingState.callAmount || 0
      )
      .includes(BettingTypes.CHECK)
      ? BettingTypes.CHECK
      : BettingTypes.FOLD;
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
      (!this._isFirstTurn &&
        this._currentPlayerToAct === this._roundEndsCondition)
    );
  }

  private switchToNextPlayer() {
    this._isFirstTurn = false;
    this._currentPlayerToAct = findNextPlayerToAct(
      this._currentPlayerToAct.getPokerPosition()!,
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
