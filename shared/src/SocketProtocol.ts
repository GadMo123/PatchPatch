// src/server/SocketProtocol.ts

import { Card } from "./Card";
import { Position } from "./Position";

export const SocketEvents = {
  LOGIN: "login",
  ENTER_GAME: "enter-game", //Enter game as an observer, pre-joining
  JOIN_GAME: "join-game", // Request to join as a player in the game
  GAME_BUYIN: "game-buyin", // Buy chips in a game where a player sitting in
  PLAYER_ACTION: "player-action", // check | fold | bet | call | raise
  CARDS_ARRANGEMENT: "cards-arrangement", // Flop private cards arrangement
  LOBBY_STATUS: "lobby-status", // Fetch avilable games
  USE_TIMEBANK: "use-timebank", // Use timebank cookie to get more time for current action
  GAME_STATE_UPDATE: "game-state-update", // Server braodcast recent changes and progress in a game
  SIT_OUT_NEXT_HAND: "sit-out-next-hand", // single not get dealt in next hand
  STAND_UP: "stand-up", // Leave the game as a player, turn into an observer
  EXIT_GAME: "exit-game", // Exit game view back to lobby / homepage
};

export interface HandlerResponse {
  success: boolean;
  message?: string;
}

export interface LoginResponse extends HandlerResponse {
  playerId?: string;
  token?: string;
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

export interface LobbyStatusServerResponse {
  success: boolean;
  games: Array<{
    id: string;
    blindLevel: string;
    players: string[];
    status: string; // "waiting" | "running";
    maxPlayers: number;
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
  observers: String[] | null; // just names
  publicPlayerDataMapByPosition: Map<
    Position,
    PublicPlayerDataClientData
  > | null;
  privatePlayerData: PrivatePlayerDataClientData | null;
  bettingState: BettingStateClientData | null;
  tableConfig: TableConfigClientData;
  arrangePlayerCardsState: Object | null;
}

export interface TableConfigClientData {
  maxPlayers: 2 | 3 | 6; // Table size
  minBuyin: number;
  maxBuyin: number;
}

export interface PublicPlayerDataClientData {
  tableAbsolotePosition: number; // How many clockwise rotations ticks from bottom-center position (0 - (maxPlayers - 1) rotations). this is the postion where the player initially set down. for UI purpose, we want each player to keep his absolute table position regardless of his poker-position .
  id?: string;
  name?: string;
  position?: Position; // Poker position
  stack?: number;
  cards?: Card[]; // Other players cards for showdown phase
}

export interface PrivatePlayerDataClientData {
  cards?: Card[]; // Hero cards
}

export interface BettingStateClientData {
  timeRemaining: number;
  callAmount?: number;
  minRaiseAmount: number;
  timeCookiesUsedThisRound: number;
  playerValidActions: String[];
  playerToAct: string;
}
