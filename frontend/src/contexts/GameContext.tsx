import React, { createContext, useContext, ReactNode } from 'react';

export interface GameContextType {
  playerId: string;
  gameId: string;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameContextProvider: React.FC<{
  playerId: string;
  gameId: string;
  children: ReactNode;
}> = ({ playerId, gameId, children }) => {
  return (
    <GameContext.Provider value={{ playerId, gameId }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
};
