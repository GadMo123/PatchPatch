// src/game/Game.ts

import { Server } from 'socket.io';
import { Player } from '../player/Player';
import { Deck } from './Deck';

// This include private cards and not public only data, filter for player privacy before sending to clients.
interface GameState {
  flops: { rank: string; suit: string }[][];
  turns: { rank: string; suit: string }[];
  rivers: { rank: string; suit: string }[];
  status:
    | 'waiting'
    | 'started'
    | 'flop-dealt'
    | 'turn-dealt'
    | 'river-dealt'
    | 'completed';
}

export class Game {
  private io: Server;
  private id: string;
  private deck: Deck;
  private players: Player[];
  private stakes: string;
  private state: GameState;

  constructor(id: string, stakes: string, server: Server) {
    this.io = server;
    this.id = id;
    this.deck = new Deck();
    this.state = { flops: [], turns: [], rivers: [], status: 'waiting' };
    this.stakes = stakes;
    this.players = [];
  }

  addPlayer(player: Player) {
    if (this.players.length >= 3) throw new Error('Game is full');
    player.cards = []; //making sure private cards are empty
    this.players.push(player);
  }

  startGame() {
    if (this.players.length > 3)
      throw new Error('Too many players to start the game');

    this.state.status = 'started';

    this.players.forEach(player => {
      player.cards = this.deck.getPlayerCards();
      this.broadcastGameState();
    });
  }

  dealFlops() {
    this.state.flops = this.deck.getFlops();
    this.state.status = 'flop-dealt';
    this.broadcastGameState();
  }

  dealTurn() {
    this.state.turns = this.deck.getTurns();
    this.state.status = 'turn-dealt';
    this.broadcastGameState();
  }

  dealRiver() {
    this.state.rivers = this.deck.getRivers();
    this.state.status = 'river-dealt';
    this.broadcastGameState();
  }

  endGame() {
    this.state.status = 'completed';
    this.broadcastGameState();
  }

  broadcastGameState() {
    this.players.forEach(player => {
      const personalizedGameState = this.getPersonalizedGameState(player.id);
      this.io.to(player.socketId).emit('game-state', personalizedGameState);
    });
  }

  getPublicGameState() {
    return {
      id: this.id,
      flops: this.state.flops,
      turns: this.state.turns,
      rivers: this.state.rivers,
      status: this.state.status,
      players: this.players.map(player => ({
        id: player.id,
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
      status: this.state.status,
      players: this.players.map(player => ({
        id: player.id,
        name: player.name,
        cards: player.id === playerId ? player.cards : [], // Include private cards only for the specific player
      })),
    };
  }

  getStatus() {
    return this.state.status;
  }

  getId() {
    return this.id;
  }

  getStakes() {
    return this.stakes;
  }

  get playersList(): Player[] {
    return this.players;
  }
}
