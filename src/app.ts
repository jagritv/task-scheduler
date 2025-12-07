/**
 * Express Application
 * Configures the Express application with middleware and routes
 */

import express from 'express';
import cors from 'cors';
import { createTaskRoutes } from './api/task.routes';
import { TaskService } from './services/task.service';
import { TaskScheduler } from './core/scheduler';

export function createApp(taskService: TaskService): express.Application {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Routes
  app.use('/api/tasks', createTaskRoutes(taskService));

  // Health check route
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // Error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
    });
  });

  return app;
}
