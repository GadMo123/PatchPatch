import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../../contexts/SocketContext";
import { useEnterGame, useLobbyStatus } from "../../hooks/CreateSocketAction";
import { useAnimationTheme } from "../../contexts/AnimationThemeProvider";
import {
  GameSpeed,
  GameType,
  LobbyStatusServerResponse,
} from "@patchpatch/shared";
import "./MainLobby.css";

interface MainLobbyProps {
  enterGameView: (gameId: string) => void;
  playerId: string;
}

interface LobbyFilters {
  gameType: GameType;
  hideFullTables: boolean;
  hideEmptyTables: boolean;
  gameSpeed: GameSpeed | "all";
  stakes: "low" | "mid" | "high" | "all";
}

type SortField = "status" | "stakes";
type SortDirection = "asc" | "desc";

const MainLobby: React.FC<MainLobbyProps> = ({ enterGameView, playerId }) => {
  const { animationLevel } = useAnimationTheme();
  const { socket } = useSocket();
  const [games, setGames] = useState<LobbyStatusServerResponse["games"]>([]);
  const [filteredGames, setFilteredGames] = useState<
    LobbyStatusServerResponse["games"]
  >([]);
  const navigate = useNavigate();
  const { sendAction: enterGame } = useEnterGame();
  const { sendAction: getLobbyStatus } = useLobbyStatus();

  const [sortField, setSortField] = useState<SortField>("stakes");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const [filters, setFilters] = useState<LobbyFilters>({
    gameType: GameType.Patch_Patch,
    hideFullTables: false,
    hideEmptyTables: false,
    gameSpeed: "all",
    stakes: "all",
  });

  useEffect(() => {
    if (!socket) return;

    const fetchLobbyStatus = async () => {
      try {
        const response: LobbyStatusServerResponse = await getLobbyStatus();
        if (response.success) {
          setGames(response.games);
        } else {
          alert("Can't connect, try again later");
        }
      } catch (error) {
        console.error("Lobby status fetch error:", error);
        alert("Failed to fetch lobby status");
      }
    };

    fetchLobbyStatus();
    const interval = setInterval(fetchLobbyStatus, 5000);

    return () => clearInterval(interval);
  }, [socket]);

  useEffect(() => {
    let result = [...games];

    result = result.filter((game) => game.gameType === filters.gameType);

    if (filters.hideFullTables) {
      result = result.filter((game) => game.players.length < game.maxPlayers);
    }

    if (filters.hideEmptyTables) {
      result = result.filter((game) => game.players.length > 0);
    }

    if (filters.gameSpeed !== "all") {
      result = result.filter((game) => game.gameSpeed === filters.gameSpeed);
    }

    if (filters.stakes !== "all") {
      result = result.filter((game) => {
        const bbAmount = game.BBAmount;
        switch (filters.stakes) {
          case "low":
            return bbAmount <= 50;
          case "mid":
            return bbAmount > 50 && bbAmount <= 500;
          case "high":
            return bbAmount > 500;
          default:
            return true;
        }
      });
    }

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "stakes":
          comparison = a.BBAmount - b.BBAmount;
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    setFilteredGames(result);
  }, [games, filters, sortField, sortDirection]);

  const handleSortChange = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleEnterGame = async (gameId: string) => {
    if (!playerId || playerId === "unregistered") {
      navigate("/login");
      return;
    }

    try {
      const response = await enterGame({ gameId, playerId });
      if (response.success) {
        enterGameView(gameId);
        navigate(`/game/${gameId}`);
      } else {
        alert(response.message || "Failed to enter game");
      }
    } catch (error) {
      alert("Failed to enter game");
    }
  };

  return (
    <div className={`lobby-container --${animationLevel}`}>
      <div className="lobby-header">
        <div className="game-type-tabs">
          {[GameType.Patch_Patch, GameType.HOLDEM, GameType.OMAHA].map(
            (type) => (
              <button
                key={type}
                className={`tab ${filters.gameType === type ? "active" : ""} ${type !== GameType.Patch_Patch ? "disabled" : ""}`}
                onClick={() =>
                  type === GameType.Patch_Patch
                    ? setFilters((prev) => ({ ...prev, gameType: type }))
                    : null
                }
              >
                {type}
                {type !== GameType.Patch_Patch && (
                  <span className="coming-soon"> - Coming Soon</span>
                )}
              </button>
            )
          )}
        </div>
      </div>

      <div className="lobby-content">
        <div className="games-grid">
          <div className="games-header">
            <div
              className="header-cell sortable"
              onClick={() => handleSortChange("stakes")}
            >
              Stakes{" "}
              {sortField === "stakes" && (sortDirection === "asc" ? "▲" : "▼")}
            </div>
            <div
              className="header-cell sortable"
              onClick={() => handleSortChange("status")}
            >
              Status{" "}
              {sortField === "status" && (sortDirection === "asc" ? "▲" : "▼")}
            </div>
            <div className="header-cell">Players</div>
            <div className="header-cell">Action</div>
          </div>
          {filteredGames.map((game) => (
            <div key={game.id} className="game-row">
              <div className="game-cell">{game.stakes}</div>
              <div className="game-cell">{game.status}</div>
              <div className="game-cell">
                {game.players.length}/{game.maxPlayers}
              </div>
              <button
                className={`enter-game-btn --${animationLevel}`}
                onClick={() => handleEnterGame(game.id)}
              >
                Enter Game
              </button>
            </div>
          ))}
        </div>

        <div className="filters-sidebar">
          <div className="filter-section">
            <h3>Table Filters</h3>
            <label>
              <input
                type="checkbox"
                checked={filters.hideFullTables}
                onChange={() =>
                  setFilters((prev) => ({
                    ...prev,
                    hideFullTables: !prev.hideFullTables,
                  }))
                }
              />
              Hide Full Tables
            </label>
            <label>
              <input
                type="checkbox"
                checked={filters.hideEmptyTables}
                onChange={() =>
                  setFilters((prev) => ({
                    ...prev,
                    hideEmptyTables: !prev.hideEmptyTables,
                  }))
                }
              />
              Hide Empty Tables
            </label>
          </div>

          <div className="filter-section">
            <h3>Game Speed</h3>
            {["all", "slow", "normal", "fast"].map((speed) => (
              <label key={speed}>
                <input
                  type="radio"
                  name="gameSpeed"
                  checked={filters.gameSpeed === speed}
                  onChange={() =>
                    setFilters((prev) => ({
                      ...prev,
                      gameSpeed: speed as GameSpeed,
                    }))
                  }
                />
                {speed}
              </label>
            ))}
          </div>

          <div className="filter-section">
            <h3>Stakes</h3>
            {["all", "low", "mid", "high"].map((stake) => (
              <label key={stake}>
                <input
                  type="radio"
                  name="stakes"
                  checked={filters.stakes === stake}
                  onChange={() =>
                    setFilters((prev) => ({ ...prev, stakes: stake as any }))
                  }
                />
                {stake === "all" ? "All Stakes" : stake}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainLobby;
