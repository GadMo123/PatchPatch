// src/server/singleGameManager.ts

import { Game } from '../game/Game';
import { GamePhase } from '../game/types/GameState';

export class SingleGameManager {
  game: Game;

  constructor(game: Game) {
    this.game = game;
    this.game.setGameFlowManager(this);
  }

  startGame() {
    console.log('starting hand: ' + this.game.getId());
    this.prepareNextRound(); // Preflop betting started
  }

  prepareNextRound() {
    switch (this.game.getPhase()) {
      case GamePhase.Showdown:
      case GamePhase.Waiting:
        this.game.startGame();
        break;
      case GamePhase.PreflopBetting:
        this.game.dealFlops();
        break;
      case GamePhase.FlopBetting:
        this.game.dealTurn();
        break;
      case GamePhase.TurnBetting:
        this.game.dealRiver();
        break;
    }
  }

  onBettingRoundComplete() {
    if (this.game.isHandWonWithoutShowdown()) {
      if (this.game.isReadyForNextHand()) this.startGame();
      // else wait for players
    } else {
      if (this.game!.getPhase() == GamePhase.RiverBetting) this.showdown();
      else this.prepareNextRound();
    }
  }

  showdown() {
    this.game.doShowdown(this.startGame.bind(this));
  }
}
