/**
 * Task Routes
 * Defines API routes for task operations
 */

import { Router } from 'express';
import { TaskController } from './task.controller';
import { TaskService } from '../services/task.service';

export function createTaskRoutes(taskService: TaskService): Router {
  const router = Router();
  const taskController = new TaskController(taskService);
  
  /**
   * @route POST /api/tasks
   * @description Create a new task
   * @access Public
   */
  router.post('/', taskController.createTask);
  
  /**
   * @route GET /api/tasks
   * @description Get all tasks
   * @access Public
   */
  router.get('/', taskController.getAllTasks);
  
  /**
   * @route GET /api/tasks/:id
   * @description Get a task by ID
   * @access Public
   */
  router.get('/:id', taskController.getTaskById);
  
  /**
   * @route GET /api/tasks/:id/status
   * @description Get the status of a task
   * @access Public
   */
  router.get('/:id/status', taskController.getTaskStatus);
  
  return router;
}