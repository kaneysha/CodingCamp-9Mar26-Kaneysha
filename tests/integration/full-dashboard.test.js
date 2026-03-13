import { describe, test, beforeEach, expect, vi, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';

// Set up full DOM environment
const dom = new JSDOM(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Productivity Dashboard</title>
</head>
<body>
    <div class="dashboard">
        <!-- Greeting Component Container -->
        <section class="greeting-section">
            <div id="greeting-container" class="greeting-container">
                <div id="time-display" class="time-display"></div>
                <div id="date-display" class="date-display"></div>
                <div id="greeting-display" class="greeting-display"></div>
                <div class="name-input-section">
                    <input type="text" id="name-input" placeholder="Enter your name" class="name-input">
                    <button id="save-name-btn" class="save-name-btn">Save</button>
                </div>
            </div>
        </section>

        <!-- Focus Timer Component Container -->
        <section class="timer-section">
            <div id="timer-container" class="timer-container">
                <h2>Focus Timer</h2>
                <div id="timer-display" class="timer-display">25:00</div>
                <div class="timer-controls">
                    <button id="start-timer-btn" class="timer-btn start-btn">Start</button>
                    <button id="stop-timer-btn" class="timer-btn stop-btn">Stop</button>
                    <button id="reset-timer-btn" class="timer-btn reset-btn">Reset</button>
                </div>
            </div>
        </section>

        <!-- Task Manager Component Container -->
        <section class="tasks-section">
            <div id="tasks-container" class="tasks-container">
                <h2>Tasks</h2>
                <div class="task-input-section">
                    <input type="text" id="task-input" placeholder="Add a new task" class="task-input">
                    <button id="add-task-btn" class="add-task-btn">Add Task</button>
                </div>
                <div id="task-list" class="task-list"></div>
            </div>
        </section>

        <!-- Quick Links Component Container -->
        <section class="links-section">
            <div id="links-container" class="links-container">
                <h2>Quick Links</h2>
                <div class="link-input-section">
                    <input type="text" id="link-url-input" placeholder="Enter URL" class="link-input">
                    <input type="text" id="link-label-input" placeholder="Enter label" class="link-input">
                    <button id="add-link-btn" class="add-link-btn">Add Link</button>
                </div>
                <div id="link-list" class="link-list"></div>
            </div>
        </section>
    </div>
</body>
</html>
`);

global.window = dom.window;
global.document = dom.window.document;

// Mock localStorage
const localStorageMock = {
    store: {},
    getItem: vi.fn((key) => localStorageMock.store[key] || null),
    setItem: vi.fn((key, value) => { localStorageMock.store[key] = value; }),
    removeItem: vi.fn((key) => { delete localStorageMock.store[key]; }),
    clear: vi.fn(() => { localStorageMock.store = {}; })
};

global.localStorage = localStorageMock;
global.window.open = vi.fn();

// Import the application code after setting up the DOM
const { 
    GreetingComponent, 
    TimerComponent, 
    TaskComponent, 
    QuickLinksComponent, 
    StorageManager, 
    STORAGE_KEYS 
} = await import('../../js/app.js');

describe('Full Dashboard Integration Tests', () => {
    let greetingComponent;
    let timerComponent;
    let taskComponent;
    let quickLinksComponent;

    beforeEach(() => {
        // Reset DOM to ensure clean state
        document.body.innerHTML = `
            <div class="dashboard">
                <!-- Greeting Component Container -->
                <section class="greeting-section">
                    <div id="greeting-container" class="greeting-container">
                        <div id="time-display" class="time-display"></div>
                        <div id="date-display" class="date-display"></div>
                        <div id="greeting-display" class="greeting-display"></div>
                        <div class="name-input-section">
                            <input type="text" id="name-input" placeholder="Enter your name" class="name-input">
                            <button id="save-name-btn" class="save-name-btn">Save</button>
                        </div>
                    </div>
                </section>

                <!-- Focus Timer Component Container -->
                <section class="timer-section">
                    <div id="timer-container" class="timer-container">
                        <h2>Focus Timer</h2>
                        <div id="timer-display" class="timer-display">25:00</div>
                        <div class="timer-controls">
                            <button id="start-timer-btn" class="timer-btn start-btn">Start</button>
                            <button id="stop-timer-btn" class="timer-btn stop-btn">Stop</button>
                            <button id="reset-timer-btn" class="timer-btn reset-btn">Reset</button>
                        </div>
                    </div>
                </section>

                <!-- Task Manager Component Container -->
                <section class="tasks-section">
                    <div id="tasks-container" class="tasks-container">
                        <h2>Tasks</h2>
                        <div class="task-input-section">
                            <input type="text" id="task-input" placeholder="Add a new task" class="task-input">
                            <button id="add-task-btn" class="add-task-btn">Add Task</button>
                        </div>
                        <div id="task-list" class="task-list"></div>
                    </div>
                </section>

                <!-- Quick Links Component Container -->
                <section class="links-section">
                    <div id="links-container" class="links-container">
                        <h2>Quick Links</h2>
                        <div class="link-input-section">
                            <input type="text" id="link-url-input" placeholder="Enter URL" class="link-input">
                            <input type="text" id="link-label-input" placeholder="Enter label" class="link-input">
                            <button id="add-link-btn" class="add-link-btn">Add Link</button>
                        </div>
                        <div id="link-list" class="link-list"></div>
                    </div>
                </section>
            </div>
        `;

        // Reset localStorage
        localStorageMock.store = {};
        vi.clearAllMocks();

        // Initialize all components
        greetingComponent = new GreetingComponent(document.getElementById('greeting-container'));
        timerComponent = new TimerComponent(document.getElementById('timer-container'));
        taskComponent = new TaskComponent(document.getElementById('tasks-container'));
        quickLinksComponent = new QuickLinksComponent(document.getElementById('links-container'));

        // Initialize components
        greetingComponent.init();
        timerComponent.init();
        taskComponent.init();
        quickLinksComponent.init();
    });

    afterEach(() => {
        // Clean up intervals and timers
        if (greetingComponent) greetingComponent.destroy();
        if (timerComponent) timerComponent.destroy();
    });

    describe('All Components Integration', () => {
        test('should initialize all four main components successfully', () => {
            // Verify all components are initialized
            expect(greetingComponent.timeDisplay).toBeTruthy();
            expect(greetingComponent.greetingDisplay).toBeTruthy();
            
            expect(timerComponent.timerDisplay).toBeTruthy();
            expect(timerComponent.timeRemaining).toBe(1500);
            
            expect(taskComponent.taskInput).toBeTruthy();
            expect(taskComponent.tasks).toEqual([]);
            
            expect(quickLinksComponent.urlInput).toBeTruthy();
            expect(quickLinksComponent.links).toEqual([]);
        });

        test('should handle data persistence across all components', () => {
            // Set name in greeting component
            greetingComponent.setName('John Doe');
            
            // Add a task
            taskComponent.addTask('Complete project');
            
            // Add a quick link
            quickLinksComponent.addLink('https://github.com', 'GitHub');
            
            // Verify all data was persisted to localStorage
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                STORAGE_KEYS.USER_NAME,
                JSON.stringify('John Doe')
            );
            
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                STORAGE_KEYS.TASKS,
                expect.stringContaining('Complete project')
            );
            
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                STORAGE_KEYS.QUICK_LINKS,
                expect.stringContaining('GitHub')
            );
        });

        test('should display current time and greeting', () => {
            // Update time display
            greetingComponent.updateTimeDisplay();
            
            // Verify time is displayed in correct format
            const timeText = greetingComponent.timeDisplay.textContent;
            expect(timeText).toMatch(/^\d{2}:\d{2}:\d{2}$/);
            
            // Verify greeting is displayed
            const greetingText = greetingComponent.greetingDisplay.textContent;
            expect(['Good morning', 'Good afternoon', 'Good evening']).toContain(greetingText);
        });

        test('should show timer in correct initial state', () => {
            // Verify timer shows 25:00 initially
            expect(timerComponent.timerDisplay.textContent).toBe('25:00');
            expect(timerComponent.isRunning).toBe(false);
        });

        test('should show empty states for tasks and links', () => {
            // Verify empty messages are shown
            const taskEmptyMessage = document.querySelector('#task-list .empty-message');
            const linkEmptyMessage = document.querySelector('#link-list .empty-message');
            
            expect(taskEmptyMessage).toBeTruthy();
            expect(taskEmptyMessage.textContent).toBe('No tasks yet. Add one above!');
            
            expect(linkEmptyMessage).toBeTruthy();
            expect(linkEmptyMessage.textContent).toBe('No quick links yet. Add one above!');
        });

        test('should handle user interactions across components', () => {
            // Test greeting component name saving
            const nameInput = document.getElementById('name-input');
            const saveNameBtn = document.getElementById('save-name-btn');
            
            nameInput.value = 'Jane Smith';
            saveNameBtn.click();
            
            expect(greetingComponent.greetingDisplay.textContent).toContain('Jane Smith');
            
            // Test task addition
            const taskInput = document.getElementById('task-input');
            const addTaskBtn = document.getElementById('add-task-btn');
            
            taskInput.value = 'Test task';
            addTaskBtn.click();
            
            expect(taskComponent.tasks).toHaveLength(1);
            expect(taskComponent.tasks[0].text).toBe('Test task');
            
            // Test quick link addition
            const urlInput = document.getElementById('link-url-input');
            const labelInput = document.getElementById('link-label-input');
            const addLinkBtn = document.getElementById('add-link-btn');
            
            urlInput.value = 'https://example.com';
            labelInput.value = 'Example';
            addLinkBtn.click();
            
            expect(quickLinksComponent.links).toHaveLength(1);
            expect(quickLinksComponent.links[0].url).toBe('https://example.com');
        });

        test('should maintain component independence', () => {
            // Actions in one component should not affect others
            
            // Add data to each component
            greetingComponent.setName('Test User');
            taskComponent.addTask('Test Task');
            quickLinksComponent.addLink('https://test.com', 'Test');
            
            // Verify each component maintains its own state
            expect(greetingComponent.getName()).toBe('Test User');
            expect(taskComponent.tasks).toHaveLength(1);
            expect(quickLinksComponent.links).toHaveLength(1);
            
            // Timer should be unaffected
            expect(timerComponent.timeRemaining).toBe(1500);
            expect(timerComponent.isRunning).toBe(false);
        });
    });

    describe('Storage Manager Integration', () => {
        test('should use consistent storage keys across components', () => {
            // Verify all components use the same storage keys
            expect(STORAGE_KEYS.USER_NAME).toBe('dashboard_user_name');
            expect(STORAGE_KEYS.TASKS).toBe('dashboard_tasks');
            expect(STORAGE_KEYS.QUICK_LINKS).toBe('dashboard_quick_links');
        });

        test('should handle storage errors gracefully', () => {
            // Mock storage failure
            localStorageMock.setItem.mockImplementation(() => {
                throw new Error('Storage quota exceeded');
            });
            
            // Components should not crash on storage errors
            expect(() => {
                greetingComponent.setName('Test');
                taskComponent.addTask('Test task');
                quickLinksComponent.addLink('https://test.com', 'Test');
            }).not.toThrow();
        });
    });
});