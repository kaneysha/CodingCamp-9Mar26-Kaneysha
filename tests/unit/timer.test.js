import { describe, test, beforeEach, expect, vi, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';

// Set up DOM environment
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<body>
    <div id="timer-container" class="timer-container">
        <h2>Focus Timer</h2>
        <div id="timer-display" class="timer-display">25:00</div>
        <div class="timer-controls">
            <button id="start-timer-btn" class="timer-btn start-btn">Start</button>
            <button id="stop-timer-btn" class="timer-btn stop-btn">Stop</button>
            <button id="reset-timer-btn" class="timer-btn reset-btn">Reset</button>
        </div>
    </div>
</body>
</html>
`);

global.window = dom.window;
global.document = dom.window.document;

// Import the application code after setting up the DOM
const { TimerComponent } = await import('../../js/app.js');

describe('TimerComponent', () => {
    let component;
    let container;

    beforeEach(() => {
        // Reset DOM
        document.body.innerHTML = `
            <div id="timer-container" class="timer-container">
                <h2>Focus Timer</h2>
                <div id="timer-display" class="timer-display">25:00</div>
                <div class="timer-controls">
                    <button id="start-timer-btn" class="timer-btn start-btn">Start</button>
                    <button id="stop-timer-btn" class="timer-btn stop-btn">Stop</button>
                    <button id="reset-timer-btn" class="timer-btn reset-btn">Reset</button>
                </div>
            </div>
        `;
        
        container = document.getElementById('timer-container');
        component = new TimerComponent(container);
        
        // Mock timers
        vi.useFakeTimers();
    });

    afterEach(() => {
        // Clean up
        if (component) {
            component.destroy();
        }
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    describe('Initialization', () => {
        test('should initialize with 25 minutes (1500 seconds)', () => {
            expect(component.timeRemaining).toBe(1500);
            expect(component.isRunning).toBe(false);
        });

        test('should find required DOM elements on init', () => {
            component.init();
            expect(component.timerDisplay).toBeTruthy();
            expect(component.startBtn).toBeTruthy();
            expect(component.stopBtn).toBeTruthy();
            expect(component.resetBtn).toBeTruthy();
        });

        test('should display initial time as 25:00', () => {
            component.init();
            expect(component.timerDisplay.textContent).toBe('25:00');
        });
    });

    describe('Time Formatting', () => {
        test('should format time as MM:SS with zero padding', () => {
            expect(component.formatTime(1500)).toBe('25:00'); // 25 minutes
            expect(component.formatTime(65)).toBe('01:05');   // 1 minute 5 seconds
            expect(component.formatTime(5)).toBe('00:05');    // 5 seconds
            expect(component.formatTime(0)).toBe('00:00');    // 0 seconds
        });

        test('should handle edge cases in formatting', () => {
            expect(component.formatTime(3599)).toBe('59:59'); // 59 minutes 59 seconds
            expect(component.formatTime(60)).toBe('01:00');   // exactly 1 minute
            expect(component.formatTime(59)).toBe('00:59');   // 59 seconds
        });
    });

    describe('Timer Controls', () => {
        beforeEach(() => {
            component.init();
        });

        test('should start timer when start button is clicked', () => {
            component.start();
            expect(component.isRunning).toBe(true);
            expect(component.interval).toBeTruthy();
        });

        test('should stop timer when stop button is clicked', () => {
            component.start();
            component.stop();
            expect(component.isRunning).toBe(false);
            expect(component.interval).toBe(null);
        });

        test('should reset timer to 25 minutes when reset button is clicked', () => {
            component.timeRemaining = 1000; // Set to some other value
            component.reset();
            expect(component.timeRemaining).toBe(1500);
            expect(component.isRunning).toBe(false);
        });

        test('should not start if already running', () => {
            component.start();
            const firstInterval = component.interval;
            component.start(); // Try to start again
            expect(component.interval).toBe(firstInterval);
        });

        test('should not start if time remaining is 0', () => {
            component.timeRemaining = 0;
            component.start();
            expect(component.isRunning).toBe(false);
            expect(component.interval).toBe(null);
        });
    });

    describe('Timer Countdown', () => {
        beforeEach(() => {
            component.init();
        });

        test('should decrease time remaining when running', () => {
            component.timeRemaining = 10;
            component.start();
            
            // Advance timer by 3 seconds
            vi.advanceTimersByTime(3000);
            
            expect(component.timeRemaining).toBe(7);
        });

        test('should update display during countdown', () => {
            component.timeRemaining = 65; // 1:05
            component.start();
            
            // Advance timer by 1 second
            vi.advanceTimersByTime(1000);
            
            expect(component.timerDisplay.textContent).toBe('01:04');
        });

        test('should stop when reaching zero', () => {
            component.timeRemaining = 2;
            component.start();
            
            // Advance timer by 3 seconds (more than remaining)
            vi.advanceTimersByTime(3000);
            
            expect(component.timeRemaining).toBe(0);
            expect(component.isRunning).toBe(false);
            expect(component.timerDisplay.textContent).toBe('00:00');
        });

        test('should call onTimerComplete when reaching zero', () => {
            const consoleSpy = vi.spyOn(console, 'log');
            component.timeRemaining = 1;
            component.start();
            
            // Advance timer by 2 seconds
            vi.advanceTimersByTime(2000);
            
            expect(consoleSpy).toHaveBeenCalledWith('Timer completed!');
        });
    });

    describe('Pause and Resume', () => {
        beforeEach(() => {
            component.init();
        });

        test('should preserve time when paused', () => {
            component.timeRemaining = 100;
            component.start();
            
            // Run for 3 seconds
            vi.advanceTimersByTime(3000);
            expect(component.timeRemaining).toBe(97);
            
            // Pause
            component.stop();
            
            // Advance time while paused
            vi.advanceTimersByTime(5000);
            
            // Time should not have changed while paused
            expect(component.timeRemaining).toBe(97);
        });

        test('should resume from paused time', () => {
            component.timeRemaining = 100;
            component.start();
            
            // Run for 2 seconds
            vi.advanceTimersByTime(2000);
            expect(component.timeRemaining).toBe(98);
            
            // Pause and resume
            component.stop();
            component.start();
            
            // Run for 1 more second
            vi.advanceTimersByTime(1000);
            expect(component.timeRemaining).toBe(97);
        });
    });
});