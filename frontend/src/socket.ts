// src/socket.ts

import { io } from 'socket.io-client';

// Connect to the server (make sure to use the correct URL)
const socket = io('http://localhost:5000', {
  transports: ['websocket', 'polling'], // Use websocket first, fallback to polling if necessary
});

socket.on('connect', () => {
  console.log('Connected to server:', socket.id);
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

export default socket;
