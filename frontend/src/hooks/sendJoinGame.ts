import { SocketEvents } from "@patchpatch/shared";
import { useCallback } from "react";
import { Socket } from "socket.io-client";

interface Response {
  success: boolean;
  error?: string;
}

export const useJoinGame = (
  gameId: string,
  playerId: string,
  socket: Socket
) => {
  const sendAction = useCallback(
    (tableAbsolotePosition: number): Promise<Response> => {
      return new Promise((resolve) => {
        socket.emit(
          SocketEvents.JOIN_GAME,
          {
            gameId,
            playerId,
            tableAbsolotePosition,
          },
          (response: Response) => {
            resolve(response);
          }
        );
      });
    },
    []
  );

  return { sendAction };
};
