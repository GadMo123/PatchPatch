import React, { useEffect, useState } from 'react';
import { useSocket } from '../../socket/SocketContext';
import { useNavigate } from 'react-router-dom';
import { SocketEvents } from 'shared/src/SocketProtocol';

interface MainLobbyProps {
  enterGameView: (gameId: string) => void; // Callback to pass gameId back to App
  playerId: string;
}

const MainLobby: React.FC<MainLobbyProps> = ({ enterGameView, playerId }) => {
  const { socket } = useSocket();
  const [games, setGames] = useState<any[]>([]);
  const navigate = useNavigate();

  const fetchLobbyStatus = () => {
    if (!socket) return;

    socket?.emit(
      'lobby-status',
      (response: { success: boolean; games: any[] }) => {
        console.log(response);
        if (response.success) {
          setGames(response.games); // Update games list
        } else alert("Can't connect, try again leter");
      }
    );
  };

  useEffect(() => {
    console.log('arrived in lobby');
    // Fetch initially
    fetchLobbyStatus();

    // Fetch every 5 seconds
    const interval = setInterval(fetchLobbyStatus, 5000);
    return () => clearInterval(interval); // Cleanup interval on unmount
  }, []);

  const handleEnterGame = (gameId: string) => {
    if (!playerId || playerId === 'unregistered') {
      navigate('/login'); // Redirect to login
      return;
    }

    socket?.emit(
      SocketEvents.ENTER_GAME,
      gameId,
      playerId,
      (response: { success: boolean; message?: string }) => {
        if (response.success) {
          enterGameView(gameId); // Pass gameId to parent
          navigate(`/game/${gameId}`);
        } else {
          alert(response.message || 'Failed to join game');
        }
      }
    );
  };

  return (
    <div>
      <h1>Lobby</h1>
      {
        <ul>
          {games?.map(game => (
            <li key={game.id}>
              <h2>{game.blindLevel} Big Blinds</h2>
              <p>Players: {game.players?.join(', ')}</p>
              <p>Status: {game.status}</p>maxPlayers
              <p>Max Players: {game.maxPlayers}</p>
              <p>Min Buyin: {game.minBuyIn}</p>
              <p>Max Buyin: {game.maxBuyIn}</p>
              <button onClick={() => handleEnterGame(game.id)}>
                Enter Game
              </button>
            </li>
          ))}
        </ul>
      }
    </div>
  );
};

export default MainLobby;
