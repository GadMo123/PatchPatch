import { Player } from '../../player/Player';
import { Game } from '../Game';
import { Card } from './Card';
import { Position } from './Positions';

export interface PlayerPublicState {
  id: string;
  name: string;
  position: Position;
  currentStack: number;
  isFolded: boolean;
}

export interface PlayerPrivateState {
  remainingTimeCookies: number;
  cards: Card[] | null; // 12 private cards
  arrangedCards?: {
    hand1: Card[]; // 4 cards
    hand2: Card[]; // 4 cards
    hand3: Card[]; // 4 cards
  };
}

// Represents player data in a single game
export class PlayerInGame extends Player {
  playerPublicState: PlayerPublicState;
  playerPrivateState: PlayerPrivateState;
  game: Game;

  constructor(player: Player, game: Game, position: Position, buyIn: number) {
    super(player);
    this.game = game;
    this.playerPublicState = {
      //public info
      id: player.id,
      name: player.name,
      position: position,
      currentStack: buyIn,
      isFolded: false,
    };

    this.playerPrivateState = {
      //private info
      remainingTimeCookies: player.remainingTimeCookies,
      cards: null,
      arrangedCards: undefined, // Will be set when player arranges cards
    };
  }

  getPlayerPublicState(): PlayerPublicState {
    return this.playerPublicState;
  }

  updatePlayerPublicState(updates: Partial<PlayerPublicState>) {
    this.playerPublicState = {
      ...this.playerPublicState,
      ...updates,
    };
  }

  getPlayerPrivateState(): PlayerPrivateState {
    return this.playerPrivateState;
  }

  updatePlayerPrivateState(updates: Partial<PlayerPrivateState>) {
    this.playerPrivateState = {
      ...this.playerPrivateState,
      ...updates,
    };
  }

  getStack() {
    return this.playerPublicState.currentStack;
  }
}
