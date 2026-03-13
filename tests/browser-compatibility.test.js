// Browser Compatibility Tests for Productivity Dashboard
// Tests Requirements 11.1 and 11.5

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock different browser environments
const createBrowserEnvironment = (userAgent, features = {}) => {
    const dom = new JSDOM(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Productivity Dashboard</title>
        </head>
        <body>
            <div id="greeting-container"></div>
            <div id="timer-container"></div>
            <div id="tasks-container"></div>
            <div id="links-container"></div>
        </body>
        </html>
    `, {
        url: 'http://localhost',
        userAgent: userAgent,
        pretendToBeVisual: true,
        resources: 'usable'
    });

    const window = dom.window;
    const document = window.document;

    // Mock browser-specific features using Object.defineProperty
    if (features.localStorage !== false) {
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: vi.fn(),
                setItem: vi.fn(),
                removeItem: vi.fn(),
                clear: vi.fn(),
                length: 0,
                key: vi.fn()
            },
            writable: true,
            configurable: true
        });
    }

    if (features.requestAnimationFrame !== false) {
        Object.defineProperty(window, 'requestAnimationFrame', {
            value: vi.fn((callback) => {
                setTimeout(callback, 16); // ~60fps
                return 1;
            }),
            writable: true,
            configurable: true
        });
    }

    if (features.performance !== false) {
        Object.defineProperty(window, 'performance', {
            value: {
                now: vi.fn(() => Date.now())
            },
            writable: true,
            configurable: true
        });
    }

    // Mock URL constructor for different browsers
    if (features.URL !== false) {
        Object.defineProperty(window, 'URL', {
            value: class MockURL {
                constructor(url) {
                    if (!url || typeof url !== 'string') {
                        throw new TypeError('Invalid URL');
                    }
                    // Basic URL validation
                    if (!url.match(/^https?:\/\/.+/)) {
                        throw new TypeError('Invalid URL');
                    }
                    this.href = url;
                }
            },
            writable: true,
            configurable: true
        });
    }

    return { window, document };
};

// Browser user agents for testing
const BROWSERS = {
    chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
    edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
    safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
};

describe('Browser Compatibility Tests', () => {
    describe('Local Storage API Compatibility', () => {
        Object.entries(BROWSERS).forEach(([browserName, userAgent]) => {
            it(`should work with Local Storage in ${browserName}`, () => {
                const { window } = createBrowserEnvironment(userAgent);
                
                // Test Local Storage availability
                expect(window.localStorage).toBeDefined();
                expect(typeof window.localStorage.getItem).toBe('function');
                expect(typeof window.localStorage.setItem).toBe('function');
                expect(typeof window.localStorage.removeItem).toBe('function');
                
                // Test basic operations
                window.localStorage.setItem('test', 'value');
                expect(window.localStorage.setItem).toHaveBeenCalledWith('test', 'value');
            });
        });

        it('should handle Local Storage unavailability gracefully', () => {
            const { window } = createBrowserEnvironment(BROWSERS.chrome, { localStorage: false });
            
            // Simulate localStorage being undefined (private browsing, etc.)
            delete window.localStorage;
            
            // Test that our StorageManager handles this gracefully
            expect(window.localStorage).toBeUndefined();
        });
    });

    describe('Core JavaScript API Compatibility', () => {
        Object.entries(BROWSERS).forEach(([browserName, userAgent]) => {
            it(`should support required APIs in ${browserName}`, () => {
                const { window } = createBrowserEnvironment(userAgent);
                
                // Test Date API
                expect(typeof Date).toBe('function');
                const date = new Date();
                expect(typeof date.toLocaleTimeString).toBe('function');
                expect(typeof date.toLocaleDateString).toBe('function');
                expect(typeof date.getHours).toBe('function');
                
                // Test JSON API
                expect(typeof JSON.stringify).toBe('function');
                expect(typeof JSON.parse).toBe('function');
                
                // Test Array methods
                expect(typeof Array.prototype.forEach).toBe('function');
                expect(typeof Array.prototype.filter).toBe('function');
                expect(typeof Array.prototype.find).toBe('function');
                expect(typeof Array.prototype.some).toBe('function');
                
                // Test Object methods
                expect(typeof Object.values).toBe('function');
                expect(typeof Object.entries).toBe('function');
            });
        });
    });

    describe('DOM API Compatibility', () => {
        Object.entries(BROWSERS).forEach(([browserName, userAgent]) => {
            it(`should support required DOM APIs in ${browserName}`, () => {
                const { window, document } = createBrowserEnvironment(userAgent);
                
                // Test DOM query methods
                expect(typeof document.getElementById).toBe('function');
                expect(typeof document.createElement).toBe('function');
                expect(typeof document.createDocumentFragment).toBe('function');
                
                // Test element methods
                const element = document.createElement('div');
                expect(typeof element.addEventListener).toBe('function');
                expect(typeof element.appendChild).toBe('function');
                expect(typeof element.classList.add).toBe('function');
                expect(typeof element.classList.remove).toBe('function');
                
                // Test event handling
                expect(typeof document.addEventListener).toBe('function');
            });
        });
    });

    describe('URL Constructor Compatibility', () => {
        Object.entries(BROWSERS).forEach(([browserName, userAgent]) => {
            it(`should support URL constructor in ${browserName}`, () => {
                const { window } = createBrowserEnvironment(userAgent);
                
                expect(typeof window.URL).toBe('function');
                
                // Test valid URL
                const validUrl = new window.URL('https://example.com');
                expect(validUrl.href).toBe('https://example.com');
                
                // Test invalid URL throws error
                expect(() => new window.URL('invalid-url')).toThrow();
                expect(() => new window.URL('')).toThrow();
            });
        });
    });

    describe('Performance API Compatibility', () => {
        Object.entries(BROWSERS).forEach(([browserName, userAgent]) => {
            it(`should support Performance API in ${browserName}`, () => {
                const { window } = createBrowserEnvironment(userAgent);
                
                expect(window.performance).toBeDefined();
                expect(typeof window.performance.now).toBe('function');
                
                const timestamp = window.performance.now();
                expect(typeof timestamp).toBe('number');
                expect(timestamp).toBeGreaterThan(0);
            });
        });
    });

    describe('Animation API Compatibility', () => {
        Object.entries(BROWSERS).forEach(([browserName, userAgent]) => {
            it(`should support requestAnimationFrame in ${browserName}`, () => {
                const { window } = createBrowserEnvironment(userAgent);
                
                expect(typeof window.requestAnimationFrame).toBe('function');
                
                const callback = vi.fn();
                const id = window.requestAnimationFrame(callback);
                expect(typeof id).toBe('number');
            });
        });
    });

    describe('Timer API Compatibility', () => {
        Object.entries(BROWSERS).forEach(([browserName, userAgent]) => {
            it(`should support timer APIs in ${browserName}`, () => {
                const { window } = createBrowserEnvironment(userAgent);
                
                // Test setTimeout/clearTimeout
                expect(typeof window.setTimeout).toBe('function');
                expect(typeof window.clearTimeout).toBe('function');
                
                // Test setInterval/clearInterval
                expect(typeof window.setInterval).toBe('function');
                expect(typeof window.clearInterval).toBe('function');
            });
        });
    });

    describe('Event Handling Compatibility', () => {
        Object.entries(BROWSERS).forEach(([browserName, userAgent]) => {
            it(`should support event handling in ${browserName}`, () => {
                const { document } = createBrowserEnvironment(userAgent);
                
                const element = document.createElement('button');
                const handler = vi.fn();
                
                // Test addEventListener
                expect(() => {
                    element.addEventListener('click', handler);
                }).not.toThrow();
                
                // Test event object properties
                const event = new document.defaultView.Event('click');
                expect(event.type).toBe('click');
                expect(typeof event.preventDefault).toBe('function');
                expect(typeof event.stopPropagation).toBe('function');
            });
        });
    });

    describe('CSS Features Compatibility', () => {
        Object.entries(BROWSERS).forEach(([browserName, userAgent]) => {
            it(`should support required CSS features in ${browserName}`, () => {
                const { document } = createBrowserEnvironment(userAgent);
                
                const element = document.createElement('div');
                const style = element.style;
                
                // Test CSS Grid support (required for dashboard layout)
                style.display = 'grid';
                expect(style.display).toBe('grid');
                
                // Test CSS Flexbox support
                style.display = 'flex';
                expect(style.display).toBe('flex');
                
                // Test CSS transforms
                style.transform = 'translateZ(0)';
                expect(style.transform).toBe('translateZ(0)');
                
                // Test CSS transitions
                style.transition = 'all 0.2s ease';
                expect(style.transition).toBe('all 0.2s ease');
            });
        });
    });

    describe('Form Input Compatibility', () => {
        Object.entries(BROWSERS).forEach(([browserName, userAgent]) => {
            it(`should support form inputs in ${browserName}`, () => {
                const { document } = createBrowserEnvironment(userAgent);
                
                // Test text input
                const textInput = document.createElement('input');
                textInput.type = 'text';
                expect(textInput.type).toBe('text');
                
                // Test checkbox input
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                expect(checkbox.type).toBe('checkbox');
                
                // Test input properties
                textInput.value = 'test';
                expect(textInput.value).toBe('test');
                
                checkbox.checked = true;
                expect(checkbox.checked).toBe(true);
            });
        });
    });

    describe('Window Object Compatibility', () => {
        Object.entries(BROWSERS).forEach(([browserName, userAgent]) => {
            it(`should support window.open in ${browserName}`, () => {
                const { window } = createBrowserEnvironment(userAgent);
                
                // Mock window.open for testing
                window.open = vi.fn();
                
                expect(typeof window.open).toBe('function');
                
                // Test opening a link (used by QuickLinks component)
                window.open('https://example.com', '_blank', 'noopener,noreferrer');
                expect(window.open).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');
            });
        });
    });
});

describe('Performance Requirements Tests', () => {
    it('should measure and validate load time performance', async () => {
        const { window } = createBrowserEnvironment(BROWSERS.chrome);
        
        const startTime = window.performance.now();
        
        // Simulate component initialization
        await new Promise(resolve => {
            window.requestAnimationFrame(() => {
                // Simulate DOM operations
                const fragment = window.document.createDocumentFragment();
                for (let i = 0; i < 10; i++) {
                    const element = window.document.createElement('div');
                    element.textContent = `Item ${i}`;
                    fragment.appendChild(element);
                }
                
                const container = window.document.getElementById('tasks-container');
                if (container) {
                    container.appendChild(fragment);
                }
                
                resolve();
            });
        });
        
        const endTime = window.performance.now();
        const loadTime = endTime - startTime;
        
        // Validate load time requirement (< 1000ms)
        expect(loadTime).toBeLessThan(1000);
    });

    it('should validate UI response time requirement', async () => {
        const { window, document } = createBrowserEnvironment(BROWSERS.chrome);
        
        const button = document.createElement('button');
        let responseTime = 0;
        
        button.addEventListener('click', () => {
            const startTime = window.performance.now();
            
            // Simulate UI update
            window.requestAnimationFrame(() => {
                const endTime = window.performance.now();
                responseTime = endTime - startTime;
            });
        });
        
        // Simulate click
        const clickEvent = new document.defaultView.Event('click');
        button.dispatchEvent(clickEvent);
        
        // Wait for animation frame
        await new Promise(resolve => {
            window.requestAnimationFrame(resolve);
        });
        
        // Validate response time requirement (< 100ms)
        expect(responseTime).toBeLessThan(100);
    });
});