import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./App.css";

import GameView from "./screens/game/GameView";
import { SocketProvider } from "./contexts/SocketContext";
import { BuyInProvider } from "./contexts/BuyInContext";
import { AnimationThemeProvider } from "./contexts/AnimationThemeProvider";
import AnimationControl from "./settingsComponents/AnimationControl";
import Login from "./screens/login/Login";
import MainLobby from "./screens/lobby/MainLobby";

const App: React.FC = () => {
  const [playerId, setPlayerId] = useState<string>("unregistered");
  const [gameId, setGameId] = useState<string | null>(null);

  useEffect(() => {
    console.log("arrived in app");
  }, []);

  return (
    <SocketProvider>
      <AnimationThemeProvider>
        <Router>
          <div className="app-container">
            {/* Animation Settings Slider in Top-Right Corner */}
            <div className="Animation-control">
              <AnimationControl />
            </div>

            <Routes>
              {/* Default Route: Redirect to Lobby */}
              <Route path="/" element={<Navigate to="/lobby" replace />} />

              {/* Login Route */}
              <Route
                path="/login"
                element={
                  playerId === "unregistered" ? (
                    <Login onLogin={setPlayerId} />
                  ) : (
                    <Navigate to="/lobby" replace />
                  )
                }
              />

              {/* Lobby Route */}
              <Route
                path="/lobby"
                element={
                  <MainLobby enterGameView={setGameId} playerId={playerId} />
                }
              />

              {/* Game Route */}
              <Route
                path="/game/:gameId"
                element={
                  playerId && gameId ? (
                    <BuyInProvider>
                      <GameView playerId={playerId} gameId={gameId} />
                    </BuyInProvider>
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
            </Routes>
          </div>
        </Router>
      </AnimationThemeProvider>
    </SocketProvider>
  );
};

export default App;
