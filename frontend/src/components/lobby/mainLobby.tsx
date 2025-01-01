import { useEffect, useState } from 'react';

const Lobby = ({ socket }) => {
  const [lobbyStatus, setLobbyStatus] = useState([]);

  useEffect(() => {
    const fetchLobbyStatus = async () => {
      const response = await fetch('http://localhost:5000/lobby-status');
      const data = await response.json();
      setLobbyStatus(data);
    };

    fetchLobbyStatus();
  }, []);

  const handleJoinGame = async blindLevel => {
    const response = await fetch('http://localhost:5000/join-game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId: localStorage.getItem('playerId'),
        blindLevel,
      }),
    });

    const data = await response.json();
    if (data.message === 'Game started') {
      alert('Game started! Redirecting...');
      // Redirect to game page
    } else {
      alert('Waiting for an opponent...');
    }
  };

  return (
    <div>
      <h1>Lobby</h1>
      <ul>
        {lobbyStatus.map(({ blindLevel, waiting, activeGames }) => (
          <li key={blindLevel}>
            <h2>{blindLevel} Big Blinds</h2>
            <p>Players waiting: {waiting}</p>
            <p>Active games: {activeGames}</p>
            <button onClick={() => handleJoinGame(blindLevel)}>
              Join Game
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Lobby;
