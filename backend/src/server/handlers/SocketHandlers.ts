// src\server\handlers\SocketHandlers.ts - Handles protocol calls from clients, send inputs throw validations and forwerd reqeusts to the relevant handlers.

import { Socket } from "socket.io";
import { Player } from "../../player/Player";
import {
  getGameAndPlayer,
  validateBuyIntoGame,
  validateCardArrangement,
  validateInGamePayload,
  validateJoinGame,
  validateLogin,
  validatePlayerAction,
  validateSitOut,
} from "./EventsInputValidator";
import { ServerStateManager } from "../ServerStateManager";
import { HandlerResponse, LoginResponse } from "@patchpatch/shared";

export class SocketHandlers {
  private static _instance: SocketHandlers;
  private _stateManager: ServerStateManager;

  private constructor() {
    this._stateManager = ServerStateManager.getInstance();
  }

  public static getInstance(): SocketHandlers {
    if (!SocketHandlers._instance) {
      SocketHandlers._instance = new SocketHandlers();
    }
    return SocketHandlers._instance;
  }

  // todo  move login to a saparated endpoint? connect to socket after login? enable gameview for unregister?
  async handleLogin(socket: Socket, payload: unknown): Promise<LoginResponse> {
    const validation = validateLogin(payload);
    if (!validation.success) {
      return { success: false, message: validation.error };
    }

    try {
      const player = new Player(socket.id, validation.data.name, socket.id);
      this._stateManager.addPlayer(player);
      return { success: true, playerId: player.getId(), token: "1" };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Login failed",
      };
    }
  }

  // Player enters game view as an observer
  async handleEnterGame(payload: unknown): Promise<HandlerResponse> {
    const validation = validateInGamePayload(payload);
    if (!validation.success) {
      return { success: false, message: validation.error };
    }

    const { game, player } = getGameAndPlayer(validation.data);
    if (!game || !player) {
      return { success: false, message: "Invalid game and player id" };
    }

    try {
      await game.addObserver(player);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to enter game",
      };
    }
  }

  async handleJoinGame(payload: unknown): Promise<HandlerResponse> {
    const validation = validateJoinGame(payload);
    if (!validation.success) {
      return { success: false, message: validation.error };
    }

    const { game, player } = getGameAndPlayer(validation.data);
    if (!game || !player) {
      return { success: false, message: "Invalid game and player id" };
    }

    const success = await game.addPlayer(
      player,
      validation.data.tableAbsolutePosition
    );
    if (!success) return { success: false, message: "Seat is taken" };

    player.addActiveGame(validation.data.gameId);
    return { success: true };
  }

  async handleGameBuyin(payload: unknown): Promise<HandlerResponse> {
    const validation = validateBuyIntoGame(payload);
    if (!validation.success) {
      return { success: false, message: validation.error };
    }

    const { game, player } = getGameAndPlayer(validation.data);
    if (!game || !player) {
      return { success: false, message: "Invalid game and player id" };
    }

    const minBuyin = game.getTableConfig().minBuyin;
    if (validation.data.amount < minBuyin) {
      return { success: false, message: "Buy-in amount below minimum" };
    }

    const playerInGame = game.getPlayer(player.getId());
    if (!playerInGame) {
      return { success: false, message: "Player not found in game" };
    }

    return (await player.buyIntoGame(validation.data.amount, game))
      ? { success: true }
      : { success: false, message: "Buy-in failed" };
  }

  async handlePlayerAction(payload: unknown): Promise<HandlerResponse> {
    const validation = validatePlayerAction(payload);
    if (!validation.success) {
      return { success: false, message: validation.error };
    }

    const { game, player } = getGameAndPlayer(validation.data);
    if (!game || !player) {
      return { success: false, message: "Invalid game and player id" };
    }

    const success = await game
      .getGameFlowManager()
      ?.getBettingManager()
      ?.handlePlayerAction(
        validation.data.playerId,
        validation.data.action,
        validation.data.amount
      );

    return { success: !!success };
  }

  async handleCardArrangement(payload: unknown): Promise<HandlerResponse> {
    const validation = validateCardArrangement(payload);
    if (!validation.success) {
      return {
        success: false,
        message: validation.error,
      };
    }

    const { gameId, playerId, arrangement } = validation.data;
    const { game, player } = getGameAndPlayer({ gameId, playerId });

    if (!game || !player) {
      return { success: false, message: "Invalid game and player id" };
    }

    const result = (await game
      .getGameFlowManager()
      ?.getArrangeCardManager()
      ?.handlePlayerArrangedCardsRecived(playerId, arrangement)) ?? {
      success: false,
    };

    return { success: result.success, message: result.error };
  }

  async handleGameStateUpdate(payload: unknown): Promise<HandlerResponse> {
    const validation = validateInGamePayload(payload);
    if (!validation.success) {
      return { success: false, message: validation.error };
    }

    const { game, player } = getGameAndPlayer(validation.data);
    if (!game || !player) {
      return { success: false, message: "Invalid game or player id" };
    }

    const result = await game.handleGameStateRequest(player);
    return { success: result };
  }

  async handleSitOutNextHand(payload: unknown): Promise<HandlerResponse> {
    const validation = validateSitOut(payload);
    if (!validation.success) {
      return { success: false, message: validation.error };
    }

    const { game, player } = getGameAndPlayer(validation.data);
    if (!game || !player) {
      return { success: false, message: "Invalid game or player id" };
    }

    console.log("player sit out " + player.getId());
    try {
      const playerInGame = game.getPlayer(player.getId());
      if (!playerInGame) {
        return { success: false, message: "Player not found in game" };
      }
      await game.playerSitoutNextHandRequest(
        playerInGame,
        validation.data.sitout
      );
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to toggle sit out status",
      };
    }
  }

  async handleStandUp(payload: unknown): Promise<HandlerResponse> {
    const validation = validateInGamePayload(payload);
    if (!validation.success) {
      return { success: false, message: validation.error };
    }

    const { game, player } = getGameAndPlayer(validation.data);
    if (!game || !player) {
      return { success: false, message: "Invalid game or player id" };
    }

    try {
      const playerInGame = game.getPlayer(player.getId());
      if (!playerInGame) {
        return { success: false, message: "Player not found in game" };
      }

      await game.removePlayer(playerInGame);
      await game.addObserver(player);
      // todo in game player.removeActiveGame(validation.data.gameId);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to stand up from game",
      };
    }
  }

  async handleExitGame(payload: unknown): Promise<HandlerResponse> {
    const validation = validateInGamePayload(payload);
    if (!validation.success) {
      return { success: false, message: validation.error };
    }

    const { game, player } = getGameAndPlayer(validation.data);
    if (!game || !player) {
      return { success: false, message: "Invalid game or player id" };
    }

    try {
      // If player is actively seated in the game, remove them
      const playerInGame = game.getPlayer(player.getId());
      if (playerInGame) {
        await game.removePlayer(playerInGame);
        player.removeActiveGame(validation.data.gameId);
      }

      // Remove from observers if they were observing
      await game.removeObserver(player);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to exit game",
      };
    }
  }

  //Todo
  async handleDisconnect(socketId: string): Promise<void> {
    const player = this._stateManager.getPlayer(socketId);
    if (player) {
      // Handle player cleanup in active games
      const games = this._stateManager.getGames();
      //todo : player object should keep a list of PlayerInGame which are active, handle dissconection
      //   for (const game of Object.values(games)) {
      //     if (game.getPlayer(socketId)) {
      //       await game.handlePlayerDisconnect(socketId);
      //     }
      //   }
      this._stateManager.removePlayer(socketId);
    }
  }
}
