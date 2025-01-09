// src/game/BettingManager.ts
import { Server } from 'socket.io';
import { Player } from '../player/Player';
import { GamePhase } from './types/GameStateUtils';
import { Timer } from './types/Timer';
import { Game } from './Game';
import { PlayerInGame } from '../player/PlayerInGame';
import { BettingConfig, BettingState, PlayerAction } from './betting/types';

export class BettingManager {
  private io: Server;
  private sbPlayer: PlayerInGame;
  private bbPlayer: PlayerInGame;
  private game: Game;
  private bettingConfig: BettingConfig;
  private currentPlayerToAct: PlayerInGame;
  private timer: Timer;
  private bettingState: BettingState;
  private readonly MAX_TIME_COOKIES_PER_ROUND = 3;

  constructor(
    io: Server,
    sbPlayer: PlayerInGame,
    bbPlayer: PlayerInGame,
    game: Game,
    config?: Partial<BettingConfig>
  ) {
    this.io = io;
    this.sbPlayer = sbPlayer;
    this.bbPlayer = bbPlayer;
    this.game = game;
    this.bettingConfig = {
      timePerAction: 15000, // Default: 15 seconds
      bettingRound: game.getPhase(),
      minBet: game.getPotSize(), // Minimum bet size
      maxBet: game.getPotSize(), // for now only pot-size bets are allowed
      timeCookieEffect: 10000, // Default: 10 seconds extra time
      ...config,
    };
    this.timer = new Timer();
    this.bettingState = {
      currentBet: 0,
      lastAction: null,
      lastRaiseAmount: 0,
      timeCookiesUsedThisRound: 0,
    };
    this.currentPlayerToAct = this.game.getSmallBlindPlayer()!;
  }

  startBettingPhase(round: GamePhase) {
    // Set initial player to act based on betting round
    this.currentPlayerToAct =
      round === GamePhase.PreflopBetting
        ? this.game.getSmallBlindPlayer()!
        : this.game.getBigBlindPlayer()!;

    this.startNextPlayerTurn();
  }

  handlePlayerAction(playerId: string, action: PlayerAction, amount?: number) {
    if (this.currentPlayerToAct.id !== playerId) return;

    if (!this.isValidAction(action, amount)) {
      console.log(
        'invalid user action: player Id, gameId, action: ' +
          playerId +
          ', ' +
          this.game.getId() +
          ', ' +
          action
      );
      action = this.isValidAction('check', 0) ? 'check' : 'fold'; // Take default action instead of player invalid input
    }

    this.timer.clear();
    this.processAction(action, amount);

    if (this.isBettingRoundComplete()) {
      this.endBettingPhase();
    } else {
      this.switchToNextPlayer();
      this.startNextPlayerTurn();
    }
  }

