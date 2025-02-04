import React from "react";
import CardView from "../../../components/common/card/CardView";
import { Card } from "@patchpatch/shared";

interface OpponentCardsProps {
  opponents: {
    id: string;
    name: string;
    cards: { rank: string; suit: string }[];
    position: string;
  }[];
}

const OpponentCards: React.FC<OpponentCardsProps> = ({ opponents }) => {
  return (
    <>
      {opponents.map((opponent, index) => (
        <div key={`opponent-${index}`} className="opponent-section">
          <div className="player-name">{opponent.name || "Villain"}</div>
          <div className="opponent-cards">
            {opponent.cards?.map((card, cardIndex) => (
              <CardView
                key={`opponent-${index}-card-${cardIndex}`}
                card={card as Card}
                className="card"
              />
            )) ||
              Array(12)
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
