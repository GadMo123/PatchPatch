import { Game } from '../Game';
import { GameActionTimerManager } from '../utils/GameActionTimerManager';
import { Position } from '../utils/PositionsUtils';
import { validateCardsArrangement } from './PlayerArrangementValidator';

export interface ArrangePlayerCardsState {
  timeRemaining: number;
  playerDoneMap: Map<Position, boolean>;
}

export interface ArrangeCardsResult {
  success: boolean;
  error?: string;
}

export class ArrangePlayerCardsManager {
  private state: ArrangePlayerCardsState;
  private game: Game;
  private playersRemaining: number;
  private timer: GameActionTimerManager;

  constructor(game: Game, OnArrangeDone: () => void) {
    this.game = game;
    // Initialize player done map and count
    const playerDoneMap = new Map<Position, boolean>();
    let activePlayerCount = 0;

    const playersInGame = game.getPlayersInGame();
    if (playersInGame) {
      playersInGame.forEach((player, position) => {
        if (player && !player.isFolded()) {
          playerDoneMap.set(position, false);
          activePlayerCount++;
        }
      });
    }

    this.playersRemaining = activePlayerCount;
    this.state = {
      timeRemaining: 60000, // todo table config
      playerDoneMap: playerDoneMap,
    };
    this.timer = new GameActionTimerManager({
      duration: this.state.timeRemaining,
      networkBuffer: 1000,
      timeCookieEffect: game.getBettingConfig().timeCookieEffect,
      maxCookiesPerRound: 3,
      updateTimeRemianing: (timeRemaining: number) =>
        this.updateTimeRemianing(timeRemaining),
      onTimeout: OnArrangeDone,
      onComplete: OnArrangeDone,
    });
    this.timer.start();
  }

  handlePlayerArrangedCardsRecived(
    playerId: any,
    arrangement: Object[]
  ): ArrangeCardsResult {
    const player = Array.from(
      this.game.getPlayersInGame()?.entries() || []
    ).find(([_, p]) => p?.id === playerId)?.[1];

    if (!player) {
      return { success: false, error: 'Player not found' };
    }

    if (this.state.playerDoneMap.get(player.getPosition()) === true) {
      return { success: false, error: 'Player already submitted arrangement' };
    }

    const validationResult = validateCardsArrangement(arrangement, player);

    console.log(validationResult.cards);

    if (!validationResult.isValid) {
      return { success: false, error: validationResult.error };
    }

    // Update player's arranged cards
    player.updatePlayerPrivateState({
      cards: validationResult.cards,
    });

    // Mark player as done
    this.markPlayerDone(player.getPosition());

    if (this.isAllPlayersDone()) {
      this.timer.handleAction(); // Signal that we received valid actions, cancel timout action
    }

    return { success: true };
  }

  markPlayerDone(position: Position) {
    if (this.state.playerDoneMap.get(position) === false) {
      this.state.playerDoneMap.set(position, true);
      this.playersRemaining--;

      // Update game state to broadcast progress
      this.game.updateGameStateAndBroadcast(
        {
          arrangePlayerCardsState: this.state,
        },
        null
      );
    }
  }

  updateTimeRemianing(timeRemaining: number) {
    this.state.timeRemaining = timeRemaining;
    this.game.updateGameStateAndBroadcast(
      {
        arrangePlayerCardsState: this.state,
      },
      null
    );
  }

  isAllPlayersDone(): boolean {
    return this.playersRemaining === 0;
  }
}
