import { Player } from '../../player/Player';
import { Game } from '../Game';
import { Card } from './Card';
import { Position } from '../utils/PositionsUtils';

export interface PlayerPublicState {
  isSittingOut: any;
  isAllIn: any;
  id: string;
  name: string;
  position: Position;
  currentStack: number;
  isFolded: boolean;
  arrangedCardsReady?: boolean;
}

export interface PlayerPrivateState {
  cards: Card[] | null;
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
      isSittingOut: true,
      id: player.id,
      name: player.name,
      position: position,
      currentStack: buyIn,
      isFolded: false,
      isAllIn: buyIn > 0,
    };

    this.playerPrivateState = {
      remainingTimeCookies: player.remainingTimeCookies,
      cards: null,
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

  increaseStack(returnedBet: number) {
    this.updatePlayerPublicState({
      currentStack: this.playerPublicState.currentStack + returnedBet,
    });
  }

  isFolded(): boolean {
    return this.playerPublicState.isFolded;
  }

  isReadyToStartHand(bbAmount: number): boolean {
    return (
      this.playerPublicState.currentStack >= bbAmount &&
      !this.playerPublicState.isSittingOut
    );
  }

  isActive() {
    return (
      !this.playerPublicState.isAllIn &&
      !this.playerPublicState.isFolded &&
      !this.playerPublicState.isSittingOut
    );
  }

  getStack(): number {
    return this.playerPublicState.currentStack;
  }

  getPosition(): Position {
    return this.playerPublicState.position;
  }
}
