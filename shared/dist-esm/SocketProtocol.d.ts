import { Card } from "./Card";
import { BettingTypes, GameSpeed, GameStatus, GameType, Position } from "./Types";
export declare const SocketEvents: {
    readonly LOGIN: "login";
    readonly ENTER_GAME: "enter-game";
    readonly JOIN_GAME: "join-game";
    readonly GAME_BUYIN: "game-buyin";
    readonly PLAYER_ACTION: "player-action";
    readonly CARDS_ARRANGEMENT: "cards-arrangement";
    readonly LOBBY_STATUS: "lobby-status";
    readonly USE_TIMEBANK: "use-timebank";
    readonly GAME_STATE_UPDATE: "game-state-update";
    readonly SIT_OUT_NEXT_HAND: "sit-out-next-hand";
    readonly STAND_UP: "stand-up";
    readonly EXIT_GAME: "exit-game";
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
    action: BettingTypes;
    amount?: number;
}
export interface CardArrangementPayload extends InGamePayload {
    arrangement: Card[];
}
export interface JoinGamePayload extends InGamePayload {
    tableAbsolutePosition: number;
}
export interface BuyIntoGamePayload extends InGamePayload {
    amount: number;
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
}
export interface TableConfigClientData {
    maxPlayers: 2 | 3 | 6;
    minBuyin: number;
    maxBuyin: number;
    bigBlindAmount: number;
    smallBlindAmount: number;
}
export interface PublicPlayerClientData {
    tableAbsolutePosition: number;
    position?: Position;
    id?: string;
    name?: string;
    stack?: number;
    cards?: Card[];
    roundPotContributions?: number;
}
export interface PrivatePlayerClientData {
    cards?: Card[];
    remainingTimeCookies?: number;
}
export interface ShowdownResultClientData {
    board: number;
    potAmount: number;
    winners: [string, number][];
    playersHandRank: [string, string][];
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
