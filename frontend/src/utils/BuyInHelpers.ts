import { GameStateServerBroadcast } from "@patchpatch/shared";
import { useGameBuyIn } from "../hooks/CreateSocketAction";
import { getPlayerAbsolutePosition } from "./GameHelpers";
import { useMemo, useState } from "react";

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
  bigBlindAmount?: number;
}

export const useBuyIn = ({
  gameId,
  playerId,
}: BuyInHelperProps): UseBuyInResult => {
  const [oneBuyinPerRoundUsed, setOneBuyinPerRoundUsed] =
    useState<boolean>(false);
  const { sendAction: doBuyIn } = useGameBuyIn();
  const [canBuyIn, setCanBuyIn] = useState(false);
  const [minBuyIn, setMinBuyIn] = useState<number | undefined>(undefined);
  const [maxBuyIn, setMaxBuyIn] = useState<number | undefined>(undefined);
  const [bigBlindAmount, setBigBlindAmount] = useState<number | undefined>(
    undefined
  );
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

    const tableMin = newGameState?.tableConfig.minBuyin;
    const tableMax = newGameState?.tableConfig.maxBuyin;
    const bigBlind = newGameState?.tableConfig.bigBlindAmount;
    setMinBuyIn(tableMin);
    setMaxBuyIn(Math.max(0, tableMax - (stack ?? 0)));
    setBigBlindAmount(bigBlind);

    // Check if a new hand is starting
    if (newGameState?.phase === "dealPreflop") {
      setOneBuyinPerRoundUsed(false);
    }

    setCanBuyIn(
      !!(
        stack !== undefined &&
        tableMax &&
        tableMin &&
        stack + tableMin <= tableMax &&
        !oneBuyinPerRoundUsed
      )
    );
  };

  const handleBuyIn = async (amount: number) => {
    if (playerStack === undefined || !minBuyIn || !maxBuyIn || !canBuyIn) {
      let message = canBuyIn
        ? "Player or game data not available"
        : "Player stack is full";
      return {
        success: false,
        message: message,
      };
    }

    if (amount < minBuyIn || amount > maxBuyIn) {
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

      // If buy-in was successful, mark that the player has used their buy-in for this hand
      if (response.success) {
        setOneBuyinPerRoundUsed(true);
        setCanBuyIn(false);
      }

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
    bigBlindAmount,
  };
};

// Helper to check if a player needs to buy in (stack is 0 or close)
export const useIsStackLow = (
  gameState: GameStateServerBroadcast | null,
  playerId: string
): boolean => {
  return useMemo(() => {
    if (!gameState) return false;

    const playerData = gameState.publicPlayerDataMapByTablePosition.find(
      (player) => player.id === playerId
    );

    if (!playerData?.stack || !gameState.tableConfig.bigBlindAmount)
      return false;

    return playerData.stack < gameState.tableConfig.bigBlindAmount;
  }, [gameState, playerId]);
};
