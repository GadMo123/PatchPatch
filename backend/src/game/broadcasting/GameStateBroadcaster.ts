// src/game/broadcasting/GameStateBroadcaster.ts

import { Server } from 'socket.io';
import { Game } from '../Game';
import { getBaseGameState } from '../types/GameState';

export class GameStateBroadcaster {
  constructor(private _io: Server) {}

  broadcastGameState(game: Game, afterFunction: (() => void) | null) {
    const baseState = getBaseGameState(game);

    // Broadcast to players in game
    game.getPlayersInGame()?.forEach((player, position) => {
      if (player) {
        const playerGameState = {
          ...baseState,
          playerPrivateState: player.getPlayerPrivateState(),
        };
        this._io.to(player.getSocketId()).emit('game-state', playerGameState);
      }
    });

    // Broadcast to observers
    game.getObserversList().forEach(observer => {
      this._io.to(observer.getSocketId()).emit('game-state', baseState);
    });

    // Call afterFunction with a small delay to allow players recive the state
    if (afterFunction) {
      setTimeout(() => {
        afterFunction();
      }, 10);
    }
  }
}
