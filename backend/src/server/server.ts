// src/server/server.ts

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { Game } from '../game/Game';
import { Player } from '../player/Player';
import { handleJoinGame, handleLobbyStatus } from '../lobby/LobbyManager';
import { BettingConfig, getBettingConfig } from '../game/betting/BettingTypes';
import { Position } from '../game/utils/PositionsUtils';
import { ServerStateManager } from './ServerStateManager';
import { GamePhase } from '../game/types/GameState';

let gameCounter = 0;

const stateManager = ServerStateManager.getInstance();

const app = express();

// Create HTTP server using Express app
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Enable JSON parsing middleware
app.use(express.json());

app.get('/health', (req, res) => {
  res.send('Server is healthy');
});

// Add a new player
function addPlayer(playerId: string, name: string, socketId: string): Player {
  const player = new Player(playerId, name, socketId);
  stateManager.addPlayer(player);
  return player;
}

// Remove a player
function removePlayer(playerId: string) {
  stateManager.removePlayer(playerId);
}

// Create a new game
function createGame(
  creatorId: string,
  blindLevel: string,
  server: Server,
  config: BettingConfig
): Game {
  const gameId = (gameCounter++).toString();
  const newGame = new Game(gameId, blindLevel, server, config);
  stateManager.addGame(newGame);
  return newGame;
}

// Socket.io communication
io.on('connection', socket => {
  console.log('A user connected:', socket.id);

  // Handle login
  socket.on('login', (name, callback) => {
    if (!name) {
      callback({ success: false, message: 'Name is required' });
      return;
    }
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
    if (!stateManager.getPlayer(socket.id)) {
      // assume playerID is socketID.
      callback({ success: false, message: 'Player not logged in' });
      return;
    }

    const game = createGame(
      socket.id,
      blindLevel,
      io,
      getBettingConfig(10000, 2, Infinity, 10)
    );
    callback({ success: true, gameId: game.getId() });
  });

  // Handle joining a game
  socket.on('join-game', async (gameId, callback) => {
    const game = stateManager.getGame(gameId);

    if (game == null) {
      callback({ success: false, message: "Game id desn't exist" });
      return;
    }

    const position =
      game?.getPlayerInPosition(Position.SB) != null
        ? Position.BB
        : Position.SB; //Todo choose position in game view

    const result = await handleJoinGame(
      game!,
      socket.id,
      100,
      position,
      ServerStateManager.getInstance()
    );

    if (result.success && game?.isReadyForNextHand()) {
      game.startGame();
    }
    callback(result);
  });

  // Handle send lobby status to player
  socket.on('lobby-status', (gameId, callback) => {
    const result = handleLobbyStatus(stateManager.getGames());

    if (result.success) {
      io.to(gameId).emit('lobby-status', result.games);
    }

    callback(result);
  });

  // Handle player betting actions
  socket.on(
    'player-action',
    ({ gameId, playerId, action, amount }, callback) => {
      const game = stateManager.getGame(gameId);
      // Todo validate player input class
      if (!game) {
        callback({ success: false, error: 'Game not found' });
        return;
      }
      if (!game.getBettingState()) {
        callback({ success: false, error: 'No betting action needed' });
        return;
      }

      try {
        game.getGameFlowManager().handlePlayerAction(playerId, action, amount);
        callback({ success: true });
      } catch (error) {
        console.error('Error handling player action:', error);
        callback({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  socket.on(
    'cards-arrangement',
    ({ gameId, playerId, arrangement }, callback) => {
      const game = stateManager.getGame(gameId);

      if (!game) {
        callback({ success: false, error: 'Game not found' });
        return;
      }

      if (game.getPhase() !== GamePhase.ArrangePlayerCards) {
        callback({ success: false, error: 'Not in card arrangement phase' });
        return;
      }

      try {
        // Emit to the ArrangePlayerCardsManager
        io.emit('cards-arrangement', { playerId, arrangement });
        callback({ success: true });
      } catch (error) {
        console.error('Error handling card arrangement:', error);
        callback({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  socket.on('reconnect', () => {
    console.log(`Client reconnected: ${socket.id}`);
    //todo send games states
  });

  // Proper cleanup on server shutdown
  process.on('SIGTERM', () => {
    io.close(() => {
      server.close(() => {
        process.exit(0);
      });
    });
  });
});

server.listen(5000, () => console.log('Server running on port 5000'));

// this section is temporary for testing, to create loby games, loggin without authentication, ect.
createDummyGames(io);
//create few games for testing, romove later
function createDummyGames(server: Server) {
  createGame(
    'admin',
    '5-10',
    server,
    getBettingConfig(10000, 10, Infinity, 10)
  );
  createGame(
    'admin',
    '5-10-fast',
    server,
    getBettingConfig(10, 10, Infinity, 8)
  );
  createGame('admin', '25-50', server, getBettingConfig(10, 50, Infinity, 10));
  createGame(
    'admin',
    '25-50-slow',
    server,
    getBettingConfig(10, 50, Infinity, 12)
  );
  createGame('admin', '10-20', server, getBettingConfig(10, 20, Infinity, 10));
}

function loginPlayerOnConnection(playerId: string, socketId: string) {
  const player = addPlayer(playerId, playerId, socketId);
}

export { io, app };
