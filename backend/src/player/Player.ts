import { Game } from '../game/Game';

export class Player {
  id: string; // Player's unique identifier (e.g., socket ID)
  name: string; // Player's name
  coins: number; // player's playing coind
  remainingTimeCookies: number; // time cookie use to increase timer for actions

  socketId: any; // Player's socket instance

  constructor(player: Player | { id: string; name: string; socketId: any }) {
    this.id = player.id;
    this.name = player.name;
    this.socketId = player.socketId;
    this.remainingTimeCookies = 1; // Todo - sync with Database.
    this.coins = 500; // Todo - sync with Database.
  }

  useTimeCookie() {
    this.remainingTimeCookies -= 1;
  }

  hasTimeCookies() {
    return this.remainingTimeCookies > 0;
  }
}
