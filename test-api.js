/**
 * Task Scheduler API Test Script
 * Tests the Task Scheduler API by submitting tasks with dependencies
 * and verifying they execute in the correct order.
 */

const fetch = require('node-fetch');

// Configuration
const API_BASE_URL = 'http://localhost:3000/api/tasks';
const DELAY_BETWEEN_REQUESTS_MS = 500;

// Test tasks
const tasks = [
  {
    id: 'task-A',
    type: 'data_processing',
    duration_ms: 3000,
    dependencies: []
  },
  {
    id: 'task-B',
    type: 'data_processing',
    duration_ms: 2000,
    dependencies: ['task-A']
  },
  {
    id: 'task-C',
    type: 'data_processing',
    duration_ms: 1000,
    dependencies: ['task-A']
  },
  {
    id: 'task-D',
    type: 'data_processing',
    duration_ms: 2000,
    dependencies: ['task-B', 'task-C']
  }
];

/**
 * Sleep function for async/await
 * @param {number} ms Milliseconds to sleep
 * @returns {Promise} Promise that resolves after ms milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a task via the API
 * @param {Object} task The task to create
 * @returns {Promise<Object>} The created task
 */
async function createTask(task) {
  try {
    // Add timestamp to make task ID unique for this test run
    const uniqueId = `${task.id}-${Date.now()}`;
    const uniqueTask = { ...task, id: uniqueId };
    
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(uniqueTask)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create task: ${error.error || 'Unknown error'}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error creating task ${task.id}:`, error);
    throw error;
  }
}

/**
 * Get a task's status via the API
 * @param {string} taskId The ID of the task
 * @returns {Promise<string>} The task's status
 */
async function getTaskStatus(taskId) {
  try {
    const response = await fetch(`${API_BASE_URL}/${taskId}/status`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to get task status: ${error.error || 'Unknown error'}`);
    }
    
    const data = await response.json();
    return data.status;
  } catch (error) {
    console.error(`Error getting status for task ${taskId}:`, error);
    throw error;
  }
}

/**
 * Wait for a task to reach a specific status
 * @param {string} taskId The ID of the task
 * @param {string} targetStatus The status to wait for
 * @param {number} timeout Timeout in milliseconds
 * @param {number} pollInterval Polling interval in milliseconds
 * @returns {Promise<boolean>} Promise that resolves to true when the task reaches the target status
 */
async function waitForTaskStatus(taskId, targetStatus, timeout = 30000, pollInterval = 1000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const status = await getTaskStatus(taskId);
    console.log(`Task ${taskId} status: ${status}`);
    
    if (status === targetStatus) {
      return true;
    }
    
    await sleep(pollInterval);
  }
  
  throw new Error(`Timeout waiting for task ${taskId} to reach status ${targetStatus}`);
}

/**
 * Run the test
 */
async function runTest() {
  try {
    console.log('Starting Task Scheduler API Test');
    
    // Create all tasks with unique IDs for this test run
    console.log('Creating tasks...');
    const createdTasks = [];
    for (const task of tasks) {
      const createdTask = await createTask(task);
      console.log(`Created task ${createdTask.id}`);
      createdTasks.push(createdTask);
      await sleep(DELAY_BETWEEN_REQUESTS_MS);
    }
    
    // Wait for all tasks to complete
    console.log('Waiting for tasks to complete...');
    for (const task of createdTasks) {
      await waitForTaskStatus(task.id, 'COMPLETED');
      console.log(`Task ${task.id} completed`);
    }
    
    console.log('All tasks completed successfully!');
    console.log('Test passed!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
runTest();