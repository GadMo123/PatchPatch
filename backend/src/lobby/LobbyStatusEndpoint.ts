import { app } from '../server';
import { gamesByBlinds } from './LobbyGames';

app.get('/lobby-status', (req, res) => {
  const lobbyStatus = Object.entries(gamesByBlinds).map(
    ([blindLevel, data]) => ({
      blindLevel,
      waiting: data.queue.length,
      activeGames: data.games.length,
    })
  );

  res.json(lobbyStatus);
});
