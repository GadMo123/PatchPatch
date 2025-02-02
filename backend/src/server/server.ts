// src/server/server.ts

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { SocketHandlers } from './handlers/SocketHandlers';
import {
  GameServerConfig,
  SocketEvents,
} from '../../../shared/src/SocketProtocol';
import { ServerStateManager } from './ServerStateManager';
import { Game } from '../game/Game';
import { TableConfig, getTableConfig } from '../game/betting/BettingTypes';
import { GamePhase } from '../game/broadcasting/GameState';
import { getLobbyStatus } from '../lobby/LobbyManager';

const serverConfig: GameServerConfig = {
  maxGamesPerServer: 3000,
  healthCheckInterval: 30000,
  serverRegion: 'us-east-1',
  serverId: 'server-1',
};

const PORT = process.env.PORT || 5000;
const app = express();

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
  pingInterval: 21000,
});

app.use(express.json());

const socketHandlers = SocketHandlers.getInstance();
let gameCounter = 0;

io.on('connection', socket => {
  console.log('A user connected:', socket.id);
  // DOS
  const rateLimiter = new Map<string, number[]>();
  socket.use((packet, next) => {
    const now = Date.now();
    const timestamps = rateLimiter.get(socket.id) || [];

    // Remove timestamps older than 1 second
    while (timestamps.length > 0 && now - timestamps[0] > 1000) {
      timestamps.shift();
    }

    const limit = Number(process.env.MSG_PER_SEC_LIMIT) || 15;
    if (timestamps.length >= limit) {
      return next(new Error(`Rate limit exceeded`));
    }
    // Add current timestamp and update map
    timestamps.push(now);
    rateLimiter.set(socket.id, timestamps);
    next();
  });

  //Todo - handle reconnection for each game where player is active

  socket.on(SocketEvents.LOGIN, async (payload, callback) => {
    const result = await socketHandlers.handleLogin(socket, payload);
    callback(result);
  });

  socket.on(SocketEvents.DISCONNECT, async () => {
    await socketHandlers.handleDisconnect(socket.id);
    console.log('User disconnected:', socket.id);
  });

  socket.on(SocketEvents.JOIN_GAME, async (payload, callback) => {
    const result = await socketHandlers.handleJoinGame(payload);
    callback(result);
  });

  socket.on(SocketEvents.GAME_BUYIN, async (payload, callback) => {
    const result = await socketHandlers.handleGameBuyin(payload);
    callback(result);
  });

  socket.on(SocketEvents.PLAYER_ACTION, async (payload, callback) => {
    const result = await socketHandlers.handlePlayerAction(payload);
    callback(result);
  });

  socket.on(SocketEvents.CARDS_ARRANGEMENT, async (payload, callback) => {
    const result = await socketHandlers.handleCardArrangement(payload);
    callback(result);
  });

  socket.on(SocketEvents.LOBBY_STATUS, async callback => {
    const games = ServerStateManager.getInstance().getGames();
    const gamesList = getLobbyStatus(games);
    if (!gamesList.success) callback({ success: false });
    else
      callback({
        success: true,
        games: gamesList,
      });
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  const healthStatus = {
    status: 'healthy',
    serverId: serverConfig.serverId,
    region: serverConfig.serverRegion,
    activeGames: Object.keys(ServerStateManager.getInstance().getGames())
      .length,
    activePlayers: Object.keys(ServerStateManager.getInstance().getPlayers())
      .length,
  };
  res.json(healthStatus);
});

// Create dummy games before starting server
createDummyGames(io);

server.listen(PORT, () => {
  console.log('Server running on port 5000');
  console.log('Created dummy games for testing');
});

// Proper cleanup on server shutdown
process.on('SIGTERM', () => {
  io.close(() => {
    server.close(() => {
      process.exit(0);
    });
  });
});

// Create a new game helper function
function createGame(
  creatorId: string,
  blindLevel: string,
  server: Server,
  config: TableConfig
): Game {
  const gameId = (gameCounter++).toString();
  const newGame = new Game(gameId, blindLevel, server, config);
  ServerStateManager.getInstance().addGame(newGame);
  return newGame;
}

// Create dummy games for testing
function createDummyGames(server: Server) {
  createGame(
    'admin',
    '5-10',
    server,
    getTableConfig(10000, 10, Infinity, 10, 5, 10, 2)
  );

  createGame(
    'admin',
    '10-20',
    server,
    getTableConfig(10000, 20, Infinity, 10, 10, 20, 3)
  );

  createGame(
    'admin',
    '25-50',
    server,
    getTableConfig(10000, 50, Infinity, 10, 25, 50, 3)
  );

  createGame(
    'admin',
    '50-100',
    server,
    getTableConfig(10000, 100, Infinity, 10, 50, 100, 4)
  );

  createGame(
    'admin',
    '100-200',
    server,
    getTableConfig(10000, 200, Infinity, 10, 100, 200, 6)
  );
}

export { io, app };
