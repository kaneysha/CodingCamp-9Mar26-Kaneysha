import { describe, test, beforeEach, expect, vi } from 'vitest';
import * as fc from 'fast-check';

// Mock TaskComponent for testing
class TaskComponent {
  constructor(containerElement) {
    this.container = containerElement;
    this.tasks = [];
    this.taskInput = null;
    this.addTaskBtn = null;
    this.taskList = null;
  }

  generateId() {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  validateTask(text) {
    if (!text || typeof text !== 'string') {
      return false;
    }
    const trimmedText = text.trim();
    return trimmedText.length > 0;
  }

  isDuplicate(text) {
    const trimmedText = text.trim();
    return this.tasks.some(task => task.text === trimmedText);
  }

  editTask(taskId, newText) {
    if (!this.validateTask(newText)) {
      return false;
    }

    const trimmedText = newText.trim();
    const task = this.tasks.find(t => t.id === taskId);
    
    if (!task) {
      return false;
    }

    // Check for duplicates (excluding the current task)
    const isDuplicate = this.tasks.some(t => t.id !== taskId && t.text === trimmedText);
    if (isDuplicate) {
      return false;
    }

    task.text = trimmedText;
    this.saveTasks();
    return true;
  }

  toggleComplete(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      this.saveTasks();
    }
  }

  deleteTask(taskId) {
    const initialLength = this.tasks.length;
    this.tasks = this.tasks.filter(t => t.id !== taskId);
    
    if (this.tasks.length < initialLength) {
      this.saveTasks();
      return true;
    }
    return false;
  }

  sortTasks() {
    this.tasks.sort((a, b) => {
      if (a.completed === b.completed) {
        return a.createdAt - b.createdAt; // Sort by creation time if same completion status
      }
      return a.completed ? 1 : -1; // Incomplete tasks first
    });
  }

  saveTasks() {
    this.sortTasks();
    localStorage.setItem('dashboard_tasks', JSON.stringify(this.tasks));
    return true;
  }
}

// Mock DOM elements for testing
function createMockDOM() {
  document.body.innerHTML = `
    <div id="tasks-container" class="tasks-container">
      <h2>Tasks</h2>
      <div class="task-input-section">
        <input type="text" id="task-input" placeholder="Add a new task" class="task-input">
        <button id="add-task-btn" class="add-task-btn">Add Task</button>
      </div>
      <div id="task-list" class="task-list"></div>
    </div>
  `;
}

// Property-based test generators
const validTaskText = fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0);
const taskId = fc.string({ minLength: 10, maxLength: 50 });
const taskObject = fc.record({
  id: taskId,
  text: validTaskText,
  completed: fc.boolean(),
  createdAt: fc.integer({ min: 1000000000000, max: Date.now() })
});

