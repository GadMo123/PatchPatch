// src/server/handlers/types.ts

export interface HandlerResponse<T = void> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface GameServerConfig {
  maxGamesPerServer: number;
  healthCheckInterval: number;
  serverRegion: string;
  serverId: string;
}

export interface LoginPayload {
  name: string;
}

export interface InGamePayload {
  gameId: string;
  playerId: string;
}

export interface PlayerActionPayload extends InGamePayload {
  action: string;
  amount?: number;
}

export interface CardArrangementPayload extends InGamePayload {
  arrangement: Array<{
    card: string;
  }>;
}

export interface JoinGamePayload extends InGamePayload {
  position: string;
}

export interface BuyIntoGamePayload extends InGamePayload {
  amount: number;
}
