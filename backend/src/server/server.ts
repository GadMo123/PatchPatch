// src/server/server.ts

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { Game } from '../game/Game';
import { Player } from '../player/Player';
import { handleJoinGame, handleLobbyStatus } from '../lobby/LobbyManager';
import { SingleGameManager } from '../gameFlowManager/SingleGameManager';

let gameCounter = 0;

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
function addPlayer(playerId: string, name: string, socketId: string): Player {
  const player = new Player(playerId, name, socketId);
  players[playerId] = player;
  return player;
}

// Remove a player
function removePlayer(socketId: string) {
  delete players[socketId];
}

// Create a new game
function createGame(
  creatorId: string,
  blindLevel: string,
  server: Server
): Game {
  const gameId = (gameCounter++).toString();
  const newGame = new Game(gameId, blindLevel, server);
  games[gameId] = newGame;

  // Add the creator as the first player
  if (players[creatorId]) {
    newGame.addPlayer(players[creatorId]);
  }

  return newGame;
}

// Socket.io communication
io.on('connection', socket => {
  console.log('A user connected:', socket.id);

  // Handle login
  socket.on('login', (name, callback) => {
    if (!name) return callback({ success: false, message: 'Name is required' });
    const player = addPlayer(socket.id, name, socket.id); // For now socket is the unique id until login functions
    callback({ success: true, playerId: player.id });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    removePlayer(socket.id);
  });

  // Handle game creation
  // Todo: handle permissions, should player be able to create a game? or admin premission?
  socket.on('create-game', (blindLevel, callback) => {
    if (!players[socket.id]) {
      return callback({ success: false, message: 'Player not logged in' });
    }

    const game = createGame(socket.id, blindLevel, io);
    callback({ success: true, gameId: game.getId() });
  });

  // Handle joining a game
  socket.on('join-game', (gameId, callback) => {
    const result = handleJoinGame(games[gameId], socket.id, players);

    if (result.success) {
      io.to(gameId).emit(
        'game-state',
        games[gameId]?.getPersonalizedGameState(socket.id)
      );
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

  // Server-side: Handle game-state-request from a client
  socket.on('game-state', (gameId, callback) => {
    const game = games[gameId];
    if (game) {
      const gameState = game.getPersonalizedGameState(socket.id);
      callback({ success: true, gameState });
    } else {
      callback({ success: false, message: 'Game not found' });
    }
  });
});

server.listen(5000, () => console.log('Server running on port 5000'));

// this section is temporary for testing, to create loby games, loggin without authentication, ect.
createDummyGames(io);
//create few games for testing, romove later
function createDummyGames(server: Server) {
  createGame('admin', '5-10', server);
  createGame('admin', '5-10', server);
  createGame('admin', '25-50', server);
  createGame('admin', '25-50', server);
  createGame('admin', '10-20', server);
}

function loginPlayerOnConnection(playerId: string, socketId: string) {
  const player = addPlayer(playerId, playerId, socketId);
}

export { io, app };
