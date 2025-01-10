// src/game/betting/BettingManager.ts
import { Server } from 'socket.io';
import { Game } from '../Game';
import { GamePhase } from '../types/GameState';
import { Timer } from '../types/Timer';
import { ActionHandler } from './ActionHandler';
import { ActionValidator } from './ActionValidator';
import { TimerManager } from './TimerManager';
import { BettingState, BettingConfig, PlayerAction } from './types';
import { PlayerInGame } from '../types/PlayerInGame';

export class BettingManager {
  private bettingState: BettingState;
  private currentPlayerToAct: PlayerInGame;
  private actionHandler: ActionHandler;
  private actionValidator: ActionValidator;
  private timerManager: TimerManager;

  constructor(
    private io: Server,
    private game: Game,
    config?: Partial<BettingConfig>
  ) {
    const finalConfig = {
      timePerAction: 15000,
      bettingRound: game.getPhase(),
      minBet: game.getPotSize(),
      maxBet: game.getPotSize(),
      timeCookieEffect: 10000,
      ...config,
    };

    this.actionHandler = new ActionHandler(game);
    this.actionValidator = new ActionValidator(finalConfig);
    this.timerManager = new TimerManager(io, new Timer(), finalConfig);

    this.currentPlayerToAct = undefined;
    this.bettingState = {
      currentBet: 0,
      lastAction: null,
      lastRaiseAmount: 0,
      timeCookiesUsedThisRound: 0,
    };
  }

  startBettingPhase(round: GamePhase): void {
    this.currentPlayerToAct =
      round === GamePhase.PreflopBetting
        ? this.game.getSmallBlindPlayer()!
        : this.game.getBigBlindPlayer()!;

    this.startNextPlayerTurn();
  }

  startNextPlayerTurn(): void {
    this.timerManager.resetRoundCookies();
    this.game
      .getBroadcaster()
      .broadcastGameState(
        this.game,
        this.currentPlayerToAct,
        this.bettingState,
        this.timerManager.getTimeRemaining()
      );
    this.setupTimerAndListeners();
  }

  handlePlayerAction(
    playerId: string,
    action: PlayerAction,
    amount?: number
  ): void {
    if (this.currentPlayerToAct.id !== playerId) return;

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
      action = validActions.includes('check') ? 'check' : 'fold';
    }

    this.timerManager.clear();
    this.actionHandler.processAction(
      action,
      amount,
      this.currentPlayerToAct,
      this.bettingState
    );

    const gameState = this.game.getDetailedGameState();
    this.game.updateGameState({
      potSize: gameState.potSize + (amount || 0),
      bettingRound: {
        ...gameState.bettingRound!,
        lastAction: action,
        currentBet: amount || gameState.bettingRound!.currentBet,
      },
    });

    if (this.isBettingRoundComplete()) {
      this.endBettingPhase();
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
      this.handlePlayerAction(this.currentPlayerToAct.id, defaultAction);
    };

    this.timerManager.startTimer(this.currentPlayerToAct, onTimeout);
    //this.setupTimeCookieListener();
  }

  private isBettingRoundComplete(): boolean {
    // Round is complete if both players checked, or after a call or after a fold.
    return (
      (this.bettingState.currentBet === 0 && // check - check
        this.bettingState.lastAction === 'check') ||
      this.bettingState.lastAction === 'call' || // bet called
      this.bettingState.lastAction === 'fold'
    );
  }

  private switchToNextPlayer() {
    this.currentPlayerToAct =
      this.currentPlayerToAct === this.game.getSmallBlindPlayer()!
        ? this.game.getBigBlindPlayer()!
        : this.game.getSmallBlindPlayer()!;
  }

  endBettingPhase() {
    this.io.emit('betting-phase-ended', {
      lastAction: this.bettingState.lastAction,
    });
  }
}
