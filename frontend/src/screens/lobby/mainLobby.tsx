import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../../contexts/SocketContext";
import { useEnterGame, useLobbyStatus } from "../../hooks/CreateSocketAction";

interface MainLobbyProps {
  enterGameView: (gameId: string) => void; // Callback to pass gameId back to App
  playerId: string;
}

// Lobby screen display, allows player to enter a game.
const MainLobby: React.FC<MainLobbyProps> = ({ enterGameView, playerId }) => {
  const { socket } = useSocket();
  const [games, setGames] = useState<any[]>([]);
  const navigate = useNavigate();
  const { sendAction: enterGame } = useEnterGame();
  const { sendAction: getLobbyStatus } = useLobbyStatus();

  const fetchLobbyStatus = async () => {
    if (!socket) return;

    // Todo, should be changed in backend to cache lobby status and braodcast without requests.
    const response = await getLobbyStatus();
    console.log(response);
    if (response.success) {
      setGames(response.games); // Update games list
    } else alert("Can't connect, try again leter");
  };

  useEffect(() => {
    console.log("arrived in lobby");
    // Fetch initially
    fetchLobbyStatus();

    // Fetch every 5 seconds
    const interval = setInterval(fetchLobbyStatus, 5000);
    return () => clearInterval(interval); // Cleanup interval on unmount
  }, []);

  const handleEnterGame = async (gameId: string) => {
    if (!playerId || playerId === "unregistered") {
      navigate("/login"); // Redirect to login
      return;
    }

    try {
      const response = await enterGame({ gameId: gameId, playerId: playerId });
      if (response.success) {
        enterGameView(gameId); // Pass gameId to parent
        navigate(`/game/${gameId}`);
      } else {
        alert(response.message || "Failed to enter game");
      }
    } catch (error) {
      alert("Failed to enter game");
    }
  };

  return (
    <div>
      <h1>Lobby</h1>
      {
        <ul>
          {games?.map((game) => (
            <li key={game.id}>
              <h2>{game.blindLevel} Big Blinds</h2>
              <p>Players: {game.players?.join(", ")}</p>
              <p>Status: {game.status}</p>maxPlayers
              <p>Max Players: {game.blindLevel}</p>
              <p>blindLevel: {game.minBuyIn}</p>
              <p>id: {game.id}</p>
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