  startNextPlayerTurn() {
    // First notify everyone whose turn it is
    this.io.emit('active-player', {
      playerId: this.currentPlayerToAct.id,
      validActions: this.getValidActions(),
      currentBet: this.bettingState.currentBet,
    });

    // Then notify the active player specifically with their valid actions
    this.notifyPlayerTurn();

    // Start base timer
    let timeRemaining = this.bettingConfig.timePerAction;
    let timeCookiesUsedThisRound = 0;

    this.timer.start(timeRemaining, () => {
      // When timer expires, take default action
      const defaultAction = this.isValidAction('check', 0) ? 'check' : 'fold';
      console.log(
        'Timer expired for player: ' +
          this.currentPlayerToAct.id +
          ' in game: ' +
          this.game.getId() +
          '. Taking default action: ' +
          defaultAction
      );
      this.handlePlayerAction(this.currentPlayerToAct.id, defaultAction);
    });

    // Set up socket listener for time cookie usage during this turn
    const timeCookieHandler = () => {
      // Check if player has time cookies and hasn't exceeded round limit
      if (!this.currentPlayerToAct.hasTimeCookies()) {
        this.io.to(this.currentPlayerToAct.socketId).emit('time-cookie-error', {
          message: 'No time cookies available',
        });
        return;
      }

      if (timeCookiesUsedThisRound >= this.MAX_TIME_COOKIES_PER_ROUND) {
        this.io.to(this.currentPlayerToAct.socketId).emit('time-cookie-error', {
          message: 'Maximum time cookies for this round already used',
        });
        return;
      }

      // Consume time cookie and extend timer
      this.currentPlayerToAct.useTimeCookie();
      timeCookiesUsedThisRound++;
      timeRemaining += this.bettingConfig.timeCookieEffect;

      // Clear existing timer and start new one with remaining time
      this.timer.clear();
      this.timer.start(timeRemaining, () => {
        const defaultAction = this.isValidAction('check', 0) ? 'check' : 'fold';
        this.handlePlayerAction(this.currentPlayerToAct.id, defaultAction);
      });

      // Notify all players about the time cookie usage
      this.io.emit('time-cookie-used', {
        playerId: this.currentPlayerToAct.id,
        timeRemaining,
        timeCookiesUsed: timeCookiesUsedThisRound,
      });
    };

    // Add the time cookie listener for this turn
    this.io
      .to(this.currentPlayerToAct.socketId)
      .on('use-time-cookie', timeCookieHandler);

    // Clean up the listener when the turn ends
    const cleanup = () => {
      this.io
        .to(this.currentPlayerToAct.socketId)
        .off('use-time-cookie', timeCookieHandler);
    };

    // Add cleanup to both timer completion and player action
    this.timer.onComplete(cleanup);
    this.currentPlayerToAct.once('action', cleanup);
  }

  private isValidAction(action: PlayerAction, amount?: number): boolean {
    const validActions = this.getValidActions();
    if (!validActions.includes(action)) return false;

    if (action === 'bet' || action === 'raise') {
      if (!amount) return false;
      if (amount < this.bettingConfig.minBet) return false;
      if (amount > this.bettingConfig.maxBet) return false;
      if (amount > this.currentPlayerToAct.getStack()) return false;
    }

    return true;
  }

  private processAction(action: PlayerAction, amount?: number) {
    switch (action) {
      case 'fold':
        this.handleFold();
        break;
      case 'check':
        this.handleCheck();
        break;
      case 'call':
        this.handleCall();
        break;
      case 'bet':
        this.handleBet(amount!);
        break;
      case 'raise':
        this.handleRaise(amount!);
        break;
    }

    this.bettingState.lastAction = action;
    this.broadcastPlayerAction(this.currentPlayerToAct.id, action, amount);
  }

  private switchToNextPlayer() {
    this.currentPlayerToAct =
      this.currentPlayerToAct === this.game.getSmallBlindPlayer()!
        ? this.game.getBigBlindPlayer()!
        : this.game.getSmallBlindPlayer()!;
  }

  private isBettingRoundComplete(): boolean {
    // Round is complete if both players checked, or after a call or after a fold.
    return (
      (this.bettingState.currentBet === 0 &&
        this.bettingState.lastAction === 'check' &&
        this.getValidActions().includes('check')) ||
      this.bettingState.lastAction === 'call' ||
      this.bettingState.lastAction === 'fold'
    );
  }

  private broadcastPlayerAction(
    playerId: string,
    action: PlayerAction,
    amount?: number
  ) {
    this.io.emit('player-action', {
      playerId,
      action,
      amount,
      pot: this.bettingState.pot,
      currentBet: this.bettingState.currentBet,
    });
  }

  private notifyPlayerTurn() {
    const validActions = this.getValidActions();
    this.io.to(this.currentPlayerToAct.socketId).emit('your-turn', {
      time: this.bettingConfig.timePerAction,
      validActions,
      currentBet: this.bettingState.currentBet,
      minBet: this.bettingConfig.minBet,
      maxBet: this.bettingConfig.maxBet,
    });
  }

  endBettingPhase() {
    this.io.emit('betting-phase-ended', {
      pot: this.bettingState.pot,
      lastAction: this.bettingState.lastAction,
    });
  }
}
