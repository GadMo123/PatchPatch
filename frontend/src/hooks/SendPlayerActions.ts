import { useCallback } from "react";

import { Socket } from "socket.io-client";
import { SocketEvents, Card, BettingTypes } from "@patchpatch/shared";

interface Response {
  success: boolean;
  error?: string;
}

export const useBettingActions = (
  gameId: string,
  playerId: string,
  socket: Socket
) => {
  const sendAction = useCallback(
    (action: BettingTypes, amount?: number): Promise<Response> => {
      return new Promise((resolve) => {
        socket.emit(
          SocketEvents.PLAYER_ACTION,
          {
            gameId,
            playerId,
            action,
            amount,
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

export const useArrangedCardActions = (
  gameId: string,
  playerId: string,
  socket: Socket
) => {
  const sendAarrangement = useCallback(
    (arrangement: Card[]): Promise<Response> => {
      console.log("arrangment " + arrangement);
      return new Promise((resolve) => {
        socket.emit(
          SocketEvents.CARDS_ARRANGEMENT,
          {
            gameId,
            playerId,
            arrangement,
          },
          (response: Response) => {
            resolve(response);
          }
        );
      });
    },
    []
  );

  return { sendAarrangement };
};
