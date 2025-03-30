// src/server/SocketProtocol.ts

import { Card } from "./Card";
import {
  BettingTypes,
  GameSpeed,
  GameStatus,
  GameType,
  Position,
} from "./Types";

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
} as const;

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
  action: BettingTypes;
  amount?: number;
}

export interface CardArrangementPayload extends InGamePayload {
  arrangement: Card[];
}

export interface JoinGamePayload extends InGamePayload {
  tableAbsolutePosition: number; // number of clockwise ticks from bottom left seat (0 - (n - 1)).
}

export interface BuyIntoGamePayload extends InGamePayload {
  amount: number;
}

export interface SitOutPayload extends InGamePayload {
  sitout: boolean; // sitout or back from sitting out
}

export interface LobbyStatusServerResponse {
  success: boolean;
  games: Array<{
    id: string;
    gameType: GameType;
    BBAmount: number;
    stakes: string;
    players: string[];
    status: GameStatus;
    maxPlayers: number;
    gameSpeed: GameSpeed;
  }>;
}

export interface GameStateServerBroadcast {
  id: string;
  phase: string;
  stakes: string;
  flops: Card[][] | null;
  turns: Card[] | null;
  rivers: Card[] | null;
  potSizes: number[] | null;
  observersNames: String[] | null;
  publicPlayerDataMapByTablePosition: Array<PublicPlayerClientData>;
  privatePlayerData: PrivatePlayerClientData | null;
  bettingState: BettingStateClientData | null;
  tableConfig: TableConfigClientData;
  arrangePlayerCardsState: ArrangePlayerCardsStateClientData | null;
  showdown: ShowdownResultClientData | null;
  noShowdown: NoShowdownResultClientData | null;
}

export interface TableConfigClientData {
  maxPlayers: 2 | 3 | 6; // Table size
  minBuyin: number;
  maxBuyin: number;
  bigBlindAmount: number;
  smallBlindAmount: number;
  timePerAction: number;
}

export interface PublicPlayerClientData {
  tableAbsolutePosition: number; // How many clockwise rotations ticks from bottom-center position (0 - (maxPlayers - 1) rotations). this is the postion where the player initially set down. for UI purpose, we want each player to keep his absolute table position regardless of his poker-position .
  position?: Position; // Poker position (BB / SB / BTN / CO ect.)
  id?: string;
  name?: string;
  stack?: number;
  cards?: Card[]; // Other players cards for showdown phase
  roundPotContributions?: number; // total Contributions to the pot in the current ongoing betting round
  sitoutTimer?: number | null;
  removed?: boolean; // A player been removed from the game (mainly by exeeding sitout timer or leaving table mid-hand), can't do any action, waiting to be removed after the current hand.
}

export interface PrivatePlayerClientData {
  cards?: Card[]; // Hero cards
  remainingTimeCookies?: number;
}

export interface ShowdownResultClientData {
  board: number; // 0, 1, or 2
  potAmount: number; // How much was in this portion of the pot
  winners: [string, number][]; // Player IDs and their winnings
  playersHandRank: [string, string][]; // Map player id to hand strength in the current board
  animationTime: number;
}

export interface NoShowdownResultClientData {
  potAmount: number;
  winnerId: string;
  animationTime: number;
}

export interface BettingStateClientData {
  timeRemaining: number;
  callAmount: number;
  minRaiseAmount: number;
  activePlayerRoundPotContributions: number;
  allInAmount: number;
  timeCookiesUsedThisRound?: number;
  playerValidActions: BettingTypes[];
  playerToAct: string;
}

export interface ArrangePlayerCardsStateClientData {
  timeRemaining: number;
  playerDoneMap: Map<Position, boolean>;
}

export type SocketEventType = (typeof SocketEvents)[keyof typeof SocketEvents];
