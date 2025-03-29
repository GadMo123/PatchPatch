import { Card, Position } from "@patchpatch/shared";
import { Game } from "game/Game";
import { PlayerInGame } from "game/types/PlayerInGame";
import { PotManager } from "game/utils/PotUtils/PotManager";
import { PotContribution } from "game/utils/PotUtils/PotContribution";
import {
  DetailedGameState,
  GamePhase,
  ShowdownResult,
} from "game/types/GameState";
import PokerHandEvaluator from "game/utils/OmahaHandEvaluator";
import { ShowdownManager } from "game/showdown/ShowdownManager";

// Mock dependencies
jest.mock("game/Game");
jest.mock("game/types/PlayerInGame");
jest.mock("game/utils/PotUtils/PotManager");
jest.mock("game/utils/PotUtils/PotContribution");
jest.mock("game/utils/OmahaHandEvaluator");

describe("ShowdownManager", () => {
  // Setup common test variables
  let mockGame: jest.Mocked<Game>;
  let mockState: DetailedGameState;
  let mockPotManager: jest.Mocked<PotManager>;
  let mockPlayers: Map<Position, jest.Mocked<PlayerInGame> | null>;
  let mockMainPot: jest.Mocked<PotContribution>;
  let showdownManager: ShowdownManager;
  let updateCallCount: number;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(global, "setTimeout");

    // Create mock players
    const player1 = createMockPlayer("player1", "Player 1", 1000);
    const player2 = createMockPlayer("player2", "Player 2", 1000);
    const player3 = createMockPlayer("player3", "Player 3", 1000);

    // Setup mock player cards
    player1.getPlayerPrivateState.mockReturnValue({
      cards: [
        new Card("A", "h"),
        new Card("K", "h"),
        new Card("Q", "h"),
        new Card("J", "h"),
        new Card("A", "s"),
        new Card("K", "s"),
        new Card("Q", "s"),
        new Card("J", "s"),
        new Card("A", "c"),
        new Card("K", "c"),
        new Card("Q", "c"),
        new Card("J", "c"),
      ],
      remainingTimeCookies: 3,
    });

    player2.getPlayerPrivateState.mockReturnValue({
      cards: [
        new Card("T", "h"),
        new Card("9", "h"),
        new Card("8", "h"),
        new Card("7", "h"),
        new Card("T", "s"),
        new Card("9", "s"),
        new Card("8", "s"),
        new Card("7", "s"),
        new Card("T", "c"),
        new Card("9", "c"),
        new Card("8", "c"),
        new Card("7", "c"),
      ],
      remainingTimeCookies: 2,
    });

    player3.getPlayerPrivateState.mockReturnValue({
      cards: [
        new Card("6", "h"),
        new Card("5", "h"),
        new Card("4", "h"),
        new Card("3", "h"),
        new Card("6", "s"),
        new Card("5", "s"),
        new Card("4", "s"),
        new Card("3", "s"),
        new Card("6", "c"),
        new Card("5", "c"),
        new Card("4", "c"),
        new Card("3", "c"),
      ],
      remainingTimeCookies: 1,
    });

    // Setup mock players map
    mockPlayers = new Map();
    mockPlayers.set(Position.BTN, player1);
    mockPlayers.set(Position.SB, player2);
    mockPlayers.set(Position.BB, player3);

    // Setup mock game
    mockGame = new Game("game1", {} as any, {} as any) as jest.Mocked<Game>;
    mockGame.getPlayersInGame.mockReturnValue(mockPlayers);

    // Setup mock state
    mockState = {
      id: "game1",
      phase: GamePhase.Showdown,
      flops: [
        [new Card("2", "h"), new Card("3", "d"), new Card("4", "c")],
        [new Card("5", "h"), new Card("6", "d"), new Card("7", "c")],
        [new Card("8", "h"), new Card("9", "d"), new Card("T", "c")],
      ],
      turns: [new Card("J", "d"), new Card("Q", "d"), new Card("K", "d")],
      rivers: [new Card("A", "d"), new Card("2", "s"), new Card("3", "s")],
      observers: new Set(),
      playerInPosition: mockPlayers,
      playersAbsolutePosition: [
        mockPlayers.get(Position.BTN) ?? null,
        mockPlayers.get(Position.SB) ?? null,
        mockPlayers.get(Position.BB) ?? null,
      ],
      bettingState: null,
      tableConfig: {
        maxPlayers: 6,
        minPlayers: 2,
        bbAmount: 2,
        sbAmount: 1,
        minBuyin: 100,
        maxBuyin: 200,
        maxBet: 0,
        minBet: 0,
        timeCookieEffect: 0,
        timePerAction: 0,
        timePerArrangeAction: 0,
        showdownAnimationTime: 0,
        noShowDwonAnimationTime: 0,
      },
      arrangePlayerCardsState: null,
      potsWinners: null,
      showdownResults: null,
      noShowdownResults: null,
    };

    // Setup mock pot manager
    mockMainPot = new PotContribution() as jest.Mocked<PotContribution>;
    mockMainPot.getTotalPotSize.mockReturnValue(300);
    mockMainPot.getContributors.mockReturnValue(
      new Set([
        mockPlayers.get(Position.BTN)!,
        mockPlayers.get(Position.SB)!,
        mockPlayers.get(Position.BB)!,
      ])
    );

    mockPotManager = new PotManager(mockMainPot) as jest.Mocked<PotManager>;
    mockPotManager.getPotsSizes.mockReturnValue([300]);
    mockPotManager.getAllPots.mockReturnValue([mockMainPot]);

    // Setup PokerHandEvaluator mock
    (PokerHandEvaluator.findBestOmahaHand as jest.Mock).mockImplementation(
      (__boardCards, playerCards) => {
        if (playerCards[0].rank === "A")
          return { value: 1, category: "Royal Flush" };
        if (playerCards[0].rank === "T")
          return { value: 2, category: "Straight Flush" };
        return { value: 3, category: "Four of a Kind" };
      }
    );

    // Setup process.env for SHOWDOWN_TIME_UNIT
    process.env.SHOWDOWN_TIME_UNIT = "10";

    // Reset update call count
    updateCallCount = 0;

    // Mock game.updateGameStateAndBroadcast to call the callback immediately
    mockGame.updateGameStateAndBroadcast.mockImplementation(
      (__updates, afterFunction) => {
        updateCallCount++;

        if (afterFunction) afterFunction();
      }
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    delete process.env.SHOWDOWN_TIME_UNIT;
  });

  test("ShowdownManager constructor initializes properly", async () => {
    mockPotManager.getAllPots.mockImplementation(() => {
      return [mockMainPot]; // Return a fresh copy each time
    });
    // Act

    showdownManager = new ShowdownManager(
      mockGame,
      mockState,
      mockPotManager,
      async () => {}
    );
    for (let i = 0; i < 4; i++) {
      // Move time forward to trigger setTimeout callback
      jest.advanceTimersByTime(Number(process.env.SHOWDOWN_TIME_UNIT) || 2000);
      // Allow any pending promise callbacks to execute
      await Promise.resolve();
    }
    // Assert
    expect(PokerHandEvaluator.findBestOmahaHand).toHaveBeenCalledTimes(9); // 3 players * 3 boards
    expect(updateCallCount).toBe(4); // One update per board
  });

  test("ShowdownManager distributes winnings for all boards", async () => {
    // Arrange
    updateCallCount = 0; // Reset counter for this test
    mockGame.updateGameStateAndBroadcast.mockImplementation(
      (updates, afterFunction) => {
        // Increment call count
        updateCallCount++;

        // Simulate the showdown results being broadcasted
        const showdownResults = updates?.showdownResults as ShowdownResult;

        if (showdownResults) {
          expect(showdownResults.board).toBeDefined();
          expect(showdownResults.potAmount).toBeDefined();
          expect(showdownResults.winners).toBeDefined();

          // Verify player1 wins on all boards (since it has the lowest hand value)
          expect(showdownResults.winners.has("player1")).toBe(true);

          // The pot amount should be divided by remaining boards
          const expectedPotAmount =
            showdownResults.board === 0
              ? 100 // 300/3
              : showdownResults.board === 1
                ? 150 // 300/2
                : 300; // Last board takes all remaining
        }

        if (afterFunction) afterFunction();
      }
    );

    // Act
    showdownManager = new ShowdownManager(
      mockGame,
      mockState,
      mockPotManager,
      async () => {}
    );

    // Fast-forward timers to complete all setTimeout calls
    jest.runAllTimers();

    // Verify player stacks were updated
    const player1 = mockPlayers.get(Position.BTN)!;
    expect(player1.updatePlayerPublicState).toHaveBeenCalledWith(
      expect.objectContaining({
        currentStack: expect.any(Number),
      })
    );
  });

  test("ShowdownManager handles multiple winners on a board", async () => {
    // Arrange
    updateCallCount = 0; // Reset counter for this test
    (PokerHandEvaluator.findBestOmahaHand as jest.Mock).mockImplementation(
      (boardCards, playerCards) => {
        // Make player1 and player2 tie on the first board
        if (boardCards[0].rank === "2") {
          // First board
          if (playerCards[0].rank === "A" || playerCards[0].rank === "T") {
            return { value: 1, category: "Royal Flush" };
          }
        }
        return { value: 2, category: "Straight Flush" };
      }
    );

    mockGame.updateGameStateAndBroadcast.mockImplementation(
      (updates, afterFunction) => {
        updateCallCount++;
        const showdownResults = updates?.showdownResults as ShowdownResult;

        if (showdownResults && showdownResults.board === 0) {
          // For board 0, both player1 and player2 should be winners
          expect(showdownResults.winners.size).toBe(2);
          expect(showdownResults.winners.has("player1")).toBe(true);
          expect(showdownResults.winners.has("player2")).toBe(true);

          // Each should get half the pot
          expect(showdownResults.winners.get("player1")).toBe(50); // 100/2
          expect(showdownResults.winners.get("player2")).toBe(50); // 100/2
        }

        if (afterFunction) afterFunction();
      }
    );

    // Act
    showdownManager = new ShowdownManager(
      mockGame,
      mockState,
      mockPotManager,
      async () => {}
    );

    // Fast-forward timers
    jest.runAllTimers();

    // Assert - check both players' stacks were updated
    const player1 = mockPlayers.get(Position.BTN)!;
    const player2 = mockPlayers.get(Position.SB)!;

    expect(player1.updatePlayerPublicState).toHaveBeenCalled();
    expect(player2.updatePlayerPublicState).toHaveBeenCalled();
  });

  test("ShowdownManager handles folded players correctly", async () => {
    // Arrange
    updateCallCount = 0; // Reset counter for this test
    const player3 = mockPlayers.get(Position.BB)! as jest.Mocked<PlayerInGame>;
    player3.isFolded.mockReturnValue(true);

    // Act
    showdownManager = new ShowdownManager(
      mockGame,
      mockState,
      mockPotManager,
      async () => {}
    );

    // Fast-forward timers
    jest.runAllTimers();

    // Assert
    // PokerHandEvaluator should not be called for folded player
    expect(PokerHandEvaluator.findBestOmahaHand).toHaveBeenCalledTimes(6); // 2 active players * 3 boards

    // Player3 should not receive any winnings
    const calls = mockGame.updateGameStateAndBroadcast.mock.calls;

    // Ensure `showdownResults` is NOT always null
    const hasValidShowdownResult = calls.some(
      (call) => call[0]?.showdownResults !== null
    );
    expect(hasValidShowdownResult).toBe(true); // At least one call must have showdown results

    // Check each call
    for (const call of calls) {
      const showdownResults = call[0]?.showdownResults;

      if (!showdownResults) {
        continue;
      }

      // Ensure "player3" is NOT in the winners map
      if (showdownResults.winners instanceof Map) {
        expect(showdownResults.winners.has("player3")).toBe(false);
      }
    }
  });

  test("ShowdownManager handles multiple pots correctly", async () => {
    // Arrange
    updateCallCount = 0; // Reset counter for this test
    let pot1Flag = false;
    let pot2Flag = false;

    const sidePot = new PotContribution() as jest.Mocked<PotContribution>;
    sidePot.getTotalPotSize.mockReturnValue(2000);
    sidePot.getContributors.mockReturnValue(
      new Set([mockPlayers.get(Position.BTN)!, mockPlayers.get(Position.SB)!])
    );

    mockMainPot.getTotalPotSize.mockReturnValue(100);
    mockMainPot.getContributors.mockReturnValue(
      new Set([
        mockPlayers.get(Position.BTN)!,
        mockPlayers.get(Position.SB)!,
        mockPlayers.get(Position.BB)!,
      ])
    );

    mockPotManager.getPotsSizes.mockReturnValue([2000, 100]);
    mockPotManager.getAllPots.mockImplementation(() => {
      return [sidePot, mockMainPot];
    });

    // Different hand strengths for different players
    (PokerHandEvaluator.findBestOmahaHand as jest.Mock).mockImplementation(
      (__boardCards, playerCards) => {
        if (playerCards[0].rank === "A")
          return { value: 1, category: "Royal Flush" };
        if (playerCards[0].rank === "T")
          return { value: 2, category: "Straight Flush" };
        if (playerCards[0].rank === "6")
          return { value: 3, category: "Four of a Kind" };
        return { value: 4, category: "Full House" };
      }
    );

    mockGame.updateGameStateAndBroadcast.mockImplementation(
      (updates, __afterFunction) => {
        updateCallCount++;
        console.log(
          "showdownResults : " + (updates?.showdownResults?.potAmount ?? "nan")
        );
        const showdownResults = updates?.showdownResults as ShowdownResult;
        const isCloseEnough = (a: number, b: number, epsilon = 0.01) =>
          Math.abs(a - b) < epsilon;

        if (showdownResults) {
          // Keep track of which pots we've processed
          if (
            showdownResults.potAmount === 100 ||
            showdownResults.potAmount === 50 ||
            isCloseEnough(showdownResults.potAmount, 33.33)
          ) {
            // Main pot (divided by 3, 2, or 1 remaining boards)
            pot1Flag = true;
          }
          if (
            showdownResults.potAmount === 2000 ||
            showdownResults.potAmount === 1000 ||
            isCloseEnough(showdownResults.potAmount, 666.67)
          ) {
            console.log("✅ Matched Side Pot:", showdownResults.potAmount);
            // Side pot (divided by 3, 2, or 1 remaining boards)
            pot2Flag = true;
            console.log("✅ pot2Flag:", pot2Flag);
          }
        }
      }
    );

    // Act
    showdownManager = new ShowdownManager(
      mockGame,
      mockState,
      mockPotManager,
      async () => {}
    );

    // Fast-forward timers
    for (let i = 0; i < 7; i++) {
      // Move time forward to trigger setTimeout callback
      jest.advanceTimersByTime(Number(process.env.SHOWDOWN_TIME_UNIT) || 2000);
      // Allow any pending promise callbacks to execute
      await Promise.resolve();
    }
    // Assert
    expect(pot1Flag).toBe(true);
    expect(pot2Flag).toBe(true);
    expect(updateCallCount).toBe(7); // 3 boards × 2 pots + final null cleanup
  });
});

// Helper function to create mock player
function createMockPlayer(
  id: string,
  name: string,
  stack: number
): jest.Mocked<PlayerInGame> {
  const player = new PlayerInGame(
    {} as any,
    {} as any,
    null,
    0
  ) as jest.Mocked<PlayerInGame>;

  player.getId.mockReturnValue(id);
  player.getName.mockReturnValue(name);
  player.getStack.mockReturnValue(stack);
  player.isFolded.mockReturnValue(false);
  player.isAllIn.mockReturnValue(false);
  player.isActive.mockReturnValue(true);

  return player;
}
