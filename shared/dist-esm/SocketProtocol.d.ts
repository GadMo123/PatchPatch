import { Card } from "./Card";
import { Position } from "./Position";
export declare const SocketEvents: {
    LOGIN: string;
    ENTER_GAME: string;
    JOIN_GAME: string;
    GAME_BUYIN: string;
    PLAYER_ACTION: string;
    CARDS_ARRANGEMENT: string;
    LOBBY_STATUS: string;
    USE_TIMEBANK: string;
    GAME_STATE_UPDATE: string;
    SIT_OUT_NEXT_HAND: string;
    STAND_UP: string;
    EXIT_GAME: string;
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
        status: string;
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
    observers: String[] | null;
    publicPlayerDataMapByPosition: Map<Position, PublicPlayerDataClientData> | null;
    privatePlayerData: PrivatePlayerDataClientData | null;
    bettingState: BettingStateClientData | null;
    tableConfig: TableConfigClientData;
    arrangePlayerCardsState: Object | null;
}
export interface TableConfigClientData {
    maxPlayers: 2 | 3 | 6;
    minBuyin: number;
    maxBuyin: number;
}
export interface PublicPlayerDataClientData {
    tableAbsolotePosition: number;
    id?: string;
    name?: string;
    position?: Position;
    stack?: number;
    cards?: Card[];
}
export interface PrivatePlayerDataClientData {
    cards?: Card[];
}
export interface BettingStateClientData {
    timeRemaining: number;
    callAmount?: number;
    minRaiseAmount: number;
    timeCookiesUsedThisRound: number;
    playerValidActions: String[];
    playerToAct: string;
}
