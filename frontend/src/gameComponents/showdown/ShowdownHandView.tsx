import "./ShowdownView.css";
import { useAnimationTheme } from "../../contexts/AnimationThemeProvider";
import { Card } from "@patchpatch/shared";
import CardView from "../../components/common/card/CardView";
import { useEffect, useState } from "react";

// Component to display a player's showdown hand and rank
export const ShowdownHandView: React.FC<{
  cards: Card[];
  handRank: string;
  isHero?: boolean;
  boardIndex: number;
}> = ({ cards, handRank, isHero = false, boardIndex }) => {
  const { animationLevel } = useAnimationTheme();
  const cardsForBoard = cards.slice(boardIndex * 4, boardIndex * 4 + 4);

  return (
    <div
      className={`showdown-hand ${isHero ? "hero-hand" : ""} --${animationLevel}`}
    >
      <div className="cards-container">
        {cardsForBoard.map((card, index) => (
          <CardView
            key={`showdown-card-${index}`}
            card={card}
            className={`showdown-card --${animationLevel}`}
          />
        ))}
      </div>
      <div className={`hand-rank --${animationLevel}`}>{handRank}</div>
    </div>
  );
};
