import { Card } from "@patchpatch/shared";

export interface ServerGameState {
  arrangeCardsTimeLeft: number | null;
  // Game state as it recived from the server
  id: string;
  phase: string;
  stakes: string;
  flops: Card[][];
  turns: Card[];
  rivers: Card[];
  potSize: number;
  observers: any[];
  publicPlayerDataMapByPosition: Record<string, PublicPlayerData>;
  bettingState: BettingState | null;
  bettingConfig: {
    timePerAction: number;
    minBet: number;
    maxBet: number | null;
    timeCookieEffect: number;
  };
  playerPrivateState: {
    remainingTimeCookies: number;
    cards: Card[] | null;
    arrangedCards?: Card[] | null;
  };
  arrangePlayerCardsState: {
    timeRemaining: number;
    playerDoneMap: Map<string, boolean>;
  };
}

export interface PublicPlayerData {
  id: string;
  name: string;
  position: string;
  cards?: Card[];
}

export interface PrivatePlayerData {
  id: string;
  cards: Card[];
}

export interface BettingState {
  timeRemaining: number;
  currentBet: number;
  lastAction: String | null;
  lastRaiseAmount: number;
  timeCookiesUsedThisRound: number;
  playerValidActions: String[];
  playerToAct: string;
}
