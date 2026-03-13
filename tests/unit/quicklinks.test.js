import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Set up DOM environment
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<body>
    <div id="links-container" class="links-container">
        <h2>Quick Links</h2>
        <div class="link-input-section">
            <input type="text" id="link-url-input" placeholder="Enter URL" class="link-input">
            <input type="text" id="link-label-input" placeholder="Enter label" class="link-input">
            <button id="add-link-btn" class="add-link-btn">Add Link</button>
        </div>
        <div id="link-list" class="link-list"></div>
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
const { QuickLinksComponent, StorageManager, STORAGE_KEYS } = await import('../../js/app.js');

describe('QuickLinksComponent', () => {
    let component;
    let container;

    beforeEach(() => {
        // Reset DOM
        document.body.innerHTML = `
            <div id="links-container" class="links-container">
                <h2>Quick Links</h2>
                <div class="link-input-section">
                    <input type="text" id="link-url-input" placeholder="Enter URL" class="link-input">
                    <input type="text" id="link-label-input" placeholder="Enter label" class="link-input">
                    <button id="add-link-btn" class="add-link-btn">Add Link</button>
                </div>
                <div id="link-list" class="link-list"></div>
            </div>
        `;
        
        container = document.getElementById('links-container');
        component = new QuickLinksComponent(container);
        
        // Reset localStorage mocks
        vi.clearAllMocks();
        global.localStorage.getItem.mockReturnValue(null);
        global.localStorage.setItem.mockReturnValue(true);
    });

    describe('Initialization', () => {
        it('should initialize with empty links array', () => {
            expect(component.links).toEqual([]);
        });

        it('should find required DOM elements on init', () => {
            component.init();
            expect(component.urlInput).toBeTruthy();
            expect(component.labelInput).toBeTruthy();
            expect(component.addLinkBtn).toBeTruthy();
            expect(component.linkList).toBeTruthy();
        });
    });

    describe('URL Validation', () => {
        beforeEach(() => {
            component.init();
        });

        it('should validate correct URLs', () => {
            expect(component.validateUrl('https://example.com')).toBe(true);
            expect(component.validateUrl('http://example.com')).toBe(true);
            expect(component.validateUrl('https://github.com/user/repo')).toBe(true);
        });

        it('should reject invalid URLs', () => {
            expect(component.validateUrl('not-a-url')).toBe(false);
            expect(component.validateUrl('example.com')).toBe(false);
            expect(component.validateUrl('')).toBe(false);
            expect(component.validateUrl(null)).toBe(false);
        });
    });

    describe('Label Validation', () => {
        beforeEach(() => {
            component.init();
        });

        it('should validate non-empty labels', () => {
            expect(component.validateLabel('GitHub')).toBe(true);
            expect(component.validateLabel('My Website')).toBe(true);
            expect(component.validateLabel('  Valid Label  ')).toBe(true);
        });

        it('should reject empty or invalid labels', () => {
            expect(component.validateLabel('')).toBe(false);
            expect(component.validateLabel('   ')).toBe(false);
            expect(component.validateLabel(null)).toBe(false);
        });
    });

    describe('Adding Links', () => {
        beforeEach(() => {
            component.init();
        });

        it('should add valid link successfully', () => {
            const result = component.addLink('https://github.com', 'GitHub');
            expect(result).toBe(true);
            expect(component.links).toHaveLength(1);
            expect(component.links[0].url).toBe('https://github.com');
            expect(component.links[0].label).toBe('GitHub');
            expect(component.links[0].id).toBeTruthy();
        });

        it('should reject link with invalid URL', () => {
            const result = component.addLink('invalid-url', 'Test');
            expect(result).toBe(false);
            expect(component.links).toHaveLength(0);
        });

        it('should reject link with empty label', () => {
            const result = component.addLink('https://example.com', '');
            expect(result).toBe(false);
            expect(component.links).toHaveLength(0);
        });

        it('should trim whitespace from URL and label', () => {
            component.addLink('  https://example.com  ', '  Test Label  ');
            expect(component.links[0].url).toBe('https://example.com');
            expect(component.links[0].label).toBe('Test Label');
        });
    });

    describe('Deleting Links', () => {
        beforeEach(() => {
            component.init();
            component.addLink('https://github.com', 'GitHub');
            component.addLink('https://example.com', 'Example');
        });

        it('should delete existing link', () => {
            const linkId = component.links[0].id;
            const result = component.deleteLink(linkId);
            expect(result).toBe(true);
            expect(component.links).toHaveLength(1);
            expect(component.links.find(link => link.id === linkId)).toBeUndefined();
        });

        it('should return false for non-existent link', () => {
            const result = component.deleteLink('non-existent-id');
            expect(result).toBe(false);
            expect(component.links).toHaveLength(2);
        });
    });

    describe('ID Generation', () => {
        beforeEach(() => {
            component.init();
        });

        it('should generate unique IDs', () => {
            const id1 = component.generateId();
            const id2 = component.generateId();
            expect(id1).not.toBe(id2);
            expect(id1).toMatch(/^link_\d+_[a-z0-9]+$/);
            expect(id2).toMatch(/^link_\d+_[a-z0-9]+$/);
        });
    });
});