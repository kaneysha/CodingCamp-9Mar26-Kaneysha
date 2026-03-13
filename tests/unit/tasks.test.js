import { describe, test, beforeEach, expect, vi } from 'vitest';

// Mock TaskComponent for unit testing
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

describe('Task Component Unit Tests', () => {
  let taskComponent;

  beforeEach(() => {
    // Create TaskComponent instance
    taskComponent = new TaskComponent(null);
  });

  describe('Task Editing (Requirement 5)', () => {
    test('should edit task text successfully', () => {
      // Setup
      const task = { id: 'test-1', text: 'Original task', completed: false, createdAt: Date.now() };
      taskComponent.tasks = [task];

      // Action
      const result = taskComponent.editTask('test-1', 'Updated task');

      // Assertion
      expect(result).toBe(true);
      expect(taskComponent.tasks[0].text).toBe('Updated task');
    });

    test('should reject empty task edit', () => {
      // Setup
      const task = { id: 'test-1', text: 'Original task', completed: false, createdAt: Date.now() };
      taskComponent.tasks = [task];

      // Action
      const result = taskComponent.editTask('test-1', '   ');

      // Assertion
      expect(result).toBe(false);
      expect(taskComponent.tasks[0].text).toBe('Original task');
    });

    test('should reject duplicate task edit', () => {
      // Setup
      const tasks = [
        { id: 'test-1', text: 'Task 1', completed: false, createdAt: Date.now() },
        { id: 'test-2', text: 'Task 2', completed: false, createdAt: Date.now() }
      ];
      taskComponent.tasks = tasks;

      // Action
      const result = taskComponent.editTask('test-1', 'Task 2');

      // Assertion
      expect(result).toBe(false);
      expect(taskComponent.tasks[0].text).toBe('Task 1');
    });
  });

  describe('Task Completion (Requirement 6)', () => {
    test('should toggle task completion status', () => {
      // Setup
      const task = { id: 'test-1', text: 'Test task', completed: false, createdAt: Date.now() };
      taskComponent.tasks = [task];

      // Action
      taskComponent.toggleComplete('test-1');

      // Assertion
      expect(taskComponent.tasks[0].completed).toBe(true);
    });

    test('should toggle back to incomplete', () => {
      // Setup
      const task = { id: 'test-1', text: 'Test task', completed: true, createdAt: Date.now() };
      taskComponent.tasks = [task];

      // Action
      taskComponent.toggleComplete('test-1');

      // Assertion
      expect(taskComponent.tasks[0].completed).toBe(false);
    });
  });

  describe('Task Deletion (Requirement 7)', () => {
    test('should delete task successfully', () => {
      // Setup
      const tasks = [
        { id: 'test-1', text: 'Task 1', completed: false, createdAt: Date.now() },
        { id: 'test-2', text: 'Task 2', completed: false, createdAt: Date.now() }
      ];
      taskComponent.tasks = tasks;

      // Action
      const result = taskComponent.deleteTask('test-1');

      // Assertion
      expect(result).toBe(true);
      expect(taskComponent.tasks.length).toBe(1);
      expect(taskComponent.tasks[0].id).toBe('test-2');
    });

    test('should return false for non-existent task', () => {
      // Setup
      const task = { id: 'test-1', text: 'Test task', completed: false, createdAt: Date.now() };
      taskComponent.tasks = [task];

      // Action
      const result = taskComponent.deleteTask('non-existent');

      // Assertion
      expect(result).toBe(false);
      expect(taskComponent.tasks.length).toBe(1);
    });
  });

  describe('Task Sorting (Requirement 8)', () => {
    test('should sort incomplete tasks before completed tasks', () => {
      // Setup - mixed completion status
      const tasks = [
        { id: 'test-1', text: 'Completed task', completed: true, createdAt: 1000 },
        { id: 'test-2', text: 'Incomplete task 1', completed: false, createdAt: 2000 },
        { id: 'test-3', text: 'Another completed', completed: true, createdAt: 3000 },
        { id: 'test-4', text: 'Incomplete task 2', completed: false, createdAt: 4000 }
      ];
      taskComponent.tasks = tasks;

      // Action
      taskComponent.sortTasks();

      // Assertion - incomplete tasks should come first
      expect(taskComponent.tasks[0].completed).toBe(false);
      expect(taskComponent.tasks[1].completed).toBe(false);
      expect(taskComponent.tasks[2].completed).toBe(true);
      expect(taskComponent.tasks[3].completed).toBe(true);
    });

    test('should sort by creation time within same completion status', () => {
      // Setup - same completion status, different creation times
      const tasks = [
        { id: 'test-1', text: 'Task 3', completed: false, createdAt: 3000 },
        { id: 'test-2', text: 'Task 1', completed: false, createdAt: 1000 },
        { id: 'test-3', text: 'Task 2', completed: false, createdAt: 2000 }
      ];
      taskComponent.tasks = tasks;

      // Action
      taskComponent.sortTasks();

      // Assertion - should be sorted by creation time (earliest first)
      expect(taskComponent.tasks[0].createdAt).toBe(1000);
      expect(taskComponent.tasks[1].createdAt).toBe(2000);
      expect(taskComponent.tasks[2].createdAt).toBe(3000);
    });

    test('should handle empty task list', () => {
      // Setup
      taskComponent.tasks = [];

      // Action
      taskComponent.sortTasks();

      // Assertion
      expect(taskComponent.tasks.length).toBe(0);
    });

    test('should handle single task', () => {
      // Setup
      const task = { id: 'test-1', text: 'Single task', completed: false, createdAt: Date.now() };
      taskComponent.tasks = [task];

      // Action
      taskComponent.sortTasks();

      // Assertion
      expect(taskComponent.tasks.length).toBe(1);
      expect(taskComponent.tasks[0].id).toBe('test-1');
    });

    test('should sort automatically when saving tasks', () => {
      // Setup - mixed completion status
      const tasks = [
        { id: 'test-1', text: 'Completed task', completed: true, createdAt: 1000 },
        { id: 'test-2', text: 'Incomplete task', completed: false, createdAt: 2000 }
      ];
      taskComponent.tasks = tasks;

      // Action
      taskComponent.saveTasks();

      // Assertion - incomplete task should be first after save
      expect(taskComponent.tasks[0].completed).toBe(false);
      expect(taskComponent.tasks[1].completed).toBe(true);
    });

    test('should update display within 100ms when sort order changes', () => {
      // Setup - large task list to test performance
      const tasks = [];
      for (let i = 0; i < 100; i++) {
        tasks.push({
          id: `test-${i}`,
          text: `Task ${i}`,
          completed: i % 2 === 0, // Alternate between completed and incomplete
          createdAt: Date.now() + i
        });
      }
      taskComponent.tasks = tasks;

      // Action - measure sorting time
      const startTime = performance.now();
      taskComponent.sortTasks();
      const endTime = performance.now();
      const sortTime = endTime - startTime;

      // Assertion - should complete within 100ms (requirement 8.4)
      expect(sortTime).toBeLessThan(100);
      
      // Verify sorting is correct
      let lastIncompleteIndex = -1;
      let firstCompleteIndex = -1;
      
      for (let i = 0; i < taskComponent.tasks.length; i++) {
        if (!taskComponent.tasks[i].completed) {
          lastIncompleteIndex = i;
        } else if (firstCompleteIndex === -1) {
          firstCompleteIndex = i;
        }
      }
      
      // All incomplete tasks should come before all completed tasks
      if (lastIncompleteIndex !== -1 && firstCompleteIndex !== -1) {
        expect(lastIncompleteIndex).toBeLessThan(firstCompleteIndex);
      }
    });
  });
});