import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import userRoutes from './routes/users.js';
import adminSetupRoutes from './routes/admin-setup.js';
import websocketService from './services/websocketService.js';

// Load environment variables
dotenv.config();

// Validate critical environment variables
if (!process.env.JWT_SECRET) {
  console.error('❌ CRITICAL: JWT_SECRET environment variable is not set!');
  process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
  console.error('❌ CRITICAL: JWT_SECRET is too short! Must be at least 32 characters.');
  process.exit(1);
}

if (!process.env.MONGODB_URI) {
  console.error('❌ CRITICAL: MONGODB_URI environment variable is not set!');
  process.exit(1);
}

console.log('✅ Environment variables validated');
console.log(`🔐 JWT_SECRET configured (${process.env.JWT_SECRET.substring(0, 8)}...)`);

// Connect to MongoDB
connectDB();

const app = express();
const server = createServer(app);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // Higher limit for development
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});

// Initialize WebSocket service
websocketService.initialize(server);

// Middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false
}));
app.use(limiter);

// CORS configuration to allow multiple origins
const allowedOrigins = [
  'http://localhost:5173',  // Vite dev server
  'http://localhost:4173',  // Vite preview server
  'http://localhost:4174',  // Vite preview server (alternative port)
  'http://localhost:4175',  // Vite preview server (alternative port)
  'http://localhost:3000',  // Alternative dev port
  process.env.FRONTEND_URL,  // Production frontend URL
  // Add common Vercel patterns
  /^https:\/\/.*\.vercel\.app$/,  // Any Vercel deployment
  'https://real-time-task-board-e098iulss-swapsdotdevs-projects.vercel.app', // Specific Vercel URL
].filter(Boolean);

console.log('🔧 CORS Debug - Allowed Origins:', allowedOrigins);
console.log('🔧 CORS Debug - FRONTEND_URL env var:', process.env.FRONTEND_URL);

app.use(cors({
  origin: (origin, callback) => {
    console.log('🔧 CORS Debug - Incoming origin:', origin);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow any localhost port in development
    if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
      return callback(null, true);
    }
    
    // Check against allowed origins (including regex patterns)
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      console.log('✅ CORS Debug - Origin allowed:', origin);
      callback(null, true);
    } else {
      console.log('❌ CORS Debug - Origin rejected:', origin);
      console.log('❌ CORS Debug - Available origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminSetupRoutes);  // One-time admin creation

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    jwtConfigured: !!process.env.JWT_SECRET,
    jwtLength: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0,
    jwtPrefix: process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(0, 8) + '...' : 'Not set',
    mongoConfigured: !!process.env.MONGODB_URI,
    frontendUrl: process.env.FRONTEND_URL || 'Not set',
    corsOrigins: [
      'http://localhost:5173',
      process.env.FRONTEND_URL,
      /^https:\/\/.*\.vercel\.app$/
    ].filter(Boolean).map(origin => 
      origin instanceof RegExp ? origin.toString() : origin
    )
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!' 
      : err.message 
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`� WebSocket server enabled at ws://localhost:${PORT}/ws`);
  console.log(`📈 WebSocket Stats:`, websocketService.getStats());
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  websocketService.close();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export { websocketService };

