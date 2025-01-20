import { Player } from '../../player/Player';
import { PlayerCardArrangement } from '../arrangeCards/ArrangePlayerCardsManager';
import { Game } from '../Game';
import { Card } from './Card';
import { Position } from '../utils/PositionsUtils';

export interface PlayerPublicState {
  id: string;
  name: string;
  position: Position;
  currentStack: number;
  isFolded: boolean;
  arrangedCardsReady?: boolean;
}

export interface PlayerPrivateState {
  cards: Card[] | null;
  arrangedCards?: PlayerCardArrangement;
  remainingTimeCookies: number;
}

// Represents player data in a single game
export class PlayerInGame extends Player {
  playerPublicState: PlayerPublicState;
  playerPrivateState: PlayerPrivateState;
  game: Game;

  constructor(player: Player, game: Game, position: Position, buyIn: number) {
    super(player.id, player.name, player.socketId);
    this.game = game;
    this.playerPublicState = {
      id: player.id,
      name: player.name,
      position: position,
      currentStack: buyIn,
      isFolded: false,
    };

    this.playerPrivateState = {
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
    if (updates.arrangedCards) {
      this.playerPublicState.arrangedCardsReady = true;
    }
  }

  isFolded(): boolean {
    return this.playerPublicState.isFolded;
  }

  getStack(): number {
    return this.playerPublicState.currentStack;
  }

  getPosition(): Position {
    return this.playerPublicState.position;
  }
}
