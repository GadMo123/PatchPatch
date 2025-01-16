// src/game/betting/BettingManager.ts
import { Game } from '../Game';
import { Timer } from '../types/Timer';
import { ActionHandler } from './ActionHandler';
import { ActionValidator } from './ActionValidator';
import { TimerManager } from './TimerManager';
import { BettingState, BettingConfig, PlayerAction } from './BettingTypes';
import { PlayerInGame } from '../types/PlayerInGame';
import { PositionsUtils } from '../types/PositionsUtils';

export class BettingManager {
  private onRoundComplete: () => void;
  private bettingState: BettingState;
  private currentPlayerToAct: PlayerInGame;
  private actionHandler: ActionHandler;
  private actionValidator: ActionValidator;
  private timerManager: TimerManager;
  private game: Game;

  constructor(
    game: Game,
    bettingConfig: BettingConfig,
    onRoundComplete: () => void
  ) {
    this.onRoundComplete = onRoundComplete;
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
  }

  startNextPlayerTurn() {
    this.bettingState.playerValidActions = this.actionValidator.getValidActions(
      this.bettingState,
      this.currentPlayerToAct
    );
    this.timerManager.resetRoundCookies();
    this.setupTimerAndListeners();
    this.broadcastBettingState();
  }

  handlePlayerAction(
    playerId: string,
    action: PlayerAction,
    amount?: number
  ): void {
    if (this.currentPlayerToAct!.id !== playerId) return;
    console.log(
      'player action recived: from : ' +
        playerId +
        ' action : ' +
        action +
        ' ' +
        amount
    );
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
    console.log('betting manager onPlayerActionCallback');
    if (this.isBettingRoundComplete()) {
      this.onRoundComplete();
    } else {
      this.switchToNextPlayer();
      this.startNextPlayerTurn();
    }
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
    // if only one player standing => hand won without showdown.
    if (
      this.bettingState.lastAction === 'fold' &&
      PositionsUtils.findNextPlayerToAct(
        this.currentPlayerToAct.getPosition(),
        this.game
      ) === this.currentPlayerToAct // last player standing is current player
    ) {
      this.game.handleHandWonWithoutShowdown(this.currentPlayerToAct);
      return true;
    }
    // Round is complete if both players checked, or after a call or after a fold.
    return (
      (this.bettingState.currentBet === 0 && // check - check
        this.bettingState.lastAction === 'check') ||
      this.bettingState.lastAction === 'call' // bet called
    );
  }

  private switchToNextPlayer() {
    this.currentPlayerToAct = PositionsUtils.findNextPlayerToAct(
      this.currentPlayerToAct.getPosition(),
      this.game
    );
    console.log('player to act : ' + this.currentPlayerToAct.id);
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
