// src/server/singleGameManager.ts

import { Game } from '../game/Game';

enum ROUNDS {
  PREFLOP,
  FLOP,
  TURN,
  RIVER,
}

export class SingleGameManager {
  game: Game;
  constructor(game: Game) {
    this.game = game;
  }

  startGame() {
    console.log('starting game: ' + this.game.getId());
    this.game.startGame();
    this.startBettingRound(ROUNDS.PREFLOP); // Preflop betting started
  }

  startBettingRound(round: ROUNDS) {
    switch (round) {
      case ROUNDS.PREFLOP:
        this.game.startGame();
        break;
      case ROUNDS.FLOP:
        this.game.dealFlops();
        break;
      case ROUNDS.TURN:
        this.game.dealTurn();
        break;
      case ROUNDS.RIVER:
        this.game.dealRiver();
        break;
    }
    this.game.startBettingRound();
    if (this.game.isHandWonWithoutShowdown()) {
      if (this.game.isReadyForNextHand()) this.startGame();
      // else wait for players
    } else {
      if (round == ROUNDS.RIVER) this.showdown();
      else this.startBettingRound(round + 1);
    }
  }

  showdown() {
    this.game.doShowdown();
    if (this.game.isReadyForNextHand()) this.startGame();
  }
}
