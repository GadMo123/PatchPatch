import { Card } from "@patchpatch/shared";
import { Game } from "game/Game";
import { DetailedGameState, ShowdownResult } from "game/types/GameState";
import { PlayerInGame } from "game/types/PlayerInGame";
import PokerHandEvaluator from "game/utils/OmahaHandEvaluator";
import { PotContribution } from "game/utils/PotUtils/PotContribution";
import { PotManager } from "game/utils/PotUtils/PotManager";

export type HandStrength = { value: number; category: string };

export class ShowdownManager {
  private _playersHandStrengthMap: Map<PlayerInGame, HandStrength>[];
  constructor(
    private _game: Game,
    private _state: DetailedGameState,
    private _potManager: PotManager,
    private _afterShowdown: () => Promise<void>
  ) {
    //Calculate Hand strength for active players in showdown
    this._playersHandStrengthMap = this.evalPlayersHands();

    this.processShowdown();
  }

  // for each board map player to Cactus kev's hand strength at the board.
  private evalPlayersHands(): Map<PlayerInGame, HandStrength>[] {
    const activePlayers = Array.from(
      this._game.getPlayersInGame()?.values() || []
    ).filter((player) => player && !player.isFolded());

    // Create an array of 3 maps, one for each board
    const handStrengthMaps: Map<PlayerInGame, HandStrength>[] = [
      new Map<PlayerInGame, HandStrength>(),
      new Map<PlayerInGame, HandStrength>(),
      new Map<PlayerInGame, HandStrength>(),
    ];

    // For each board (0, 1, 2)
    for (let boardIndex = 0; boardIndex < 3; boardIndex++) {
      // Construct the complete board cards (flop + turn + river)
      const boardCards: Card[] = [
        ...this._state.flops[boardIndex], // 3 flop cards
        this._state.turns[boardIndex], // 1 turn card
        this._state.rivers[boardIndex], // 1 river card
      ];

      // Calculate hand strength for each active player on this board
      for (const player of activePlayers) {
        // Get player's private state to access their cards
        const playerPrivateState = player!.getPlayerPrivateState();

        if (!playerPrivateState || !playerPrivateState.cards) {
          console.error("Player have no cards");
          continue;
        }

        // Get player's cards for this board
        // Board 1: cards 0-3, Board 2: cards 4-7, Board 3: cards 8-11
        const startIndex = boardIndex * 4;
        const playerCards = playerPrivateState.cards.slice(
          startIndex,
          startIndex + 4
        );

        // Calculate hand strength using evalHand function
        const handStrength = PokerHandEvaluator.findBestOmahaHand(
          boardCards,
          playerCards
        );

        // Store the result in the appropriate map
        handStrengthMaps[boardIndex].set(player!, handStrength);
      }
    }

    return handStrengthMaps;
  }

  private async processShowdown() {
    const totalPotsInfo = this._potManager.getPotsSizes();

    console.log("processShowdown");
    if (!totalPotsInfo || totalPotsInfo.length === 0) {
      console.error("No pots to distribute in showdown");
      return;
    }

    // For each board (0, 1, 2)
    for (let boardIndex = 0; boardIndex < 3; boardIndex++) {
      console.log("boardindex " + boardIndex);
      const playerHandStrengths = this._playersHandStrengthMap[boardIndex];
      const remainingPots = this._potManager.getAllPots(); // Get copy of pots for each board

      // Process each pot for this board
      while (remainingPots.length > 0) {
        console.log("remainingPots: " + remainingPots.length);
        const currentPot = remainingPots.pop()!; // Get the current pot
        const potSize = currentPot.getTotalPotSize();

        // For each board, divide the pot by the remaining boards
        // Board 0: divide by 3, Board 1: divide by 2, Board 2: take all remaining
        const divisor = 3 - boardIndex;
        const boardPotAmount = Math.round((potSize / divisor) * 100) / 100;

        // Distribute winnings for this board's portion of the pot
        const winners = this.distributeWinningsForBoard(
          currentPot,
          playerHandStrengths,
          boardPotAmount
        );

        // Create showdown result for broadcasting
        const result: ShowdownResult = {
          board: boardIndex,
          potAmount: boardPotAmount,
          winners: new Map(
            Array.from(winners.entries()).map(([player, amount]) => [
              player.getId(), // Convert PlayerInGame to player ID for broadcasting
              amount,
            ])
          ),
          playersHandRank: this._playersHandStrengthMap[boardIndex],
        };

        // Broadcast this result and wait for client animation display
        this._game.updateGameStateAndBroadcast(
          {
            showdownResults: result,
          },
          null
        );

        currentPot.reduceAmount(boardPotAmount);

        // Wait for the client animation duration before proceeding
        await new Promise((resolve) =>
          setTimeout(resolve, Number(process.env.SHOWDOWN_TIME_UNIT) || 2000)
        );
      }
    }
    //cleanup
    this._game.updateGameStateAndBroadcast(
      {
        showdownResults: null,
      },
      null
    );
    this._afterShowdown();
  }

  private distributeWinningsForBoard(
    pot: PotContribution,
    handStrengths: Map<PlayerInGame, HandStrength>,
    boardPotAmount: number
  ): Map<PlayerInGame, number> {
    const winnings = new Map<PlayerInGame, number>();
    const potContributors = Array.from(pot.getContributors());

    // Filter eligible winners (only contributors who are still active)
    const eligibleWinners = potContributors.filter(
      (player) => handStrengths.has(player) // Only players who haven't folded
    );

    if (eligibleWinners.length === 0) {
      console.error("No eligible winner");
      return winnings; // No eligible winners, return empty map
    }

    // Find best hand among eligible winners
    const bestHandValue = Math.min(
      ...eligibleWinners.map((player) => handStrengths.get(player)!.value)
    );

    // All players with the best hand value are winners
    const potWinners = eligibleWinners.filter(
      (player) => handStrengths.get(player)!.value === bestHandValue
    );

    // Distribute pot evenly among winners
    const winnerShare =
      Math.round((boardPotAmount / potWinners.length) * 100) / 100;

    for (const winner of potWinners) {
      winnings.set(winner, winnerShare);

      // Update player's stack
      winner.updatePlayerPublicState({
        currentStack: winner.getStack() + winnerShare,
      });
    }

    return winnings;
  }
}
