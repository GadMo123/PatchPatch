import React, { useEffect, useState } from "react";
import "./TableAndSeats.css";
import { useGameContext } from "../../contexts/GameContext";
import { Position, PublicPlayerClientData } from "@patchpatch/shared";
import socket from "../../services/socket/Socket";
import { useJoinGame } from "../../hooks/sendJoinGame";

export interface TableProps {
  numberOfSeats: 2 | 3 | 6;
  seatsMap: { [index: number]: PublicPlayerClientData };
  isJoinedGame: boolean;
}

// Displaying the table and seats with player's info for each seat, keeps hero centered at bottom-center seat, allows player to join empty seats.
const TableAndSeats: React.FC<TableProps> = ({
  numberOfSeats,
  seatsMap,
  isJoinedGame: isJoinedGame,
}) => {
  const [tableSize, setTableSize] = useState({ width: 0, height: 0 });
  const { gameId, playerId } = useGameContext();
  const { sendAction } = useJoinGame(gameId, playerId, socket);

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

  const renderSeats = () => {
    if (tableSize.width === 0) return null;

    const seatElements = [];
    const ellipseRadiusX = tableSize.width / 2;
    const ellipseRadiusY = tableSize.height / 2;

    const renderSeat = (angle: number, index: number) => {
      const x = ellipseRadiusX * Math.cos(angle);
      const y = ellipseRadiusY * Math.sin(angle);
      const seatInfo = seatsMap[index];

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
                {seatInfo.id === playerId ? "You" : seatInfo.name}
              </div>
              <div className="player-stack">${seatInfo.stack}</div>
              <div className="player-position">${seatInfo.position}</div>
            </div>
          ) : (
            !isJoinedGame && (
              <button
                className="join-seat-button"
                onClick={() => sendAction(seatInfo.tableAbsolotePosition)}
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
