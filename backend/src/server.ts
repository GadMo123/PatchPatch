import express, { Request, Response } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { generateDeck } from './gameUtils/Deck';


const app = express();
const server = http.createServer(app);

// Initialize socket.io with the server, properly handling CORS
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Ensure this matches your client-side URL
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('create-game', (callback: (id: string) => void) => {
    const gameId = `game-${Date.now()}`;
    callback(gameId);
  });

  socket.on('join-game', (gameId: string, callback: (state: any) => void) => {
    console.log(`User joined game ${gameId}`);
    callback({ gameId, state: 'waiting' });
  });

  socket.on('start-game', (gameId: string) => {
    console.log('joined');
    const deck = generateDeck();
    const flops = [deck.slice(0, 3), deck.slice(3, 6), deck.slice(6, 9)];

    const gameState = {
      flops, // 3 poker flops
      status: 'started',
    };

    // Emit the game state to all clients in the game
    io.emit('game-state', gameState);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
