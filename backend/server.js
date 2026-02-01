const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const { connectMongo } = require('./config/database');

// Routes
const urlRoutes = require('./routes/urls');
const redirectRoutes = require('./routes/redirect');
const analyticsRoutes = require('./routes/analytics');

// Middleware
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: config.frontendUrl || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Connect to Database
connectMongo();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory room state storage
const roomStates = new Map();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// API Routes
app.use('/api/urls', apiLimiter, urlRoutes);
app.use('/api/analytics', analyticsRoutes);

// Redirection Route (Static redirection - should be last)
app.use('/', redirectRoutes);

// Socket.io logic
io.on('connection', (socket) => {
  console.log('[Socket] User connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`[Socket] User ${socket.id} joined room: ${roomId}`);
    // Notify others in the room
    socket.to(roomId).emit('user-joined', { userId: socket.id });
  });

  // Chat logic
  socket.on('send-message', (data) => {
    const { roomId, message, user } = data;
    console.log(`[Socket] Message from ${user} in room ${roomId}: ${message}`);
    io.to(roomId).emit('receive-message', {
      user,
      message,
      timestamp: new Date().toISOString(),
    });
  });

  // Video Sync logic
  socket.on('video-state-change', (data) => {
    const { roomId, state, timestamp } = data;
    console.log(`[Socket] Video state change in ${roomId}: ${state} at ${timestamp}`);

    // Save state
    roomStates.set(roomId, { state, timestamp, lastUpdate: Date.now() });

    // Broadcast to others in the same room
    socket.to(roomId).emit('video-state-update', { state, timestamp });
  });

  socket.on('request-room-state', ({ roomId }) => {
    const state = roomStates.get(roomId);
    if (state) {
      console.log(`[Socket] Sending room state to new user in ${roomId}`);
      // Estimate current timestamp if it was playing
      let currentTimestamp = state.timestamp;
      if (state.state === 'playing') {
        const elapsed = (Date.now() - state.lastUpdate) / 1000;
        currentTimestamp += elapsed;
      }
      socket.emit('room-state-response', { ...state, timestamp: currentTimestamp });
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`[Socket] User disconnected: ${socket.id} (Reason: ${reason})`);
  });
});

const PORT = config.port || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Syncvia API running at http://localhost:${PORT}`);
});
