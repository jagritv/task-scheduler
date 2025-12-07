# Distributed Task Scheduler

A lightweight, persistent task orchestration engine that manages task dependencies and concurrent execution.

## Overview

This task scheduler is designed to handle background job processing in distributed systems. It accepts tasks via a REST API, manages their lifecycle, and executes them while respecting concurrency limits and inter-task dependencies.

## Features

- RESTful API for task management
- Dependency resolution (tasks wait for their dependencies to complete)
- Configurable concurrency control
- Persistent task state with SQLite
- Crash recovery support
- Graceful shutdown handling

## Installation

1. Clone the repository:
```bash
git clone https://github.com/jagritv/task-scheduler.git
cd task-scheduler
```

2. Install dependencies:
```bash
npm install
```

3. Create the environment file:
```bash
# Copy the example environment file
cp .env.example .env

# Optional: Edit the .env file if you need to change any configuration
```

4. Generate Prisma client:
```bash
npx prisma generate
```

5. Create database and run migrations:
```bash
npx prisma migrate dev --name init
```

## Configuration

Configuration is handled through environment variables (with sensible defaults):

- `PORT`: Server port (default: 3000)
- `MAX_CONCURRENT_TASKS`: Maximum number of tasks to execute concurrently (default: 3)
- `POLLING_INTERVAL`: How often to check for eligible tasks in milliseconds (default: 1000)

## Running the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

## API Endpoints

### Submit Task

```
POST /api/tasks
```

Request body:
```json
{
  "id": "task-A",
  "type": "data_processing",
  "duration_ms": 5000,
  "dependencies": []
}
```

### Get Task Status

```
GET /api/tasks/:id/status
```

Response:
```json
{
  "id": "task-A",
  "status": "QUEUED" // QUEUED, RUNNING, COMPLETED, FAILED
}
```

### List All Tasks

```
GET /api/tasks
```

Response:
```json
[
  {
    "id": "task-A",
    "type": "data_processing",
    "duration_ms": 5000,
    "status": "COMPLETED",
    "dependencies": [],
    "created_at": "2023-04-12T15:30:45.123Z",
    "updated_at": "2023-04-12T15:30:50.456Z"
  },
  // More tasks...
]
```

### Get Task Details

```
GET /api/tasks/:id
```

Response:
```json
{
  "id": "task-A",
  "type": "data_processing",
  "duration_ms": 5000,
  "status": "COMPLETED",
  "dependencies": [],
  "created_at": "2023-04-12T15:30:45.123Z",
  "updated_at": "2023-04-12T15:30:50.456Z"
}
```

## Design Choices

### Architecture

The system follows a modular architecture with clear separation of concerns:

- **API Layer**: Handles HTTP requests/responses
- **Service Layer**: Contains business logic
- **Core Components**: Scheduler, WorkerPool, and DependencyResolver
- **Data Layer**: Prisma for database access

### Concurrency Model

The system uses a worker pool pattern to control concurrency. The `WorkerPool` class manages task execution and enforces the maximum number of concurrent tasks. When a task completes, it notifies the scheduler, which can then check for newly eligible tasks.

### Storage Strategy

SQLite was chosen for persistence due to its simplicity and embedded nature, making the application self-contained. The database schema is designed to efficiently track task state and dependencies.

Tasks are stored with their dependencies as a JSON string to support complex dependency relationships while maintaining query efficiency.

### Dependency Resolution

Dependencies form a Directed Acyclic Graph (DAG). The `DependencyResolver` class maintains a set of completed task IDs and determines which tasks are eligible to run based on their dependencies.

### Crash Recovery

If the application crashes and restarts:
1. The scheduler loads completed tasks from the database
2. Tasks that were in a RUNNING state are considered failed and need to be resubmitted
3. Tasks that were QUEUED will be picked up and executed

## Testing

You can test the system using the provided test script:

```bash
node test-api.js
```

This script creates a series of tasks with dependencies and verifies they execute in the correct order.

## Scaling Considerations

To scale this system to handle a million tasks per hour:

1. **Database**: Replace SQLite with a more robust database like PostgreSQL
2. **Distributed Workers**: Implement a distributed worker architecture using message queues
3. **Sharding**: Partition tasks based on type or other criteria
4. **Caching**: Implement caching for frequently accessed task states
5. **Load Balancing**: Deploy multiple API instances behind a load balancer
6. **Horizontal Scaling**: Deploy scheduler instances that coordinate through a shared database or message broker

## License

MIT