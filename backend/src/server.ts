import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

import { PrismaClient } from '@prisma/client';
import { errorHandler } from './v1/middleware/errorHandler';

// V1 API Routes
import authV1Routes from './v1/routes/auth';
import mentorV1Routes from './v1/routes/mentors';
import bookingV1Routes from './v1/routes/bookings';
import paymentV1Routes from './v1/routes/payments';
import reviewV1Routes from './v1/routes/reviews';
import leaderboardV1Routes from './v1/routes/leaderboard';
import adminV1Routes from './v1/routes/admin';
import studentV1Routes from './v1/routes/students';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Initialize Prisma Client
export const prisma = new PrismaClient();

// In-memory slot locking system
export const slotLocks = new Map<string, { expiresAt: number }>();

// Clean expired locks every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, lock] of slotLocks.entries()) {
    if (lock.expiresAt < now) {
      slotLocks.delete(key);
    }
  }
}, 60000);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again later.' },
});

// Middleware
app.use(limiter);
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0' 
  });
});

// API V1 Routes
app.use('/api/v1/auth', authV1Routes);
app.use('/api/v1/mentors', mentorV1Routes);
app.use('/api/v1/bookings', bookingV1Routes);
app.use('/api/v1/payments', paymentV1Routes);
app.use('/api/v1/reviews', reviewV1Routes);
app.use('/api/v1/leaderboard', leaderboardV1Routes);
app.use('/api/v1/admin', adminV1Routes);
app.use('/api/v1/students', studentV1Routes);

// API Info endpoint
app.get('/api/v1', (req, res) => {
  res.json({
    name: 'EdVisor API',
    version: '1.0.0',
    description: 'Expert mentorship platform API',
    endpoints: {
      auth: '/api/v1/auth',
      mentors: '/api/v1/mentors',
      bookings: '/api/v1/bookings',
      payments: '/api/v1/payments',
      reviews: '/api/v1/reviews',
      leaderboard: '/api/v1/leaderboard',
      students: '/api/v1/students',
      admin: '/api/v1/admin'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('Connected to database');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();