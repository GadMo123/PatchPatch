import { PlayerAction } from '../../game/betting/BettingTypes';
import { Game } from '../../game/Game';
import { Card, isValidRank, isValidSuit } from '../../../../shared/src/Card';
import { Player } from '../../player/Player';
import { ServerStateManager } from '../ServerStateManager';
import {
  BuyIntoGamePayload,
  CardArrangementPayload,
  InGamePayload,
  JoinGamePayload,
  LoginPayload,
  PlayerActionPayload,
} from 'shared/SocketProtocol';

export interface GameAndPlayer {
  game: Game | null;
  player: Player | null;
}

const validPlayerActions: Set<PlayerAction> = new Set([
  'fold',
  'check',
  'call',
  'bet',
  'raise',
]);

// Type guards for runtime validation
export const isLoginPayload = (payload: unknown): payload is LoginPayload => {
  if (typeof payload !== 'object' || payload === null) return false;
  const p = payload as Record<string, unknown>;
  return typeof p.name === 'string' && p.name.length > 0;
};

const isInGamePayload = (p: Record<string, unknown>): boolean => {
  return typeof p.gameId === 'string' && typeof p.playerId === 'string';
};

export const isPlayerActionPayload = (
  payload: unknown
): payload is PlayerActionPayload => {
  if (typeof payload !== 'object' || payload === null) return false;
  const p = payload as Record<string, unknown>;
  return (
    isInGamePayload(p) &&
    typeof p.action === 'string' &&
    validPlayerActions.has(p.action as PlayerAction) &&
    (p.amount === undefined || (typeof p.amount === 'number' && p.amount >= 0))
  );
};

export const isCardArrangementPayload = (
  payload: unknown
): payload is CardArrangementPayload => {
  if (typeof payload !== 'object' || payload === null) return false;
  const p = payload as Record<string, unknown>;
  const isValidArrangement =
    Array.isArray(p.arrangement) &&
    p.arrangement.length === 12 &&
    p.arrangement.every(
      item =>
        item instanceof Card && isValidSuit(item.suit) && isValidRank(item.rank)
    );

  return isInGamePayload(p) && isValidArrangement;
};

export const isJoinGamePayload = (
  payload: unknown
): payload is JoinGamePayload => {
  if (typeof payload !== 'object' || payload === null) return false;
  const p = payload as Record<string, unknown>;
  return isInGamePayload(p) && typeof p.position === 'string';
};

export const isBuyIntoGamePayload = (
  payload: unknown
): payload is BuyIntoGamePayload => {
  if (typeof payload !== 'object' || payload === null) return false;
  const p = payload as Record<string, unknown>;
  return isInGamePayload(p) && typeof p.amount === 'number';
};

// could be async if need acurate state at some point
export const getGameAndPlayer = (payload: InGamePayload): GameAndPlayer => {
  const game = ServerStateManager.getInstance().getGame(payload.gameId) ?? null;
  const player =
    ServerStateManager.getInstance().getPlayer(payload.playerId) ?? null;
  return { game: game, player: player };
};

export const validateSessionToken = (token: string): boolean => {
  return typeof token === 'string' && token.length > 20 && token.length < 500;
};
