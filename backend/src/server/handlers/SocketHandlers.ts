import { Socket } from 'socket.io';
import { Player } from '../../player/Player';
import {
  getGameAndPlayer,
  isBuyIntoGamePayload,
  isCardArrangementPayload,
  isJoinGamePayload,
  isLoginPayload,
  isPlayerActionPayload,
} from './EventsInputValidator';
import { ServerStateManager } from '../ServerStateManager';
import { getPosition, Position } from '../../game/utils/PositionsUtils';
import { PlayerAction } from '../../game/betting/BettingTypes';
import { HandlerResponse } from './ServerTypes';
import { Card } from '../../game/types/Card';

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

  async handleLogin(
    socket: Socket,
    payload: unknown
  ): Promise<HandlerResponse<{ playerId: string }>> {
    if (!isLoginPayload(payload)) {
      return { success: false, message: 'Invalid login payload format' };
    }

    try {
      const player = new Player(socket.id, payload.name, socket.id);
      this._stateManager.addPlayer(player);
      return { success: true, data: { playerId: player.getId() } };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  async handleJoinGame(payload: unknown): Promise<HandlerResponse<void>> {
    if (!isJoinGamePayload(payload))
      return { success: false, message: 'Invalid input' };
    const { game, player } = getGameAndPlayer(payload); //
    if (!game || !player) {
      return { success: false, message: 'Invalid game and player id' };
    }
    const position = getPosition(payload.position);
    if (!position) return { success: false, message: 'Invalid position' };
    await game.addPlayer(player, position);
    player.addActiveGame(payload.gameId);
    return { success: true };
  }

  async handleGameBuyin(payload: unknown): Promise<HandlerResponse<void>> {
    if (!isBuyIntoGamePayload(payload))
      return { success: false, message: 'Invalid input' };

    const { game, player } = getGameAndPlayer(payload);
    if (!game || !player) {
      return { success: false, message: 'Invalid game and player id' };
    }

    const MIN_BUYIN = Number(process.env.MIN_BUYIN) || 20;
    const amount = payload.amount;

    if (amount < game.getTableConfig().bbAmount * MIN_BUYIN) {
      return { success: false, message: 'Invalid amount' };
    }

    const playerInGame = game.getPlayer(player.getId());
    if (!playerInGame) return { success: false, message: 'Invalid player' };

    //Reduce Coins from base player layer, still not adding chips to game stack (game logic).
    if (!(await player.buyIntoGame(amount, game)))
      return { success: false, message: 'Invalid Buyin' };

    //Add chips to player stack, mark ready / start game based on player and game status.
    game.playerBuyIn(playerInGame, amount);
    return { success: true };
  }

  async handlePlayerAction(payload: unknown): Promise<HandlerResponse<void>> {
    if (!isPlayerActionPayload(payload))
      return { success: false, message: 'Invalid input' };

    const { game, player } = getGameAndPlayer(payload);
    if (!game || !player) {
      return { success: false, message: 'Invalid game and player id' };
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

  async handleCardArrangement(
    payload: unknown
  ): Promise<HandlerResponse<void>> {
    if (!isCardArrangementPayload(payload)) {
      return {
        success: false,
        message: 'Invalid payload format for card arrangement',
      };
    }
    const { game, player } = getGameAndPlayer(payload);
    if (!game || !player) {
      return { success: false, message: 'Invalid game and player id' };
    }

    const { playerId, arrangement } = payload;
    const validCards: Card[] = arrangement.map(item => item as unknown as Card);

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
