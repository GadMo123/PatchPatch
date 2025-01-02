import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import './App.css';
import Login from './components/login/Login';
import GameView from './components/game/GameView';
import MainLobby from './components/lobby/MainLobby';
import { SocketProvider } from './components/socket/SocketContext'; // Wrap the app with SocketProvider

const App: React.FC = () => {
  const [playerId, setPlayerId] = useState<string>('unregistered');
  const [gameId, setGameId] = useState<string | null>(null);

  return (
    <SocketProvider>
      <Router>
        <Routes>
          {/* Default Route: Redirect to Lobby */}
          <Route path="/" element={<Navigate to="/lobby" replace />} />

          {/* Login Route */}
          <Route
            path="/login"
            element={
              playerId === 'unregistered' ? (
                <Login setPlayerId={setPlayerId} />
              ) : (
                <Navigate to="/lobby" replace />
              )
            }
          />

          {/* Lobby Route */}
          <Route
            path="/lobby"
            element={
              playerId && playerId !== 'unregistered' ? (
                <MainLobby joinGame={setGameId} /> // Pass the setGameId directly to MainLobby
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          {/* Game Route */}
          <Route
            path="/game/:gameId"
            element={
              playerId && gameId ? (
                <GameView playerId={playerId} />
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
