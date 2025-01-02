// src/server/singleGameManager.ts

import { Server, Socket } from 'socket.io';
import { Game } from '../game/Game';
export class SingleGameManager {
  game: Game;
  constructor(game: Game) {
    this.game = game;
  }

  startGame(io: Server) {
    try {
      this.game.startGame();
      this.sendGameStateToPlayers(io);

      // Deal flops after 5 seconds
      setTimeout(() => {
        this.game.dealFlops();
        this.sendGameStateToPlayers(io);

        // Deal turns after another 5 seconds
        setTimeout(() => {
          this.game.dealTurn();
          this.sendGameStateToPlayers(io);

          // Deal rivers after another 5 seconds
          setTimeout(() => {
            this.game.dealRiver();
            this.sendGameStateToPlayers(io);

            // Mark the game as completed
            this.game.endGame();
            this.sendGameStateToPlayers(io);
          }, 1000);
        }, 1000);
      }, 1000);
    } catch (error: any) {
      console.error(error.message);
    }
  }
  /**
   * Sends the game state to all players in the game individually.
   */
  private sendGameStateToPlayers(io: Server) {
    this.game.playersList.forEach(player => {
      io.to(player.id).emit('game-state', this.game.getState());
    });
  }
}
