// src/utils/gameStateUtils.ts

export const verifyPlayerId = (players: Record<string, any>, playerId: string, socketId: string) => {
    if (players[playerId]?.socket.id !== socketId) {
      throw new Error('Player ID mismatch, cannot join game');
    }
  };
  
  export const handleGameStateError = (error: any, callback: (error: any) => void) => {
    console.error(error);
    callback({ error: error.message });
  };
  