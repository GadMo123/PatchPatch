// src\game\arrangeCards\ArrangePlayerCardsManager.ts - Handles card arrangement phase - timers, broadcasts, validations, default action.

import { Card } from "shared";
import { Game } from "../Game";
import { GameActionTimerManager } from "../utils/GameActionTimerManager";
import { validateCardsArrangement } from "./PlayerArrangementValidator";
import { Position } from "shared";

export interface ArrangePlayerCardsState {
  timeRemaining: number;
  playerDoneMap: Map<Position, boolean>;
}

export interface ArrangeCardsResult {
  success: boolean;
  error?: string;
}

export class ArrangePlayerCardsManager {
  private _state: ArrangePlayerCardsState;
  private _playersRemaining: number;
  private _timer: GameActionTimerManager;

  constructor(
    private _game: Game,
    OnArrangeDone: () => void
  ) {
    // Initialize player done map and count
    const playerDoneMap = new Map<Position, boolean>();
    let activePlayerCount = 0;

    const playersInGame = _game.getPlayersInGame();
    if (playersInGame) {
      playersInGame.forEach((player, position) => {
        if (player && player.isFolded()) {
          playerDoneMap.set(position, false);
          activePlayerCount++;
        }
      });
    }

    this._playersRemaining = activePlayerCount;
    this._state = {
      timeRemaining: 60000, // todo table config
      playerDoneMap: playerDoneMap,
    };
    this._timer = new GameActionTimerManager({
      duration: this._state.timeRemaining,
      networkBuffer: 1000,
      timeCookieEffect: _game.getTableConfig().timeCookieEffect,
      maxCookiesPerRound: 3,
      updateTimeRemianing: (timeRemaining: number) =>
        this.updateTimeRemianing(timeRemaining),
      onTimeout: OnArrangeDone,
      onComplete: OnArrangeDone,
    });
    this._timer.start();
  }

  async handlePlayerArrangedCardsRecived(
    playerId: string,
    arrangement: Card[]
  ): Promise<ArrangeCardsResult> {
    const player = Array.from(
      this._game.getPlayersInGame()?.entries() || []
    ).find(([_, p]) => p?.getId() === playerId)?.[1];

    if (!player) {
      return { success: false, error: "Player not found" };
    }

    if (this._state.playerDoneMap.get(player.getPokerPosition()) === true) {
      return { success: false, error: "Player already submitted arrangement" };
    }

    const validationResult = validateCardsArrangement(arrangement, player);

    console.log(validationResult.cards);

    if (!validationResult.isValid) {
      return { success: false, error: validationResult.error };
    }

    // Update player's arranged cards
    player.updatePlayerPrivateState({
      cards: arrangement,
    });

    // Mark player as done
    this.markPlayerDone(player.getPokerPosition());

    if (this.isAllPlayersDone()) {
      this._timer.handleAction(); // Signal that we received valid actions, cancel timout action
    }

    return { success: true };
  }

  markPlayerDone(position: Position) {
    if (this._state.playerDoneMap.get(position) === false) {
      this._state.playerDoneMap.set(position, true);
      this._playersRemaining--;

      // Update game state to broadcast progress
      this._game.updateGameStateAndBroadcast(
        {
          arrangePlayerCardsState: this._state,
        },
        null
      );
    }
  }

  updateTimeRemianing(timeRemaining: number) {
    this._state.timeRemaining = timeRemaining;
    this._game.updateGameStateAndBroadcast(
      {
        arrangePlayerCardsState: this._state,
      },
      null
    );
  }

  isAllPlayersDone(): boolean {
    return this._playersRemaining === 0;
  }
}
