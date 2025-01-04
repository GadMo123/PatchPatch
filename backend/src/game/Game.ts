// src/game/Game.ts

import { Player } from '../player/Player';
import { Deck } from './Deck';

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
  private id: string;
  private deck: Deck;
  private players: Player[];
  private stakes: string;
  private state: GameState;

  constructor(id: string, stakes: string) {
    this.id = id;
    this.deck = new Deck();
    this.state = { flops: [], turns: [], rivers: [], status: 'waiting' };
    this.stakes = stakes;
    this.players = [];
  }

  addPlayer(player: Player) {
    if (this.players.length >= 3) throw new Error('Game is full');
    this.players.push(player);
  }

  startGame() {
    if (this.players.length > 3)
      throw new Error('Too many players to start the game');

    this.players.forEach(player => {
      player.cards = this.deck.getPlayerCards();
      player.socket.emit('private-cards', player.cards);
    });

    this.state.status = 'started';
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
    const gameState = this.getPublicGameState();
    this.players.forEach(player => player.socket.emit('game-state', gameState));
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

  getState() {
    return this.state;
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
