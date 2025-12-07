/**
 * Dependency Resolver
 * Responsible for determining which tasks are eligible to run based on dependencies
 */

import { Task, TaskStatus } from '../models/task.model';

export class DependencyResolver {
  private completedTaskIds: Set<string> = new Set<string>();
  
  /**
   * Register a completed task
   * @param taskId ID of the completed task
   */
  public registerCompletedTask(taskId: string): void {
    this.completedTaskIds.add(taskId);
  }
  
  /**
   * Check if a task is eligible to run based on its dependencies
   * @param task The task to check
   * @returns boolean indicating if all dependencies are satisfied
   */
  public isEligibleToRun(task: Task): boolean {
    // If the task is already running or completed, it's not eligible
    if (task.status === TaskStatus.RUNNING || task.status === TaskStatus.COMPLETED) {
      return false;
    }
    
    // If the task has no dependencies, it's eligible to run
    if (!task.dependencies || task.dependencies.length === 0) {
      return true;
    }
    
    // Check if all dependencies are completed
    return task.dependencies.every(depId => this.completedTaskIds.has(depId));
  }
  
  /**
   * Filter eligible tasks from a list of tasks
   * @param tasks Array of tasks to filter
   * @returns Array of tasks that are eligible to run
   */
  public getEligibleTasks(tasks: Task[]): Task[] {
    return tasks.filter(task => this.isEligibleToRun(task));
  }
  
  /**
   * Reset the dependency resolver state
   * Useful for testing or system resets
   */
  public reset(): void {
    this.completedTaskIds.clear();
  }
  
  /**
   * Load the completed tasks from a persistent store
   * @param completedTaskIds Array of completed task IDs
   */
  public loadCompletedTasks(completedTaskIds: string[]): void {
    completedTaskIds.forEach(id => this.completedTaskIds.add(id));
  }
}