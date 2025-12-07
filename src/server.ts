/**
 * Server Entry Point
 * Initializes the application, database, and scheduler
 */

import { createApp } from './app';
import { TaskScheduler } from './core/scheduler';
import { TaskService } from './services/task.service';
import prisma from './db/client';

const PORT = process.env.PORT || 3000;
const MAX_CONCURRENT_TASKS = Number(process.env.MAX_CONCURRENT_TASKS) || 3;
const POLLING_INTERVAL = Number(process.env.POLLING_INTERVAL) || 1000; // 1 second

// Initialize scheduler with configuration
const scheduler = new TaskScheduler({
  maxConcurrentTasks: MAX_CONCURRENT_TASKS,
  pollingInterval: POLLING_INTERVAL,
});

// Initialize task service
const taskService = new TaskService(scheduler);

// Create Express application
const app = createApp(taskService);

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
  console.log(`Max concurrent tasks: ${MAX_CONCURRENT_TASKS}`);
  console.log(`Polling interval: ${POLLING_INTERVAL}ms`);

  // Start the scheduler after server is up
  scheduler.start()
    .then(() => {
      console.log('Task scheduler started');
    })
    .catch((error) => {
      console.error('Failed to start task scheduler:', error);
    });
});

// Implement graceful shutdown
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

async function gracefulShutdown() {
  console.log('Shutting down gracefully...');

  // Stop accepting new connections
  server.close(async () => {
    try {
      // Stop the scheduler to prevent new task processing
      scheduler.stop();
      console.log('Task scheduler stopped');

      // Close database connections
      await prisma.$disconnect();
      console.log('Database connections closed');

      console.log('Shutdown complete');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  });

  // Force shutdown if graceful shutdown takes too long
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}
