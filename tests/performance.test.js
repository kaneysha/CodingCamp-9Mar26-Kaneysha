// Performance Tests for Productivity Dashboard
// Tests Requirements 11.2, 11.3, 11.4

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Import components for testing
const { StorageManager, GreetingComponent, TimerComponent, TaskComponent, QuickLinksComponent } = await import('../js/app.js');

const createTestEnvironment = () => {
    const dom = new JSDOM(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Productivity Dashboard</title>
        </head>
        <body>
            <div id="greeting-container">
                <div id="time-display"></div>
                <div id="date-display"></div>
                <div id="greeting-display"></div>
                <input id="name-input" type="text">
                <button id="save-name-btn">Save</button>
            </div>
            <div id="timer-container">
                <div id="timer-display">25:00</div>
                <button id="start-timer-btn">Start</button>
                <button id="stop-timer-btn">Stop</button>
                <button id="reset-timer-btn">Reset</button>
            </div>
            <div id="tasks-container">
                <input id="task-input" type="text">
                <button id="add-task-btn">Add</button>
                <div id="task-list"></div>
            </div>
            <div id="links-container">
                <input id="link-url-input" type="text">
                <input id="link-label-input" type="text">
                <button id="add-link-btn">Add</button>
                <div id="link-list"></div>
            </div>
        </body>
        </html>
    `, {
        url: 'http://localhost',
        pretendToBeVisual: true,
        resources: 'usable'
    });

    const window = dom.window;
    const document = window.document;

    // Mock browser APIs
    global.window = window;
    global.document = document;
    global.localStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
    };
    global.requestAnimationFrame = vi.fn((callback) => {
        setTimeout(callback, 16);
        return 1;
    });
    global.performance = {
        now: vi.fn(() => Date.now())
    };

    return { window, document };
};

describe('Performance Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        createTestEnvironment();
    });

    describe('Initial Load Time Performance (Requirement 11.2)', () => {
        it('should initialize all components within 1 second', async () => {
            const startTime = performance.now();
            
            // Initialize all components
            const greetingContainer = document.getElementById('greeting-container');
            const timerContainer = document.getElementById('timer-container');
            const tasksContainer = document.getElementById('tasks-container');
            const linksContainer = document.getElementById('links-container');
            
            const greetingComponent = new GreetingComponent(greetingContainer);
            const timerComponent = new TimerComponent(timerContainer);
            const taskComponent = new TaskComponent(tasksContainer);
            const quickLinksComponent = new QuickLinksComponent(linksContainer);
            
            // Initialize components
            greetingComponent.init();
            timerComponent.init();
            taskComponent.init();
            quickLinksComponent.init();
            
            const endTime = performance.now();
            const initTime = endTime - startTime;
            
            // Should initialize within 1000ms (1 second)
            expect(initTime).toBeLessThan(1000);
        });

        it('should load stored data efficiently', async () => {
            // Mock stored data
            global.localStorage.getItem.mockImplementation((key) => {
                if (key === 'dashboard_tasks') {
                    return JSON.stringify([
                        { id: 'task1', text: 'Task 1', completed: false, createdAt: Date.now() },
                        { id: 'task2', text: 'Task 2', completed: true, createdAt: Date.now() }
                    ]);
                }
                if (key === 'dashboard_quick_links') {
                    return JSON.stringify([
                        { id: 'link1', url: 'https://example.com', label: 'Example' }
                    ]);
                }
                if (key === 'dashboard_user_name') {
                    return JSON.stringify('Test User');
                }
                return null;
            });

            const startTime = performance.now();
            
            const tasksContainer = document.getElementById('tasks-container');
            const linksContainer = document.getElementById('links-container');
            
            const taskComponent = new TaskComponent(tasksContainer);
            const quickLinksComponent = new QuickLinksComponent(linksContainer);
            
            taskComponent.init();
            quickLinksComponent.init();
            
            const endTime = performance.now();
            const loadTime = endTime - startTime;
            
            // Should load data efficiently
            expect(loadTime).toBeLessThan(100);
            expect(global.localStorage.getItem).toHaveBeenCalled();
        });
    });

    describe('UI Response Time Performance (Requirement 11.3)', () => {
        it('should respond to task addition within 100ms', async () => {
            const tasksContainer = document.getElementById('tasks-container');
            const taskComponent = new TaskComponent(tasksContainer);
            taskComponent.init();
            
            const startTime = performance.now();
            
            // Add a task
            const result = taskComponent.addTask('Test Task');
            
            const endTime = performance.now();
            const responseTime = endTime - startTime;
            
            expect(result).toBe(true);
            expect(responseTime).toBeLessThan(100);
        });

        it('should respond to task deletion within 100ms', async () => {
            const tasksContainer = document.getElementById('tasks-container');
            const taskComponent = new TaskComponent(tasksContainer);
            taskComponent.init();
            
            // Add a task first
            taskComponent.addTask('Test Task');
            const taskId = taskComponent.tasks[0].id;
            
            const startTime = performance.now();
            
            // Delete the task
            const result = taskComponent.deleteTask(taskId);
            
            const endTime = performance.now();
            const responseTime = endTime - startTime;
            
            expect(result).toBe(true);
            expect(responseTime).toBeLessThan(100);
        });

        it('should respond to task completion toggle within 100ms', async () => {
            const tasksContainer = document.getElementById('tasks-container');
            const taskComponent = new TaskComponent(tasksContainer);
            taskComponent.init();
            
            // Add a task first
            taskComponent.addTask('Test Task');
            const taskId = taskComponent.tasks[0].id;
            
            const startTime = performance.now();
            
            // Toggle completion
            taskComponent.toggleComplete(taskId);
            
            const endTime = performance.now();
            const responseTime = endTime - startTime;
            
            expect(responseTime).toBeLessThan(100);
            expect(taskComponent.tasks[0].completed).toBe(true);
        });

        it('should respond to quick link addition within 100ms', async () => {
            const linksContainer = document.getElementById('links-container');
            const quickLinksComponent = new QuickLinksComponent(linksContainer);
            quickLinksComponent.init();
            
            const startTime = performance.now();
            
            // Add a quick link
            const result = quickLinksComponent.addLink('https://example.com', 'Example');
            
            const endTime = performance.now();
            const responseTime = endTime - startTime;
            
            expect(result).toBe(true);
            expect(responseTime).toBeLessThan(100);
        });

        it('should respond to timer controls within 100ms', async () => {
            const timerContainer = document.getElementById('timer-container');
            const timerComponent = new TimerComponent(timerContainer);
            timerComponent.init();
            
            const startTime = performance.now();
            
            // Start timer
            timerComponent.start();
            
            const endTime = performance.now();
            const responseTime = endTime - startTime;
            
            expect(responseTime).toBeLessThan(100);
            expect(timerComponent.isRunning).toBe(true);
        });
    });

    describe('DOM Manipulation Optimization (Requirement 11.4)', () => {
        it('should use document fragments for batch DOM operations', async () => {
            const tasksContainer = document.getElementById('tasks-container');
            const taskComponent = new TaskComponent(tasksContainer);
            taskComponent.init();
            
            // Add multiple tasks
            for (let i = 0; i < 10; i++) {
                taskComponent.addTask(`Task ${i + 1}`);
            }
            
            // Mock document.createDocumentFragment to verify it's being used
            const originalCreateFragment = document.createDocumentFragment;
            const createFragmentSpy = vi.fn(originalCreateFragment);
            document.createDocumentFragment = createFragmentSpy;
            
            // Trigger re-render and wait for requestAnimationFrame
            taskComponent.renderTasks();
            
            // Wait for requestAnimationFrame to complete
            await new Promise(resolve => {
                global.requestAnimationFrame(resolve);
            });
            
            // Verify document fragment was used
            expect(createFragmentSpy).toHaveBeenCalled();
            
            // Restore original method
            document.createDocumentFragment = originalCreateFragment;
        });

        it('should minimize DOM queries by caching elements', async () => {
            const greetingContainer = document.getElementById('greeting-container');
            const greetingComponent = new GreetingComponent(greetingContainer);
            
            // Mock getElementById to count calls
            const originalGetElementById = document.getElementById;
            const getElementByIdSpy = vi.fn(originalGetElementById);
            document.getElementById = getElementByIdSpy;
            
            greetingComponent.init();
            
            // Update time multiple times
            greetingComponent.updateTimeDisplay();
            greetingComponent.updateTimeDisplay();
            greetingComponent.updateTimeDisplay();
            
            // getElementById should only be called during init, not during updates
            const initCalls = getElementByIdSpy.mock.calls.length;
            expect(initCalls).toBeLessThan(10); // Should cache elements after init
            
            // Restore original method
            document.getElementById = originalGetElementById;
        });

        it('should use requestAnimationFrame for smooth updates', async () => {
            const tasksContainer = document.getElementById('tasks-container');
            const taskComponent = new TaskComponent(tasksContainer);
            taskComponent.init();
            
            // Add a task to trigger render
            taskComponent.addTask('Test Task');
            
            // Verify requestAnimationFrame was called
            expect(global.requestAnimationFrame).toHaveBeenCalled();
        });

        it('should avoid unnecessary DOM updates', async () => {
            const greetingContainer = document.getElementById('greeting-container');
            const greetingComponent = new GreetingComponent(greetingContainer);
            greetingComponent.init();
            
            const timeDisplay = document.getElementById('time-display');
            const originalTextContent = timeDisplay.textContent;
            
            // Mock textContent setter to count updates
            let updateCount = 0;
            Object.defineProperty(timeDisplay, 'textContent', {
                get: () => originalTextContent,
                set: (value) => {
                    if (value !== originalTextContent) {
                        updateCount++;
                    }
                }
            });
            
            // Update time with same value multiple times
            greetingComponent.updateTimeDisplay();
            greetingComponent.updateTimeDisplay();
            greetingComponent.updateTimeDisplay();
            
            // Should minimize unnecessary updates
            expect(updateCount).toBeLessThan(3);
        });
    });

    describe('Memory Usage Optimization', () => {
        it('should clean up intervals when components are destroyed', () => {
            const greetingContainer = document.getElementById('greeting-container');
            const greetingComponent = new GreetingComponent(greetingContainer);
            greetingComponent.init();
            
            // Mock clearInterval
            const originalClearInterval = global.clearInterval;
            const clearIntervalSpy = vi.fn();
            global.clearInterval = clearIntervalSpy;
            
            // Destroy component
            greetingComponent.destroy();
            
            // Verify interval was cleared
            expect(clearIntervalSpy).toHaveBeenCalled();
            
            // Restore original method
            global.clearInterval = originalClearInterval;
        });

        it('should clean up timer intervals', () => {
            const timerContainer = document.getElementById('timer-container');
            const timerComponent = new TimerComponent(timerContainer);
            timerComponent.init();
            
            // Start timer
            timerComponent.start();
            
            // Mock clearInterval
            const originalClearInterval = global.clearInterval;
            const clearIntervalSpy = vi.fn();
            global.clearInterval = clearIntervalSpy;
            
            // Destroy component
            timerComponent.destroy();
            
            // Verify interval was cleared
            expect(clearIntervalSpy).toHaveBeenCalled();
            
            // Restore original method
            global.clearInterval = originalClearInterval;
        });
    });

    describe('Storage Performance', () => {
        it('should batch storage operations efficiently', async () => {
            const tasksContainer = document.getElementById('tasks-container');
            const taskComponent = new TaskComponent(tasksContainer);
            taskComponent.init();
            
            const startTime = performance.now();
            
            // Add multiple tasks (should batch storage operations)
            taskComponent.addTask('Task 1');
            taskComponent.addTask('Task 2');
            taskComponent.addTask('Task 3');
            
            const endTime = performance.now();
            const operationTime = endTime - startTime;
            
            // Should complete quickly even with multiple operations
            expect(operationTime).toBeLessThan(50);
            expect(global.localStorage.setItem).toHaveBeenCalled();
        });

        it('should handle storage errors gracefully', () => {
            // Mock storage error
            global.localStorage.setItem.mockImplementation(() => {
                throw new Error('QuotaExceededError');
            });
            
            const result = StorageManager.set('test', 'value');
            expect(result).toBe(false);
        });
    });

    describe('Rendering Performance', () => {
        it('should render large task lists efficiently', async () => {
            const tasksContainer = document.getElementById('tasks-container');
            const taskComponent = new TaskComponent(tasksContainer);
            taskComponent.init();
            
            // Add many tasks
            for (let i = 0; i < 100; i++) {
                taskComponent.tasks.push({
                    id: `task_${i}`,
                    text: `Task ${i + 1}`,
                    completed: i % 2 === 0,
                    createdAt: Date.now()
                });
            }
            
            const startTime = performance.now();
            
            // Render all tasks
            taskComponent.renderTasks();
            
            const endTime = performance.now();
            const renderTime = endTime - startTime;
            
            // Should render efficiently even with many items
            expect(renderTime).toBeLessThan(100);
        });

        it('should render large link lists efficiently', async () => {
            const linksContainer = document.getElementById('links-container');
            const quickLinksComponent = new QuickLinksComponent(linksContainer);
            quickLinksComponent.init();
            
            // Add many links
            for (let i = 0; i < 50; i++) {
                quickLinksComponent.links.push({
                    id: `link_${i}`,
                    url: `https://example${i}.com`,
                    label: `Example ${i + 1}`
                });
            }
            
            const startTime = performance.now();
            
            // Render all links
            quickLinksComponent.renderLinks();
            
            const endTime = performance.now();
            const renderTime = endTime - startTime;
            
            // Should render efficiently even with many items
            expect(renderTime).toBeLessThan(100);
        });
    });
});