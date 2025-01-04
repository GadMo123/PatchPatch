import React, { useEffect, useState } from 'react';
import { useSocket } from '../socket/SocketContext';
import { useNavigate } from 'react-router-dom';

interface MainLobbyProps {
  joinGame: (gameId: string) => void; // Callback to pass gameId back to App
}

const MainLobby: React.FC<MainLobbyProps> = ({ joinGame }) => {
  const { socket } = useSocket();
  const [games, setGames] = useState<any[]>([]);
  const navigate = useNavigate();

  const fetchLobbyStatus = () => {
    if (!socket) return;

    socket?.emit(
      'lobby-status',
      {},
      (response: { success: boolean; games: any[] }) => {
        console.log(response);
        if (response.success) {
          setGames(response.games); // Update games list
        }
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

  const handleJoinGame = (gameId: string) => {
    socket?.emit(
      'join-game',
      gameId,
      (response: { success: boolean; message?: string }) => {
        if (response.success) {
          joinGame(gameId); // Pass gameId to parent
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
              <p>Status: {game.status}</p>
              <button onClick={() => handleJoinGame(game.id)}>Join Game</button>
            </li>
          ))}
        </ul>
      }
    </div>
  );
};

export default MainLobby;
