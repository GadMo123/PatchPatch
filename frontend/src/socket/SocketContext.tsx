import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import socket from './Socket';

interface SocketContextType {
  socket: typeof socket | null;
}

interface SocketProviderProps {
  children: ReactNode;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  useEffect(() => {
    // Handle reconnection attempts
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('reconnect', attemptNumber => {
      console.log(`Reconnected on attempt ${attemptNumber}`);
      // Optionally trigger events here, like re-fetching game status, player status, etc.
    });

    socket.on('reconnect_error', error => {
      console.error('Reconnection error:', error);
    });

    // Cleanup on unmount
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('reconnect');
      socket.off('reconnect_error');
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
