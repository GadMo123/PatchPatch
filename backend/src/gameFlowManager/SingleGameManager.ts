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
    this.startBettingRound(); // Preflop betting started
  }

  startBettingRound() {
    switch (this.game.getPhase()) {
      case GamePhase.Showdown || GamePhase.Waiting: //Either start running the game from waiting state or starting the next hand after showdown
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
    this.game.startBettingRound(this.onBettingRoundComplete);
  }

  onBettingRoundComplete() {
    if (this.game.isHandWonWithoutShowdown()) {
      if (this.game.isReadyForNextHand()) this.startGame();
      // else wait for players
    } else {
      if (this.game!.getPhase() == GamePhase.RiverBetting) this.showdown();
      else this.startBettingRound();
    }
  }

  showdown() {
    this.game.doShowdown(this.startGame);
  }
}
