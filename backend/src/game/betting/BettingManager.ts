// src/game/betting/BettingManager.ts
import { Game } from '../Game';
import { ActionValidator } from './ActionValidator';
import { BettingState, BettingConfig, PlayerAction } from './BettingTypes';
import { PlayerInGame } from '../types/PlayerInGame';
import { Position, PositionsUtils } from '../utils/PositionsUtils';
import { GameActionTimerManager } from '../utils/GameActionTimerManager';
import { BettingRoundPotManager } from './bettingRoundPotManager';

export class BettingManager {
  getBiggestBet(): number {
    throw new Error('Method not implemented.');
  }
  private bettingState: BettingState;
  private currentPlayerToAct: PlayerInGame;
  private actionValidator: ActionValidator;
  private timerManager: GameActionTimerManager;
  private game: Game;
  private biggestBetToCall: number; // The amount a player have to complate to the pot to call (reducing previous contributions)
  private potManager: BettingRoundPotManager;
  onBettingRoundComplete: (winner: PlayerInGame | null) => void;

  // This is a marker pointing to the last player to take an aggresive action, if the action returns to him without more aggrestion - we know the betting round ends.
  private roundEndsCondition: PlayerInGame;

  constructor(
    game: Game,
    bettingConfig: BettingConfig,
    onBettingRoundComplete: (winner: PlayerInGame | null) => void,
    isPreflop: boolean
  ) {
    this.actionValidator = new ActionValidator(bettingConfig);
    this.game = game;
    this.currentPlayerToAct = PositionsUtils.findFirstPlayerToAct(this.game);
    this.roundEndsCondition = this.currentPlayerToAct;
    this.biggestBetToCall = 0;

    this.bettingState = {
      timeRemaining: 0,
      timeCookiesUsedThisRound: 0,
      playerValidActions: [],
      playerToAct: this.currentPlayerToAct.id,
      potContributions: new Map(
        Array.from(game.getPlayersInGame()!.values())
          .filter(player => player?.isActive())
          .map(player => [player!, 0])
      ),
      lastRaise: 0,
    };
    this.onBettingRoundComplete = onBettingRoundComplete;
    this.potManager = new BettingRoundPotManager(this);
    this.timerManager = new GameActionTimerManager({
      duration: bettingConfig.timePerAction,
      networkBuffer: 1000,
      timeCookieEffect: bettingConfig.timeCookieEffect,
      maxCookiesPerRound: 3,
      updateTimeRemianing: (timeRemaining: number) =>
        this.updateBettingState({ timeRemaining: timeRemaining }),
      onTimeout: this.doDefualtActionOnTimeout.bind(this),
      onComplete: this.cleanupTimerState.bind(this),
    });
    if (isPreflop) {
      this.potManager.takeBlinds(
        game.getPlayerInPosition(Position.SB)!,
        game.getPlayerInPosition(Position.BB)!,
        bettingConfig.sbAmount,
        bettingConfig.bbAmount
      );
      this.biggestBetToCall = bettingConfig.bbAmount; // for the current scope, we force the BB player (in hand preparation) to have at least 1BB in order to play a hand.
      this.bettingState.lastRaise = bettingConfig.bbAmount;
    }
  }

  startNextPlayerTurn() {
    this.bettingState.playerValidActions = this.actionValidator.getValidActions(
      this.bettingState,
      this.currentPlayerToAct,
      this.biggestBetToCall
    );
    console.log('starting player turn ' + this.currentPlayerToAct.id);
    this.timerManager.start();
    this.broadcastBettingState();
  }

  handlePlayerAction(
    playerId: string,
    action: PlayerAction,
    amount?: number
  ): void {
    if (this.currentPlayerToAct!.id !== playerId) return;
    const validActions = this.actionValidator.getValidActions(
      this.bettingState,
      this.currentPlayerToAct,
      this.biggestBetToCall
    );

    // Calculate call amount in case of 'call' action
    if (action === 'call')
      amount = this.potManager.getRemainingToCall(this.currentPlayerToAct);

    const validation = this.actionValidator.validateAction(
      action,
      amount,
      this.currentPlayerToAct,
      validActions
    );

    if (!validation.isValid) {
      console.log(`Invalid action: ${validation.error}`);
      action = validActions.includes('check') ? 'check' : 'fold'; // take default action
      amount = 0;
    }

    this.potManager.addContribution(this.currentPlayerToAct, amount || 0);

    // When a player raise or bet a valid amount, he has the new biggest bet this round.
    if ((amount ?? 0 > 0) && (action == 'raise' || action == 'bet')) {
      this.roundEndsCondition = this.currentPlayerToAct;
      this.bettingState.lastRaise = amount! - this.biggestBetToCall;
      this.biggestBetToCall = this.bettingState.potContributions.get(
        this.currentPlayerToAct
      )!;
    }

    if (action == 'fold')
      this.currentPlayerToAct.updatePlayerPublicState({ isFolded: true });

    // Update betting state with latest pot contributions
    this.updateBettingState({
      potContributions: this.potManager.getAllContributions(),
    });

    this.timerManager.handleAction(); // Signal timer that we recived a valid action from the player

    this.onPlayerActionDone();
  }

  private cleanupTimerState() {
    this.updateBettingState({
      timeRemaining: 0,
      timeCookiesUsedThisRound: 0,
    });
  }

  private onPlayerActionDone() {
    console.log('onPlayerActionDone ');
    const lastPlayer = this.currentPlayerToAct;
    this.switchToNextPlayer();
    if (this.isBettingRoundComplete()) {
      const winner = this.currentPlayerToAct === lastPlayer ? lastPlayer : null;
      this.onBettingRoundComplete(winner);
    } else this.startNextPlayerTurn();
  }

  private doDefualtActionOnTimeout(): void {
    console.log('doDefualtActionOnTimeout ');
    const defaultAction = this.actionValidator
      .getValidActions(
        this.bettingState,
        this.currentPlayerToAct,
        this.biggestBetToCall
      )
      .includes('check')
      ? 'check'
      : 'fold';
    this.handlePlayerAction(this.currentPlayerToAct.id, defaultAction);
  }

  private isBettingRoundComplete(): boolean {
    const activePlayers = Array.from(
      this.bettingState.potContributions.keys()
    ).filter(player => player.isActive());

    // Round is complete if:
    // 1. Only one player remains (others folded or allin)
    // 2. action is back to the last aggresor (or first player to act in case there is no aggresion behind)
    return (
      activePlayers.length <= 1 ||
      this.currentPlayerToAct === this.roundEndsCondition
    );
  }

  private switchToNextPlayer() {
    this.currentPlayerToAct = PositionsUtils.findNextPlayerToAct(
      this.currentPlayerToAct.getPosition(),
      this.game
    );
    this.updateBettingState({ playerToAct: this.currentPlayerToAct.id });
  }

  updateBettingState(partialUpdate: Partial<BettingState>) {
    this.bettingState = {
      ...this.bettingState,
      ...partialUpdate,
    };
  }

  broadcastBettingState() {
    this.game.updateGameStateAndBroadcast(
      { bettingState: this.bettingState },
      null
    );
  }
}
