import { Player } from './Player';
import { Game } from '../game/Game';
import { Card } from '../game/types/Card';

export interface PlayerState {
  id: string;
  name: string;
  position: 'sb' | 'bb';
  currentStack: number;
  isFolded: boolean;
  remainingTimeCookies: number;
  cards?: Card[]; // 12 private cards
  arrangedCards?: {
    hand1: Card[]; // 4 cards
    hand2: Card[]; // 4 cards
    hand3: Card[]; // 4 cards
  };
}

export class PlayerInGame extends Player {
  playerState: PlayerState;
  game: Game;

  constructor(player: Player, game: Game) {
    super(player);
    this.game = game;
    this.playerState = {
      id: player.id,
      name: player.name,
      position: 'sb', // Default position, should be set by Game class
      currentStack: 0, // Should be set when buying in
      isFolded: false,
      remainingTimeCookies: player.remainingTimeCookies,
      cards: undefined, // Will be set when cards are dealt
      arrangedCards: undefined, // Will be set when player arranges cards
    };
  }

  getPlayerState(): PlayerState {
    return this.playerState;
  }

  updatePlayerState(updates: Partial<PlayerState>) {
    this.playerState = {
      ...this.playerState,
      ...updates,
    };
  }

  getStack() {
    return this.playerState.currentStack;
  }
}
