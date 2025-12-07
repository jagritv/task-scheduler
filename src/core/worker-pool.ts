/**
 * Worker Pool
 * Manages a pool of workers for concurrent task execution
 * Controls concurrency limits and task processing
 */

import { Task, TaskStatus } from '../models/task.model';
import { EventEmitter } from 'events';

export interface WorkerPoolOptions {
  maxConcurrentTasks: number;
}

export class WorkerPool extends EventEmitter {
  private activeTaskCount: number = 0;
  private readonly maxConcurrentTasks: number;
  private runningTasks: Map<string, NodeJS.Timeout> = new Map();
  
  constructor(options: WorkerPoolOptions) {
    super();
    this.maxConcurrentTasks = options.maxConcurrentTasks;
  }
  
  /**
   * Check if the worker pool can accept more tasks
   * @returns boolean indicating if the pool has capacity
   */
  public hasCapacity(): boolean {
    return this.activeTaskCount < this.maxConcurrentTasks;
  }
  
  /**
   * Get the number of currently active tasks
   * @returns number of active tasks
   */
  public getActiveTaskCount(): number {
    return this.activeTaskCount;
  }
  
  /**
   * Get the IDs of currently running tasks
   * @returns array of task IDs
   */
  public getRunningTaskIds(): string[] {
    return Array.from(this.runningTasks.keys());
  }
  
  /**
   * Execute a task
   * @param task The task to execute
   * @returns boolean indicating if the task was accepted for execution
   */
  public executeTask(task: Task): boolean {
    // If the pool is at capacity, reject the task
    if (!this.hasCapacity()) {
      return false;
    }
    
    // If the task is already running, reject it
    if (this.runningTasks.has(task.id)) {
      return false;
    }
    
    // Mark the task as running and increment the active task count
    this.activeTaskCount++;
    
    // Emit task started event
    this.emit('taskStarted', task);
    
    // Simulate task execution with a timeout based on the task duration
    const timeout = setTimeout(() => {
      // Remove the task from running tasks and decrement the active task count
      this.runningTasks.delete(task.id);
      this.activeTaskCount--;
      
      // Emit task completed event
      this.emit('taskCompleted', task);
    }, task.duration_ms);
    
    // Store the timeout reference for potential cancellation
    this.runningTasks.set(task.id, timeout);
    
    return true;
  }
  
  /**
   * Cancel a running task (for graceful shutdown or error handling)
   * @param taskId ID of the task to cancel
   * @returns boolean indicating if the task was cancelled
   */
  public cancelTask(taskId: string): boolean {
    const timeout = this.runningTasks.get(taskId);
    
    if (timeout) {
      clearTimeout(timeout);
      this.runningTasks.delete(taskId);
      this.activeTaskCount--;
      
      // Emit task cancelled event
      this.emit('taskCancelled', { id: taskId });
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Cancel all running tasks (for graceful shutdown)
   */
  public shutdown(): void {
    for (const [taskId, timeout] of this.runningTasks.entries()) {
      clearTimeout(timeout);
      this.emit('taskCancelled', { id: taskId });
    }
    
    this.runningTasks.clear();
    this.activeTaskCount = 0;
  }
}