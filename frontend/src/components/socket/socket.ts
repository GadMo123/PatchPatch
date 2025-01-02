// src/socket.ts

import { io, Socket } from 'socket.io-client';

// Connect to the server (make sure to use the correct URL)
const socket: Socket = io('http://localhost:5000', {
  transports: ['websocket'], // Use WebSocket transport
  withCredentials: true, // Ensure credentials are passed correctly
});

export default socket;
