import { GameStateServerBroadcast, SocketEvents } from "@patchpatch/shared";
import { useEffect } from "react";
import socket from "../services/socket/Socket";

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
