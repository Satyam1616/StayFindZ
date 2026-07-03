/**
 * StayFinder API Server — Entry Point
 * Express.js server with REST API for property rental platform
 */

require('dotenv').config();

// ─── Secrets Management: Validate required environment variables ─────────────
const REQUIRED_ENV_VARS = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`\n❌ Missing required environment variables: ${missing.join(', ')}`);
  console.error(`   Copy .env.example to .env and fill in the values.\n`);
  process.exit(1);
}

// Validate production secrets — block deployment with insecure/missing values
if (process.env.NODE_ENV === 'production') {
  if (process.env.JWT_ACCESS_SECRET.includes('dev-')) {
    console.error('❌ FATAL: Using development JWT secrets in production!');
    process.exit(1);
  }
  if (process.env.DATABASE_URL.includes('user:password')) {
    console.error('❌ FATAL: DATABASE_URL appears to be a placeholder.');
    process.exit(1);
  }
  // Warn about optional services (app works without them in demo mode)
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('⚠️  Stripe not configured — payments will run in demo mode');
  }
}
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { PrismaClient } = require('./prisma/generated/client');

// Route imports
const authRoutes = require('./routes/auth');
const listingRoutes = require('./routes/listings');
const bookingRoutes = require('./routes/bookings');
const reviewRoutes = require('./routes/reviews');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('./routes/uploads');
const paymentRoutes = require('./routes/payments');

// Middleware imports
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { logger, requestLogger } = require('./utils/logger');
const { initSentry, sentryErrorHandler } = require('./utils/sentry');

// Initialize Prisma
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Initialize Express
const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Sentry (must be before routes)
initSentry(app);

// ─── Global Middleware ───────────────────────────────────────────────────────

// Security headers with CSP tuned for Unsplash, Google Fonts, Stripe
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://js.stripe.com", "https://accounts.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://images.unsplash.com", "https://res.cloudinary.com", "https://*.googleusercontent.com"],
      connectSrc: ["'self'", "https://api.stripe.com", "https://*.sentry.io"],
      frameSrc: ["https://js.stripe.com", "https://hooks.stripe.com", "https://accounts.google.com"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow loading cross-origin images
}));

// CORS configuration
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',');
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    // Allow any localhost origin in development
    if (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Global rate limiting — 100 requests per minute per IP
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many requests. Please slow down and try again in a minute.',
  },
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Cookie parsing
app.use(cookieParser());

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}
app.use(requestLogger);

// Attach Prisma to request for use in controllers
app.use((req, _res, next) => {
  req.prisma = prisma;
  next();
});

// ─── Health Check ────────────────────────────────────────────────────────────

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRawUnsafe('SELECT 1');
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message,
    });
  }
});

// ─── API Routes ──────────────────────────────────────────────────────────────

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/listings', listingRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/uploads', uploadRoutes);
app.use('/api/v1/payments', paymentRoutes);

// ─── Error Handling ──────────────────────────────────────────────────────────

app.use(notFoundHandler);
app.use(sentryErrorHandler()); // Send errors to Sentry before responding
app.use(errorHandler);

// ─── Server Start ────────────────────────────────────────────────────────────

const server = app.listen(PORT, () => {
  logger.info(`StayFinder API Server running on port ${PORT}`, { env: process.env.NODE_ENV || 'development' });
  console.log(`\n🏠 StayFinder API Server running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health check: http://localhost:${PORT}/health\n`);
});

// Graceful shutdown
const shutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  await prisma.$disconnect();
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

module.exports = { app, prisma };
