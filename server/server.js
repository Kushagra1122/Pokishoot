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

// Security middleware
const { securityHeaders, requestSizeLimiter, sanitizeInput } = require('./middleware/securityMiddleware');

// Apply security headers
app.use(securityHeaders);

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Request size limit
app.use(requestSizeLimiter('10mb'));

// Body parsing with size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization
app.use(sanitizeInput);

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

// ---------------- Initialize XCM Services ----------------
const xcmService = require('./services/xcmService');
const crossChainNFTService = require('./services/crossChainNFTService');
const crossChainMarketplaceService = require('./services/crossChainMarketplaceService');
const crossChainLeaderboardService = require('./services/crossChainLeaderboardService');

// Initialize cross-chain services (non-blocking)
(async () => {
  try {
    await xcmService.initializeChain('moonbase');
    await xcmService.initializeChain('moonbeam');
    await crossChainNFTService.initialize();
    await crossChainMarketplaceService.initialize();
    await crossChainLeaderboardService.initialize();
    console.log('✅ Cross-chain services initialized');
  } catch (error) {
    console.warn('⚠️  Cross-chain services initialization warning:', error.message);
  }
})();

// ---------------- Routes ----------------
const authRoutes = require('./routes/authRoutes');
const pokemonRoutes = require('./routes/pokemonRoutes');
const lobbyRoutes = require('./routes/lobbyRoutes');
const matchRoutes = require('./routes/matchRoutes');
const dataRoutes = require('./routes/dataRoutes');
const crossChainRoutes = require('./routes/crossChainRoutes');
const authMiddleware = require('./middleware/authMiddleware');

// Organized routes
app.use('/api/auth', authRoutes);
app.use('/api/pokemon', pokemonRoutes);
app.use('/api/lobby', lobbyRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/crosschain', crossChainRoutes);

// Example protected route
app.get('/api/dashboard', authMiddleware, (req, res) => {
  res.json({
    message: `Hello ${req.user.name}, this is a protected dashboard route.`,
  });
});

// Health
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ---------------- Error Handling ----------------
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// ---------------- Start Server ----------------
server.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
  console.log(`🌐 API available at http://localhost:${PORT}`);
  console.log(`📡 Cross-chain endpoints: http://localhost:${PORT}/api/crosschain`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use.`);
    console.error(`💡 Try one of these solutions:`);
    console.error(`   1. Kill the process using port ${PORT}: lsof -ti:${PORT} | xargs kill -9`);
    console.error(`   2. Use a different port: PORT=4001 npm run dev`);
    console.error(`   3. Find and stop the other server instance`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', err);
    process.exit(1);
  }
});

// Export for testing if needed
module.exports = { app, server, lobbyManager, gameManager };
