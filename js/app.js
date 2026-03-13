// Productivity Dashboard - Main Application
// Storage keys
const STORAGE_KEYS = {
    USER_NAME: 'dashboard_user_name',
    TASKS: 'dashboard_tasks',
    QUICK_LINKS: 'dashboard_quick_links'
};

// Storage Manager Class
class StorageManager {
    // Check if Local Storage is available
    static isAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            console.error('Local Storage is not available:', e);
            return false;
        }
    }

    // Get item from Local Storage
    static get(key) {
        try {
            if (!this.isAvailable()) {
                return null;
            }
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error('Error retrieving from storage:', e);
            return null;
        }
    }

    // Set item in Local Storage
    static set(key, value) {
        try {
            if (!this.isAvailable()) {
                return false;
            }
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                console.error('Storage quota exceeded. Please clear some data.');
            } else {
                console.error('Error saving to storage:', e);
            }
            return false;
        }
    }

    // Remove item from Local Storage
    static remove(key) {
        try {
            if (!this.isAvailable()) {
                return false;
            }
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Error removing from storage:', e);
            return false;
        }
    }

    // Clear all application data
    static clear() {
        try {
            if (!this.isAvailable()) {
                return false;
            }
            Object.values(STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            return true;
        } catch (e) {
            console.error('Error clearing storage:', e);
            return false;
        }
    }
}

// Greeting Component Class
class GreetingComponent {
    constructor(containerElement) {
        this.container = containerElement;
        this.timeDisplay = null;
        this.dateDisplay = null;
        this.greetingDisplay = null;
        this.nameInput = null;
        this.saveNameBtn = null;
        this.updateInterval = null;
    }

    // Initialize component and start time updates
    init() {
        if (!this.container) {
            console.error('Greeting container element not found');
            return;
        }

        // Get DOM elements
        this.timeDisplay = document.getElementById('time-display');
        this.dateDisplay = document.getElementById('date-display');
        this.greetingDisplay = document.getElementById('greeting-display');
        this.nameInput = document.getElementById('name-input');
        this.saveNameBtn = document.getElementById('save-name-btn');

        if (!this.timeDisplay || !this.dateDisplay || !this.greetingDisplay || !this.nameInput || !this.saveNameBtn) {
            console.error('Required greeting elements not found');
            return;
        }

        // Set up event listeners
        this.saveNameBtn.addEventListener('click', () => this.handleSaveName());
        this.nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSaveName();
            }
        });

        // Load stored name
        const storedName = this.getName();
        if (storedName) {
            this.nameInput.value = storedName;
        }

        // Start time updates
        this.updateTimeDisplay();
        this.updateInterval = setInterval(() => this.updateTimeDisplay(), 1000);
    }

    // Update time and date display with performance optimizations
    updateTimeDisplay() {
        const now = new Date();
        
        // Cache formatted strings to avoid unnecessary DOM updates
        const timeString = now.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        const dateString = now.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
        });

        // Only update DOM if values have changed (minimize reflows)
        if (this.timeDisplay && this.timeDisplay.textContent !== timeString) {
            this.timeDisplay.textContent = timeString;
        }
        if (this.dateDisplay && this.dateDisplay.textContent !== dateString) {
            this.dateDisplay.textContent = dateString;
        }

        // Only update greeting if time-based greeting might have changed
        const currentHour = now.getHours();
        if (!this.lastGreetingHour || this.lastGreetingHour !== currentHour) {
            this.lastGreetingHour = currentHour;
            this.renderGreeting();
        }
    }

    // Get appropriate greeting based on current time
    getGreeting() {
        const now = new Date();
        const hours = now.getHours();

        if (hours >= 5 && hours < 12) {
            return 'Good morning';
        } else if (hours >= 12 && hours < 17) {
            return 'Good afternoon';
        } else {
            return 'Good evening';
        }
    }

    // Set user name
    setName(name) {
        const trimmedName = name ? name.trim() : '';
        if (trimmedName) {
            StorageManager.set(STORAGE_KEYS.USER_NAME, trimmedName);
        } else {
            StorageManager.remove(STORAGE_KEYS.USER_NAME);
        }
        this.renderGreeting();
    }

    // Get stored user name
    getName() {
        return StorageManager.get(STORAGE_KEYS.USER_NAME);
    }

    // Render greeting with name if available
    renderGreeting() {
        if (!this.greetingDisplay) return;

        const greeting = this.getGreeting();
        const name = this.getName();
        
        if (name) {
            this.greetingDisplay.textContent = `${greeting}, ${name}!`;
        } else {
            this.greetingDisplay.textContent = greeting;
        }
    }

    // Handle save name button click
    handleSaveName() {
        const name = this.nameInput.value;
        this.setName(name);
    }

    // Clean up interval when component is destroyed
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

