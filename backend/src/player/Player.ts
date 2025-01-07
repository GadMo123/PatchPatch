export class Player {
  id: string; // Player's unique identifier (e.g., socket ID)
  name: string; // Player's name
  cards: { rank: string; suit: string }[]; // Player's private cards (12 cards for each player)
  socketId: any; // Player's socket instance

  constructor(id: string, name: string, socketId: String) {
    this.id = id;
    this.name = name;
    this.cards = [];
    this.socketId = socketId;
  }
}
