// src\server\handlers\EventsInputValidator.ts - Validates client protocol calls inputs are in the right format.

import {
  BettingTypes,
  BuyIntoGamePayload,
  Card,
  CardArrangementPayload,
  InGamePayload,
  isValidRank,
  isValidSuit,
  JoinGamePayload,
  LoginPayload,
  PlayerActionPayload,
} from "@patchpatch/shared";
import { Game } from "../../game/Game";
import { Player } from "../../player/Player";
import { ServerStateManager } from "../ServerStateManager";

export interface GameAndPlayer {
  game: Game | null;
  player: Player | null;
}

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const validateBasePayload = (
  payload: unknown
): ValidationResult<Record<string, unknown>> => {
  if (typeof payload !== "object" || payload === null) {
    return { success: false, error: "Invalid payload format" };
  }
  return { success: true, data: payload as Record<string, unknown> };
};

export const validateLogin = (
  payload: unknown
): ValidationResult<LoginPayload> => {
  const baseValidation = validateBasePayload(payload);
  if (!baseValidation.success) return baseValidation;

  const { data: p } = baseValidation;
  if (typeof p.name !== "string" || p.name.length === 0) {
    return { success: false, error: "Invalid name format" };
  }

  return { success: true, data: { name: p.name } };
};

export const validateInGamePayload = (
  payload: unknown
): ValidationResult<InGamePayload> => {
  const baseValidation = validateBasePayload(payload);
  if (!baseValidation.success) return baseValidation;

  const { data: p } = baseValidation;
  if (typeof p.gameId !== "string" || typeof p.playerId !== "string") {
    return { success: false, error: "Invalid game or player ID format" };
  }

  return {
    success: true,
    data: { gameId: p.gameId, playerId: p.playerId },
  };
};

export const validatePlayerAction = (
  payload: unknown
): ValidationResult<PlayerActionPayload> => {
  const baseValidation = validateInGamePayload(payload);
  if (!baseValidation.success) return baseValidation;

  const p = payload as Record<string, unknown>;
  if (
    typeof p.action !== "string" ||
    !Object.values(BettingTypes).includes(p.action as BettingTypes)
  ) {
    return { success: false, error: "Invalid action type" };
  }

  if (
    p.amount !== undefined &&
    (typeof p.amount !== "number" || p.amount < 0)
  ) {
    return { success: false, error: "Invalid amount" };
  }

  return {
    success: true,
    data: {
      ...baseValidation.data,
      action: p.action as BettingTypes,
      amount: p.amount as number | undefined,
    },
  };
};

export const validateCardArrangement = (
  payload: unknown
): ValidationResult<CardArrangementPayload> => {
  const baseValidation = validateInGamePayload(payload);
  if (!baseValidation.success) return baseValidation;

  const p = payload as Record<string, unknown>;
  if (!Array.isArray(p.arrangement)) {
    return { success: false, error: "Arrangement must be an array" };
  }

  if (p.arrangement.length !== 12) {
    return {
      success: false,
      error: "Arrangement must contain exactly 12 cards",
    };
  }

  const isValidCard = (item: unknown): item is Card => {
    if (!(item instanceof Card)) return false;
    return isValidSuit(item.suit) && isValidRank(item.rank);
  };

  if (!p.arrangement.every(isValidCard)) {
    return { success: false, error: "Invalid card in arrangement" };
  }

  return {
    success: true,
    data: {
      ...baseValidation.data,
      arrangement: p.arrangement,
    },
  };
};

export const validateJoinGame = (
  payload: unknown
): ValidationResult<JoinGamePayload> => {
  const baseValidation = validateInGamePayload(payload);
  if (!baseValidation.success) return baseValidation;

  const p = payload as Record<string, unknown>;
  if (
    typeof p.tableAbsolutePosition !== "number" ||
    p.tableAbsolutePosition < 0
  ) {
    return { success: false, error: "Invalid table position" };
  }

  return {
    success: true,
    data: {
      ...baseValidation.data,
      tableAbsolutePosition: p.tableAbsolutePosition,
    },
  };
};

export const validateBuyIntoGame = (
  payload: unknown
): ValidationResult<BuyIntoGamePayload> => {
  const baseValidation = validateInGamePayload(payload);
  if (!baseValidation.success) return baseValidation;

  const p = payload as Record<string, unknown>;
  if (typeof p.amount !== "number" || p.amount <= 0) {
    return { success: false, error: "Invalid buy-in amount" };
  }

  return {
    success: true,
    data: {
      ...baseValidation.data,
      amount: p.amount,
    },
  };
};

export const getGameAndPlayer = (payload: InGamePayload): GameAndPlayer => {
  const game = ServerStateManager.getInstance().getGame(payload.gameId) ?? null;
  const player =
    ServerStateManager.getInstance().getPlayer(payload.playerId) ?? null;
  return { game, player };
};

export const validateSessionToken = (token: string): boolean => {
  return typeof token === "string" && token.length > 20 && token.length < 500;
};
