import { app } from '../server/server';
import { Player } from '../player/Player';
import { createGame, gamesByBlinds } from './lobbyGames';

app.post('/join-game', (req, res) => {
  const { playerId, blindLevel } = req.body;
  const gameQueue = gamesByBlinds[blindLevel];

  if (!gameQueue) {
    return res.status(400).json({ message: 'Invalid blind level' });
  }

  const player: Player | undefined = players[playerId];
  if (!player) {
    return res.status(404).json({ message: 'Player not found' });
  }

  if (gameQueue.queue.length > 0) {
    // Match with an existing player
    const opponent = gameQueue.queue.shift()!;
    const game = createGame(blindLevel, [player, opponent]);

    gameQueue.games.push(game);

    player.socket.emit('game-start', { gameId: game.id });
    opponent.socket.emit('game-start', { gameId: game.id });

    res.json({ message: 'Game started', gameId: game.id });
  } else {
    // Add player to the queue
    gameQueue.queue.push(player);
    res.json({ message: 'Waiting for an opponent' });
  }
});
