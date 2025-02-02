// src/server/SocketProtocol.ts

import { Card } from './Card';

export enum SocketEvents {
  LOGIN = 'login',
  ENTER_GAME = 'enter-game',
  JOIN_GAME = 'join-game',
  GAME_BUYIN = 'game-buyin',
  PLAYER_ACTION = 'player-action',
  CARDS_ARRANGEMENT = 'cards-arrangement',
  LOBBY_STATUS = 'lobby-status',
  USE_TIMEBANK = 'use-timebank',
  GAME_STATE_UPDATE = 'game-state-update',
  DISCONNECT = 'disconnect',
}

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
    card: Card[];
  }>;
}

export interface JoinGamePayload extends InGamePayload {
  position: string;
}

export interface BuyIntoGamePayload extends InGamePayload {
  amount: number;
}

export interface LobbyStatusResponse {
  success: boolean;
  games: Array<{
    id: string;
    blindLevel: string;
    players: string[];
    status: 'waiting' | 'running';
    maxPlayers: number;
    minBuyIn: number;
    maxBuyIn: number;
  }>;
}

export interface GameStateServerBroadcast {
  id: string;
  phase: string;
  stakes: string;
  flops: Card[][] | null;
  turns: Card[] | null;
  rivers: Card[] | null;
  potSize: number | null;
  observers: String[] | null;
  publicPlayerDataMapByPosition: Map<Object, Object | null> | null;
  privatePlayerData: Object | null;
  bettingState: Object | null;
  tableConfig: Object | null;
  arrangePlayerCardsState: Object | null;
}
