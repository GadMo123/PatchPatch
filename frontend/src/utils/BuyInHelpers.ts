import { GameStateServerBroadcast } from "@patchpatch/shared";
import { useGameBuyIn } from "../hooks/CreateSocketAction";
import { getPlayerAbsolutePosition } from "./GameHelpers";
import { useEffect, useState } from "react";

interface BuyInHelperProps {
  gameId: string;
  playerId: string;
}

interface UseBuyInResult {
  canBuyIn: boolean;
  handleBuyIn: (amount: number) => Promise<{
    success: boolean;
    message?: string;
  }>;
  minBuyIn?: number;
  maxBuyIn?: number;
  updateBuyInState: (state: GameStateServerBroadcast) => void;
}

export const useBuyIn = ({
  gameId,
  playerId,
}: BuyInHelperProps): UseBuyInResult => {
  const { sendAction: doBuyIn } = useGameBuyIn();
  const [canBuyIn, setCanBuyIn] = useState(false);
  const [minBuyIn, setMinBuyIn] = useState<number | undefined>(undefined);
  const [maxBuyIn, setMaxBuyIn] = useState<number | undefined>(undefined);
  const [playerStack, setPlayerStack] = useState<number | undefined>(undefined);

  const updateBuyInState = (newGameState: GameStateServerBroadcast) => {
    const playerAbsolutePosition = getPlayerAbsolutePosition(
      playerId,
      newGameState
    );
    const stack =
      playerAbsolutePosition != null
        ? newGameState?.publicPlayerDataMapByTablePosition?.[
            playerAbsolutePosition
          ]?.stack
        : undefined;
    if (playerAbsolutePosition !== null) setPlayerStack(stack);

    const min = newGameState?.tableConfig.minBuyin;
    const max = newGameState?.tableConfig.maxBuyin;
    setMinBuyIn(min);
    setMaxBuyIn(max);
    setCanBuyIn(!!(stack !== undefined && max && stack < max));
    console.log("can buyin? " + canBuyIn);
  };

  const handleBuyIn = async (amount: number) => {
    if (!(playerStack && minBuyIn && maxBuyIn && canBuyIn)) {
      let message = canBuyIn
        ? "Player or game data not available"
        : "Player stack is full";
      return {
        success: false,
        message: message,
      };
    }

    if (amount < minBuyIn || amount + playerStack > maxBuyIn) {
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
    updateBuyInState,
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