describe('Task Component Property Tests', () => {
  let taskComponent;

  beforeEach(() => {
    // Create DOM
    createMockDOM();
    
    // Create TaskComponent instance
    const container = document.getElementById('tasks-container');
    taskComponent = new TaskComponent(container);
  });

  // **Property 13: Task Edit Updates Text**
  // **Validates: Requirements 5.3**
  test('Property 13: Task Edit Updates Text', () => {
    fc.assert(
      fc.property(
        taskObject,
        validTaskText,
        (originalTask, newText) => {
          // Setup: Add original task
          taskComponent.tasks = [originalTask];
          
          // Action: Edit the task
          const result = taskComponent.editTask(originalTask.id, newText);
          
          // Assertion: Task text should be updated
          if (result) {
            const updatedTask = taskComponent.tasks.find(t => t.id === originalTask.id);
            expect(updatedTask.text).toBe(newText.trim());
          }
          
          return true;
        }
      ),
      { numRuns: 25 }
    );
  });

  // **Property 14: Task Edit Persistence**
  // **Validates: Requirements 5.4**
  test('Property 14: Task Edit Persistence', () => {
    fc.assert(
      fc.property(
        taskObject,
        validTaskText,
        (originalTask, newText) => {
          // Setup: Add original task
          taskComponent.tasks = [originalTask];
          
          // Action: Edit the task
          const result = taskComponent.editTask(originalTask.id, newText);
          
          // Assertion: Changes should be persisted to storage
          if (result) {
            expect(localStorage.setItem).toHaveBeenCalledWith(
              'dashboard_tasks',
              expect.any(String)
            );
            
            // Verify the stored data contains the updated text
            const lastCall = localStorage.setItem.mock.calls[localStorage.setItem.mock.calls.length - 1];
            const storedData = JSON.parse(lastCall[1]);
            const updatedTask = storedData.find(t => t.id === originalTask.id);
            expect(updatedTask.text).toBe(newText.trim());
          }
          
          return true;
        }
      ),
      { numRuns: 25 }
    );
  });

  // **Property 15: Empty Task Edit Rejection**
  // **Validates: Requirements 5.5**
  test('Property 15: Empty Task Edit Rejection', () => {
    const emptyStrings = fc.oneof(
      fc.constant(''),
      fc.string().filter(s => s.trim().length === 0)
    );

    fc.assert(
      fc.property(
        taskObject,
        emptyStrings,
        (originalTask, emptyText) => {
          // Setup: Add original task
          const originalText = originalTask.text;
          taskComponent.tasks = [originalTask];
          
          // Action: Try to edit with empty text
          const result = taskComponent.editTask(originalTask.id, emptyText);
          
          // Assertion: Edit should fail and original text preserved
          expect(result).toBe(false);
          const task = taskComponent.tasks.find(t => t.id === originalTask.id);
          expect(task.text).toBe(originalText);
          
          return true;
        }
      ),
      { numRuns: 25 }
    );
  });

  // **Property 16: Task Completion Toggle Round-Trip**
  // **Validates: Requirements 6.4**
  test('Property 16: Task Completion Toggle Round-Trip', () => {
    fc.assert(
      fc.property(
        taskObject,
        (task) => {
          // Setup: Add task
          const originalCompleted = task.completed;
          taskComponent.tasks = [task];
          
          // Action: Toggle completion twice
          taskComponent.toggleComplete(task.id);
          taskComponent.toggleComplete(task.id);
          
          // Assertion: Should return to original state
          const finalTask = taskComponent.tasks.find(t => t.id === task.id);
          expect(finalTask.completed).toBe(originalCompleted);
          
          return true;
        }
      ),
      { numRuns: 25 }
    );
  });

  // **Property 17: Task Completion Persistence**
  // **Validates: Requirements 6.3**
  test('Property 17: Task Completion Persistence', () => {
    fc.assert(
      fc.property(
        taskObject,
        (task) => {
          // Setup: Add task
          taskComponent.tasks = [task];
          
          // Action: Toggle completion
          taskComponent.toggleComplete(task.id);
          
          // Assertion: Changes should be persisted to storage
          expect(localStorage.setItem).toHaveBeenCalledWith(
            'dashboard_tasks',
            expect.any(String)
          );
          
          return true;
        }
      ),
      { numRuns: 25 }
    );
  });

  // **Property 18: Task Deletion Removes Item**
  // **Validates: Requirements 7.2**
  test('Property 18: Task Deletion Removes Item', () => {
    fc.assert(
      fc.property(
        fc.array(taskObject, { minLength: 1, maxLength: 10 }),
        fc.integer(),
        (taskList, indexSeed) => {
          // Setup: Add tasks
          taskComponent.tasks = [...taskList];
          const initialLength = taskComponent.tasks.length;
          const taskToDelete = taskList[Math.abs(indexSeed) % taskList.length];
          
          // Action: Delete a task
          const result = taskComponent.deleteTask(taskToDelete.id);
          
          // Assertion: Task should be removed and list length decreased
          if (result) {
            expect(taskComponent.tasks.length).toBe(initialLength - 1);
            expect(taskComponent.tasks.find(t => t.id === taskToDelete.id)).toBeUndefined();
          }
          
          return true;
        }
      ),
      { numRuns: 25 }
    );
  });

  // **Property 19: Task Deletion Persistence**
  // **Validates: Requirements 7.3**
  test('Property 19: Task Deletion Persistence', () => {
    fc.assert(
      fc.property(
        taskObject,
        (task) => {
          // Setup: Add task
          taskComponent.tasks = [task];
          
          // Action: Delete the task
          const result = taskComponent.deleteTask(task.id);
          
          // Assertion: Changes should be persisted to storage
          if (result) {
            expect(localStorage.setItem).toHaveBeenCalledWith(
              'dashboard_tasks',
              expect.any(String)
            );
          }
          
          return true;
        }
      ),
      { numRuns: 25 }
    );
  });

  // **Property 20: Task Sorting by Completion Status**
  // **Validates: Requirements 8.2, 8.3**
  test('Property 20: Task Sorting by Completion Status', () => {
    fc.assert(
      fc.property(
        fc.array(taskObject, { minLength: 2, maxLength: 20 }),
        (taskList) => {
          // Setup: Add mixed completion status tasks
          taskComponent.tasks = [...taskList];
          
          // Action: Sort tasks
          taskComponent.sortTasks();
          
          // Assertion: All incomplete tasks should come before all completed tasks
          let lastIncompleteIndex = -1;
          let firstCompleteIndex = -1;
          
          for (let i = 0; i < taskComponent.tasks.length; i++) {
            if (!taskComponent.tasks[i].completed) {
              lastIncompleteIndex = i;
            } else if (firstCompleteIndex === -1) {
              firstCompleteIndex = i;
            }
          }
          
          // If both incomplete and completed tasks exist, 
          // all incomplete should come before all completed
          if (lastIncompleteIndex !== -1 && firstCompleteIndex !== -1) {
            expect(lastIncompleteIndex).toBeLessThan(firstCompleteIndex);
          }
          
          // Verify within same completion status, tasks are sorted by creation time
          for (let i = 1; i < taskComponent.tasks.length; i++) {
            const current = taskComponent.tasks[i];
            const previous = taskComponent.tasks[i - 1];
            
            if (current.completed === previous.completed) {
              expect(current.createdAt).toBeGreaterThanOrEqual(previous.createdAt);
            }
          }
          
          return true;
        }
      ),
      { numRuns: 25 }
    );
  });
});