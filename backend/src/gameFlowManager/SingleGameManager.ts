// src/server/singleGameManager.ts

import { Server } from 'socket.io';
import { Game } from '../game/Game';
export class SingleGameManager {
  game: Game;
  constructor(game: Game) {
    this.game = game;
  }

  startGame(io: Server) {
    console.log('starting game: ' + this.game.getId());
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
      if (player.socketId) {
        // Emit the game state to the specific player's socket
        io.to(player.socketId).emit('game-state', this.game.getState());
      } else {
        console.error(`Player ${player.id} does not have a valid socket ID.`);
      }
    });
  }
}
