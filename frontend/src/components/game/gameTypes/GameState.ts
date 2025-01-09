import CardObject from './CardObject';

interface GameState {
  boards: CardObject[][]; // Cards on the boards
  flops: CardObject[][]; // Flops
  turns: CardObject[]; // Turn cards
  rivers: CardObject[]; // River cards
  playerCards: CardObject[]; // Player's private cards
  currentBettingRound: 'preflop' | 'flop' | 'turn' | 'river' | null;
  currentPlayerToAct: string | null; // playerId of the player to act
  pot: number;
  phase:
    | 'waiting'
    | 'started'
    | 'deal-cards'
    | 'preflop-betting'
    | 'flop-dealt'
    | 'arrange-player-cards'
    | 'flop-betting'
    | 'turn-dealt'
    | 'turn-betting'
    | 'river-dealt'
    | 'river-betting'
    | 'showdown';
  players: {
    id: string;
    name: string;
    cards: CardObject[];
    position: 'BB' | 'SB';
    betOptions: 'BetOrCheck' | 'RaiseOrCallOrFold' | null;
  }[];
}

export default GameState;
