// src/game/betting/BettingManager.ts
import { Game } from '../Game';
import { Timer } from '../utils/Timer';
import { ActionHandler } from './ActionHandler';
import { ActionValidator } from './ActionValidator';
import { TimerManager } from './TimerManager';
import { BettingState, BettingConfig, PlayerAction } from './BettingTypes';
import { PlayerInGame } from '../types/PlayerInGame';
import { PositionsUtils } from '../utils/PositionsUtils';

export class BettingManager {
  private bettingState: BettingState;
  private currentPlayerToAct: PlayerInGame;
  private actionHandler: ActionHandler;
  private actionValidator: ActionValidator;
  private timerManager: TimerManager;
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
    this.timerManager = new TimerManager(new Timer(), bettingConfig, this);
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
  }

  startNextPlayerTurn() {
    console.log('3');
    this.bettingState.playerValidActions = this.actionValidator.getValidActions(
      this.bettingState,
      this.currentPlayerToAct
    );
    this.timerManager.resetRoundTimebankCookies();
    this.setupTimerAndListeners();
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
      this.currentPlayerToAct
    );
    const validation = this.actionValidator.validateAction(
      action,
      amount,
      this.currentPlayerToAct,
      validActions
    );

    console.log('1 ' + action);
    if (!validation.isValid) {
      console.log(`Invalid action: ${validation.error}`);
      action = validActions.includes('check') ? 'check' : 'fold'; // take default action
    }

    this.timerManager.clear();
    this.actionHandler.processAction(
      action,
      amount,
      this.currentPlayerToAct,
      this.bettingState,
      this.onPlayerActionCallback.bind(this)
    );
  }

  private onPlayerActionCallback() {
    console.log('2 ');
    const lastPlayer = this.currentPlayerToAct;
    this.switchToNextPlayer();
    if (this.isBettingRoundComplete()) {
      console.log('4');
      const winner = this.currentPlayerToAct === lastPlayer ? lastPlayer : null;
      this.onBettingRoundComplete(winner);
    } else this.startNextPlayerTurn();
  }

  private setupTimerAndListeners(): void {
    const onTimeout = () => {
      const defaultAction = this.actionValidator
        .getValidActions(this.bettingState, this.currentPlayerToAct)
        .includes('check')
        ? 'check'
        : 'fold';
      // todo lock player from sending action
      this.handlePlayerAction(this.currentPlayerToAct.id, defaultAction);
    };

    this.timerManager.startTimer(this.currentPlayerToAct, onTimeout);
    //this.setupTimeCookieListener();
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

  setLastToBetOrRaise(player: PlayerInGame) {
    this.lastToBetOrRaise = player;
  }
}
