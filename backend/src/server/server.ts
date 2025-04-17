// src/server/server.ts - Listen for a websocket communication with each the client and forward client protocol calls to handlers.

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { SocketHandlers } from "./handlers/SocketHandlers";

import { ServerStateManager } from "./ServerStateManager";
import { Game } from "../game/Game";
import { TableConfig, TableConfigBuilder } from "../game/betting/BettingTypes";
import { getLobbyStatus } from "../lobby/LobbyManager";
import { GameServerConfig, SocketEvents } from "@patchpatch/shared";
import { CactusKev } from "../game/utils/Cactus-Kev";

const serverConfig: GameServerConfig = {
  maxGamesPerServer: 3000,
  healthCheckInterval: 30000,
  serverRegion: "us-east-1",
  serverId: "server-1",
};

const PORT = process.env.PORT || 5000;
const app = express();

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  },
  transports: ["websocket", "polling"],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 21000,
});

app.use(express.json());

const socketHandlers = SocketHandlers.getInstance();
let gameCounter = 0;

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
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

  socket.on("disconnect", async () => {
    await socketHandlers.handleDisconnect(socket.id);
    console.log("User disconnected:", socket.id);
  });

  socket.on(SocketEvents.ENTER_GAME, async (payload, callback) => {
    const result = await socketHandlers.handleEnterGame(payload);
    callback(result);
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

  socket.on(SocketEvents.SIT_OUT_NEXT_HAND, async (payload, callback) => {
    const result = await socketHandlers.handleSitOutNextHand(payload);
    callback(result);
  });

  socket.on(SocketEvents.EXIT_GAME, async (payload, callback) => {
    const result = await socketHandlers.handleExitGame(payload);
    callback(result);
  });

  // socket.on(SocketEvents.STAND_UP, async (payload, callback) => {
  //   // const result = await socketHandlers.handleStandUp(payload);
  //   // callback(result);
  // });

  socket.on(SocketEvents.LOBBY_STATUS, async (callback) => {
    const games = ServerStateManager.getInstance().getGames();
    callback(getLobbyStatus(games));
  });

  // Allow a player to request the current game-state at any time (used for reconection and missed server broadcast)
  socket.on(SocketEvents.GAME_STATE_UPDATE, async (payload, callback) => {
    const result = await socketHandlers.handleGameStateUpdate(payload);
    callback(result);
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  const healthStatus = {
    status: "healthy",
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
  console.log("Server running on port 5000");
  console.log("Created dummy games for testing");
});

// Load to memory CactusKev instance with lookup tables
CactusKev.getInstance();

// Proper cleanup on server shutdown
process.on("SIGTERM", () => {
  io.close(() => {
    server.close(() => {
      process.exit(0);
    });
  });
});

// Create a new game helper function
function createGame(
  creatorId: string,
  server: Server,
  config: TableConfig
): Game {
  const gameId = (gameCounter++).toString();
  const newGame = new Game(gameId, server, config);
  ServerStateManager.getInstance().addGame(newGame);
  return newGame;
}

// Create dummy games for testing
function createDummyGames(server: Server) {
  const tableConfig1 = new TableConfigBuilder()
    .setTimePerArrangeAction(100000)
    .setTimePerAction(12000)
    .setMinBet(10)
    .setMaxBet(Infinity)
    .setTimeCookieEffect(600000)
    .setSbAmount(5)
    .setBbAmount(10)
    .setMinPlayers(2)
    .setMaxPlayers(2)
    .setMinBuyin(50)
    .setMaxBuyin(500)
    .setShowdownAnimationTime(4000)
    .setNoShowdownAnimationTime(2000)
    .build();

  const tableConfig2 = {
    ...tableConfig1,
    sbAmount: 10,
    bbAmount: 20,
    minBet: 20,
  };

  const tableConfig3 = {
    ...tableConfig2,
    minPlayers: 2,
    maxPlayers: 3,
  };

  const tableConfig4 = {
    ...tableConfig3,
    maxPlayers: 6,
  };

  const tableConfig5 = {
    ...tableConfig1,
  };

  const tableConfig6 = {
    ...tableConfig1,
    sbAmount: 10000,
    bbAmount: 20000,
    minBet: 20000,
    minBuyin: 2000000,
    maxBuyin: 20000000,
  };

  createGame("admin", server, tableConfig1);

  createGame("admin", server, tableConfig2);

  createGame("admin", server, tableConfig3);

  createGame("admin", server, tableConfig4);

  createGame("admin", server, tableConfig5);

  createGame("admin", server, tableConfig6);
}

export { io, app };
