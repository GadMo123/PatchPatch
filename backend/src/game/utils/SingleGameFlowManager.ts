// src/server/singleGameManager.ts

/* This is a helper to manage all the single game life cycle, manage all the flow of a single game*/

import { ArrangePlayerCardsManager } from '../arrangeCards/ArrangePlayerCardsManager';
import { BettingManager } from '../betting/BettingManager';
import { Game } from '../Game';
import { GamePhase } from '../types/GameState';
import { PlayerInGame } from '../types/PlayerInGame';

export class SingleGameFlowManager {
  private game: Game;
  private bettingManager: BettingManager | null;
  private arrangePlayerCardsManager: ArrangePlayerCardsManager | null;

  constructor(game: Game) {
    this.game = game;
    this.bettingManager = null;
    this.arrangePlayerCardsManager = null;
  }

  startNextStreet() {
    switch (this.game.getPhase()) {
      case GamePhase.Showdown:
      case GamePhase.Waiting:
        this.dealPreflop();
        break;
      case GamePhase.PreflopBetting:
        this.dealFlops();
        break;
      case GamePhase.ArrangePlayerCards:
        this.startArrangePlayerCards();
        break;
      case GamePhase.FlopBetting:
        this.dealTurn();
        break;
      case GamePhase.TurnBetting:
        this.dealRiver();
        break;
    }
  }

  dealPreflop() {
    this.game.dealNewHand();
    this.game.updateGameStateAndBroadcast(
      {},
      this.startBettingRound.bind(this)
    );
  }

  dealFlops() {
    this.game.updateGameStateAndBroadcast(
      {
        flops: this.game.dealFlops(),
        phase: GamePhase.ArrangePlayerCards,
      },
      this.startArrangePlayerCards.bind(this)
    );
  }

  dealTurn() {
    this.game.updateGameStateAndBroadcast(
      {
        turns: this.game.dealTurns(),
        phase: GamePhase.TurnBetting,
      },
      this.startBettingRound.bind(this)
    );
  }

  dealRiver() {
    this.game.updateGameStateAndBroadcast(
      {
        rivers: this.game.dealRivers(),
        phase: GamePhase.RiverBetting,
      },
      this.startBettingRound.bind(this)
    );
    // Todo : start cacl winner right here as a microservice to find the winner by the time of showdown
  }

  startBettingRound() {
    const bettingManager = new BettingManager(
      this.game,
      this.game.getBettingConfig(),
      this.onBettingRoundComplete.bind(this)
    );
    this.bettingManager = bettingManager;

    bettingManager.startNextPlayerTurn();
  }

  startArrangePlayerCards() {
    console.log('Card Arrange start -' + this.game.getPhase());
    this.arrangePlayerCardsManager = new ArrangePlayerCardsManager(
      this.game,
      this.onCardArrangeDone.bind(this)
    );
  }

  onCardArrangeDone() {
    console.log('Card Arrange Done -' + this.game.getPhase());
    this.arrangePlayerCardsManager = null;
    this.game.updateGameStateAndBroadcast(
      {
        arrangePlayerCardsState: null,
        phase: GamePhase.FlopBetting,
      },
      this.startNextStreet.bind(this)
    );
  }

  onBettingRoundComplete(winner: PlayerInGame | null) {
    console.log('betting round complete -' + this.game.getPhase());
    if (winner) this.game.handleHandWonWithoutShowdown(winner);
    this.game.updateGameStateAndBroadcast(
      { bettingState: null },
      this.afterBettingRoundComplete.bind(this)
    );
  }

  afterBettingRoundComplete() {
    if (this.game.isHandWonWithoutShowdown()) {
      if (this.game.isReadyForNextHand()) this.startNextStreet();
      // else wait for players to join, the server will create a new game manager once ready
    } else {
      if (this.game.getPhase() === GamePhase.RiverBetting)
        this.game.doShowdown();
      if (this.game.isReadyForNextHand()) this.startNextStreet();
    }
  }

  getBettingManager() {
    return this.bettingManager;
  }

  getArrangeCardManager() {
    return this.arrangePlayerCardsManager;
  }
}
