// src/utils/GameStateUtils.ts

export enum GamePhase {
  Waiting = 'waiting',
  Started = 'started',
  DealCards = 'deal-cards',
  PreflopBetting = 'preflop-betting',
  FlopDealt = 'flop-dealt',
  ArrangePlayerCards = 'arrange-player-cards',
  FlopBetting = 'flop-betting',
  TurnDealt = 'turn-dealt',
  TurnBetting = 'turn-betting',
  RiverDealt = 'river-dealt',
  RiverBetting = 'river-betting',
  Showdown = 'showdown',
}

export const verifyPlayerId = (
  players: Record<string, any>,
  playerId: string,
  socketId: string
) => {
  if (players[playerId]?.socket.id !== socketId) {
    throw new Error('Player ID mismatch, cannot join game');
  }
};

export const handleGameStateError = (
  error: any,
  callback: (error: any) => void
) => {
  console.error(error);
  callback({ error: error.message });
};
