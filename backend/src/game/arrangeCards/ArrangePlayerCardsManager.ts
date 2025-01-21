import { Game } from '../Game';
import { Position } from '../utils/PositionsUtils';
import { Timer } from '../utils/Timer';
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
  private timer: Timer;
  private updateInterval: NodeJS.Timeout | null;
  private timeIsUpCallback: () => void;

  constructor(game: Game, OnTimerUp: () => void) {
    this.game = game;
    this.timer = new Timer();
    this.updateInterval = null;
    this.timeIsUpCallback = OnTimerUp;
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
    this.startTimer();
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
      this.cleanup();
      this.timeIsUpCallback();
    }
    return { success: true };
  }

  startTimer() {
    // Start countdown timer
    this.timer.start(this.state.timeRemaining, () => {
      this.cleanup();
      this.timeIsUpCallback();
    });

    // Update time remaining every second
    this.updateInterval = setInterval(() => {
      this.state.timeRemaining = Math.max(0, this.state.timeRemaining - 1000);

      // Update game state to broadcast time remaining and players done to clients every second
      this.game.updateGameStateAndBroadcast(
        {
          arrangePlayerCardsState: this.getState(),
        },
        null
      );
    }, 1000);
  }

  private cleanup() {
    // Clear timer and interval
    this.timer.clear();
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  markPlayerDone(position: Position) {
    if (this.state.playerDoneMap.get(position) === false) {
      this.state.playerDoneMap.set(position, true);
      this.playersRemaining--;

      // Update game state to broadcast progress
      this.game.updateGameStateAndBroadcast(
        {
          arrangePlayerCardsState: this.getState(),
        },
        null
      );
    }
  }

  isAllPlayersDone(): boolean {
    return this.playersRemaining === 0;
  }

  getState(): ArrangePlayerCardsState {
    return this.state;
  }
}
