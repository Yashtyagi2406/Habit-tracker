import express, { Express } from 'express';
import cors from 'cors';
import { authRoutes } from './modules/auth/auth.routes';
import { habitRoutes } from './modules/habits/habits.routes';
import { checkInRoutes } from './modules/checkins/checkins.routes';
import { errorHandler } from './middleware/errorHandler';

export function createApp(): Express {
  const app = express();

  // Global middleware
  app.use(cors());
  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/habits', habitRoutes);
  app.use('/api/checkins', checkInRoutes);

  // Central Error Handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
