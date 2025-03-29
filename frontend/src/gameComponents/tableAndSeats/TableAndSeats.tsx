import React, { useEffect, useRef, useState } from "react";
import "./TableAndSeats.css";
import { useGameContext } from "../../contexts/GameContext";
import {
  NoShowdownResultClientData,
  PublicPlayerClientData,
  ShowdownResultClientData,
} from "@patchpatch/shared";
import { useJoinGame } from "../../hooks/CreateSocketAction";
import { useBuyInDialog } from "../../contexts/BuyInContext";
import PotDisplay from "../../components/common/PotDisplay/PotDisplay";
import { useAnimationTheme } from "../../contexts/AnimationThemeProvider";
import { ShowdownHandView } from "../showdown/ShowdownHandView";
import WinningAnimation from "../showdown/WinningAnimation";

export interface TableProps {
  numberOfSeats: 2 | 3 | 6;
  seatsMap: { [index: number]: PublicPlayerClientData };
  isJoinedGame: boolean;
  canBuyIn: boolean;
  showdownState: ShowdownResultClientData | null;
  noShowdownState: NoShowdownResultClientData | null;
  children?: React.ReactNode;
}

const TableAndSeats: React.FC<TableProps> = ({
  numberOfSeats,
  seatsMap,
  isJoinedGame,
  canBuyIn,
  showdownState,
  noShowdownState,
  children,
}) => {
  const { animationLevel } = useAnimationTheme();
  const [tableSize, setTableSize] = useState({ width: 0, height: 0 });
  const { gameId, playerId } = useGameContext();
  const { sendAction: joinGame } = useJoinGame();
  const { openBuyInDialog } = useBuyInDialog();
  const [showWinningAnimation, setShowWinningAnimation] = useState<{
    [key: string]: number; // playerID => amount won
  }>({});
  const [animationTime, setAnimationTime] = useState<number>(0);

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

  useEffect(() => {
    const winnerAnimations: { [key: string]: number } = {};
    let animationTimeout = 0;
    if (showdownState && showdownState.winners) {
      // Handle showdown winners
      showdownState.winners.forEach(([winnerId, amount]) => {
        winnerAnimations[winnerId] = amount;
        animationTimeout = showdownState.animationTime;
      });
    }

    // Handle no-showdown winner
    else if (noShowdownState && noShowdownState.winnerId) {
      winnerAnimations[noShowdownState.winnerId] = noShowdownState.potAmount;
      animationTimeout = noShowdownState.animationTime;
    }

    //set anination
    if (animationTimeout > 0) {
      setAnimationTime(animationTimeout);
      setShowWinningAnimation(winnerAnimations);
    } else {
      setShowWinningAnimation({});
    }
  }, [showdownState, noShowdownState]);

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

  const handleWinningAnimationComplete = (
    __playerId: string,
    __amount: number
  ) => {
    setShowWinningAnimation({});
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
      const isWinner = seatInfo.id && showWinningAnimation[seatInfo.id] > 0;
      const winAmount =
        isWinner && seatInfo.id ? showWinningAnimation[seatInfo.id] : 0;

      const handPositionFactor = 1.1; // Reduced to bring cards closer to the seat
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
                      animationTime={animationTime}
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

          {showdownState &&
            seatInfo.id &&
            seatInfo.cards &&
            seatInfo.cards.length > 0 &&
            !isHeroSeat &&
            showdownState.playersHandRank &&
            showdownState.playersHandRank.some(
              ([id, _]) => id === seatInfo.id
            ) && (
              <div
                className="showdown-hand-container"
                style={{
                  position: "absolute",
                  left: `calc(50% + ${handX + 80}px)`, // Move 80px to the right
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
      className={`table-ellipse --${animationLevel}`}
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
