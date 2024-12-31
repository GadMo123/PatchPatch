import { Socket } from "socket.io";

export class Player {
  id: string; // Player's unique identifier (e.g., socket ID)
  name: string; // Player's name
  cards: { rank: string; suit: string }[]; // Player's private cards (12 cards for each player)
  socket: any; // Player's socket instance

  constructor(id: string, name: string, socket: Socket) {
    this.id = id;
    this.name = name;
    this.socket = socket;
    this.cards = [];
  }
}