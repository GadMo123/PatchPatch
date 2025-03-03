import React, { useEffect, useState } from "react";
import "./TableAndSeats.css";
import { useGameContext } from "../../contexts/GameContext";
import { PublicPlayerClientData } from "@patchpatch/shared";
import { useJoinGame } from "../../hooks/CreateSocketAction";
import { useBuyInDialog } from "../../contexts/BuyInContext";
import PotDisplay from "../../components/common/PotDisplay/PotDisplay";

export interface TableProps {
  numberOfSeats: 2 | 3 | 6;
  seatsMap: { [index: number]: PublicPlayerClientData };
  isJoinedGame: boolean;
  canBuyIn: boolean;
}

// Displaying the table and seats with player's info for each seat, keeps hero centered at bottom-center seat, allows player to join empty seats.
const TableAndSeats: React.FC<TableProps> = ({
  numberOfSeats,
  seatsMap,
  isJoinedGame,
  canBuyIn,
}) => {
  const [tableSize, setTableSize] = useState({ width: 0, height: 0 });
  const { gameId, playerId } = useGameContext();
  const { sendAction: joinGame } = useJoinGame();
  const { openBuyInDialog } = useBuyInDialog();

  useEffect(() => {
    const calculateTableSize = () => {
      const screenWidth = window.innerWidth;
      const tableWidth = Math.min(screenWidth * 0.9, 1300);
      const tableHeight = window.innerHeight * 0.43; // Matches bottom: 45% in CSS
      setTableSize({ width: tableWidth, height: tableHeight });
    };

    calculateTableSize();
    window.addEventListener("resize", calculateTableSize);
    return () => window.removeEventListener("resize", calculateTableSize);
  }, []);

  const handleJoinGame = async (seatInfo: PublicPlayerClientData) => {
    try {
      const response = await joinGame({
        gameId: gameId,
        playerId: playerId,
        tableAbsolutePosition: seatInfo.tableAbsolotePosition,
      });

      if (!response.success) {
        console.log(response.message);
      }
    } catch (error) {
      console.error("Error joining game:", error);
    }
  };

  const renderSeats = () => {
    if (tableSize.width === 0) return null;

    const seatElements = [];
    const ellipseRadiusX = tableSize.width / 2;
    const ellipseRadiusY = tableSize.height / 2;

    const renderSeat = (angle: number, index: number) => {
      const x = ellipseRadiusX * Math.cos(angle);
      const y = ellipseRadiusY * Math.sin(angle);
      const seatInfo = seatsMap[index];

      const isHeroSeat = seatInfo.id === playerId;
      const showBuyInButton = isHeroSeat && canBuyIn;

      // Calculate pot position (closer to the center of the table)
      const potDistanceRatio = 0.6; // How far from the seat toward the center (0.6 means 60% of the way to the center)
      const potX = x * potDistanceRatio;
      const potY = y * potDistanceRatio;

      return (
        <React.Fragment key={seatInfo.tableAbsolotePosition}>
          <div
            className="table-seat"
            style={{
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
            }}
          >
            {seatInfo.id ? (
              <div className="occupied-seat">
                <div className="player-name">
                  {isHeroSeat ? "You" : seatInfo.name}
                </div>
                <div className="player-stack">${seatInfo.stack}</div>
                <div className="player-position">${seatInfo.position}</div>

                {showBuyInButton && seatInfo.stack === 0 && (
                  <button
                    onClick={openBuyInDialog}
                    className="add-chips-button"
                  >
                    + Add Chips
                  </button>
                )}
              </div>
            ) : (
              !isJoinedGame && (
                <button
                  className="join-seat-button"
                  onClick={() => {
                    console.log("clicked join game");
                    handleJoinGame(seatInfo);
                  }}
                >
                  Seat Here
                </button>
              )
            )}
          </div>

          {/* Player's betting round pot contribution display */}
          {seatInfo.id &&
            seatInfo.roundPotContributions &&
            seatInfo.roundPotContributions > 0 && (
              <div
                className="player-pot-contribution"
                style={{
                  position: "absolute",
                  left: `calc(50% + ${potX}px)`,
                  top: `calc(50% + ${potY}px)`,
                  transform: "translate(-50%, -50%)",
                  zIndex: 10,
                }}
              >
                <PotDisplay potSize={seatInfo.roundPotContributions} />
              </div>
            )}
        </React.Fragment>
      );
    };

    const angleIncrement = (2 * Math.PI) / numberOfSeats;
    for (let i = 0; i < numberOfSeats; i++) {
      const angle = Math.PI / 2 + i * angleIncrement;
      seatElements.push(renderSeat(angle, i));
    }

    return seatElements;
  };

  return <div className="table-ellipse">{renderSeats()}</div>;
};

export default TableAndSeats;