// Timer Component Class
class TimerComponent {
    constructor(containerElement) {
        this.container = containerElement;
        this.timerDisplay = null;
        this.startBtn = null;
        this.stopBtn = null;
        this.resetBtn = null;
        this.timeRemaining = 1500; // 25 minutes in seconds
        this.isRunning = false;
        this.interval = null;
    }

    // Initialize timer at 25 minutes
    init() {
        if (!this.container) {
            console.error('Timer container element not found');
            return;
        }

        // Get DOM elements
        this.timerDisplay = document.getElementById('timer-display');
        this.startBtn = document.getElementById('start-timer-btn');
        this.stopBtn = document.getElementById('stop-timer-btn');
        this.resetBtn = document.getElementById('reset-timer-btn');

        if (!this.timerDisplay || !this.startBtn || !this.stopBtn || !this.resetBtn) {
            console.error('Required timer elements not found');
            return;
        }

        // Set up event listeners
        this.startBtn.addEventListener('click', () => this.start());
        this.stopBtn.addEventListener('click', () => this.stop());
        this.resetBtn.addEventListener('click', () => this.reset());

        // Initial display update
        this.updateDisplay();
    }

    // Start countdown
    start() {
        if (!this.isRunning && this.timeRemaining > 0) {
            this.isRunning = true;
            this.interval = setInterval(() => {
                this.timeRemaining--;
                this.updateDisplay();
                
                if (this.timeRemaining <= 0) {
                    this.onTimerComplete();
                }
            }, 1000);
        }
    }

    // Pause countdown
    stop() {
        if (this.isRunning) {
            this.isRunning = false;
            if (this.interval) {
                clearInterval(this.interval);
                this.interval = null;
            }
        }
    }

    // Reset to 25 minutes
    reset() {
        this.stop();
        this.timeRemaining = 1500; // 25 minutes
        this.updateDisplay();
    }

    // Update display with current time
    updateDisplay() {
        if (this.timerDisplay) {
            this.timerDisplay.textContent = this.formatTime(this.timeRemaining);
        }
    }

    // Format seconds as MM:SS
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // Handle timer completion
    onTimerComplete() {
        this.stop();
        this.timeRemaining = 0;
        this.updateDisplay();
        
        // Emit event for component communication
        if (window.appEventBus) {
            window.appEventBus.emit('timer:complete', {
                duration: 1500, // 25 minutes in seconds
                completedAt: new Date().toISOString()
            });
        }
        
        console.log('Timer completed!');
    }

    // Clean up interval when component is destroyed
    destroy() {
        this.stop();
    }
}

// Task Component Class
class TaskComponent {
    constructor(containerElement) {
        this.container = containerElement;
        this.tasks = [];
        this.taskInput = null;
        this.addTaskBtn = null;
        this.taskList = null;
    }

