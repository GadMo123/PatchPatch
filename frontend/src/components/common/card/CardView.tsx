import React from "react";
import { Card, Rank, Suit } from "@patchpatch/shared";
import "./CardView.css";
import { useAnimationTheme } from "../../../contexts/AnimationThemeProvider";

interface CardProps {
  card: Card | { _rank: Rank; _suit: Suit } | undefined;
  className?: string;
  isSmall?: boolean;
}

const CardView: React.FC<CardProps> = ({
  card,
  className = "",
  isSmall = false,
}) => {
  const { animationLevel } = useAnimationTheme();

  // Add null check here
  if (!card) {
    return (
      <div className={`container empty ${className} --${animationLevel}`}></div>
    );
  }

  const rank = "rank" in card ? card.rank : card._rank;
  const suit = "suit" in card ? card.suit : card._suit;

  const suitSrc = `/suits/${suit}.svg`;
  return (
    <div className={`container ${suit} ${className} --${animationLevel}`}>
      <div className="upper-rank">{rank}</div>
      <div className={`suit-icon ${isSmall ? "small" : ""}`}>
        <img src={suitSrc} alt={suit} />
      </div>
      {!isSmall && <div className="lower-rank">{rank}</div>}
    </div>
  );
};

export default CardView;
