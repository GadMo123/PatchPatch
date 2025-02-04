import React, { useEffect, useState } from 'react';
import './TableAndSeats.css';

export interface TableProps {
  numberOfSeats: 2 | 3 | 6;
  isPlayerSeated: boolean;
}

const TableAndSeats: React.FC<TableProps> = ({
  numberOfSeats,
  isPlayerSeated,
}) => {
  const [tableSize, setTableSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const calculateTableSize = () => {
      const screenWidth = window.innerWidth;
      const tableWidth = Math.min(screenWidth * 0.9, 1300);
      const tableHeight = window.innerHeight * 0.43; // Matches bottom: 45% in CSS
      setTableSize({ width: tableWidth, height: tableHeight });
    };

    calculateTableSize();
    window.addEventListener('resize', calculateTableSize);
    return () => window.removeEventListener('resize', calculateTableSize);
  }, []);

  const renderSeats = () => {
    if (tableSize.width === 0) return null;

    const seats = [];
    const ellipseRadiusX = tableSize.width / 2;
    const ellipseRadiusY = tableSize.height / 2;

    const renderSeat = (angle: number, index: number) => {
      const x = ellipseRadiusX * Math.cos(angle);
      const y = ellipseRadiusY * Math.sin(angle);

      return (
        <div
          key={index}
          className="table-seat"
          style={{
            left: `calc(50% + ${x}px)`,
            top: `calc(50% + ${y}px)`,
          }}
        >
          {isPlayerSeated && index === 0 ? 'You' : `Seat ${index + 1}`}
        </div>
      );
    };

    seats.push(renderSeat(Math.PI / 2, 0));

    const angleIncrement = (2 * Math.PI) / numberOfSeats;
    for (let i = 1; i < numberOfSeats; i++) {
      const angle = Math.PI / 2 + i * angleIncrement;
      seats.push(renderSeat(angle, i));
    }

    return seats;
  };

  return <div className="table-ellipse">{renderSeats()}</div>;
};

export default TableAndSeats;
