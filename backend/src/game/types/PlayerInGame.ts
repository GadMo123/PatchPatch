import { Player } from '../../player/Player';
import { Game } from '../Game';
import { Position } from '../utils/PositionsUtils';
import { Card } from './Card';

export interface PlayerPublicState {
  isSittingOut: boolean;
  isAllIn: boolean;
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

// extends player? seems right but have a synchronicity complexity
export class PlayerInGame {
  private playerPublicState: PlayerPublicState;
  private playerPrivateState: PlayerPrivateState;
  private game: Game;
  private player: Player;

  // Player sits in game
  constructor(player: Player, game: Game, position: Position) {
    this.player = player;
    this.game = game;

    // Initialize states
    this.playerPublicState = {
      isSittingOut: true,
      id: player.getId(),
      name: player.getName(),
      position: position,
      currentStack: 0,
      isFolded: false,
      isAllIn: false,
    };

    this.player.addActiveGame(game.getId());
    this.playerPrivateState = {
      cards: null,
      remainingTimeCookies: 0,
    };

    player.getTimebankCookies().then(timebanks => {
      this.playerPrivateState.remainingTimeCookies = timebanks;
    });
  }

  async buyIntoGame(game: Game, buyIn: number): Promise<boolean> {
    const seccuss = await this.player.buyIntoGame(buyIn, game);
    if (!seccuss) return false;

    this.playerPublicState.currentStack += buyIn;
    return true;
  }

  async cashoutStack(): Promise<void> {
    const currentStack = this.playerPublicState.currentStack;
    if (currentStack > 0) {
      this.player.addToBankCoins(currentStack).then(() =>
        this.updatePlayerPublicState({
          currentStack: 0,
          isAllIn: false,
        })
      );
    }
  }

  exitGame() {
    this.player.removeActiveGame(this.game.getId());
  }

  async useTimebankCookie(): Promise<boolean> {
    const success = await this.player.useTimebankCookie();
    if (success) {
      const remainingCookies = await this.player.getTimebankCookies();
      this.updatePlayerPrivateState({
        remainingTimeCookies: remainingCookies,
      });
    }
    return success;
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

  isFolded(): boolean {
    return this.playerPublicState.isFolded;
  }

  isReadyToStartHand(bbAmount: number): boolean {
    const minStack = Number(process.env.MIN_BB_TO_PLAY_HAND) || 1;
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

  getId(): string {
    return this.player.getId();
  }

  getName(): string {
    return this.player.getName();
  }

  getSocketId(): string {
    return this.player.getSocketId();
  }
}
