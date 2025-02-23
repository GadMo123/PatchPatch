import React, { useEffect, useState } from "react";
import "./TableAndSeats.css";
import { useGameContext } from "../../contexts/GameContext";
import { PublicPlayerClientData } from "@patchpatch/shared";
import { useJoinGame } from "../../hooks/CreateSocketAction";
import { useBuyInDialog } from "../../contexts/BuyInContext";

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

      return (
        <div
          key={seatInfo.tableAbsolotePosition}
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

              {showBuyInButton && (
                <button onClick={openBuyInDialog} className="add-chips-button">
                  + Add Chips
                </button>
              )}
            </div>
          ) : (
            !isJoinedGame && (
              <button
                className="join-seat-button"
                onClick={() => {
                  console.log("clicked join game"); // Test if this works first
                  handleJoinGame(seatInfo); // We'll create this function
                }}
              >
                Seat Here
              </button>
            )
          )}
        </div>
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
