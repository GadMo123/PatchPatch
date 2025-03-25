import "./ShowdownView.css";
import { useAnimationTheme } from "../../contexts/AnimationThemeProvider";
import { Card } from "@patchpatch/shared";
import CardView from "../../components/common/card/CardView";

export const ShowdownHandView: React.FC<{
  cards: Card[];
  handRank: string;
  isHero?: boolean;
  boardIndex: number;
}> = ({ cards, handRank, boardIndex }) => {
  const { animationLevel } = useAnimationTheme();
  const cardsForBoard = cards.slice(boardIndex * 4, boardIndex * 4 + 4);

  return (
    <div className={`showdown-hand --${animationLevel}`}>
      <div className={`cards-row --${animationLevel}`}>
        {cardsForBoard.map((card, index) => (
          <div
            key={`showdown-card-wrapper-${index}`}
            className={`showdown-card-wrapper --${animationLevel}`}
          >
            <CardView
              card={card}
              className={`showdown-card --${animationLevel}`}
            />
          </div>
        ))}
      </div>
      <div className={`hand-rank --${animationLevel}`}>{handRank}</div>
    </div>
  );
};
