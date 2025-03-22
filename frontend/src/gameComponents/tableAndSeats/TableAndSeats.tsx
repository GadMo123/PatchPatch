import React, { useEffect, useState } from "react";
import "./TableAndSeats.css";
import { useGameContext } from "../../contexts/GameContext";
import {
  PublicPlayerClientData,
  ShowdownResultClientData,
} from "@patchpatch/shared";
import { useJoinGame } from "../../hooks/CreateSocketAction";
import { useBuyInDialog } from "../../contexts/BuyInContext";
import PotDisplay from "../../components/common/PotDisplay/PotDisplay";
import { useAnimationTheme } from "../../contexts/AnimationThemeProvider";
import { WinningAnimation } from "../showdown/WinningAnimation";
import { ShowdownHandView } from "../showdown/ShowdownHandView";

export interface TableProps {
  numberOfSeats: 2 | 3 | 6;
  seatsMap: { [index: number]: PublicPlayerClientData };
  isJoinedGame: boolean;
  canBuyIn: boolean;
  showdownState: ShowdownResultClientData | null;
  children?: React.ReactNode;
}

const TableAndSeats: React.FC<TableProps> = ({
  numberOfSeats,
  seatsMap,
  isJoinedGame,
  canBuyIn,
  showdownState,
  children,
}) => {
  const { animationLevel } = useAnimationTheme();
  const [tableSize, setTableSize] = useState({ width: 0, height: 0 });
  const { gameId, playerId } = useGameContext();
  const { sendAction: joinGame } = useJoinGame();
  const { openBuyInDialog } = useBuyInDialog();
  const [showWinningAnimation, setShowWinningAnimation] = useState<{
    [key: string]: boolean;
  }>({});
  const [updatedStacks, setUpdatedStacks] = useState<{ [key: string]: number }>(
    {}
  );

  useEffect(() => {
    const calculateTableSize = () => {
      const screenWidth = window.innerWidth;
      const tableWidth = Math.min(screenWidth * 0.9, 1300);
      const tableHeight = window.innerHeight * 0.43;
      setTableSize({ width: tableWidth, height: tableHeight });
    };

    calculateTableSize();
    window.addEventListener("resize", calculateTableSize);
    return () => window.removeEventListener("resize", calculateTableSize);
  }, []);

  // Handle showdown winner animations
  useEffect(() => {
    if (showdownState && showdownState.winners) {
      const winnerAnimations: { [key: string]: boolean } = {};
      const winnerStacks: { [key: string]: number } = {};

      // Setup animations for each winner
      showdownState.winners.forEach(([winnerId, amount]) => {
        winnerAnimations[winnerId] = amount > 0;

        // Find the player's current stack
        Object.values(seatsMap).forEach((player) => {
          if (player.id === winnerId && player.stack) {
            winnerStacks[winnerId] = player.stack;
          }
        });
      });

      setShowWinningAnimation(winnerAnimations);
      setUpdatedStacks(winnerStacks);

      // Auto-clear animations after timeout
      const timeout = setTimeout(() => {
        setShowWinningAnimation({});
      }, showdownState.animationTime);

      return () => clearTimeout(timeout);
    }
  }, [showdownState, seatsMap]);

  const handleJoinGame = async (seatInfo: PublicPlayerClientData) => {
    try {
      const response = await joinGame({
        gameId: gameId,
        playerId: playerId,
        tableAbsolutePosition: seatInfo.tableAbsolutePosition,
      });

      if (!response.success) {
        console.log(response.message);
      }
    } catch (error) {
      console.error("Error joining game:", error);
    }
  };

  const handleWinningAnimationComplete = (playerId: string, amount: number) => {
    // Update the animation state to stop showing it
    setShowWinningAnimation((prev) => ({
      ...prev,
      [playerId]: false,
    }));

    // Update the displayed stack amount
    setUpdatedStacks((prev) => ({
      ...prev,
      [playerId]: (prev[playerId] || 0) + amount,
    }));
  };

  const renderSeats = () => {
    if (tableSize.width === 0) return null;

    const seatElements = [];
    const ellipseRadiusX = tableSize.width / 2;
    const ellipseRadiusY = tableSize.height / 2;

    const renderSeat = (angle: number, index: number) => {
      const x = ellipseRadiusX * Math.cos(angle);
      const y = ellipseRadiusY * Math.sin(angle);
      const seatInfo = seatsMap[index];

      const isHeroSeat = seatInfo.id === playerId;
      const showBuyInButton = isHeroSeat && canBuyIn;
      const isWinner =
        showdownState &&
        showdownState.winners &&
        seatInfo.id &&
        showdownState.winners.some(([id, _]) => id === seatInfo.id);

      const winAmount =
        isWinner && seatInfo.id
          ? showdownState!.winners.find(([id, _]) => id === seatInfo.id)?.[1] ||
            0
          : 0;

      // Determine positioning for showdown hand display
      // We want to show it outside the table ellipse
      const handPositionFactor = 1.3; // Further out than the seat
      const handX = x * handPositionFactor;
      const handY = y * handPositionFactor;

      const potDistanceRatio = 0.6;
      const potX = x * potDistanceRatio;
      const potY = y * potDistanceRatio;

      return (
        <React.Fragment key={seatInfo.tableAbsolutePosition}>
          <div
            className={`table-seat ${seatInfo.id ? "occupied" : ""} --${animationLevel}`}
            style={{
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
            }}
          >
            {seatInfo.id ? (
              <div className="occupied-seat">
                <div className={`player-name --${animationLevel}`}>
                  {isHeroSeat ? "You" : seatInfo.name}
                </div>
                <div className={`player-stack --${animationLevel}`}>
                  ${Math.round(seatInfo.stack ?? 0)}{" "}
                  {isWinner && showWinningAnimation[seatInfo.id] && (
                    <WinningAnimation
                      amount={winAmount}
                      onComplete={() =>
                        handleWinningAnimationComplete(seatInfo.id!, winAmount)
                      }
                    />
                  )}
                </div>
                <div className={`player-position --${animationLevel}`}>
                  {seatInfo.position}
                </div>
                {showBuyInButton && seatInfo.stack === 0 && (
                  <button
                    onClick={openBuyInDialog}
                    className={`add-chips-button --${animationLevel}`}
                  >
                    + Add Chips
                  </button>
                )}
              </div>
            ) : (
              !isJoinedGame && (
                <button
                  className={`join-seat-button --${animationLevel}`}
                  onClick={() => {
                    console.log("clicked join game");
                    handleJoinGame(seatInfo);
                  }}
                >
                  Seat Here
                </button>
              )
            )}
          </div>

          {/* Showdown hand display for players */}
          {showdownState &&
            seatInfo.id &&
            seatInfo.cards &&
            seatInfo.cards.length > 0 &&
            showdownState.playersHandRank &&
            showdownState.playersHandRank.some(
              ([id, _]) => id === seatInfo.id
            ) && (
              <div
                className="showdown-hand-container"
                style={{
                  position: "absolute",
                  left: `calc(50% + ${handX}px)`,
                  top: `calc(50% + ${handY}px)`,
                  transform: "translate(-50%, -50%)",
                  zIndex: 15,
                }}
              >
                <ShowdownHandView
                  cards={seatInfo.cards}
                  handRank={
                    showdownState.playersHandRank.find(
                      ([id, _]) => id === seatInfo.id
                    )![1]
                  }
                  isHero={isHeroSeat}
                  boardIndex={showdownState.board}
                />
              </div>
            )}

          {seatInfo.id &&
          seatInfo.roundPotContributions &&
          seatInfo.roundPotContributions > 0 ? (
            <div
              className={`player-pot-contribution --${animationLevel}`}
              style={{
                position: "absolute",
                left: `calc(50% + ${potX}px)`,
                top: `calc(50% + ${potY}px)`,
                transform: "translate(-50%, -50%)",
                zIndex: 10,
              }}
            >
              <PotDisplay potSize={seatInfo.roundPotContributions} />
            </div>
          ) : null}
        </React.Fragment>
      );
    };

    const angleIncrement = (2 * Math.PI) / numberOfSeats;
    for (let i = 0; i < numberOfSeats; i++) {
      const angle = Math.PI / 2 + i * angleIncrement;
      seatElements.push(renderSeat(angle, i));
    }

    return seatElements;
  };

  return (
    <div
      className={`table-ellipse  --${animationLevel}`}
      style={{
        width: `${tableSize.width}px`,
        height: `${tableSize.height}px`,
      }}
    >
      {children}
      {renderSeats()}
    </div>
  );
};

export default TableAndSeats;
