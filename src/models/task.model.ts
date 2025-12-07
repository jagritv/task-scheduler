/**
 * Task Model
 * Defines the structure and behavior of Task objects in the system
 */

export enum TaskStatus {
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface Task {
  id: string;
  type: string;
  duration_ms: number;
  status: TaskStatus;
  dependencies: string[];  // Array of task IDs that this task depends on
  created_at: Date;
  updated_at: Date;
}

export interface CreateTaskDTO {
  id: string;
  type: string;
  duration_ms: number;
  dependencies?: string[];
}

// Utility function to convert dependencies from JSON string to array
export function parseDependencies(dependenciesJson: string): string[] {
  try {
    return JSON.parse(dependenciesJson);
  } catch (error) {
    console.error('Error parsing dependencies JSON:', error);
    return [];
  }
}

// Utility function to convert dependencies array to JSON string
export function stringifyDependencies(dependencies: string[]): string {
  return JSON.stringify(dependencies || []);
}

// Utility function to check if a task can be started based on its dependencies
export function canTaskStart(task: Task, completedTaskIds: Set<string>): boolean {
  // If the task has no dependencies, it can start immediately
  if (!task.dependencies || task.dependencies.length === 0) {
    return true;
  }
  
  // Check if all dependencies are completed
  return task.dependencies.every(depId => completedTaskIds.has(depId));
}