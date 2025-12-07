/**
 * Task Controller
 * Handles HTTP requests for task operations
 */

import { Request, Response } from 'express';
import { TaskService } from '../services/task.service';
import { CreateTaskDTO, TaskStatus } from '../models/task.model';

export class TaskController {
  private taskService: TaskService;

  constructor(taskService: TaskService) {
    this.taskService = taskService;
  }

  /**
   * Create a new task
   * @param req Express request
   * @param res Express response
   */
  public createTask = async (req: Request, res: Response): Promise<void> => {
    try {
      const taskData: CreateTaskDTO = req.body;

      // Validate required fields
      if (!taskData.id || !taskData.type || taskData.duration_ms === undefined) {
        res.status(400).json({
          error: 'Missing required fields: id, type, and duration_ms are required'
        });
        return;
      }

      // Check for valid duration
      if (taskData.duration_ms <= 0) {
        res.status(400).json({
          error: 'duration_ms must be a positive number'
        });
        return;
      }

      const task = await this.taskService.createTask(taskData);
      res.status(201).json(task);
    } catch (error: any) {
      console.error('Error creating task:', error);
      res.status(500).json({
        error: error.message || 'An error occurred while creating the task'
      });
    }
  };

  /**
   * Get a task by ID
   * @param req Express request
   * @param res Express response
   */
  public getTaskById = async (req: Request, res: Response): Promise<void> => {
    try {
      const taskId = req.params.id;

      if (!taskId) {
        res.status(400).json({ error: 'Task ID is required' });
        return;
      }

      const task = await this.taskService.getTaskById(taskId);

      if (!task) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }

      res.status(200).json(task);
    } catch (error: any) {
      console.error('Error getting task:', error);
      res.status(500).json({
        error: error.message || 'An error occurred while getting the task'
      });
    }
  };

  /**
   * Get all tasks
   * @param req Express request
   * @param res Express response
   */
  public getAllTasks = async (req: Request, res: Response): Promise<void> => {
    try {
      const tasks = await this.taskService.getAllTasks();
      res.status(200).json(tasks);
    } catch (error: any) {
      console.error('Error getting all tasks:', error);
      res.status(500).json({
        error: error.message || 'An error occurred while getting tasks'
      });
    }
  };

  /**
   * Get task status
   * @param req Express request
   * @param res Express response
   */
  public getTaskStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const taskId = req.params.id;

      if (!taskId) {
        res.status(400).json({ error: 'Task ID is required' });
        return;
      }

      const task = await this.taskService.getTaskById(taskId);

      if (!task) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }

      res.status(200).json({ id: task.id, status: task.status });
    } catch (error: any) {
      console.error('Error getting task status:', error);
      res.status(500).json({
        error: error.message || 'An error occurred while getting task status'
      });
    }
  };
}
