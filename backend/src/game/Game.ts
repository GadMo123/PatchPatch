// src/game/Game.ts

import { Server } from 'socket.io';
import { Player } from '../player/Player';
import { DetailedGameState, GamePhase } from './types/GameState';
import { PlayerInGame } from './types/PlayerInGame';
import { GameStateBroadcaster } from './broadcasting/GameStateBroadcaster';
import { Card } from './types/Card';
import { Position } from './types/PositionsUtils';
import { Deck } from './types/Deck';
import { BettingConfig } from './betting/BettingTypes';
import { BettingManager } from './betting/BettingManager';
import { PositionLock } from './types/PositionLock';

export class Game {
  private state: DetailedGameState;
  private broadcaster: GameStateBroadcaster;
  private deck: Deck | null;
  private positionLock: PositionLock;
  private handWonWithoutShowdown: boolean;

  constructor(
    id: string,
    stakes: string,
    server: Server,
    tableBettingConfig: BettingConfig
  ) {
    this.broadcaster = new GameStateBroadcaster(server);
    this.deck = null;
    this.positionLock = new PositionLock();
    this.handWonWithoutShowdown = false;
    this.state = {
      id,
      stakes,
      phase: GamePhase.Waiting,
      flops: [],
      turns: [],
      rivers: [],
      observers: [],
      potSize: 0,
      playerInPosition: new Map<Position, PlayerInGame | null>(),
      bettingConfig: tableBettingConfig,
      bettingState: null,
    };
  }

  updateGameState(updates: Partial<DetailedGameState>) {
    this.state = { ...this.state, ...updates };
    this.broadcastGameState();
  }

  addObserver(player: Player) {
    if (!this.state.observers.some(observer => observer === player)) {
      this.state.observers.push(player); // broadcast?
    }
  }

  async addPlayer(
    player: Player,
    buyIn: number,
    position: Position
  ): Promise<boolean> {
    await this.positionLock.acquire(); // Acquire the lock
    try {
      // Check if the position is available
      if (this.state.playerInPosition!.has(position)) return false;

      const playerInGame = new PlayerInGame(player, this, position, buyIn);
      this.state.playerInPosition!.set(position, playerInGame);
      //Remove player as an observers
      this.state.observers = this.state.observers.filter(
        obs => obs.id !== player.id
      );
      this.broadcastGameState();
    } catch (error) {
    } finally {
      this.positionLock.release(); // Release the lock
    }
    return true;
  }

  startGame() {
    if (this.state.playerInPosition!.size < 2)
      throw new Error('Not enough players to start a game');

    // Todo check and rearrange positions if needed
    this.handWonWithoutShowdown = false;
    this.deck = new Deck();
    this.state.phase = GamePhase.PreflopBetting;
    this.state.playerInPosition!.forEach(player => {
      if (player) {
        const cards = this.deck!.getPlayerCards(); // deal player's cards
        player.updatePlayerPrivateState({ cards }); // update
      }
    });
  }

  startBettingRound() {
    const bettingManager = new BettingManager(this, this.state.bettingConfig);
  }

  dealFlops() {
    this.updateGameState({
      flops: this.deck!.getFlops(),
      phase: GamePhase.FlopDealt,
    });
  }

  dealTurn() {
    this.updateGameState({
      turns: this.deck!.getTurns(),
      phase: GamePhase.TurnDealt,
    });
  }

  dealRiver() {
    this.updateGameState({
      rivers: this.deck!.getRivers(),
      phase: GamePhase.RiverDealt,
    });
    // Todo : start cacl winner right here as a microservice to find the winner by the time of showdown
  }

  broadcastGameState() {
    this.broadcaster.broadcastGameState(this);
  }

  getStatus() {
    return this.state.phase;
  }

  getId() {
    return this.state.id;
  }

  getStakes() {
    return this.state.stakes;
  }

  getObserversNames(): String[] {
    return this.state.observers.map((observer: Player) => observer.name);
  }

  getPlayerInPosition(position: Position): PlayerInGame | null {
    return this.state.playerInPosition?.get(position) || null;
  }

  getPlayersInGame(): Map<Position, PlayerInGame | null> | null {
    return this.state.playerInPosition;
  }

  getPotSize(): number {
    return this.state.potSize;
  }

  getPhase(): GamePhase {
    return this.state?.phase;
  }

  getFlops(): Card[][] {
    return this.state.flops;
  }
  getTurns(): Card[] {
    return this.state.turns;
  }
  getRivers(): Card[] {
    return this.state.rivers;
  }

  getBettingConfig() {
    return this.state.bettingConfig;
  }
  getBettingState() {
    return this.state.bettingState;
  }

  getObserversList(): Player[] {
    return this.state.observers;
  }

  handleHandWonWithoutShowdown(winner: PlayerInGame) {
    this.handWonWithoutShowdown = true;
    winner.updatePlayerPublicState({
      currentStack: winner.getStack() + this.state.potSize,
    });
    this.state.potSize = 0;
  }

  isHandWonWithoutShowdown() {
    return this.isHandWonWithoutShowdown;
  }

  doShowdown() {
    //throw new Error('Method not implemented.');
  }

  isReadyForNextHand(): boolean {
    //Todo
    return (
      this.getPlayerInPosition(Position.SB) != null &&
      this.getPlayerInPosition(Position.BB) != null
    );
  }
}
