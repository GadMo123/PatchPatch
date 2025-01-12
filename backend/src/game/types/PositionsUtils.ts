//\src\game\types\PositionsUtils.ts

import { Game } from '../Game';
import { GamePhase } from './GameState';
import { PlayerInGame } from './PlayerInGame';

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

      if (player && !player!.isFolded()) {
        return player; // Return the first valid player ot act
      }
    }
    throw new Error('No players found to act.');
  }

  static getPosition(position: string): Position {
    const positions = Object.values(Position); // Get all enum values
    const foundPosition = positions.find(p => p === position);
    return foundPosition as Position;
  }
}
