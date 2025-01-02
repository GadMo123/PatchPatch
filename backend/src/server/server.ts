// src/server/server.ts

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { Game } from '../game/Game';
import { Player } from '../player/Player';
import { handleJoinGame, handleLobbyStatus } from '../lobby/LobbyManager';
import { SingleGameManager } from '../gameFlowManager/singleGameManager';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:3000', methods: ['GET', 'POST'] },
});

app.use(express.json());

// Data storage
const players: Record<string, Player> = {};
const games: Record<string, Game> = {};

// Add a new player
function addPlayer(socketId: string, name: string): Player {
  const player = new Player(socketId, name);
  players[socketId] = player;
  return player;
}

// Remove a player
function removePlayer(socketId: string) {
  delete players[socketId];
}

// Create a new game
function createGame(creatorId: string, blindLevel: string): Game {
  const gameId = `game-${Date.now()}`;
  const newGame = new Game(gameId, blindLevel);
  games[gameId] = newGame;

  // Add the creator as the first player
  if (players[creatorId]) {
    newGame.addPlayer(players[creatorId]);
  }

  return newGame;
}

// Get a game by ID
function getGame(gameId: string): Game | undefined {
  return games[gameId];
}

// Get all games
function getGames(): Record<string, Game> | undefined {
  return games;
}

// Socket.io communication
io.on('connection', socket => {
  console.log('A user connected:', socket.id);

  // Handle login
  socket.on('login', (name, callback) => {
    if (!name) return callback({ success: false, message: 'Name is required' });
    const player = addPlayer(socket.id, name);
    callback({ success: true, playerId: player.id });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    removePlayer(socket.id);
  });

  // Handle game creation
  // Todo: handle permissions, should player be able to create a game??
  socket.on('create-game', (blindLevel, callback) => {
    if (!players[socket.id]) {
      return callback({ success: false, message: 'Player not logged in' });
    }

    const game = createGame(socket.id, blindLevel);
    callback({ success: true, gameId: game.getid });
  });

  // Handle joining a game
  socket.on('join-game', (gameId, callback) => {
    const result = handleJoinGame(gameId, socket.id, players);

    if (result.success) {
      io.to(gameId).emit('game-state', games[gameId]?.getState());
    }
    //assuming for now start on single player join
    new SingleGameManager(games[gameId]).startGame(io);
    callback(result);
  });

  // Handle send lobby status to player
  socket.on('lobby-status', (gameId, callback) => {
    const result = handleLobbyStatus(games);

    if (result.success) {
      io.to(gameId).emit('lobby-status', result.games);
    }

    callback(result);
  });
});

server.listen(5000, () => console.log('Server running on port 5000'));

export { io, app };
