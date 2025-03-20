import { Card } from "@patchpatch/shared";
import { useAnimationTheme } from "../../contexts/AnimationThemeProvider";
import CardView from "../../components/common/card/CardView";
import "./ShowdownView.css";

// Enhanced BoardCards component with showdown highlighting
export const EnhancedBoardCards: React.FC<{
  boards: Card[][];
  showdownState: any;
}> = ({ boards, showdownState }) => {
  const { animationLevel } = useAnimationTheme();
  const highlightedBoard = showdownState ? showdownState.board : null;

  return (
    <div className={`enhanced-boards --${animationLevel}`}>
      {boards.map((board, boardIndex) => (
        <div
          key={`board-${boardIndex}`}
          className={`board-section ${
            highlightedBoard === boardIndex ? "showdown-highlighted" : ""
          } --${animationLevel}`}
          style={{
            transform:
              highlightedBoard === boardIndex ? "scale(1.15)" : "scale(1)",
            zIndex: highlightedBoard === boardIndex ? 10 : 1,
            transition: "all 0.5s ease-in-out",
          }}
        >
          <div className={`board --${animationLevel}`}>
            {board.map(
              (card, cardIndex) =>
                card && (
                  <CardView
                    key={`board-${boardIndex}-card-${cardIndex}`}
                    card={card}
                    className="card board-card"
                  />
                )
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
