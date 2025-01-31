import { Game } from '../Game';
import { DetailedGameState, GamePhase } from '../types/GameState';
import { PlayerInGame } from '../types/PlayerInGame';

export enum Position {
  BB = 'bb',
  SB = 'sb',
  BTN = 'btn',
  CO = 'co',
  MP = 'mp',
  UTG = 'utg',
}

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

    if (player?.isActive()) {
      return player;
    }
  }
  throw new Error('No players found to act.');
}

export function getPosition(position: string): Position | null {
  const positions = Object.values(Position);
  const foundPosition = positions.find(p => p === position);
  return foundPosition ?? null;
}

export function rotatePositionsAndSetupPlayerState(
  players: Map<Position, PlayerInGame | null>,
  state: DetailedGameState
): boolean {
  const readyPlayers: { player: PlayerInGame; position: Position }[] = [];
  players.forEach((player, position) => {
    if (player?.isReadyToStartHand(state.tableConfig.bbAmount)) {
      readyPlayers.push({ player, position });
      player.updatePlayerPublicState({ isFolded: false, isAllIn: false });
    }
  });

  if (readyPlayers.length < 2) {
    return false;
  }

  players.forEach((_, position) => {
    players.set(position, null);
  });

  const priorityOrder = [
    Position.BB,
    Position.SB,
    Position.BTN,
    Position.CO,
    Position.MP,
    Position.UTG,
  ] as const;

  const playerToMoveFront = priorityOrder.reduce<
    { player: PlayerInGame; position: Position } | undefined
  >(
    (found, position) =>
      found || readyPlayers.find(p => p.position === position),
    undefined
  );

  if (!playerToMoveFront) {
    return false;
  }

  const activePositions = positionOrder.slice(-readyPlayers.length);
  players.set(activePositions[0], playerToMoveFront.player);

  const remainingPlayers = readyPlayers.filter(
    p => p.player !== playerToMoveFront.player
  );

  remainingPlayers.forEach(({ player }, index) => {
    const positionIndex = index + 1;
    if (positionIndex < activePositions.length) {
      players.set(activePositions[positionIndex], player);
    }
  });

  return true;
}
