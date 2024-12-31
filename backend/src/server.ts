import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { Game } from './gameUtils/Game';


const app = express();
const server = http.createServer(app);

// Initialize socket.io with the server, properly handling CORS
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000', // Ensure this matches your client-side URL
    methods: ['GET', 'POST'],
    allowedHeaders: ['my-custom-header'],
    credentials: true,
  },
});

// Store all games
const games: Record<string, Game> = {};

io.on('connection', socket => {
  console.log('A user connected:', socket.id);

  // Create a new game
  socket.on('create-game', (callback: (id: string) => void) => {
    const gameId = `game-${Date.now()}`;
    games[gameId] = new Game(gameId);
    callback(gameId);
  });

  // Join an existing game
  socket.on('join-game', (gameId: string, name: string, callback: (state: any) => void) => {
    const game = games[gameId];
    if (!game) {
      return callback({ error: 'Game not found' });
    }

    try {
      game.addPlayer(socket.id, name);
      callback(game.getState());
    } catch (error: any) {
      callback({ error: error.message });
    }
  });

  // Start the game
  socket.on('start-game', (gameId: string) => {
    const game = games[gameId];
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

  // Disconnect handling
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
