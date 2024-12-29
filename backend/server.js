const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();

// Enable CORS for the backend (HTTP requests)
app.use(cors());

// Create HTTP server
const server = http.createServer(app);

// Configure Socket.IO with CORS options
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000', // Allow requests from the frontend app running at localhost:3000
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true
  }
});

// Define socket event handlers
io.on('connection', (socket) => {
  console.log('A user connected');
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

const port = 5000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
