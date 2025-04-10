// src/server/singleGameManager.ts - Is a helper to manage a single game life cycle flow and timings.

import { ArrangePlayerCardsManager } from "../arrangeCards/ArrangePlayerCardsManager";
import { BettingManager } from "../betting/BettingManager";
import { Game } from "../Game";
import { GamePhase } from "../types/GameState";

export class SingleGameFlowManager {
  private _bettingManager: BettingManager | null;
  private _arrangePlayerCardsManager: ArrangePlayerCardsManager | null;

  constructor(private _game: Game) {
    this._bettingManager = null;
    this._arrangePlayerCardsManager = null;
  }

  startNextStreet() {
    switch (this._game.getPhase()) {
      case GamePhase.StartingHand:
        this.prapereNextHand();
        break;
      case GamePhase.DealPreflop:
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
    const ready = await this._game.PrepareNextHand();
    const afterFunction = ready
      ? this.startNextStreet.bind(this)
      : this._game.enterRestMode.bind(this._game);
    this._game.updateGameStateAndBroadcast({}, afterFunction);
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
  }

  private startBettingRound() {
    if (this.isBettingRoundNeeded()) {
      const bettingManager = new BettingManager(
        this._game,
        this.onBettingRoundComplete.bind(this),
        this._game.getPhase() === GamePhase.PreflopBetting
      );
      this._bettingManager = bettingManager;

      bettingManager.startNextPlayerTurn();
    } else {
      this.afterBettingDetermineNextPhase();
    }
  }

  private isBettingRoundNeeded() {
    let activePlayersCount = 0;
    this._game.getPlayersInGame()?.forEach((player) => {
      if (player && !player.isFolded() && !player.isAllIn())
        activePlayersCount++;
    });
    return activePlayersCount > 1;
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

  private async onBettingRoundComplete() {
    console.log("betting round complete -" + this._game.getPhase());
    const noSDWinner = await this._game.FindHandWinnerWithoutShowdown();
    const animationTime = noSDWinner ? this._game.getNoSDAnimationTime() : 0;

    this._game.updateGameStateAndBroadcast(
      { bettingState: null },
      this.afterBettingDetermineNextPhase.bind(this, animationTime)
    );
  }

  private async afterBettingDetermineNextPhase(waitTime?: number) {
    if (waitTime) {
      // wait before next step (noShowdown winning animation, ect)
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
    //hand is done
    if (this._game.isHandWonWithoutShowdown()) {
      this.startNextStreet();
    } else if (this._game.getPhase() === GamePhase.RiverBetting) {
      this._game.doShowdown(this.prapereNextHand.bind(this));
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
