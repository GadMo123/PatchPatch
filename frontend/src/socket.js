import io from 'socket.io-client';

// Connect to backend WebSocket server (update URL as needed)
const socket = io('http://localhost:5000'); // Change to backend URL

export default socket;