// src/hooks/useBettingActions.ts
import { useCallback } from 'react';

import { PlayerAction } from '../screens/game/gameComponents/BetPanel';
import socket from '../socket/Socket';

interface BettingResponse {
  success: boolean;
  error?: string;
}

export const useBettingActions = (gameId: string, playerId: string) => {
  const sendAction = useCallback(
    (action: PlayerAction, amount?: number): Promise<BettingResponse> => {
      return new Promise(resolve => {
        socket.emit(
          'player-action',
          {
            gameId,
            playerId,
            action,
            amount,
          },
          (response: BettingResponse) => {
            resolve(response);
          }
        );
      });
    },
    []
  );

  return { sendAction };
};
