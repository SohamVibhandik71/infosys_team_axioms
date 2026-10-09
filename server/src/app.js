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
const allowedOrigins = env.CLIENT_URL 
  ? env.CLIENT_URL.split(',').map(u => u.trim().replace(/\/$/, '')) 
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server or non-browser requests
    if (!origin) return callback(null, true);
    
    // Check if origin matches allowed list or is a Render deployment
    if (
      allowedOrigins.includes('*') ||
      allowedOrigins.includes(origin) ||
      origin.endsWith('.onrender.com') ||
      origin.includes('localhost')
    ) {
      return callback(null, true);
    }
    
    callback(null, true);
  },
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