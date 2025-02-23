import { GameStateServerBroadcast } from "@patchpatch/shared";
import { useGameBuyIn } from "../hooks/CreateSocketAction";
import { getPlayerAbsolutePosition } from "./GameHelpers";

interface BuyInHelperProps {
  gameId: string;
  playerId: string;
  gameState: GameStateServerBroadcast | null;
}

interface UseBuyInResult {
  canBuyIn: boolean;
  handleBuyIn: (amount: number) => Promise<{
    success: boolean;
    message?: string;
  }>;
  minBuyIn?: number;
  maxBuyIn?: number;
}

export const useBuyIn = ({
  gameId,
  playerId,
  gameState,
}: BuyInHelperProps): UseBuyInResult => {
  const { sendAction: doBuyIn } = useGameBuyIn();

  const playerAbsolutePosition = getPlayerAbsolutePosition(playerId, gameState);
  const stack = playerAbsolutePosition
    ? (gameState?.publicPlayerDataMapByTablePosition[playerAbsolutePosition]
        ?.stack ?? null)
    : null;

  const minBuyIn = gameState?.tableConfig.minBuyin;
  const maxBuyIn = gameState?.tableConfig.maxBuyin;
  const canBuyIn = !!(stack && maxBuyIn && stack < maxBuyIn);

  const handleBuyIn = async (amount: number) => {
    if (!(stack && minBuyIn && maxBuyIn && canBuyIn)) {
      let message = canBuyIn
        ? "Player or game data not available"
        : "Player stack is full";
      return {
        success: false,
        message: message,
      };
    }

    if (amount < minBuyIn || amount + stack > maxBuyIn) {
      return {
        success: false,
        message: `Buy-in amount exceeds the table limit.`,
      };
    }

    try {
      const response = await doBuyIn({
        gameId,
        playerId,
        amount,
      });

      return {
        success: response.success,
        message: response.message,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to process buy-in. Please try again.",
      };
    }
  };

  return {
    canBuyIn,
    handleBuyIn,
    minBuyIn,
    maxBuyIn,
  };
};

// Helper to check if a player needs to buy in (stack is 0)
export const needsBuyIn = (
  gameState: GameStateServerBroadcast | null,
  playerAbsolutePosition: number
): boolean => {
  if (!gameState?.publicPlayerDataMapByTablePosition) return false;

  const playerData =
    gameState.publicPlayerDataMapByTablePosition[playerAbsolutePosition];

  return playerData?.stack === 0;
};
