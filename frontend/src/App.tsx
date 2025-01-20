import React, { useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import './App.css';

import GameView from './components/game/GameView';

import { SocketProvider } from './components/socket/SocketContext'; // Wrap the app with SocketProvider
import Login from './components/login/login';
import MainLobby from './components/lobby/mainLobby';

const App: React.FC = () => {
  const [playerId, setPlayerId] = useState<string>('unregistered');
  const [gameId, setGameId] = useState<string | null>(null);

  useEffect(() => {
    console.log('arrived in app');
  }, []);

  return (
    <SocketProvider>
      <Router>
        <Routes>
          {/* Default Route: Redirect to Lobby */}
          <Route path="/" element={<Navigate to="/lobby" replace />} />

          {/* Login Route*/}
          <Route
            path="/login"
            element={
              playerId === 'unregistered' ? (
                <Login onLogin={setPlayerId} />
              ) : (
                <Navigate to="/lobby" replace />
              )
            }
          />

          {/* Lobby Route */}
          <Route
            path="/lobby"
            element={<MainLobby joinGame={setGameId} playerId={playerId} />}
          />

          {/* Game Route */}
          <Route
            path="/game/:gameId"
            element={
              playerId && gameId ? (
                <GameView playerId={playerId} gameId={gameId} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
        </Routes>
      </Router>
    </SocketProvider>
  );
};

export default App;
