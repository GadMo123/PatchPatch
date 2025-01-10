// src/game/broadcasting/GameStateBroadcaster.ts

import { Server } from 'socket.io';
import { Game } from '../Game';
import { GameStateUtils } from '../types/GameState';

export class GameStateBroadcaster {
  constructor(private io: Server) {}

  broadcastGameState(game: Game) {
    const baseState = GameStateUtils.getBaseGameState(game);

    // Broadcast to players in game
    game.getPlayersInGame()?.forEach((player, position) => {
      if (player) {
        const gameState = GameStateUtils.addPlayerPersonalData(
          baseState,
          position,
          game
        );
        this.io.to(player.socketId).emit('game-state', gameState);
      }
    });

    // Broadcast to observers
    game.getObserversList().forEach(observer => {
      this.io.to(observer.socketId).emit('game-state', baseState);
    });
  }
}
