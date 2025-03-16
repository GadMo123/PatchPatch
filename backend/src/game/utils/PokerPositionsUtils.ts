// src\game\utils\PositionsUtils.ts - Helper functions related to position, manage players position and table rotations between hands.

import { Position } from "@patchpatch/shared";
import { Game } from "../Game";
import { DetailedGameState, GamePhase } from "../types/GameState";
import { PlayerInGame } from "../types/PlayerInGame";

const positionOrder = [
  Position.UTG,
  Position.MP,
  Position.CO,
  Position.BTN,
  Position.SB,
  Position.BB,
] as const;

export function findFirstPlayerToAct(game: Game): PlayerInGame {
  const nextToTalk =
    game.getPhase() === GamePhase.PreflopBetting ? Position.UTG : Position.SB;
  return (
    game.getPlayerInPosition(nextToTalk) ||
    findNextPlayerToAct(nextToTalk, game)
  );
}

export function findNextPlayerToAct(
  startingPosition: Position,
  game: Game
): PlayerInGame {
  const startIndex = positionOrder.indexOf(startingPosition);
  for (let i = 1; i < positionOrder.length; i++) {
    const nextIndex = (startIndex + i) % positionOrder.length;
    const position = positionOrder[nextIndex];
    const player = game.getPlayerInPosition(position);

    if (player && !player.isFolded() && !player.isAllIn()) {
      return player;
    }
  }
  throw new Error("NO_PLAYER_TO_ACT");
}

export function getPosition(position: string): Position | null {
  const positions = Object.values(Position);
  const foundPosition = positions.find((p) => p === position);
  return foundPosition ?? null;
}

/**
 * Assigns poker positions to players for the next hand
 * @param readyPlayers Array of players who are will be playing in the next hand, (clockwise table position ordered)
 * @param btnPlayer The player who will have the BTN position in the next hand (or SB Position in case of Heads-up)
 * @returns Map of positions to players (null for unoccupied positions)
 */
export function assignPositions(
  readyPlayers: PlayerInGame[],
  btnPlayerID: string
): Map<Position, PlayerInGame | null> {
  // Initialize position map with all positions set to null
  const positions = [
    Position.BTN,
    Position.SB,
    Position.BB,
    Position.UTG,
    Position.MP,
    Position.CO,
  ];
  const positionMap = new Map<Position, PlayerInGame | null>();
  positions.forEach((pos) => positionMap.set(pos, null));

  // Validate input
  if (readyPlayers.length === 0 || readyPlayers.length > 6) {
    throw new Error("Number of ready players must be between 1 and 6");
  }

  if (!readyPlayers.some((player) => player.getId() === btnPlayerID)) {
    throw new Error("BTN player must be included in readyPlayers");
  }

  // Find the index of btnPlayer in readyPlayers
  const btnIndex = readyPlayers.findIndex(
    (player) => player.getId() === btnPlayerID
  );

  // Sort players to start with btnPlayer and proceed clockwise
  const orderedPlayers = [
    ...readyPlayers.slice(btnIndex),
    ...readyPlayers.slice(0, btnIndex),
  ];

  // Handle heads-up case (2 players)
  if (readyPlayers.length === 2) {
    positionMap.set(Position.SB, orderedPlayers[0]);
    positionMap.set(Position.BB, orderedPlayers[1]); // BTN player is also BB in heads-up
    return positionMap;
  }

  // Assign BTN position
  positionMap.set(Position.BTN, orderedPlayers[0]);

  // Handle 3+ players
  positionMap.set(Position.SB, orderedPlayers[1]);
  positionMap.set(Position.BB, orderedPlayers[2]);

  // Assign remaining positions based on player count
  switch (readyPlayers.length) {
    case 6:
      positionMap.set(Position.UTG, orderedPlayers[3]);
      positionMap.set(Position.MP, orderedPlayers[4]);
      positionMap.set(Position.CO, orderedPlayers[5]);
      break;
    case 5:
      positionMap.set(Position.MP, orderedPlayers[3]);
      positionMap.set(Position.CO, orderedPlayers[4]);
      break;
    case 4:
      positionMap.set(Position.CO, orderedPlayers[3]);
      break;
    // For 3 players, only BTN, SB, and BB are assigned
  }

  return positionMap;
}

/**
 * Calculates the next button position player for the next hand.
 *
 * @param lastBtnTablePosition The table position of the last BTN (or SB in case of HU), can be null
 * @param nextHandPlayers Array of players who will play in the next hand
 * @return The player who should have the button in the next hand
 */
export function RotateButtonPosition(
  lastBtnTablePosition: number | null | undefined,
  nextHandPlayers: PlayerInGame[]
): PlayerInGame {
  // If there are no players for the next hand, throw an error
  if (!nextHandPlayers || nextHandPlayers.length === 0) {
    throw new Error("No players available for the next hand");
  }

  // If we have no last button position, select a random player for the button
  if (lastBtnTablePosition === null || lastBtnTablePosition === undefined) {
    const randomIndex = Math.floor(Math.random() * nextHandPlayers.length);
    return nextHandPlayers[randomIndex];
  }

  // Get all table positions from the active players
  const tablePositions = nextHandPlayers.map((player) =>
    player.getTablePosition()
  );
  const maxPosition = Math.max(...tablePositions);

  // Start looking from the position after the last button
  const startPosition = (lastBtnTablePosition + 1) % (maxPosition + 1);

  // Search clockwise (increasing position numbers) for the next active player
  for (let i = 0; i < maxPosition + 1; i++) {
    const currentPosition = (startPosition + i) % (maxPosition + 1);

    // Find the player at this position in nextHandPlayers
    const nextBtnPlayer = nextHandPlayers.find(
      (player) => player.getTablePosition() === currentPosition
    );

    if (nextBtnPlayer) {
      return nextBtnPlayer; // Found the next button player
    }
  }

  // If we went through all positions and couldn't find a player,
  // just pick the first player in the nextHandPlayers array
  // (this shouldn't happen if table positions are assigned correctly)
  return nextHandPlayers[0];
}
