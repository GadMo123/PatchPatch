"use strict";
// src/server/server.ts - Listen for a websocket communication with each the client and forward client protocol calls to handlers.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = exports.io = void 0;
exports.getTableConfig = getTableConfig;
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const SocketHandlers_1 = require("./handlers/SocketHandlers");
const ServerStateManager_1 = require("./ServerStateManager");
const Game_1 = require("../game/Game");
const LobbyManager_1 = require("../lobby/LobbyManager");
const shared_1 = require("shared");
const serverConfig = {
    maxGamesPerServer: 3000,
    healthCheckInterval: 30000,
    serverRegion: "us-east-1",
    serverId: "server-1",
};
const PORT = process.env.PORT || 5000;
const app = (0, express_1.default)();
exports.app = app;
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
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
exports.io = io;
app.use(express_1.default.json());
const socketHandlers = SocketHandlers_1.SocketHandlers.getInstance();
let gameCounter = 0;
io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);
    // DOS
    const rateLimiter = new Map();
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
    socket.on(shared_1.SocketEvents.LOGIN, (payload, callback) => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield socketHandlers.handleLogin(socket, payload);
        callback(result);
    }));
    socket.on("disconnect", () => __awaiter(void 0, void 0, void 0, function* () {
        yield socketHandlers.handleDisconnect(socket.id);
        console.log("User disconnected:", socket.id);
    }));
    socket.on(shared_1.SocketEvents.ENTER_GAME, (payload, callback) => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield socketHandlers.handleEnterGame(payload);
        callback(result);
    }));
    socket.on(shared_1.SocketEvents.JOIN_GAME, (payload, callback) => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield socketHandlers.handleJoinGame(payload);
        callback(result);
    }));
    socket.on(shared_1.SocketEvents.GAME_BUYIN, (payload, callback) => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield socketHandlers.handleGameBuyin(payload);
        callback(result);
    }));
    socket.on(shared_1.SocketEvents.PLAYER_ACTION, (payload, callback) => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield socketHandlers.handlePlayerAction(payload);
        callback(result);
    }));
    socket.on(shared_1.SocketEvents.CARDS_ARRANGEMENT, (payload, callback) => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield socketHandlers.handleCardArrangement(payload);
        callback(result);
    }));
    socket.on(shared_1.SocketEvents.LOBBY_STATUS, (callback) => __awaiter(void 0, void 0, void 0, function* () {
        const games = ServerStateManager_1.ServerStateManager.getInstance().getGames();
        callback((0, LobbyManager_1.getLobbyStatus)(games));
    }));
});
// Health check endpoint
app.get("/health", (req, res) => {
    const healthStatus = {
        status: "healthy",
        serverId: serverConfig.serverId,
        region: serverConfig.serverRegion,
        activeGames: Object.keys(ServerStateManager_1.ServerStateManager.getInstance().getGames())
            .length,
        activePlayers: Object.keys(ServerStateManager_1.ServerStateManager.getInstance().getPlayers())
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
// Proper cleanup on server shutdown
process.on("SIGTERM", () => {
    io.close(() => {
        server.close(() => {
            process.exit(0);
        });
    });
});
// Create a new game helper function
function createGame(creatorId, blindLevel, server, config) {
    const gameId = (gameCounter++).toString();
    const newGame = new Game_1.Game(gameId, blindLevel, server, config);
    ServerStateManager_1.ServerStateManager.getInstance().addGame(newGame);
    return newGame;
}
// Create dummy games for testing
function createDummyGames(server) {
    createGame("admin", "5-10", server, getTableConfig(10000, 10, Infinity, 10, 5, 10, 2, 2, 50, 500));
    createGame("admin", "10-20", server, getTableConfig(10000, 20, Infinity, 10, 10, 20, 3, 6, 50, 500));
    createGame("admin", "25-50", server, getTableConfig(10000, 50, Infinity, 10, 25, 50, 3, 6, 50, 500));
    createGame("admin", "50-100", server, getTableConfig(10000, 100, Infinity, 10, 50, 100, 4, 3, 50, 500));
    createGame("admin", "100-200", server, getTableConfig(10000, 200, Infinity, 10, 100, 200, 6, 2, 50, 500));
}
function getTableConfig(timePerAction, minBet, maxBet, timeCookieEffect, sbAmount, bbAmount, minPlayers, maxPlayers, minBuyin, maxBuyin) {
    return {
        timePerAction: timePerAction,
        minBet: minBet,
        maxBet: maxBet,
        timeCookieEffect: timeCookieEffect,
        sbAmount: sbAmount,
        bbAmount: bbAmount,
        minPlayers: minPlayers,
        maxPlayers: maxPlayers,
        maxBuyin: maxBuyin,
        minBuyin: minBuyin,
    };
}
//# sourceMappingURL=server.js.map