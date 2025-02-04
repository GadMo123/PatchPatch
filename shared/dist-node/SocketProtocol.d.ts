import { Card } from "./Card";
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
    DISCONNECT: string;
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
    publicPlayerDataMapByPosition: Map<Object, Object | null> | null;
    privatePlayerData: Object | null;
    bettingState: Object | null;
    tableConfig: Object | null;
    arrangePlayerCardsState: Object | null;
}
