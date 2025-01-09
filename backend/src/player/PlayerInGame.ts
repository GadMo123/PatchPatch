import { Player } from './Player';
import { Game } from '../game/Game';
import { Card } from '../game/types/Card';

export class PlayerInGame extends Player {
  currentStack: number; // Player's currently playing game stack (updated after last betting)
  isFolded: boolean; // Player's currently folded status in the game
  game: Game;
  cards: Card[]; // Player's private cards (12 cards for each player)

  constructor(player: Player, game: Game) {
    super(player);
    this.game = game;
    this.currentStack = 0; // Default stack
    this.isFolded = false; // Default to not folded
    this.cards = [];
  }

  getStack(): number {
    return this.currentStack;
  }

  getIsFolded(): boolean {
    return this.isFolded;
  }

  setFolded(fold: boolean) {
    this.isFolded = fold;
  }

  // Player won a hand
  addToStack(pot: number) {
    this.currentStack += pot;
  }

  // Player call or raise
  removeFromStack(amount: number) {
    this.currentStack -= amount;
  }
}
