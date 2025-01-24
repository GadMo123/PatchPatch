// src/game/betting/BettingManager.ts
import { Game } from '../Game';
import { ActionHandler } from './ActionHandler';
import { ActionValidator } from './ActionValidator';
import { BettingState, BettingConfig, PlayerAction } from './BettingTypes';
import { PlayerInGame } from '../types/PlayerInGame';
import { PositionsUtils } from '../utils/PositionsUtils';
import { GameActionTimerManager } from '../utils/GameActionTimerManager';

export class BettingManager {
  private bettingState: BettingState;
  private currentPlayerToAct: PlayerInGame;
  private actionHandler: ActionHandler;
  private actionValidator: ActionValidator;
  private timerManager: GameActionTimerManager;
  private game: Game;
  private lastToBetOrRaise: PlayerInGame;
  onBettingRoundComplete: (winner: PlayerInGame | null) => void;

  constructor(
    game: Game,
    bettingConfig: BettingConfig,
    onBettingRoundComplete: (winner: PlayerInGame | null) => void
  ) {
    this.actionValidator = new ActionValidator(bettingConfig);
    this.game = game;
    this.actionHandler = new ActionHandler(this.game);
    this.currentPlayerToAct = PositionsUtils.findFirstPlayerToAct(this.game);
    this.bettingState = {
      timeRemaining: 0,
      currentBet: 0, // Todo : count preflop blinds as a bet
      lastAction: null,
      lastRaiseAmount: 0,
      timeCookiesUsedThisRound: 0,
      playerValidActions: [],
      playerToAct: this.currentPlayerToAct.id,
    };
    this.onBettingRoundComplete = onBettingRoundComplete;
    this.lastToBetOrRaise = this.currentPlayerToAct; // A hook to detect when the action returns back to the aggresor/first to talk without any further raise.
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
  }

  startNextPlayerTurn() {
    this.bettingState.playerValidActions = this.actionValidator.getValidActions(
      this.bettingState,
      this.currentPlayerToAct
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
    console.log('handlePlayerAction ' + playerId);
    if (this.currentPlayerToAct!.id !== playerId) return;

    const validActions = this.actionValidator.getValidActions(
      this.bettingState,
      this.currentPlayerToAct
    );
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
    if ((amount ?? 0) > 0) this.lastToBetOrRaise = this.currentPlayerToAct;

    this.timerManager.handleAction();
    this.actionHandler.processAction(
      action,
      amount,
      this.currentPlayerToAct,
      this.bettingState,
      this.onPlayerActionCallback.bind(this)
    );
  }

  private cleanupTimerState() {
    this.updateBettingState({
      timeRemaining: 0,
      timeCookiesUsedThisRound: 0,
    });
  }

  private onPlayerActionCallback() {
    console.log('onPlayerActionCallback ');
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
      .getValidActions(this.bettingState, this.currentPlayerToAct)
      .includes('check')
      ? 'check'
      : 'fold';
    this.handlePlayerAction(this.currentPlayerToAct.id, defaultAction);
  }

  private isBettingRoundComplete(): boolean {
    return this.lastToBetOrRaise === this.currentPlayerToAct;
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
