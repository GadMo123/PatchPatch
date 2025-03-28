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
    <div className={`villain-showdown-hand --${animationLevel}`}>
      <div className={`showdown-cards-row --${animationLevel}`}>
        {cardsForBoard.map((card, index) => (
          <div
            key={`showdown-cards-row-wrapper-${index}`}
            className={`showdown-cards-row-wrapper --${animationLevel}`}
          >
            <CardView
              card={card}
              className={`villain-showdown-card --${animationLevel}`}
              isSmall={true}
            />
          </div>
        ))}
      </div>
      <div className={`hand-rank --${animationLevel}`}>{handRank}</div>
    </div>
  );
};
