// src/game/broadcasting/GameStateBroadcaster.ts - Broadcasting GameState to all clients involved in a game.

import { Server } from "socket.io";
import { Game } from "../Game";
import { getBaseGameState } from "./GameState";
import { ServerStateManager } from "server/ServerStateManager";
import { SocketEvents } from "shared";

export class GameStateBroadcaster {
  constructor(private _io: Server) {}

  broadcastGameState(game: Game, afterFunction: (() => void) | null) {
    const baseState = getBaseGameState(game);

    // Broadcast to players in game
    game.getPlayersInGame()?.forEach((player, position) => {
      if (player) {
        const playerGameState = {
          ...baseState,
          playerPrivateState: player.getPlayerPrivateState(),
        };
        try {
          this._io
            .to(player.getSocketId())
            .emit(SocketEvents.GAME_STATE_UPDATE, playerGameState);
        } catch (error) {
          console.error(
            `Error broadcasting to player ${player.getSocketId()}:`,
            error
          );
        }
      }
      1210;
    });

    // Broadcast to observers
    game.getObserversSockets().forEach((observer) => {
      if (observer)
        try {
          this._io.to(observer).emit(SocketEvents.GAME_STATE_UPDATE, baseState);
        } catch (error) {
          console.error(`Error broadcasting to observer ${observer}:`, error);
        }
    });

    // Call afterFunction with a small delay to allow players recive the state
    if (afterFunction) {
      setTimeout(() => {
        afterFunction();
      }, 10);
    }
  }
}
