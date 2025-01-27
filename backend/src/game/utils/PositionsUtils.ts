//\src\game\types\PositionsUtils.ts

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

export class PositionsUtils {
  static findFirstPlayerToAct(game: Game): PlayerInGame {
    const nextToTalk =
      game.getPhase() === GamePhase.PreflopBetting ? Position.UTG : Position.SB; // preflop first player to act is UTG, otherwise SB (poker standart rules)
    return (
      game.getPlayerInPosition(nextToTalk) ||
      this.findNextPlayerToAct(nextToTalk, game)
    );
  }

  static readonly PositionOrder = [
    Position.UTG,
    Position.MP,
    Position.CO,
    Position.BTN,
    Position.SB,
    Position.BB,
  ];

  static findNextPlayerToAct(
    startingPosition: Position,
    game: Game
  ): PlayerInGame {
    const startIndex = this.PositionOrder.indexOf(startingPosition);
    for (let i = 1; i < this.PositionOrder.length; i++) {
      const nextIndex = (startIndex + i) % this.PositionOrder.length;
      const position = this.PositionOrder[nextIndex];
      const player = game.getPlayerInPosition(position);

      if (player?.isActive()) {
        return player; // Return the first valid player ot act
      }
    }
    throw new Error('No players found to act.');
  }

  // get position by name
  static getPosition(position: string): Position {
    const positions = Object.values(Position); // Get all enum values
    const foundPosition = positions.find(p => p === position);
    return foundPosition as Position;
  }

  static rotatePositionsAndSetupPlayerState(
    players: Map<Position, PlayerInGame | null>,
    state: DetailedGameState
  ): boolean {
    // Get ready players and their current positions
    const readyPlayers: { player: PlayerInGame; position: Position }[] = [];
    players.forEach((player, position) => {
      if (player?.isReadyToStartHand(state.bettingConfig.bbAmount)) {
        readyPlayers.push({ player, position });
        player.updatePlayerPublicState({ isFolded: false, isAllIn: false });
      }
    });

    // If less than 2 players ready, return false
    if (readyPlayers.length < 2) {
      return false;
    }

    // Clear all positions first
    players.forEach((_, position) => {
      players.set(position, null);
    });

    // Find the player who should move to the lowest position (either previous BB or next in succession)
    const priorityOrder = [
      Position.BB,
      Position.SB,
      Position.BTN,
      Position.CO,
      Position.MP,
      Position.UTG,
    ];
    let playerToMoveFront:
      | { player: PlayerInGame; position: Position }
      | undefined;

    // Look through priority order until we find a player who is ready
    for (const position of priorityOrder) {
      playerToMoveFront = readyPlayers.find(p => p.position === position);
      if (playerToMoveFront) {
        break;
      }
    }

    if (!playerToMoveFront) {
      return false;
    }

    // Get positions for the number of players we have
    const activePositions = this.PositionOrder.slice(-readyPlayers.length);

    // Selected player moves to the lowest ranking position (first in the activePositions array)
    players.set(activePositions[0], playerToMoveFront.player);

    // Remove the selected player from ready players list
    const remainingPlayers = readyPlayers.filter(
      p => p.player !== playerToMoveFront!.player
    );

    // Assign remaining players to positions clockwise
    let positionIndex = 1;
    remainingPlayers.forEach(({ player }) => {
      if (positionIndex < activePositions.length) {
        players.set(activePositions[positionIndex], player);
        positionIndex++;
      }
    });

    return true;
  }
}
