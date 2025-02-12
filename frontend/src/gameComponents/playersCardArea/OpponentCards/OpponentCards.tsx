import React from "react";
import CardView from "../../../components/common/card/CardView";
import { Card } from "@patchpatch/shared";

interface OpponentCardsProps {
  opponents: {
    id: string;
    name: string;
    cards: Card[];
    position: string;
  }[];
}

// Showing the opponent cards area, default is card-back during the game phases until the showdown where the actual cards revealed
const OpponentCards: React.FC<OpponentCardsProps> = ({ opponents }) => {
  return (
    <>
      {opponents.map((opponent, index) => (
        <div key={`opponent-${opponent.id}`} className="opponent-section">
          <div className="player-name">{opponent.name}</div>
          <div className="opponent-cards">
            {opponent.cards?.length > 0
              ? opponent.cards.map((card, cardIndex) => (
                  <CardView
                    key={`opponent-${opponent.id}-card-${cardIndex}`}
                    card={card}
                    className="card"
                  />
                ))
              : Array(12)
                  .fill(null)
                  .map((_, i) => (
                    <div
                      key={`hidden-card-${i}`}
                      className="card card-back"
                      style={{
                        backgroundImage: 'url("/assets/cards/back.png")',
                      }}
                    />
                  ))}
          </div>
        </div>
      ))}
    </>
  );
};

export default OpponentCards;
