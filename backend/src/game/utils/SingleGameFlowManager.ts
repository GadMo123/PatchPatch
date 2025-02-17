// src/server/singleGameManager.ts - Is a helper to manage a single game life cycle flow and timings.

import { ArrangePlayerCardsManager } from "../arrangeCards/ArrangePlayerCardsManager";
import { BettingManager } from "../betting/BettingManager";
import { Game } from "../Game";
import { GamePhase } from "../broadcasting/GameState";
import { PlayerInGame } from "../types/PlayerInGame";

export class SingleGameFlowManager {
  private _bettingManager: BettingManager | null;
  private _arrangePlayerCardsManager: ArrangePlayerCardsManager | null;

  constructor(private _game: Game) {
    this._bettingManager = null;
    this._arrangePlayerCardsManager = null;
  }

  startNextStreet() {
    switch (this._game.getPhase()) {
      case GamePhase.Showdown:
        this.prapereNextHand();
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

  private async prapereNextHand() {
    await this._game.PrepareNextHand();
    this._game.updateGameStateAndBroadcast(
      {},
      this.startBettingRound.bind(this)
    );
  }

  private dealPreflop() {
    this._game.dealNewHand();
    this._game.updateGameStateAndBroadcast(
      {},
      this.startBettingRound.bind(this)
    );
  }

  private dealFlops() {
    this._game.updateGameStateAndBroadcast(
      {
        flops: this._game.dealFlops(),
        phase: GamePhase.ArrangePlayerCards,
      },
      this.startArrangePlayerCards.bind(this)
    );
  }

  private dealTurn() {
    this._game.updateGameStateAndBroadcast(
      {
        turns: this._game.dealTurns(),
        phase: GamePhase.TurnBetting,
      },
      this.startBettingRound.bind(this)
    );
  }

  private dealRiver() {
    this._game.updateGameStateAndBroadcast(
      {
        rivers: this._game.dealRivers(),
        phase: GamePhase.RiverBetting,
      },
      this.startBettingRound.bind(this)
    );
    // Todo : start cacl winner right here as a microservice to find the winner by the time of showdown
  }

  private startBettingRound() {
    const bettingManager = new BettingManager(
      this._game,
      this._game.getTableConfig(),
      this.onBettingRoundComplete.bind(this),
      this._game.getPhase() === GamePhase.PreflopBetting
    );
    this._bettingManager = bettingManager;

    bettingManager.startNextPlayerTurn();
  }

  private startArrangePlayerCards() {
    console.log("Card Arrange start -" + this._game.getPhase());
    this._arrangePlayerCardsManager = new ArrangePlayerCardsManager(
      this._game,
      this.onCardArrangeDone.bind(this)
    );
  }

  private onCardArrangeDone() {
    console.log("Card Arrange Done -" + this._game.getPhase());
    this._arrangePlayerCardsManager = null;
    this._game.updateGameStateAndBroadcast(
      {
        arrangePlayerCardsState: null,
        phase: GamePhase.FlopBetting,
      },
      this.startBettingRound.bind(this)
    );
  }

  private onBettingRoundComplete(winner: PlayerInGame | null) {
    console.log("betting round complete -" + this._game.getPhase());
    if (winner) this._game.handleHandWonWithoutShowdown(winner);
    this._game.updateGameStateAndBroadcast(
      { bettingState: null },
      this.afterBettingDetermineNextStep.bind(this)
    );
  }

  private afterBettingDetermineNextStep() {
    //hand is done
    if (this._game.isHandWonWithoutShowdown()) {
      if (this._game.isReadyForNextHand()) this.startNextStreet();
      // else wait for players to join, the server will create a new game manager once ready
    } else if (this._game.getPhase() === GamePhase.RiverBetting) {
      this._game.doShowdown();
      if (this._game.isReadyForNextHand()) {
        this.startNextStreet();
      }
    }
    // Keep current hand running
    else {
      this.startNextStreet();
    }
  }

  getBettingManager() {
    return this._bettingManager;
  }

  getArrangeCardManager() {
    return this._arrangePlayerCardsManager;
  }
}
