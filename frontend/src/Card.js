import React from 'react';

function Card({ card }) {
  return (
    <div className="Card">
      {card.rank} of {card.suit}
    </div>
  );
}

export default Card;
