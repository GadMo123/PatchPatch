import CardObject from './CardObject';

export interface Player {
  id: string;
  name: string;
  cards: CardObject[];
  position: string;
  betOptions: String | null;
}

export interface ServerGameState {
  // Game state as it recived from the server
  id: string;
  phase: string;
  stakes: string;
  flops: CardObject[][];
  turns: CardObject[];
  rivers: CardObject[];
  potSize: number;
  observers: any[];
  publicPlayerDataMapByPosition: Record<string, PublicPlayerData>;
  privatePlayerData: PrivatePlayerData | null;
  bettingState: BettingState | null;
  bettingConfig: {
    timePerAction: number;
    minBet: number;
    maxBet: number | null;
    timeCookieEffect: number;
  };
  playerPrivateState: {
    remainingTimeCookies: number;
    cards: CardObject[] | null;
  };
}

export interface PublicPlayerData {
  id: string;
  name: string;
  position: string;
  cards?: CardObject[];
}

export interface PrivatePlayerData {
  id: string;
  cards: CardObject[];
}

export interface BettingState {
  timeRemaining: number;
  currentBet: number;
  lastAction: String | null;
  lastRaiseAmount: number;
  timeCookiesUsedThisRound: number;
  playerValidActions: String[];
}
