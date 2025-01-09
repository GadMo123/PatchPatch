// src/game/Game.ts

import { Server } from 'socket.io';
import { Player } from '../player/Player';
import { Deck } from './types/Deck';
import { GamePhase } from './types/GameStateUtils';
import { PlayerInGame } from '../player/PlayerInGame';
import { GameStateBroadcaster } from './broadcasting/GameStateBroadcaster';
import { Card } from './types/Card';

interface GameState {
  flops: Card[][];
  turns: Card[];
  rivers: Card[];
  phase: GamePhase;
  potSize: number;
  bigBlindPlayer: PlayerInGame | null; // player on the big blind
  smallBlindPlayer: PlayerInGame | null; // player on the small blind
  // add more players for ring games
}

export class Game {
  handWonWithoutShowdown() {
    throw new Error('Method not implemented.');
  }
  private io: Server;
  private id: string;
  private deck: Deck;
  private observers: Player[];
  private stakes: string;
  private state: GameState;
  private broadcaster: GameStateBroadcaster;

  constructor(id: string, stakes: string, server: Server) {
    this.io = server;
    this.id = id;
    this.deck = new Deck();
    this.state = {
      flops: [],
      turns: [],
      rivers: [],
      phase: GamePhase.Waiting,
      potSize: 0,
      bigBlindPlayer: null,
      smallBlindPlayer: null,
    };
    this.stakes = stakes;
    this.observers = [];
    this.broadcaster = new GameStateBroadcaster(server);
  }

  // todo, turn observer into a player
  addObserver(player: Player) {
    this.observers.push(player);
  }

  addPlayer(player: Player, buyIn: number) {
    // todo, handle Error('Game is full');
    const playerInGame = new PlayerInGame(player, this);
    playerInGame.currentStack = buyIn; // Todo, buyin Logic, database, reduce for coind, ect.
    // Assign player's position
    if (!this.state.smallBlindPlayer)
      this.state.smallBlindPlayer = playerInGame; // first player to join enjoy the btn position advantage for now
    else this.state.bigBlindPlayer = playerInGame;
    this.observers = this.observers.filter(other => other.id !== player.id); //Remove player as an observer
  }

  startGame() {
    if (!this.state.smallBlindPlayer || !this.state.bigBlindPlayer)
      throw new Error('Not enough players to start a game');

    this.state.phase = GamePhase.PreflopBetting;

    this.state.bigBlindPlayer!.cards = this.deck.getPlayerCards();
    this.state.smallBlindPlayer!.cards = this.deck.getPlayerCards();
    this.broadcastGameState();
  }

  dealFlops() {
    this.state.flops = this.deck.getFlops();
    this.state.phase = GamePhase.FlopDealt;
    this.broadcastGameState();
  }

  dealTurn() {
    this.state.turns = this.deck.getTurns();
    this.state.phase = GamePhase.TurnDealt;
    this.broadcastGameState();
  }

  dealRiver() {
    this.state.rivers = this.deck.getRivers();
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

  getPublicGameState() {
    // use for observers
    return {
      id: this.id,
      flops: this.state.flops,
      turns: this.state.turns,
      rivers: this.state.rivers,
      phase: this.state.phase,
      potSize: this.state.potSize,
      smallBlindPlayer: this.state.smallBlindPlayer,
      bigBlindPlayer: this.state.bigBlindPlayer,
      observers: this.observers.map(player => ({
        name: player.name,
      })),
    };
  }

  getPersonalizedGameState(playerId: string) {
    return {
      id: this.id,
      flops: this.state.flops,
      turns: this.state.turns,
      rivers: this.state.rivers,
      status: this.state.phase,
      potSize: this.state.potSize, // Include the pot size
      players: this.observers.map(player => ({
        id: player.id,
        name: player.name,
      })),
      playersInGame: [this.state.bigBlindPlayer, this.state.smallBlindPlayer]
        .filter(player => player !== null) // Ensure only valid players are included
        .map(player => ({
          id: player!.id,
          name: player!.name,
          stack: player!.currentStack, // Include their current stack
          cards: player!.id === playerId ? player!.cards : [], // Include private cards only for the requesting player
        })),
    };
  }

  getStatus() {
    return this.state.phase;
  }

  getId() {
    return this.id;
  }

  getStakes() {
    return this.stakes;
  }

  getObserversList(): Player[] {
    return this.observers;
  }

  getPotSize(): number {
    return this.state.potSize;
  }

  getPhase(): GamePhase {
    return this.state?.phase;
  }

  getBigBlindPlayer(): PlayerInGame | null {
    return this.state?.bigBlindPlayer;
  }

  getSmallBlindPlayer(): PlayerInGame | null {
    return this.state?.smallBlindPlayer;
  }

  getBroadcaster() {
    return this.broadcaster;
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

  increasePotSize(amount: number) {
    this.state.potSize += amount;
  }
}
