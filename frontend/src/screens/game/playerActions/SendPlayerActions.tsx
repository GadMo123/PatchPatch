import { useCallback } from 'react';

import { PlayerAction } from '../gameComponents/BetPanel';
import { Socket } from 'socket.io-client';

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
    (action: PlayerAction, amount?: number): Promise<Response> => {
      return new Promise(resolve => {
        socket.emit(
          'player-action',
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
    (arrangement: string[]): Promise<Response> => {
      console.log('arrangment ' + arrangement);
      return new Promise(resolve => {
        socket.emit(
          'cards-arrangement',
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
