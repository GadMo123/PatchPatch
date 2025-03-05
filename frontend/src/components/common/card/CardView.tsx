import React from "react";
import { Card, Rank, Suit } from "@patchpatch/shared";
import "./CardView.css";
import { useAnimationTheme } from "../../../contexts/AnimationThemeProvider"; // Adjust path as needed

interface CardProps {
  card: Card | { _rank: Rank; _suit: Suit };
  className?: string;
}

const CardView: React.FC<CardProps> = ({ card, className = "" }) => {
  const { animationLevel } = useAnimationTheme();
  const rank = "rank" in card ? card.rank : card._rank;
  const suit = "suit" in card ? card.suit : card._suit;

  const suitSrc = `/suits/${suit}.svg`; // Ensure this points to the updated SVGs
  return (
    <div className={`container ${suit} ${className} --${animationLevel}`}>
      <div className="upper">
        <div className="upper-rank">{rank}</div>
        <img src={suitSrc} alt={suit} className="suit-icon" />
      </div>
      <div className="lower">
        <img src={suitSrc} alt={suit} className="suit-icon" />
        <div className="rank">{rank}</div>
      </div>
    </div>
  );
};

export default CardView;
