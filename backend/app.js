import express from 'express';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import passport from 'passport';
import './config/passport.js';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import flash from 'express-flash';
import dotenv from 'dotenv';
dotenv.config();

import usersRouter from './routes/userRouter.js';
import authRouter from './routes/authRouter.js';
import placeRouter from './routes/placeRouter.js';
import airoutes from './routes/airoutes.js';
import creditRouter from './routes/creditRouter.js';
import errorHandler from './middlewares/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5555;
const isProduction = process.env.NODE_ENV === 'production';

// ─── Security Headers (Helmet) ────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow images from CDNs
  contentSecurityPolicy: false, // disable CSP — frontend handles this
}));

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'https://ai-trip-planner.app',
  'https://www.ai-trip-planner.app',
  'http://localhost:5173',
  'http://localhost:3000',
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));       // reject oversized JSON bodies
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

// ─── NoSQL Injection Prevention ───────────────────────────────────────────────
// Strips $ and . from req.body, req.query, req.params
app.use(mongoSanitize());

// ─── HTTP Parameter Pollution Prevention ─────────────────────────────────────
app.use(hpp());

// ─── Session & Passport ───────────────────────────────────────────────────────
app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: process.env.SESSION_SECRET || 'highhook',
  cookie: {
    maxAge: 60000,
    secure: isProduction,
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
  },
}));
app.use(flash());
app.use(passport.initialize());

// ─── Rate Limiters ────────────────────────────────────────────────────────────

// Global limiter — 200 requests per 15 min per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use(globalLimiter);

// Auth limiter — 10 attempts per 15 min (OTP send, login, register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please wait 15 minutes.' },
  skipSuccessfulRequests: true, // only count failed/errored requests
});

// AI generation limiter — 20 requests per hour per IP (expensive operation)
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI generation limit reached. Please try again in an hour.' },
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/auth/sendotp', authLimiter);
app.use('/auth/register', authLimiter);
app.use('/auth/resetpassword', authLimiter);
app.use('/ai', aiLimiter);

app.use('/users', usersRouter);
app.use('/auth', authRouter);
app.use('/api/places', placeRouter);
app.use('/ai', airoutes);
app.use('/credits', creditRouter);

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Trip Planner API is running' });
});

// ─── Error Handler (must be last) ─────────────────────────────────────────────
app.use(errorHandler);

// ─── MongoDB Connection ───────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} [${isProduction ? 'production' : 'development'}]`);
});
