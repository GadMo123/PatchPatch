import { GameStateServerBroadcast, SocketEvents } from "@patchpatch/shared";
import { useEffect } from "react";
import { Socket } from "socket.io-client";
import socket from "../services/socket/Socket";

function createServerBroadcastHook<T>(
  socket: Socket,
  event: string,
  handler: (data: T) => void
) {
  return () => {
    useEffect(() => {
      socket.on(event, handler);
      return () => {
        socket.off(event, handler);
      };
    }, []);
  };
}

// Hook for game state updates
export const useGameStateUpdates = (
  onGameState: (state: GameStateServerBroadcast) => void
) => {
  useEffect(() => {
    socket.on(SocketEvents.GAME_STATE_UPDATE, onGameState);
    return () => {
      socket.off(SocketEvents.GAME_STATE_UPDATE, onGameState);
    };
  }, [onGameState]);
};
