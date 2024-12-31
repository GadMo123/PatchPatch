import { Deck } from './Deck';

interface Player {
  id: string; // Player's unique identifier (e.g., socket ID)
  name: string; // Player's name
  cards: { rank: string; suit: string }[]; // Player's cards
}

interface GameState {
  flops: { rank: string; suit: string }[][];
  turns: { rank: string; suit: string }[];
  rivers: { rank: string; suit: string }[];
  status: 'waiting' | 'started' | 'flop-dealt' | 'turn-dealt' | 'river-dealt' | 'completed';
}

export class Game {
  private id: string;
  private deck: Deck;
  private players: Player[] = [];
  private state: GameState;

  constructor(id: string) {
    this.id = id;
    this.deck = new Deck(); // Create a new shuffled deck
    this.state = {
      flops: [],
      turns: [],
      rivers: [],
      status: 'waiting',
    };
  }

  // Add a player to the game
  addPlayer(playerId: string, name: string) {
    if (this.players.length >= 2) {
      throw new Error('Game is full');
    }

    const playerCards = this.players.length === 0
      ? this.deck.getPlayer1Cards()
      : this.deck.getPlayer2Cards();

    this.players.push({ id: playerId, name, cards: playerCards });
  }

  // Start the game by dealing the flops
  startGame() {
    // if (this.players.length < 2) {
    //   throw new Error('Not enough players to start the game');
    // }
    this.state.status = 'started';
  }

   // Deal the turn (one card to each flop)
  dealFlops() {
    if (this.state.status !== 'started') {
      throw new Error('Flop cannot be dealt in the current state');
    }

    this.state.flops = this.deck.getFlops();
    this.state.status = 'flop-dealt';
  }

  // Deal the turn (one card to each flop)
  dealTurn() {
    if (this.state.status !== 'flop-dealt') {
      throw new Error('Turn cannot be dealt in the current state');
    }

    this.state.turns = this.deck.getTurns();
    this.state.status = 'turn-dealt';
  }

  // Deal the river (one final card to each flop)
  dealRiver() {
    if (this.state.status !== 'turn-dealt') {
      throw new Error('River cannot be dealt in the current state');
    }

    this.state.rivers = this.deck.getRivers();
    this.state.status = 'river-dealt';
  }

  // End the game
  endGame() {
    if (this.state.status !== 'river-dealt') {
      throw new Error('Game cannot be ended in the current state');
    }

    this.state.status = 'completed';
  }

  // Get the current game state
  getState() {
    return this.state;
  }

  // Get player information
  getPlayerInfo() {
    return this.players.map(player => ({
      id: player.id,
      name: player.name,
      cards: player.cards,
    }));
  }
}
