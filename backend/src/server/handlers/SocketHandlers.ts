// src\server\handlers\SocketHandlers.ts - Handles protocol calls from clients, send inputs throw validations and forwerd reqeusts to the relevant handlers.

import { Socket } from "socket.io";
import { Player } from "../../player/Player";
import {
  getGameAndPlayer,
  isBuyIntoGamePayload,
  isCardArrangementPayload,
  isInGamePayload,
  isJoinGamePayload,
  isLoginPayload,
  isPlayerActionPayload,
} from "./EventsInputValidator";
import { ServerStateManager } from "../ServerStateManager";
import { PlayerAction } from "../../game/betting/BettingTypes";
import { Card, HandlerResponse, LoginResponse } from "shared";

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

  // Design - move login to a saparated endpoint? connect to socket after login? enable gameview for unregister?
  async handleLogin(socket: Socket, payload: unknown): Promise<LoginResponse> {
    if (!isLoginPayload(payload)) {
      return { success: false, message: "Invalid login payload format" };
    }

    try {
      const player = new Player(socket.id, payload.name, socket.id);
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
  async handleEnterGame(payload: any) {
    if (!isInGamePayload(payload))
      return { success: false, message: "Invalid input" };
    const { game, player } = getGameAndPlayer(payload);
    if (!game || !player) {
      return { success: false, message: "Invalid game and player id" };
    }
    game
      .addObserver(player)
      .then(() => {
        return { success: true };
      })
      .catch((error) => {
        return { success: false, error: error.message };
      });
  }

  // Player enter game seat as a Player
  async handleJoinGame(payload: unknown): Promise<HandlerResponse> {
    if (!isJoinGamePayload(payload))
      return { success: false, message: "Invalid input" };
    const { game, player } = getGameAndPlayer(payload);
    if (!game || !player) {
      return { success: false, message: "Invalid game and player id" };
    }

    const success = await game.addPlayer(player, payload.tableAbsoluteposition);

    if (!success) return { success: false, message: "Seat is taken" };
    player.addActiveGame(payload.gameId);
    return { success: true };
  }

  // Player is sitting in a game and wants to buyin or add play chips
  async handleGameBuyin(payload: unknown): Promise<HandlerResponse> {
    if (!isBuyIntoGamePayload(payload))
      return { success: false, message: "Invalid input" };

    const { game, player } = getGameAndPlayer(payload);
    if (!game || !player) {
      return { success: false, message: "Invalid game and player id" };
    }

    const MIN_BUYIN =
      Number(process.env.MIN_BUYIN) || 20 * game.getTableConfig().bbAmount;
    const amount = payload.amount;

    if (amount < MIN_BUYIN) {
      return { success: false, message: "Invalid amount" };
    }

    const playerInGame = game.getPlayer(player.getId());
    if (!playerInGame) return { success: false, message: "Invalid player" };

    // Reduce Coins from base player layer and add chips to player stack as one transaction.
    if (!(await player.buyIntoGame(amount, game)))
      return { success: false, message: "Invalid Buyin" };
    return { success: true };
  }

  async handlePlayerAction(payload: unknown): Promise<HandlerResponse> {
    if (!isPlayerActionPayload(payload))
      return { success: false, message: "Invalid input" };

    const { game, player } = getGameAndPlayer(payload);
    if (!game || !player) {
      return { success: false, message: "Invalid game and player id" };
    }

    const { playerId, action, amount } = payload;
    const success =
      (await game
        .getGameFlowManager()
        ?.getBettingManager()
        ?.handlePlayerAction(playerId, action as PlayerAction, amount)) ??
      false;
    return { success: success };
  }

  async handleCardArrangement(payload: unknown): Promise<HandlerResponse> {
    if (!isCardArrangementPayload(payload)) {
      return {
        success: false,
        message: "Invalid payload format for card arrangement",
      };
    }
    const { game, player } = getGameAndPlayer(payload);
    if (!game || !player) {
      return { success: false, message: "Invalid game and player id" };
    }

    const { playerId, arrangement } = payload;
    const validCards: Card[] = arrangement.map(
      (item) => item as unknown as Card
    );

    const result = (await game
      .getGameFlowManager()
      ?.getArrangeCardManager()
      ?.handlePlayerArrangedCardsRecived(playerId, validCards)) ?? {
      success: false,
    };
    return { success: result.success, message: result.error };
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
