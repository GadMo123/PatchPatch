import { useState } from "react";
import "./LeaveGame.css";
import { useNavigate } from "react-router-dom";

interface LeaveGameProps {
  isInHand: boolean;
  exitGame: () => void;
  sitOutNextHand: () => void;
}

const LeaveGame: React.FC<LeaveGameProps> = ({
  isInHand,
  exitGame,
  sitOutNextHand,
}) => {
  const [showDialog, setShowDialog] = useState(false);
  const navigate = useNavigate(); // Hook for navigation

  const handleLeaveClick = () => {
    if (isInHand) {
      // Show confirmation dialog if player is in a hand
      setShowDialog(true);
    } else {
      setShowDialog(false);
      // Directly exit if not in a hand
      handleExitAnyway();
    }
  };

  const handleExitAnyway = async () => {
    await exitGame();
    setShowDialog(false);
    navigate("/lobby");
  };

  const handleCancel = () => {
    setShowDialog(false);
  };

  const handleSitOutNextHand = () => {
    setShowDialog(false);
    sitOutNextHand();
  };

  return (
    <div className="leave-game-container">
      <button
        onClick={handleLeaveClick}
        className="leave-game-button"
        aria-label="Leave Game"
      >
        <span className="exit-icon">✕</span>
      </button>

      {showDialog && (
        <div className="leave-game-overlay">
          <div className="leave-game-dialog">
            <div className="dialog-header">
              <h2 className="dialog-title">You're in the middle of a hand</h2>
              <p className="dialog-description">
                Leaving now might cause you to lose the current hand. Consider
                using "Sit out next hand" instead.
              </p>
            </div>
            <div className="dialog-footer">
              <button className="cancel-button" onClick={handleCancel}>
                Cancel
              </button>
              <button className="sit-out-button" onClick={handleSitOutNextHand}>
                Sit Out Next Hand
              </button>
              <button className="exit-anyway-button" onClick={handleExitAnyway}>
                Leave Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveGame;
