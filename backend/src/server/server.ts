// src/server/server.ts

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { Game } from '../game/Game';
import { Player } from '../player/Player';
import { verifyPlayerId, handleGameStateError } from '../utils/gameStateUtils';

let curPlayerID = 0;
let curGameID = 0;
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:3000', methods: ['GET', 'POST'] },
});

const games: Record<string, Game> = {};
const players: Record<string, Player> = {};

io.on('connection', socket => {
  console.log('A user connected:', socket.id);
  const playerId = (curPlayerID++).toString();
  players[playerId] = new Player(playerId, `Player ${playerId}`, socket);

  socket.emit('player-id', playerId);

  socket.on('create-game', callback => {
    const gameId = createGame();
    callback({ success: true });
  });

  socket.on('join-game', (gameId, name, callback) => {
    const game = games[0] ? games[0] : games[createGame()];

    // Add the player to the game
    game.addPlayer(players[playerId]);

    // Broadcast the game state to each player individually
    game.broadcastGameState();
  });

  socket.on('start-game', gameId => {
    const game = games[0];
    if (!game) {
      console.error('Game not found');
      return;
    }

    try {
      game.startGame();
      io.emit('game-state', game.getState());

      // Deal flops after 5 seconds
      setTimeout(() => {
        game.dealFlops();
        io.emit('game-state', game.getState());

        // Deal turns after another 5 seconds
        setTimeout(() => {
          game.dealTurn();
          io.emit('game-state', game.getState());

          // Deal rivers after another 5 seconds
          setTimeout(() => {
            game.dealRiver();
            io.emit('game-state', game.getState());

            // Mark the game as completed
            game.endGame();
            io.emit('game-state', game.getState());
          }, 1000);
        }, 1000);
      }, 1000);
    } catch (error: any) {
      console.error(error.message);
    }
  });

  socket.on('disconnect', () => {
    delete players[playerId];
    console.log('User disconnected:', socket.id);
  });
});

const PORT = 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

function createGame() {
  const id = 0;
  games[id] = new Game('' + id); // Store the game under the string key.
  return id;
}