    // Initialize component and load tasks
    init() {
        if (!this.container) {
            console.error('Task container element not found');
            return;
        }

        // Get DOM elements
        this.taskInput = document.getElementById('task-input');
        this.addTaskBtn = document.getElementById('add-task-btn');
        this.taskList = document.getElementById('task-list');

        if (!this.taskInput || !this.addTaskBtn || !this.taskList) {
            console.error('Required task elements not found');
            return;
        }

        // Load tasks from storage
        this.loadTasks();

        // Set up event listeners
        this.addTaskBtn.addEventListener('click', () => this.handleAddTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleAddTask();
            }
        });

        // Initial render
        this.renderTasks();
    }

    // Generate unique ID using timestamp + random component
    generateId() {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Validate task text
    validateTask(text) {
        if (!text || typeof text !== 'string') {
            return false;
        }
        const trimmedText = text.trim();
        return trimmedText.length > 0;
    }

    // Check for duplicate tasks
    isDuplicate(text) {
        const trimmedText = text.trim();
        return this.tasks.some(task => task.text === trimmedText);
    }

    // Add new task
    addTask(text) {
        if (!this.validateTask(text)) {
            this.showError('Task cannot be empty');
            return false;
        }

        const trimmedText = text.trim();
        
        if (this.isDuplicate(trimmedText)) {
            this.showError('This task already exists');
            return false;
        }

        const newTask = {
            id: this.generateId(),
            text: trimmedText,
            completed: false,
            createdAt: Date.now()
        };

        this.tasks.push(newTask);
        this.saveTasks();
        this.renderTasks();
        this.clearInput();
        this.hideError();
        return true;
    }

    // Edit existing task
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
        this.renderTasks();
        return true;
    }

    // Toggle task completion status
    toggleComplete(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            const wasCompleted = task.completed;
            task.completed = !task.completed;
            this.saveTasks();
            this.renderTasks();
            
            // Emit event for component communication
            if (window.appEventBus && !wasCompleted && task.completed) {
                window.appEventBus.emit('task:completed', {
                    id: task.id,
                    text: task.text,
                    completedAt: new Date().toISOString()
                });
            }
        }
    }

    // Delete task
    deleteTask(taskId) {
        const initialLength = this.tasks.length;
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        
        if (this.tasks.length < initialLength) {
            this.saveTasks();
            this.renderTasks();
            return true;
        }
        return false;
    }

    // Sort tasks by completion status (incomplete first)
    sortTasks() {
        this.tasks.sort((a, b) => {
            if (a.completed === b.completed) {
                return a.createdAt - b.createdAt; // Sort by creation time if same completion status
            }
            return a.completed ? 1 : -1; // Incomplete tasks first
        });
    }

    // Load tasks from Local Storage
    loadTasks() {
        const storedTasks = StorageManager.get(STORAGE_KEYS.TASKS);
        if (storedTasks && Array.isArray(storedTasks)) {
            this.tasks = storedTasks;
            this.sortTasks();
        }
    }

    // Persist tasks to storage
    saveTasks() {
        this.sortTasks();
        return StorageManager.set(STORAGE_KEYS.TASKS, this.tasks);
    }

    // Handle add task button click
    handleAddTask() {
        const text = this.taskInput.value;
        this.addTask(text);
    }

    // Clear input field
    clearInput() {
        if (this.taskInput) {
            this.taskInput.value = '';
        }
    }

    // Show error message
    showError(message) {
        // Create or update error message element
        let errorElement = this.container.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            this.taskInput.parentNode.appendChild(errorElement);
        }
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }

    // Hide error message
    hideError() {
        const errorElement = this.container.querySelector('.error-message');
        if (errorElement) {
            errorElement.classList.remove('show');
        }
    }

    // Render task list with performance optimizations
    renderTasks() {
        if (!this.taskList) {
            return;
        }

        const doRender = () => {
            // Use document fragment to minimize reflows
            const fragment = document.createDocumentFragment();

            if (this.tasks.length === 0) {
                const emptyMessage = document.createElement('div');
                emptyMessage.className = 'empty-message';
                emptyMessage.textContent = 'No tasks yet. Add one above!';
                emptyMessage.style.textAlign = 'center';
                emptyMessage.style.color = '#7f8c8d';
                emptyMessage.style.padding = '20px';
                fragment.appendChild(emptyMessage);
            } else {
                // Batch DOM operations using fragment
                this.tasks.forEach(task => {
                    const taskElement = this.createTaskElement(task);
                    fragment.appendChild(taskElement);
                });
            }

            // Single DOM update to minimize reflows
            this.taskList.innerHTML = '';
            this.taskList.appendChild(fragment);
        };

        // Use requestAnimationFrame for smooth UI updates in browser environment
        // Use synchronous rendering in test environment
        if (typeof window !== 'undefined' && window.requestAnimationFrame && !window.location.href.includes('test')) {
            requestAnimationFrame(doRender);
        } else {
            doRender();
        }
    }

    // Create individual task element
    createTaskElement(task) {
        const taskItem = document.createElement('div');
        taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
        taskItem.dataset.taskId = task.id;

        taskItem.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <span class="task-text ${task.completed ? 'completed' : ''}">${this.escapeHtml(task.text)}</span>
            <div class="task-actions">
                <button class="task-btn edit-btn">Edit</button>
                <button class="task-btn delete-btn">Delete</button>
            </div>
        `;

        // Add event listeners
        const checkbox = taskItem.querySelector('.task-checkbox');
        const editBtn = taskItem.querySelector('.edit-btn');
        const deleteBtn = taskItem.querySelector('.delete-btn');

        checkbox.addEventListener('change', () => {
            this.toggleComplete(task.id);
        });

        editBtn.addEventListener('click', () => {
            this.startEditTask(task.id, taskItem);
        });

        deleteBtn.addEventListener('click', () => {
            this.deleteTask(task.id);
        });

        return taskItem;
    }

    // Start editing a task
    startEditTask(taskId, taskElement) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        const taskTextElement = taskElement.querySelector('.task-text');
        const editBtn = taskElement.querySelector('.edit-btn');
        
        // Create input field
        const input = document.createElement('input');
        input.type = 'text';
        input.value = task.text;
        input.className = 'task-edit-input';
        input.style.flex = '1';
        input.style.padding = '5px';
        input.style.border = '1px solid #ddd';
        input.style.borderRadius = '3px';

        // Replace text with input
        taskTextElement.replaceWith(input);
        editBtn.textContent = 'Save';
        
        // Focus input and select text
        input.focus();
        input.select();

        // Handle save
        const saveEdit = () => {
            const newText = input.value.trim();
            if (newText && this.editTask(taskId, newText)) {
                // Success - renderTasks will be called by editTask
            } else {
                // Failed - restore original
                this.renderTasks();
            }
        };

        // Handle cancel
        const cancelEdit = () => {
            this.renderTasks();
        };

        // Event listeners
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveEdit();
            } else if (e.key === 'Escape') {
                cancelEdit();
            }
        });

        input.addEventListener('blur', saveEdit);
        editBtn.addEventListener('click', saveEdit);
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Quick Links Component Class
class QuickLinksComponent {
    constructor(containerElement) {
        this.container = containerElement;
        this.links = [];
        this.urlInput = null;
        this.labelInput = null;
        this.addLinkBtn = null;
        this.linkList = null;
    }

    // Initialize component and load links
    init() {
        if (!this.container) {
            console.error('Quick Links container element not found');
            return;
        }

        // Get DOM elements
        this.urlInput = document.getElementById('link-url-input');
        this.labelInput = document.getElementById('link-label-input');
        this.addLinkBtn = document.getElementById('add-link-btn');
        this.linkList = document.getElementById('link-list');

        if (!this.urlInput || !this.labelInput || !this.addLinkBtn || !this.linkList) {
            console.error('Required quick links elements not found');
            return;
        }

        // Load links from storage
        this.loadLinks();

        // Set up event listeners
        this.addLinkBtn.addEventListener('click', () => this.handleAddLink());
        this.urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.labelInput.focus();
            }
        });
        this.labelInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleAddLink();
            }
        });

        // Initial render
        this.renderLinks();
    }

    // Generate unique ID for links
    generateId() {
        return `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Validate URL format using URL constructor
    validateUrl(url) {
        if (!url || typeof url !== 'string') {
            return false;
        }
        
        try {
            new URL(url.trim());
            return true;
        } catch (e) {
            return false;
        }
    }

    // Validate label text
    validateLabel(label) {
        if (!label || typeof label !== 'string') {
            return false;
        }
        const trimmedLabel = label.trim();
        return trimmedLabel.length > 0;
    }

    // Add new quick link
    addLink(url, label) {
        const trimmedUrl = url.trim();
        const trimmedLabel = label.trim();

        if (!this.validateUrl(trimmedUrl)) {
            this.showError('Please enter a valid URL (include http:// or https://)');
            return false;
        }

        if (!this.validateLabel(trimmedLabel)) {
            this.showError('Please enter a label for the link');
            return false;
        }

        const newLink = {
            id: this.generateId(),
            url: trimmedUrl,
            label: trimmedLabel
        };

        this.links.push(newLink);
        this.saveLinks();
        this.renderLinks();
        this.clearInputs();
        this.hideError();
        return true;
    }

    // Delete quick link
    deleteLink(linkId) {
        const initialLength = this.links.length;
        this.links = this.links.filter(link => link.id !== linkId);
        
        if (this.links.length < initialLength) {
            this.saveLinks();
            this.renderLinks();
            return true;
        }
        return false;
    }

    // Open link in new tab with security attributes
    openLink(url) {
        window.open(url, '_blank', 'noopener,noreferrer');
    }

    // Load links from Local Storage
    loadLinks() {
        const storedLinks = StorageManager.get(STORAGE_KEYS.QUICK_LINKS);
        if (storedLinks && Array.isArray(storedLinks)) {
            this.links = storedLinks;
        }
    }

    // Persist links to storage
    saveLinks() {
        return StorageManager.set(STORAGE_KEYS.QUICK_LINKS, this.links);
    }

    // Handle add link button click
    handleAddLink() {
        const url = this.urlInput.value;
        const label = this.labelInput.value;
        this.addLink(url, label);
    }

    // Clear input fields
    clearInputs() {
        if (this.urlInput) {
            this.urlInput.value = '';
        }
        if (this.labelInput) {
            this.labelInput.value = '';
        }
    }

    // Show error message
    showError(message) {
        // Create or update error message element
        let errorElement = this.container.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            this.addLinkBtn.parentNode.appendChild(errorElement);
        }
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }

    // Hide error message
    hideError() {
        const errorElement = this.container.querySelector('.error-message');
        if (errorElement) {
            errorElement.classList.remove('show');
        }
    }

    // Render links list with performance optimizations
    renderLinks() {
        if (!this.linkList) {
            return;
        }

        const doRender = () => {
            // Use document fragment to minimize reflows
            const fragment = document.createDocumentFragment();

            if (this.links.length === 0) {
                const emptyMessage = document.createElement('div');
                emptyMessage.className = 'empty-message';
                emptyMessage.textContent = 'No quick links yet. Add one above!';
                emptyMessage.style.textAlign = 'center';
                emptyMessage.style.color = '#7f8c8d';
                emptyMessage.style.padding = '20px';
                fragment.appendChild(emptyMessage);
            } else {
                // Batch DOM operations using fragment
                this.links.forEach(link => {
                    const linkElement = this.createLinkElement(link);
                    fragment.appendChild(linkElement);
                });
            }

            // Single DOM update to minimize reflows
            this.linkList.innerHTML = '';
            this.linkList.appendChild(fragment);
        };

        // Use requestAnimationFrame for smooth UI updates in browser environment
        // Use synchronous rendering in test environment
        if (typeof window !== 'undefined' && window.requestAnimationFrame && !window.location.href.includes('test')) {
            requestAnimationFrame(doRender);
        } else {
            doRender();
        }
    }

    // Create individual link element
    createLinkElement(link) {
        const linkItem = document.createElement('div');
        linkItem.className = 'link-item';
        linkItem.dataset.linkId = link.id;

        linkItem.innerHTML = `
            <div class="link-content" role="button" tabindex="0">
                <span class="link-label">${this.escapeHtml(link.label)}</span>
                <span class="link-url">${this.escapeHtml(link.url)}</span>
            </div>
            <div class="link-actions">
                <button class="link-btn link-delete-btn">Delete</button>
            </div>
        `;

        // Add event listeners
        const linkContent = linkItem.querySelector('.link-content');
        const deleteBtn = linkItem.querySelector('.link-delete-btn');

        // Click handler to open link
        const openLinkHandler = (e) => {
            e.preventDefault();
            this.openLink(link.url);
        };

        linkContent.addEventListener('click', openLinkHandler);
        linkContent.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.openLink(link.url);
            }
        });

        // Delete handler
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent opening link when deleting
            this.deleteLink(link.id);
        });

        return linkItem;
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Application initialization with performance optimizations
document.addEventListener('DOMContentLoaded', () => {
    // Performance timing for load optimization
    const startTime = performance.now();
    
    // Prevent transitions during page load
    document.body.classList.add('preload');
    
    // Check if Local Storage is available
    if (!StorageManager.isAvailable()) {
        console.warn('Local Storage is not available. Data will not persist.');
        // Could show a warning to the user here
    }

    // Batch DOM queries for better performance
    const containers = {
        greeting: document.getElementById('greeting-container'),
        timer: document.getElementById('timer-container'),
        tasks: document.getElementById('tasks-container'),
        links: document.getElementById('links-container')
    };

    // Application state for component communication
    const appState = {
        components: {},
        initialized: false,
        errors: []
    };

    // Initialize components with proper error handling and communication
    const initializeComponents = () => {
        const initErrors = [];
        
        try {
            // Initialize components in dependency order
            const componentConfigs = [
                { name: 'greeting', container: containers.greeting, Component: GreetingComponent },
                { name: 'timer', container: containers.timer, Component: TimerComponent },
                { name: 'tasks', container: containers.tasks, Component: TaskComponent },
                { name: 'links', container: containers.links, Component: QuickLinksComponent }
            ];

            // Initialize each component with error handling
            componentConfigs.forEach(({ name, container, Component }) => {
                try {
                    if (!container) {
                        throw new Error(`Container element not found for ${name} component`);
                    }

                    console.log(`Initializing ${name} component...`);
                    const component = new Component(container);
                    component.init();
                    
                    // Store component reference for communication
                    appState.components[name] = component;
                    window[`${name}Component`] = component; // Backward compatibility
                    
                    console.log(`✓ ${name} component initialized successfully`);
                } catch (error) {
                    const errorMsg = `Failed to initialize ${name} component: ${error.message}`;
                    console.error(errorMsg, error);
                    initErrors.push({ component: name, error: errorMsg });
                    
                    // Show user-friendly error in the container if available
                    if (container) {
                        container.innerHTML = `
                            <div class="error-message">
                                <h3>Component Error</h3>
                                <p>The ${name} component failed to load. Please refresh the page.</p>
                                <details>
                                    <summary>Technical Details</summary>
                                    <pre>${error.message}</pre>
                                </details>
                            </div>
                        `;
                    }
                }
            });

            // Set up component communication if needed
            setupComponentCommunication();
            
            // Mark application as initialized
            appState.initialized = true;
            appState.errors = initErrors;

            // Performance measurement
            const endTime = performance.now();
            const loadTime = endTime - startTime;
            
            // Log initialization results
            const successCount = Object.keys(appState.components).length;
            const totalCount = componentConfigs.length;
            
            if (initErrors.length === 0) {
                console.log(`✓ All ${totalCount} components initialized successfully in ${loadTime.toFixed(2)}ms`);
            } else {
                console.warn(`⚠ ${successCount}/${totalCount} components initialized in ${loadTime.toFixed(2)}ms. ${initErrors.length} errors occurred.`);
            }
            
            // Ensure load time meets requirement (< 1000ms)
            if (loadTime > 1000) {
                console.warn(`Load time (${loadTime.toFixed(2)}ms) exceeds 1 second requirement`);
            }

        } catch (error) {
            console.error('Critical error during application initialization:', error);
            document.body.innerHTML = `
                <div class="critical-error">
                    <h1>Application Error</h1>
                    <p>The productivity dashboard failed to initialize. Please refresh the page.</p>
                    <details>
                        <summary>Technical Details</summary>
                        <pre>${error.message}</pre>
                    </details>
                </div>
            `;
        }
    };

    // Set up communication between components
    const setupComponentCommunication = () => {
        // Create a simple event system for component communication
        const eventBus = {
            events: {},
            
            on(event, callback) {
                if (!this.events[event]) {
                    this.events[event] = [];
                }
                this.events[event].push(callback);
            },
            
            emit(event, data) {
                if (this.events[event]) {
                    this.events[event].forEach(callback => {
                        try {
                            callback(data);
                        } catch (error) {
                            console.error(`Error in event handler for ${event}:`, error);
                        }
                    });
                }
            }
        };

        // Make event bus available globally for components
        window.appEventBus = eventBus;
        appState.eventBus = eventBus;

        // Example: Timer completion could trigger task reminder
        eventBus.on('timer:complete', () => {
            console.log('Focus session completed! Check your tasks.');
        });

        // Example: Task completion could trigger celebration
        eventBus.on('task:completed', (taskData) => {
            console.log(`Task completed: ${taskData.text}`);
        });
    };

    // Use requestAnimationFrame for smooth initialization
    requestAnimationFrame(() => {
        initializeComponents();
        
        // Remove preload class after initialization to enable transitions
        requestAnimationFrame(() => {
            document.body.classList.remove('preload');
        });
    });
});

// Export classes for testing (only in Node.js environment)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StorageManager, GreetingComponent, TimerComponent, TaskComponent, QuickLinksComponent, STORAGE_KEYS };
}