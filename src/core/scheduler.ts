/**
 * Task Scheduler
 * Core scheduling logic for task execution
 * Coordinates between dependency resolution and worker pool
 */

import { EventEmitter } from 'events';
import { Task, TaskStatus } from '../models/task.model';
import { DependencyResolver } from './dependency-resolver';
import { WorkerPool } from './worker-pool';
import prisma from '../db/client';

export interface SchedulerOptions {
  maxConcurrentTasks: number;
  pollingInterval: number; // ms
}

export class TaskScheduler extends EventEmitter {
  private readonly dependencyResolver: DependencyResolver;
  private readonly workerPool: WorkerPool;
  private pollingInterval: number;
  private pollingTimer: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor(options: SchedulerOptions) {
    super();
    this.dependencyResolver = new DependencyResolver();
    this.workerPool = new WorkerPool({ maxConcurrentTasks: options.maxConcurrentTasks });
    this.pollingInterval = options.pollingInterval;

    // Set up event listeners for worker pool events
    this.workerPool.on('taskStarted', this.handleTaskStarted.bind(this));
    this.workerPool.on('taskCompleted', this.handleTaskCompleted.bind(this));
    this.workerPool.on('taskCancelled', this.handleTaskCancelled.bind(this));
  }

  /**
   * Start the scheduler
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    // Load completed tasks from the database
    await this.loadCompletedTasks();

    // Start polling for new tasks
    this.poll();
  }

  /**
   * Stop the scheduler
   */
  public stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.pollingTimer) {
      clearTimeout(this.pollingTimer);
      this.pollingTimer = null;
    }

    // Shutdown the worker pool
    this.workerPool.shutdown();
  }

  /**
   * Poll for new tasks to execute
   */
  private async poll(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      // Process eligible tasks if the worker pool has capacity
      if (this.workerPool.hasCapacity()) {
        await this.processEligibleTasks();
      }
    } catch (error) {
      console.error('Error processing tasks:', error);
    } finally {
      // Schedule next poll
      this.pollingTimer = setTimeout(() => this.poll(), this.pollingInterval);
    }
  }

  /**
   * Process eligible tasks
   */
  private async processEligibleTasks(): Promise<void> {
    // Find queued tasks
    const queuedTasks = await prisma.task.findMany({
      where: { status: TaskStatus.QUEUED }
    });

    if (queuedTasks.length === 0) {
      return;
    }

    // Map database tasks to domain model
    const tasks: Task[] = queuedTasks.map(task => ({
      ...task,
      dependencies: JSON.parse(task.dependencies),
      created_at: task.created_at,
      updated_at: task.updated_at
    }));

    // Get eligible tasks based on dependencies
    const eligibleTasks = this.dependencyResolver.getEligibleTasks(tasks);

    // Execute eligible tasks if the worker pool has capacity
    for (const task of eligibleTasks) {
      if (!this.workerPool.hasCapacity()) {
        break;
      }

      // Update task status to RUNNING in the database
      await prisma.task.update({
        where: { id: task.id },
        data: { status: TaskStatus.RUNNING }
      });

      // Update task status in memory
      task.status = TaskStatus.RUNNING;

      // Execute the task
      this.workerPool.executeTask(task);
    }
  }

  /**
   * Load completed tasks from the database
   */
  private async loadCompletedTasks(): Promise<void> {
    try {
      const completedTasks = await prisma.task.findMany({
        where: { status: TaskStatus.COMPLETED },
        select: { id: true }
      });

      // Register completed tasks with the dependency resolver
      this.dependencyResolver.loadCompletedTasks(completedTasks.map(task => {
        return task.id;
      }));
    } catch (error) {
      console.error('Error loading completed tasks:', error);
    }
  }

  /**
   * Handle task started event from worker pool
   */
  private handleTaskStarted(task: Task): void {
    this.emit('taskStarted', task);
  }

  /**
   * Handle task completed event from worker pool
   */
  private async handleTaskCompleted(task: Task): Promise<void> {
    try {
      // Update task status in the database
      await prisma.task.update({
        where: { id: task.id },
        data: { status: TaskStatus.COMPLETED }
      });

      // Register the completed task with the dependency resolver
      this.dependencyResolver.registerCompletedTask(task.id);

      // Emit task completed event
      this.emit('taskCompleted', task);

      // Trigger an immediate poll to process newly eligible tasks
      this.poll();
    } catch (error) {
      console.error(`Error handling task completion for task ${task.id}:`, error);
    }
  }

  /**
   * Handle task cancelled event from worker pool
   */
  private async handleTaskCancelled(task: { id: string }): Promise<void> {
    try {
      // Update task status in the database
      await prisma.task.update({
        where: { id: task.id },
        data: { status: TaskStatus.FAILED }
      });

      // Emit task cancelled event
      this.emit('taskCancelled', task);
    } catch (error) {
      console.error(`Error handling task cancellation for task ${task.id}:`, error);
    }
  }
}
