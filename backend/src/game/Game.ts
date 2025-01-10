// src/game/Game.ts

import { Server } from 'socket.io';
import { Player } from '../player/Player';
import { DetailedGameState, GamePhase } from './types/GameState';
import { PlayerInGame } from './types/PlayerInGame';
import { GameStateBroadcaster } from './broadcasting/GameStateBroadcaster';
import { Card } from './types/Card';
import { Position } from './types/Positions';
import { Deck } from './types/Deck';
import { BettingConfig, BettingState } from './betting/types';

export class Game {
  private state: DetailedGameState;
  private broadcaster: GameStateBroadcaster;
  private deck: Deck | null;

  constructor(
    id: string,
    stakes: string,
    server: Server,
    tableBettingConfig: BettingConfig
  ) {
    this.broadcaster = new GameStateBroadcaster(server);
    this.deck = null;
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

  // State update methods
  updateGameState(updates: Partial<DetailedGameState>) {
    this.state = { ...this.state, ...updates };
    this.broadcastGameState();
  }

  addObserver(player: Player) {
    //if (!this.state.observers.) todo, check if obs already observing
    this.state.observers.push(player);
  }

  addPlayer(player: Player, buyIn: number, position: Position) {
    // todo, handle Errors ('Game is full', 'position not avilable' ;
    const playerInGame = new PlayerInGame(player, this, position, buyIn);
    this.state.playerInPosition!.set(position, playerInGame);
    //Remove player as an observers
    this.state.observers = this.state.observers.filter(
      obs => obs.id !== player.id
    );
  }

  startGame() {
    if (
      !this.state.playerInPosition!.get(Position.SB) ||
      !this.state.playerInPosition!.get(Position.BB)
    )
      throw new Error('Not enough players to start a game');

    this.deck = new Deck();
    this.state.phase = GamePhase.PreflopBetting;
    this.state.playerInPosition!.forEach(player => {
      if (player) {
        const cards = this.deck!.getPlayerCards(); // deal player's cards
        player.updatePlayerPrivateState({ cards }); // update
      }
    });

    this.broadcastGameState();
  }

  dealFlops() {
    this.state.flops = this.deck!.getFlops();
    this.state.phase = GamePhase.FlopDealt;
    this.broadcastGameState();
  }

  dealTurn() {
    this.state.turns = this.deck!.getTurns();
    this.state.phase = GamePhase.TurnDealt;
    this.broadcastGameState();
  }

  dealRiver() {
    this.state.rivers = this.deck!.getRivers();
    this.state.phase = GamePhase.RiverDealt;
    this.broadcastGameState();
  }

  endGame() {
    this.state.phase = GamePhase.Showdown;
    this.broadcastGameState();
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

  handWonWithoutShowdown(winner: PlayerInGame) {
    throw new Error('Method not implemented.');
  }
}
