// src/Socket.ts
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';
// process.env.NODE_ENV === 'production'
//   ? 'http://your-production-url'
//   : 'http://localhost:5000';

const socket: Socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'], // Allow fallback to polling
  withCredentials: true,
  autoConnect: true, // Automatically connect on initialization
  reconnection: true, // Enable reconnection
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Add error handling
socket.on('connect_error', error => {
  console.error('Socket connection error:', error);
});

socket.on('connect', () => {
  console.log('Socket connected successfully');
});

export default socket;
