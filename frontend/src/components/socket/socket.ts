// src/socket.ts

import { io, Socket } from 'socket.io-client';

// Connect to the server (make sure to use the correct URL)
const socket: Socket = io('http://localhost:5000', {
  transports: ['websocket'], // Use WebSocket transport
  withCredentials: true, // Ensure credentials are passed correctly
});

socket.on('connect', () => {
  console.log('Connected to server:', socket.id);
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

export default socket;
