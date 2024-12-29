// src/components/Lobby.js

import React, { useState } from 'react';

const Lobby = ({ createGame, joinGame }) => {
  const [gameId, setGameId] = useState('');

  const handleJoin = () => {
    joinGame(gameId);
  };

  return (
    <div className="Lobby">
      <h2>Lobby</h2>
      <button onClick={createGame}>Create Game</button>
      <div>
        <input
          type="text"
          placeholder="Enter Game ID"
          value={gameId}
          onChange={(e) => setGameId(e.target.value)}
        />
        <button onClick={handleJoin}>Join Game</button>
      </div>
    </div>
  );
};

export default Lobby;
