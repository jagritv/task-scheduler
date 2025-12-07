/**
 * Task Service
 * Provides business logic for task operations
 * Interfaces between the API layer and core components
 */

import { Task, TaskStatus, CreateTaskDTO, parseDependencies, stringifyDependencies } from '../models/task.model';
import prisma from '../db/client';
import { TaskScheduler } from '../core/scheduler';

export class TaskService {
  private scheduler: TaskScheduler;
  
  constructor(scheduler: TaskScheduler) {
    this.scheduler = scheduler;
  }
  
  /**
   * Create a new task
   * @param taskData The task data
   * @returns The created task
   */
  public async createTask(taskData: CreateTaskDTO): Promise<Task> {
    // Validate dependencies
    if (taskData.dependencies && taskData.dependencies.length > 0) {
      // Check if all dependent tasks exist
      const dependencyIds = taskData.dependencies;
      const existingTasks = await prisma.task.findMany({
        where: { id: { in: dependencyIds } },
        select: { id: true }
      });
      
      const existingTaskIds = existingTasks.map(task => task.id);
      const missingTaskIds = dependencyIds.filter(id => !existingTaskIds.includes(id));
      
      if (missingTaskIds.length > 0) {
        throw new Error(`Dependencies not found: ${missingTaskIds.join(', ')}`);
      }
    }
    
    // Create the task in the database
    const createdTask = await prisma.task.create({
      data: {
        id: taskData.id,
        type: taskData.type,
        duration_ms: taskData.duration_ms,
        dependencies: stringifyDependencies(taskData.dependencies || []),
        status: TaskStatus.QUEUED
      }
    });
    
    // Convert the database task to domain model
    const task: Task = {
      ...createdTask,
      dependencies: taskData.dependencies || [],
      created_at: createdTask.created_at,
      updated_at: createdTask.updated_at
    };
    
    return task;
  }
  
  /**
   * Get a task by ID
   * @param taskId The task ID
   * @returns The task or null if not found
   */
  public async getTaskById(taskId: string): Promise<Task | null> {
    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });
    
    if (!task) {
      return null;
    }
    
    // Convert the database task to domain model
    return {
      ...task,
      dependencies: parseDependencies(task.dependencies),
      created_at: task.created_at,
      updated_at: task.updated_at
    };
  }
  
  /**
   * Get all tasks
   * @returns Array of tasks
   */
  public async getAllTasks(): Promise<Task[]> {
    const tasks = await prisma.task.findMany({
      orderBy: { created_at: 'desc' }
    });
    
    // Convert the database tasks to domain model
    return tasks.map(task => ({
      ...task,
      dependencies: parseDependencies(task.dependencies),
      created_at: task.created_at,
      updated_at: task.updated_at
    }));
  }
  
  /**
   * Get tasks by status
   * @param status The task status
   * @returns Array of tasks with the specified status
   */
  public async getTasksByStatus(status: TaskStatus): Promise<Task[]> {
    const tasks = await prisma.task.findMany({
      where: { status },
      orderBy: { created_at: 'desc' }
    });
    
    // Convert the database tasks to domain model
    return tasks.map(task => ({
      ...task,
      dependencies: parseDependencies(task.dependencies),
      created_at: task.created_at,
      updated_at: task.updated_at
    }));
  }
}