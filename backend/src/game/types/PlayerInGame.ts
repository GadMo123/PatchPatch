// src\game\types\PlayerInGame.ts - A representation of a player sitting in a game, PlayerInGame extends Player is possibility, for now Decided agains it, for better synchronicity handling clearance
import { Card, Position } from "@patchpatch/shared";
import { Player } from "../../player/Player";
import { Game } from "../Game";

// Define the maximum sit-out time (in milliseconds) before player gets kicked
const MAX_SITOUT_TIME = (() => {
  const envValue = process.env.MAX_SITOUT_TIME;
  if (envValue && !isNaN(Number(envValue))) {
    return Number(envValue);
  }
  return 2 * 60 * 1000; // Default: 2 minutes
})();

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
  removed: boolean;
  sitoutTimer: number | null; // Timer in milliseconds remaining for sit-out
}

export interface PlayerPrivateState {
  cards?: Card[];
  remainingTimeCookies: number;
}

// extends player? seems right but have a synchronicity complexity
export class PlayerInGame {
  private _playerPublicState: PlayerPublicState;
  private _playerPrivateState: PlayerPrivateState;
  private _sitoutTimerInterval: NodeJS.Timeout | null = null;

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
      sitoutTimer: null,
      removed: false,
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

  /**
   * Toggle sit-out status and manage timer
   * @param sitout Whether to sit out (true) or come back in (false)
   * @returns success status
   */
  async toggleSitOut(sitout: boolean): Promise<boolean> {
    if (this._playerPublicState?.isSittingOut === sitout) return false;
    if (sitout) {
      // Player sit out
      this.startSitOutTimer();
      console.log("player sitout");
    } else {
      // Player wants to come back in
      if (!this._playerPublicState.removed)
        this._playerPublicState.isSittingOut = false;
      this.stopSitOutTimer();
    }
    return true;
  }

  /**
   * Start the sit-out timer
   */
  private startSitOutTimer(): void {
    if (this._sitoutTimerInterval !== null) return; // already sitting out

    // Set the initial timer value to the maximum sit-out time
    this.updatePlayerPublicState({
      sitoutTimer: MAX_SITOUT_TIME,
      isSittingOut: true,
    });

    console.log("player sitout 2 " + this._playerPublicState.sitoutTimer);

    this._game.updateGameStateAndBroadcast({}, null);

    // Start counting down at regular intervals (1 second)
    this._sitoutTimerInterval = setInterval(() => {
      // Get current timer value
      const currentTimer = this._playerPublicState.sitoutTimer;

      if (currentTimer === null) {
        // Timer should be active but isn't, clean up
        this.stopSitOutTimer();
        return;
      }

      if (currentTimer <= 1000) {
        // Timer has reached zero, kick the player out
        this.stopSitOutTimer();
        this.updatePlayerPublicState({
          sitoutTimer: 1, // mark player as sitting out until removed phisiclly by the game
        });
        this._playerPublicState.removed = true;
        this._game.removePlayer(this);
        return;
      }

      // Decrease timer by 1 second (1000ms)
      this.updatePlayerPublicState({
        sitoutTimer: currentTimer - 1000,
      });
    }, 1000);
  }

  /**
   * Stop the sit-out timer
   */
  private stopSitOutTimer(): void {
    if (this._sitoutTimerInterval) {
      clearInterval(this._sitoutTimerInterval);
      this._sitoutTimerInterval = null;
    }

    this.updatePlayerPublicState({
      isSittingOut: false,
      sitoutTimer: null,
    });

    this._game.updateGameStateAndBroadcast({}, null);
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
    // Make sure to stop any timers when exiting
    this.stopSitOutTimer();
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

  /**
   * Check if the player is currently sitting out
   */
  isSittingOut(): boolean {
    return this._playerPublicState.isSittingOut;
  }

  /**
   * Get the remaining sit-out time in milliseconds
   * Returns null if player is not sitting out
   */
  getSitOutTimeRemaining(): number | null {
    return this._playerPublicState.sitoutTimer;
  }
}
