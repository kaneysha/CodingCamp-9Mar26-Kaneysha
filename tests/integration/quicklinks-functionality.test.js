import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Set up DOM environment with full HTML structure
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

// Mock window.open for testing link opening
global.window.open = vi.fn();

// Import the application code after setting up the DOM
const { QuickLinksComponent, StorageManager, STORAGE_KEYS } = await import('../../js/app.js');

describe('Quick Links Integration Tests', () => {
    let component;
    let container;
    let urlInput;
    let labelInput;
    let addButton;
    let linkList;

    beforeEach(() => {
        // Reset DOM to ensure clean state
        document.body.innerHTML = `
            <div class="dashboard">
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

        // Get DOM elements
        container = document.getElementById('links-container');
        urlInput = document.getElementById('link-url-input');
        labelInput = document.getElementById('link-label-input');
        addButton = document.getElementById('add-link-btn');
        linkList = document.getElementById('link-list');

        // Initialize component
        component = new QuickLinksComponent(container);
        component.init();
    });

    describe('Full workflow integration', () => {
        it('should add, display, and persist a quick link', () => {
            // Add a link through the UI
            urlInput.value = 'https://github.com';
            labelInput.value = 'GitHub';
            addButton.click();

            // Verify the link was added to the component
            expect(component.links).toHaveLength(1);
            expect(component.links[0].url).toBe('https://github.com');
            expect(component.links[0].label).toBe('GitHub');

            // Verify the link was persisted to localStorage
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                STORAGE_KEYS.QUICK_LINKS,
                JSON.stringify(component.links)
            );

            // Verify the link appears in the DOM
            const linkItems = linkList.querySelectorAll('.link-item');
            expect(linkItems).toHaveLength(1);
            
            const linkLabel = linkItems[0].querySelector('.link-label');
            const linkUrl = linkItems[0].querySelector('.link-url');
            expect(linkLabel.textContent).toBe('GitHub');
            expect(linkUrl.textContent).toBe('https://github.com');

            // Verify inputs were cleared
            expect(urlInput.value).toBe('');
            expect(labelInput.value).toBe('');
        });

        it('should load persisted links on initialization', () => {
            // Pre-populate localStorage with links
            const existingLinks = [
                { id: 'link_1', url: 'https://example.com', label: 'Example' },
                { id: 'link_2', url: 'https://github.com', label: 'GitHub' }
            ];
            localStorageMock.store[STORAGE_KEYS.QUICK_LINKS] = JSON.stringify(existingLinks);

            // Create new component instance
            const newComponent = new QuickLinksComponent(container);
            newComponent.init();

            // Verify links were loaded
            expect(newComponent.links).toHaveLength(2);
            expect(newComponent.links[0].label).toBe('Example');
            expect(newComponent.links[1].label).toBe('GitHub');

            // Verify links appear in DOM
            const linkItems = linkList.querySelectorAll('.link-item');
            expect(linkItems).toHaveLength(2);
        });

        it('should open link in new tab when clicked', () => {
            // Add a link
            component.addLink('https://github.com', 'GitHub');

            // Find the link content element
            const linkContent = linkList.querySelector('.link-content');
            expect(linkContent).toBeTruthy();

            // Click the link
            linkContent.click();

            // Verify window.open was called with correct parameters
            expect(global.window.open).toHaveBeenCalledWith(
                'https://github.com',
                '_blank',
                'noopener,noreferrer'
            );
        });

        it('should delete link when delete button is clicked', () => {
            // Add two links
            component.addLink('https://github.com', 'GitHub');
            component.addLink('https://example.com', 'Example');

            expect(component.links).toHaveLength(2);

            // Find and click the delete button for the first link
            const deleteButton = linkList.querySelector('.link-delete-btn');
            expect(deleteButton).toBeTruthy();
            deleteButton.click();

            // Verify link was deleted
            expect(component.links).toHaveLength(1);
            expect(component.links[0].label).toBe('Example');

            // Verify DOM was updated
            const linkItems = linkList.querySelectorAll('.link-item');
            expect(linkItems).toHaveLength(1);

            // Verify localStorage was updated
            expect(localStorageMock.setItem).toHaveBeenLastCalledWith(
                STORAGE_KEYS.QUICK_LINKS,
                JSON.stringify(component.links)
            );
        });

        it('should show error for invalid URL', () => {
            // Try to add invalid URL
            urlInput.value = 'not-a-valid-url';
            labelInput.value = 'Invalid';
            addButton.click();

            // Verify no link was added
            expect(component.links).toHaveLength(0);

            // Verify error message is shown
            const errorMessage = container.querySelector('.error-message');
            expect(errorMessage).toBeTruthy();
            expect(errorMessage.classList.contains('show')).toBe(true);
            expect(errorMessage.textContent).toContain('valid URL');
        });

        it('should show error for empty label', () => {
            // Try to add link with empty label
            urlInput.value = 'https://example.com';
            labelInput.value = '';
            addButton.click();

            // Verify no link was added
            expect(component.links).toHaveLength(0);

            // Verify error message is shown
            const errorMessage = container.querySelector('.error-message');
            expect(errorMessage).toBeTruthy();
            expect(errorMessage.classList.contains('show')).toBe(true);
            expect(errorMessage.textContent).toContain('label');
        });

        it('should handle keyboard navigation', () => {
            // Add a link
            component.addLink('https://github.com', 'GitHub');

            // Find the link content element
            const linkContent = linkList.querySelector('.link-content');
            expect(linkContent).toBeTruthy();

            // Simulate Enter key press
            const enterEvent = new dom.window.KeyboardEvent('keypress', { key: 'Enter' });
            linkContent.dispatchEvent(enterEvent);

            // Verify window.open was called
            expect(global.window.open).toHaveBeenCalledWith(
                'https://github.com',
                '_blank',
                'noopener,noreferrer'
            );
        });
    });

    describe('Empty state', () => {
        it('should show empty message when no links exist', () => {
            // Verify empty message is shown
            const emptyMessage = linkList.querySelector('.empty-message');
            expect(emptyMessage).toBeTruthy();
            expect(emptyMessage.textContent).toBe('No quick links yet. Add one above!');
        });

        it('should hide empty message when links are added', () => {
            // Initially should show empty message
            expect(linkList.querySelector('.empty-message')).toBeTruthy();

            // Add a link
            component.addLink('https://github.com', 'GitHub');

            // Empty message should be gone
            expect(linkList.querySelector('.empty-message')).toBeFalsy();

            // Should show link item instead
            expect(linkList.querySelector('.link-item')).toBeTruthy();
        });
    });
});