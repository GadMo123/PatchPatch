// src\game\types\PlayerInGame.ts - A representation of a player sitting in a game, PlayerInGame extends Player is possibility, for now Decided agains it, for better synchronicity handling clearance
import { Card, Position } from "@patchpatch/shared";
import { Player } from "../../player/Player";
import { Game } from "../Game";

export interface PlayerPublicState {
  isSittingOut: boolean;
  isAllIn: boolean;
  id: string;
  name: string;
  pokerPosition: Position | null;
  tablePosition: number;
  currentStack: number;
  isFolded: boolean;
  arrangedCardsReady?: boolean;
  roundPotContributions?: number;
}

export interface PlayerPrivateState {
  cards?: Card[];
  remainingTimeCookies: number;
}

// extends player? seems right but have a synchronicity complexity
export class PlayerInGame {
  private _playerPublicState: PlayerPublicState;
  private _playerPrivateState: PlayerPrivateState;

  // A player that sits in a game
  constructor(
    private _player: Player,
    private _game: Game,
    pokerPosition: Position | null,
    tablePosition: number
  ) {
    this._player = _player;

    // Initialize states
    this._playerPublicState = {
      id: _player.getId(),
      name: _player.getName(),
      pokerPosition: pokerPosition,
      tablePosition: tablePosition,
      currentStack: 0,
      isSittingOut: false,
      isFolded: false,
      isAllIn: false,
    };

    this._player.addActiveGame(_game.getId());
    this._playerPrivateState = {
      cards: undefined,
      remainingTimeCookies: 0,
    };

    _player.getTimebankCookies().then((timebanks) => {
      this._playerPrivateState.remainingTimeCookies = timebanks;
    });
  }

  async buyIntoGame(game: Game, buyIn: number): Promise<boolean> {
    const seccuss = await this._player.buyIntoGame(buyIn, game);
    if (!seccuss) return false;

    this._playerPublicState.currentStack += buyIn;
    return true;
  }

  async cashoutStack(): Promise<void> {
    const currentStack = this._playerPublicState.currentStack;
    if (currentStack > 0) {
      this._player.addToBankCoins(currentStack).then(() =>
        this.updatePlayerPublicState({
          currentStack: 0,
          isAllIn: false,
        })
      );
    }
  }

  exitGame() {
    this._player.removeActiveGame(this._game.getId());
  }

  async useTimebankCookie(): Promise<boolean> {
    const success = await this._player.useTimebankCookie();
    if (success) {
      const remainingCookies = await this._player.getTimebankCookies();
      this.updatePlayerPrivateState({
        remainingTimeCookies: remainingCookies,
      });
    }
    return success;
  }

  getPlayerPublicState(): PlayerPublicState {
    return this._playerPublicState;
  }

  updatePlayerPublicState(updates: Partial<PlayerPublicState>) {
    this._playerPublicState = {
      ...this._playerPublicState,
      ...updates,
    };
  }

  getPlayerPrivateState(): PlayerPrivateState {
    return this._playerPrivateState;
  }

  updatePlayerPrivateState(updates: Partial<PlayerPrivateState>) {
    this._playerPrivateState = {
      ...this._playerPrivateState,
      ...updates,
    };
  }

  isFolded(): boolean {
    return this._playerPublicState.isFolded;
  }

  isReadyToStartHand(minStackRequired: number): boolean {
    return (
      this._playerPublicState.currentStack >= minStackRequired &&
      !this._playerPublicState.isSittingOut
    );
  }

  isActive() {
    return (
      !this._playerPublicState.isAllIn &&
      !this._playerPublicState.isFolded &&
      !this._playerPublicState.isSittingOut
    );
  }

  getStack(): number {
    return this._playerPublicState.currentStack;
  }

  isAllIn() {
    return this._playerPublicState.isAllIn;
  }

  getPokerPosition(): Position | null {
    return this._playerPublicState.pokerPosition;
  }

  getTablePosition(): number {
    return this._playerPublicState.tablePosition;
  }

  getId(): string {
    return this._player.getId();
  }

  getName(): string {
    return this._player.getName();
  }

  getSocketId(): string {
    return this._player.getSocketId();
  }
}
