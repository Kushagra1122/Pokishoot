const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/auth-demo';

console.log(`📍 API running on port ${PORT}`);

// ---------------- MongoDB ----------------
mongoose
  .connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Mongo connection error:', err));

// ---------------- Create single Socket.io instance ----------------
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

console.log('🔌 Socket.io server initialized');

// ---------------- Game Manager ----------------
const GameManager = require('./managers/gameManager');
const gameManager = new GameManager(io);

// ---------------- Lobby Manager ----------------
const LobbyManager = require('./managers/lobbyManager');
const lobbyManager = new LobbyManager(io, gameManager);

// Make managers available to routes via app context
app.set('lobbyManager', lobbyManager);
app.set('gameManager', gameManager);

// ---------------- Routes ----------------
const authRoutes = require('./routes/authRoutes');
const pokemonRoutes = require('./routes/pokemonRoutes');
const lobbyRoutes = require('./routes/lobbyRoutes');
const matchRoutes = require('./routes/matchRoutes');
const authMiddleware = require('./middleware/authMiddleware');

// Organized routes
app.use('/api/auth', authRoutes);
app.use('/api/pokemon', pokemonRoutes);
app.use('/api/lobby', lobbyRoutes);
app.use('/api/matches', matchRoutes);

// Example protected route
app.get('/api/dashboard', authMiddleware, (req, res) => {
  res.json({
    message: `Hello ${req.user.name}, this is a protected dashboard route.`,
  });
});

// Health
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ---------------- Start Server ----------------
server.listen(PORT, () => console.log(`Server listening on ${PORT}`));

// Export for testing if needed
module.exports = { app, server, lobbyManager, gameManager };
