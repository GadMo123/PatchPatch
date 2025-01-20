import { Game } from '../Game';
import { Position } from '../utils/PositionsUtils';
import { Card } from '../types/Card';
import { Timer } from '../utils/Timer';

export interface ArrangePlayerCardsState {
  timeRemaining: number;
  playerDoneMap: Map<Position, boolean>;
}

export interface PlayerCardArrangement {
  hand1: Card[];
  hand2: Card[];
  hand3: Card[];
}

export class ArrangePlayerCardsManager {
  private state: ArrangePlayerCardsState;
  private game: Game;
  private playersRemaining: number;
  private timer: Timer;
  private updateInterval: NodeJS.Timeout | null;

  constructor(game: Game) {
    this.game = game;
    this.timer = new Timer();
    this.updateInterval = null;

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
  }

  startTimerAndListeners(onComplete: () => void) {
    // Set up socket listener for card arrangements
    this.game
      .getServer()
      .on(
        'cards-arrangement',
        ({
          playerId,
          arrangement,
        }: {
          playerId: string;
          arrangement: PlayerCardArrangement;
        }) => {
          const player = Array.from(
            this.game.getPlayersInGame()?.entries() || []
          ).find(([_, p]) => p?.id === playerId)?.[1];

          if (player) {
            // Update player's arranged cards
            player.updatePlayerPrivateState({
              arrangedCards: arrangement,
            });

            // Mark player as done
            this.markPlayerDone(player.getPosition());

            // Check if all players are done
            if (this.isAllPlayersDone()) {
              this.cleanup();
              onComplete();
            }
          }
        }
      );

    // Start countdown timer
    this.timer.start(this.state.timeRemaining, () => {
      this.cleanup();
      onComplete();
    });

    // Update time remaining every second
    this.updateInterval = setInterval(() => {
      this.state.timeRemaining = Math.max(0, this.state.timeRemaining - 1000);

      // Update game state to broadcast time remaining to clients
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

    // Remove socket listener
    this.game.getServer().removeAllListeners('cards-arrangement');
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
