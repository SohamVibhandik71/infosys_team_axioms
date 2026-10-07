import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import meetingRoutes from './routes/meetingRoutes.js';
import actionRoutes from './routes/actionRoutes.js';
import decisionRoutes from './routes/decisionRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import dependencyRoutes from './routes/dependencyRoutes.js';

const app = express();

// Security & CORS Middleware
app.use(cors({
  origin: env.CLIENT_URL || '*',
  credentials: true
}));

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/actions', actionRoutes);
app.use('/api/decisions', decisionRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/dependencies', dependencyRoutes);

// Catch 404 & Unhandled Errors
app.use(notFoundHandler);
app.use(errorHandler);

export default app;