import CardObject from './CardObject';

interface GameState {
  boards: CardObject[][]; // Cards on the boards
  flops: CardObject[][]; // Flops
  turns: CardObject[]; // Turn cards
  rivers: CardObject[]; // River cards
  status: string; // Game status
  playerCards: CardObject[]; // Player's private cards
  players: {
    id: string;
    name: string;
    cards: CardObject[];
  }[];
}

export default GameState;
