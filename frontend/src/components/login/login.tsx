import React, { useState, useEffect } from 'react';
import socket from '../socket/socket';

interface LoginProps {
  setPlayerId: (id: string) => void;
}

const Login: React.FC<LoginProps> = ({ setPlayerId }) => {
  const [playerName, setPlayerName] = useState<string>('');

  const handleLogin = () => {
    const id = playerName ? playerName : 'viewer'; // Default to 'viewer' if no name
    setPlayerId(id);

    socket.emit('login', { playerId: id }, (response: { success: boolean }) => {
      if (response.success) {
        console.log('Player logged in as', id);
      } else {
        console.error('Login failed');
      }
    });
  };

  return (
    <div>
      <h1>Login</h1>
      <input
        type="text"
        placeholder="Enter Player Name"
        value={playerName}
        onChange={e => setPlayerName(e.target.value)}
      />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
};

export default Login;
