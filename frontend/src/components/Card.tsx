import React from 'react';

interface CardProps {
  card: {
    rank: string;
    suit: string;
  };
}

const Card: React.FC<CardProps> = ({ card }) => {
  let imageName = `${card.rank}${card.suit}.png`;
  console.log("Card received:", card);
  
  return (
    <div className="Card">
      <img
        src={`/assets/cards/${imageName}`}
        alt={`${card.rank} of ${card.suit}`}
        className="CardImage"
      />
    </div>
  );
};

export default Card;
