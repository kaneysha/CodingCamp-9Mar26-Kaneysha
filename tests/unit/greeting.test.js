import { describe, test, beforeEach, expect, vi, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';

// Set up DOM environment
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<body>
    <div id="greeting-container" class="greeting-container">
        <div id="time-display" class="time-display"></div>
        <div id="date-display" class="date-display"></div>
        <div id="greeting-display" class="greeting-display"></div>
        <div class="name-input-section">
            <input type="text" id="name-input" placeholder="Enter your name" class="name-input">
            <button id="save-name-btn" class="save-name-btn">Save</button>
        </div>
    </div>
</body>
</html>
`);

global.window = dom.window;
global.document = dom.window.document;
global.localStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
};

// Import the application code after setting up the DOM
const { GreetingComponent, StorageManager, STORAGE_KEYS } = await import('../../js/app.js');

describe('GreetingComponent', () => {
    let component;
    let container;

    beforeEach(() => {
        // Reset DOM
        document.body.innerHTML = `
            <div id="greeting-container" class="greeting-container">
                <div id="time-display" class="time-display"></div>
                <div id="date-display" class="date-display"></div>
                <div id="greeting-display" class="greeting-display"></div>
                <div class="name-input-section">
                    <input type="text" id="name-input" placeholder="Enter your name" class="name-input">
                    <button id="save-name-btn" class="save-name-btn">Save</button>
                </div>
            </div>
        `;
        
        container = document.getElementById('greeting-container');
        component = new GreetingComponent(container);
        
        // Reset localStorage mocks
        vi.clearAllMocks();
        global.localStorage.getItem.mockReturnValue(null);
        global.localStorage.setItem.mockReturnValue(true);
    });

    afterEach(() => {
        // Clean up intervals
        if (component) {
            component.destroy();
        }
    });

    describe('Initialization', () => {
        test('should initialize with required DOM elements', () => {
            component.init();
            expect(component.timeDisplay).toBeTruthy();
            expect(component.dateDisplay).toBeTruthy();
            expect(component.greetingDisplay).toBeTruthy();
            expect(component.nameInput).toBeTruthy();
            expect(component.saveNameBtn).toBeTruthy();
        });

        test('should start time updates on init', () => {
            component.init();
            expect(component.updateInterval).toBeTruthy();
        });
    });

    describe('Time Display', () => {
        test('should format time in 24-hour format', () => {
            component.init();
            component.updateTimeDisplay();
            
            const timeText = component.timeDisplay.textContent;
            // Should match HH:MM:SS format
            expect(timeText).toMatch(/^\d{2}:\d{2}:\d{2}$/);
        });

        test('should display date with day, month, and day number', () => {
            component.init();
            component.updateTimeDisplay();
            
            const dateText = component.dateDisplay.textContent;
            // Should contain day of week and month name
            expect(dateText).toMatch(/\w+day.*\w+.*\d+/);
        });
    });

    describe('Greeting Logic', () => {
        test('should return "Good morning" for morning hours', () => {
            // Mock Date to return 9 AM
            const mockDate = new Date();
            mockDate.setHours(9, 0, 0, 0);
            vi.spyOn(global, 'Date').mockImplementation(() => mockDate);

            const greeting = component.getGreeting();
            expect(greeting).toBe('Good morning');

            vi.restoreAllMocks();
        });

        test('should return "Good afternoon" for afternoon hours', () => {
            // Mock Date to return 2 PM
            const mockDate = new Date();
            mockDate.setHours(14, 0, 0, 0);
            vi.spyOn(global, 'Date').mockImplementation(() => mockDate);

            const greeting = component.getGreeting();
            expect(greeting).toBe('Good afternoon');

            vi.restoreAllMocks();
        });

        test('should return "Good evening" for evening hours', () => {
            // Mock Date to return 8 PM
            const mockDate = new Date();
            mockDate.setHours(20, 0, 0, 0);
            vi.spyOn(global, 'Date').mockImplementation(() => mockDate);

            const greeting = component.getGreeting();
            expect(greeting).toBe('Good evening');

            vi.restoreAllMocks();
        });
    });

    describe('Name Management', () => {
        beforeEach(() => {
            component.init();
        });

        test('should save name to storage', () => {
            component.setName('John Doe');
            expect(global.localStorage.setItem).toHaveBeenCalledWith(
                STORAGE_KEYS.USER_NAME,
                JSON.stringify('John Doe')
            );
        });

        test('should include name in greeting when available', () => {
            // Mock stored name
            global.localStorage.getItem.mockReturnValue(JSON.stringify('John'));
            
            component.renderGreeting();
            const greetingText = component.greetingDisplay.textContent;
            expect(greetingText).toContain('John');
        });

        test('should show generic greeting when no name stored', () => {
            global.localStorage.getItem.mockReturnValue(null);
            
            component.renderGreeting();
            const greetingText = component.greetingDisplay.textContent;
            expect(greetingText).not.toContain(',');
            expect(['Good morning', 'Good afternoon', 'Good evening']).toContain(greetingText);
        });

        test('should handle save name button click', () => {
            component.nameInput.value = 'Jane Doe';
            component.handleSaveName();
            
            expect(global.localStorage.setItem).toHaveBeenCalledWith(
                STORAGE_KEYS.USER_NAME,
                JSON.stringify('Jane Doe')
            );
        });
    });
});