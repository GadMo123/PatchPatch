import React, { useEffect, useState } from "react";
import "./TableAndSeats.css";
import { useGameContext } from "../../contexts/GameContext";
import { Position } from "@patchpatch/shared";
import socket from "../../services/socket/Socket";
import { useJoinGame } from "../../hooks/sendJoinGame";

export interface PlayerSeatInfo {
  playerId: string | null;
  name: string | null;
  stack?: number;
  position: Position;
}

export interface TableProps {
  numberOfSeats: 2 | 3 | 6;
  seatsMap: { [index: number]: PlayerSeatInfo };
  currentPlayerPosition?: Position;
}

const TableAndSeats: React.FC<TableProps> = ({
  numberOfSeats,
  seatsMap: seats,
  currentPlayerPosition,
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
      const seatInfo = seats[index];

      return (
        <div
          key={seatInfo.position}
          className="table-seat"
          style={{
            left: `calc(50% + ${x}px)`,
            top: `calc(50% + ${y}px)`,
          }}
        >
          {seatInfo ? (
            <div className="occupied-seat">
              <div className="player-name">
                {seatInfo.playerId === playerId ? "You" : seatInfo.name}
              </div>
              <div className="player-stack">${seatInfo.stack}</div>
            </div>
          ) : (
            currentPlayerPosition === null && (
              <button
                className="join-seat-button"
                onClick={() => sendAction(seatInfo.position)}
              >
                Seat Here
              </button>
            )
          )}
        </div>
      );
    };

    const angleIncrement = (2 * Math.PI) / numberOfSeats;
    for (let i = 1; i < numberOfSeats; i++) {
      const angle = Math.PI / 2 + i * angleIncrement;
      const position = i.toString();
      seatElements.push(renderSeat(angle, position));
    }

    return seatElements;
  };

  return <div className="table-ellipse">{renderSeats()}</div>;
};

export default TableAndSeats;
