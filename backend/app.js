import express from 'express';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import cors from "cors";
import passport from 'passport';
import './config/passport.js';

import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import flash from 'express-flash';

import usersRouter from './routes/userRouter.js';
import authRouter from './routes/authRouter.js';
import placeRouter from './routes/placeRouter.js';
import airoutes from './routes/airoutes.js';
import dotenv from 'dotenv';
dotenv.config();





// Workaround for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5555;

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(passport.initialize());
app.use(
  session({
    resave: false,
    saveUninitialized: false,
    secret: 'highhook',
    cookie: { maxAge: 60000 },
  })
);
app.use(flash()); // Now properly imported

import errorHandler from './middlewares/errorHandler.js';

// ... existing imports ...

// ... existing routes ...

app.use('/users', usersRouter);
app.use('/auth', authRouter);
app.use("/api/places", placeRouter);
app.use("/ai", airoutes);

// Error Handler Middleware (Must be last)
app.use(errorHandler);

// MongoDB Connection

//app.use('/auth', authRouter);

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  // .connect('mongodb://127.0.0.1:27017/tripplanner')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// Default Route
app.get('/', (req, res) => {
  res.send('<h1>WELCOME AI TRIP PLANNER</h1>');
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
