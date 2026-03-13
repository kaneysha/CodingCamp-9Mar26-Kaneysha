# Design Document: Productivity Dashboard

## Overview

The Productivity Dashboard is a client-side web application that provides essential productivity tools through a clean, minimal interface. The application runs entirely in the browser without requiring a backend server, using the browser's Local Storage API for data persistence.

The dashboard consists of five main components:
1. **Greeting Component**: Displays current time, date, and personalized greeting
2. **Focus Timer**: 25-minute countdown timer for focused work sessions
3. **Task Manager**: To-do list with create, edit, complete, and delete operations
4. **Quick Links**: Saved shortcuts to favorite websites
5. **Storage Manager**: Handles all Local Storage operations

The application is built with vanilla HTML, CSS, and JavaScript to minimize dependencies and ensure fast load times. All state management and data persistence is handled through the browser's Local Storage API, making the application fully functional offline after the initial load.

## Architecture

### System Architecture

The application follows a component-based architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                         index.html                          │
│                    (Application Shell)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ├─────────────────────────────┐
                              │                             │
                    ┌─────────▼─────────┐       ┌──────────▼─────────┐
                    │   styles.css      │       │      app.js        │
                    │  (Presentation)   │       │  (Application      │
                    └───────────────────┘       │   Logic)           │
                                                └──────────┬─────────┘
                                                           │
                    ┌──────────────────────────────────────┼──────────────────────┐
                    │                                      │                      │
         ┌──────────▼──────────┐            ┌─────────────▼────────┐  ┌─────────▼─────────┐
         │  Greeting Component │            │  Timer Component     │  │  Task Component   │
         │  - Time display     │            │  - Countdown logic   │  │  - CRUD operations│
         │  - Date display     │            │  - Start/Stop/Reset  │  │  - Sorting        │
         │  - Name management  │            │  - Display format    │  │  - Completion     │
         └─────────────────────┘            └──────────────────────┘  └───────────────────┘
                    │                                      │                      │
                    │                       ┌──────────────▼──────────┐          │
                    │                       │  Quick Links Component  │          │
                    │                       │  - Add/Delete links     │          │
                    │                       │  - URL validation       │          │
                    │                       └─────────────────────────┘          │
                    │                                      │                      │
                    └──────────────────────────────────────┼──────────────────────┘
                                                           │
                                                ┌──────────▼──────────┐
                                                │  Storage Manager    │
                                                │  - Local Storage    │
                                                │  - Serialization    │
                                                │  - Data retrieval   │
                                                └─────────────────────┘
                                                           │
                                                ┌──────────▼──────────┐
                                                │  Browser Local      │
                                                │  Storage API        │
                                                └─────────────────────┘
```

### Component Responsibilities

**Greeting Component**
- Manages time and date display with automatic updates
- Determines appropriate greeting based on time of day
- Handles user name storage and retrieval
- Updates display every second

**Timer Component**
- Implements 25-minute countdown timer
- Manages timer state (running, paused, stopped)
- Provides start, stop, and reset controls
- Formats time display as MM:SS

**Task Component**
- Manages task lifecycle (create, read, update, delete)
- Handles task completion status
- Implements task sorting by completion status
- Validates task input (no empty tasks, no duplicates)
- Persists changes to Local Storage

**Quick Links Component**
- Manages URL shortcuts
- Validates URLs before storage
- Opens links in new tabs
- Persists links to Local Storage

**Storage Manager**
- Provides abstraction over Local Storage API
- Handles serialization/deserialization of data structures
- Manages storage keys and namespacing
- Provides error handling for storage operations

## Components and Interfaces

### Greeting Component

**Interface:**
```javascript
class GreetingComponent {
  constructor(containerElement)
  
  // Initialize component and start time updates
  init()
  
  // Update time and date display
  updateTimeDisplay()
  
  // Get appropriate greeting based on current time
  getGreeting(): string
  
  // Set user name
  setName(name: string)
  
  // Get stored user name
  getName(): string | null
  
  // Render greeting with name if available
  renderGreeting()
}
```

**Behavior:**
- Updates time display every 1000ms using setInterval
- Determines greeting based on 24-hour time ranges:
  - 05:00-11:59: "Good morning"
  - 12:00-16:59: "Good afternoon"
  - 17:00-04:59: "Good evening"
- Retrieves name from Storage Manager on initialization
- Persists name changes immediately to Local Storage

### Timer Component

**Interface:**
```javascript
class TimerComponent {
  constructor(containerElement)
  
  // Initialize timer at 25 minutes
  init()
  
  // Start countdown
  start()
  
  // Pause countdown
  stop()
  
  // Reset to 25 minutes
  reset()
  
  // Update display with current time
  updateDisplay()
  
  // Format seconds as MM:SS
  formatTime(seconds: number): string
  
  // Handle timer completion
  onTimerComplete()
}
```

**Behavior:**
- Initializes with 1500 seconds (25 minutes)
- Uses setInterval for countdown when running
- Clears interval when stopped or completed
- Formats display as zero-padded MM:SS
- Stops automatically at zero

### Task Component

**Interface:**
```javascript
class TaskComponent {
  constructor(containerElement)
  
  // Initialize component and load tasks
  init()
  
  // Add new task
  addTask(text: string): boolean
  
  // Edit existing task
  editTask(taskId: string, newText: string): boolean
  
  // Toggle task completion status
  toggleComplete(taskId: string)
  
  // Delete task
  deleteTask(taskId: string)
  
  // Sort tasks by completion status
  sortTasks()
  
  // Validate task text
  validateTask(text: string): boolean
  
  // Check for duplicate tasks
  isDuplicate(text: string): boolean
  
  // Render task list
  renderTasks()
  
  // Persist tasks to storage
  saveTasks()
}
```

**Task Data Structure:**
```javascript
{
  id: string,          // Unique identifier (timestamp-based)
  text: string,        // Task description
  completed: boolean,  // Completion status
  createdAt: number    // Creation timestamp
}
```

**Behavior:**
- Validates task text is non-empty and trimmed
- Prevents duplicate tasks (case-sensitive comparison)
- Generates unique IDs using timestamp + random component
- Sorts with incomplete tasks first, then completed tasks
- Persists to Local Storage after every modification
- Updates UI within 100ms of state changes

### Quick Links Component

**Interface:**
```javascript
class QuickLinksComponent {
  constructor(containerElement)
  
  // Initialize component and load links
  init()
  
  // Add new quick link
  addLink(url: string, label: string): boolean
  
  // Delete quick link
  deleteLink(linkId: string)
  
  // Validate URL format
  validateUrl(url: string): boolean
  
  // Open link in new tab
  openLink(url: string)
  
  // Render links
  renderLinks()
  
  // Persist links to storage
  saveLinks()
}
```

**Quick Link Data Structure:**
```javascript
{
  id: string,    // Unique identifier
  url: string,   // Full URL
  label: string  // Display text
}
```

**Behavior:**
- Validates URLs using URL constructor
- Opens links with target="_blank" and rel="noopener noreferrer"
- Persists to Local Storage after modifications
- Generates unique IDs for each link

### Storage Manager

**Interface:**
```javascript
class StorageManager {
  // Get item from Local Storage
  static get(key: string): any | null
  
  // Set item in Local Storage
  static set(key: string, value: any): boolean
  
  // Remove item from Local Storage
  static remove(key: string): boolean
  
  // Clear all application data
  static clear(): boolean
  
  // Check if Local Storage is available
  static isAvailable(): boolean
}
```

**Storage Keys:**
- `dashboard_user_name`: User's name for greeting
- `dashboard_tasks`: Array of task objects
- `dashboard_quick_links`: Array of quick link objects

**Behavior:**
- Serializes objects to JSON before storage
- Deserializes JSON when retrieving
- Returns null for missing keys
- Handles storage quota errors gracefully
- Checks for Local Storage availability on initialization

## Data Models

### Task Model

```javascript
{
  id: string,          // Unique identifier (e.g., "task_1234567890123")
  text: string,        // Task description (non-empty, trimmed)
  completed: boolean,  // Completion status (default: false)
  createdAt: number    // Unix timestamp of creation
}
```

**Constraints:**
- `id`: Must be unique across all tasks
- `text`: Must be non-empty after trimming, no duplicates allowed
- `completed`: Boolean value only
- `createdAt`: Positive integer timestamp

**Example:**
```javascript
{
  id: "task_1704067200000",
  text: "Review design document",
  completed: false,
  createdAt: 1704067200000
}
```

### Quick Link Model

```javascript
{
  id: string,    // Unique identifier (e.g., "link_1234567890123")
  url: string,   // Valid URL (must include protocol)
  label: string  // Display text (non-empty)
}
```

**Constraints:**
- `id`: Must be unique across all links
- `url`: Must be valid URL format (validated by URL constructor)
- `label`: Must be non-empty string

**Example:**
```javascript
{
  id: "link_1704067200000",
  url: "https://github.com",
  label: "GitHub"
}
```

### User Preferences Model

```javascript
{
  name: string | null  // User's name for personalized greeting
}
```

**Constraints:**
- `name`: Can be null if not set, otherwise non-empty string

### Local Storage Schema

The application uses the following keys in Local Storage:

| Key | Type | Description |
|-----|------|-------------|
| `dashboard_user_name` | string | User's name for greeting |
| `dashboard_tasks` | string (JSON) | Serialized array of Task objects |
| `dashboard_quick_links` | string (JSON) | Serialized array of Quick Link objects |

**Storage Format:**
All complex data structures are serialized as JSON strings before storage and deserialized upon retrieval.


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Time Display Format

*For any* valid time value, when the Greeting Component renders the time, the output SHALL contain the time in 24-hour format (HH:MM or HH:MM:SS).

**Validates: Requirements 1.1**

### Property 2: Date Display Completeness

*For any* valid date value, when the Greeting Component renders the date, the output SHALL contain the day of week, month name, and day number.

**Validates: Requirements 1.2**

### Property 3: Greeting Based on Time of Day

*For any* time value, the Greeting Component SHALL display "Good morning" for times between 05:00-11:59, "Good afternoon" for times between 12:00-16:59, and "Good evening" for times between 17:00-04:59.

**Validates: Requirements 1.3, 1.4, 1.5**

### Property 4: Name Inclusion in Greeting

*For any* non-empty name string, when stored and the greeting is rendered, the greeting message SHALL contain that name.

**Validates: Requirements 1.6**

### Property 5: Name Storage Round-Trip

*For any* valid name string, storing the name and then retrieving it SHALL return the same name value.

**Validates: Requirements 2.2, 2.3, 2.4**

### Property 6: Timer Format Consistency

*For any* non-negative integer representing seconds, the timer format function SHALL return a string in MM:SS format with zero-padding (e.g., 05:09, 25:00, 00:00).

**Validates: Requirements 3.6**

### Property 7: Timer Countdown Decreases Value

*For any* timer state with time remaining greater than zero, starting the timer and waiting SHALL result in a decreased time value.

**Validates: Requirements 3.2**

### Property 8: Timer Pause Preserves State

*For any* running timer with time remaining, stopping the timer SHALL preserve the current time value without further changes.

**Validates: Requirements 3.3**

### Property 9: Task Addition Increases List Size

*For any* valid task text (non-empty, non-duplicate), adding the task to an existing task list SHALL increase the list length by exactly one.

**Validates: Requirements 4.2**

### Property 10: Task Storage Round-Trip

*For any* valid task object, adding it to the task list and then retrieving the task list from storage SHALL include a task with the same text and properties.

**Validates: Requirements 4.3**

### Property 11: Duplicate Task Prevention

*For any* task list containing a task with specific text, attempting to add another task with identical text SHALL not increase the list size.

**Validates: Requirements 4.4**

### Property 12: Empty Task Rejection

*For any* string composed entirely of whitespace characters or empty string, attempting to add it as a task SHALL not modify the task list.

**Validates: Requirements 4.5**

### Property 13: Task Edit Updates Text

*For any* existing task and any valid new text (non-empty), editing the task SHALL result in the task having the new text value.

**Validates: Requirements 5.3**

### Property 14: Task Edit Persistence

*For any* task that is edited with valid text, retrieving the task list from storage SHALL reflect the updated text.

**Validates: Requirements 5.4**

### Property 15: Empty Task Edit Rejection

*For any* existing task, attempting to edit it with empty or whitespace-only text SHALL preserve the original task text unchanged.

**Validates: Requirements 5.5**

### Property 16: Task Completion Toggle Round-Trip

*For any* task, toggling its completion status twice SHALL return it to its original completion state.

**Validates: Requirements 6.4**

### Property 17: Task Completion Persistence

*For any* task whose completion status is changed, retrieving the task list from storage SHALL reflect the updated completion status.

**Validates: Requirements 6.3**

### Property 18: Task Deletion Removes Item

*For any* task list containing a specific task, deleting that task SHALL result in a list that does not contain that task and has length decreased by one.

**Validates: Requirements 7.2**

### Property 19: Task Deletion Persistence

*For any* task that is deleted, retrieving the task list from storage SHALL not include the deleted task.

**Validates: Requirements 7.3**

### Property 20: Task Sorting by Completion Status

*For any* task list containing both completed and incomplete tasks, sorting the list SHALL result in all incomplete tasks appearing before all completed tasks.

**Validates: Requirements 8.2, 8.3**

### Property 21: Quick Link Storage Round-Trip

*For any* valid quick link object (with URL and label), adding it to the quick links list and then retrieving the list from storage SHALL include a link with the same URL and label.

**Validates: Requirements 9.2, 9.3, 9.7**

### Property 22: Quick Link Deletion Removes Item

*For any* quick links list containing a specific link, deleting that link SHALL result in a list that does not contain that link and has length decreased by one.

**Validates: Requirements 9.5**

## Error Handling

### Storage Errors

**Local Storage Unavailable:**
- Check for Local Storage availability on application initialization
- Display user-friendly error message if unavailable
- Gracefully degrade to in-memory storage with warning that data won't persist
- Log error to console for debugging

**Storage Quota Exceeded:**
- Catch QuotaExceededError when writing to Local Storage
- Display error message to user indicating storage is full
- Suggest clearing old tasks or quick links
- Prevent further additions until space is available
- Log error details to console

**Serialization Errors:**
- Wrap JSON.stringify/parse in try-catch blocks
- Log serialization errors to console with data context
- Return null for failed deserialization
- Display generic error message to user
- Prevent corrupted data from breaking application

### Input Validation Errors

**Invalid Task Input:**
- Trim whitespace from task text before validation
- Reject empty strings and whitespace-only strings
- Display inline error message near input field
- Prevent form submission for invalid input
- Clear error message when user corrects input

**Duplicate Task:**
- Check for exact text match (case-sensitive) before adding
- Display inline message: "This task already exists"
- Keep input field populated for user to modify
- Clear message when user changes input

**Invalid URL for Quick Links:**
- Validate URL using URL constructor
- Catch TypeError for invalid URLs
- Display inline error: "Please enter a valid URL"
- Require protocol (http:// or https://)
- Clear error when user corrects input

### Timer Errors

**Invalid Timer State:**
- Validate timer value is non-negative before operations
- Reset to 25 minutes if invalid state detected
- Log warning to console
- Continue normal operation after reset

**Interval Management:**
- Clear existing intervals before starting new ones
- Prevent multiple simultaneous intervals
- Clean up intervals on component destruction
- Handle page visibility changes appropriately

### Component Initialization Errors

**Missing DOM Elements:**
- Check for required container elements on initialization
- Log error to console if elements not found
- Fail gracefully without breaking other components
- Display error message in console for developers

**Data Migration:**
- Handle legacy data formats gracefully
- Provide default values for missing properties
- Log migration warnings to console
- Preserve user data during format changes

## Testing Strategy

### Overview

The testing strategy employs a dual approach combining unit tests for specific scenarios and property-based tests for comprehensive coverage of universal behaviors. This ensures both concrete examples work correctly and general properties hold across all possible inputs.

### Unit Testing

Unit tests focus on:
- **Specific examples**: Concrete scenarios that demonstrate correct behavior
- **Edge cases**: Boundary conditions like empty lists, zero values, maximum values
- **Error conditions**: Invalid inputs, storage failures, missing data
- **Integration points**: Component interactions and data flow

**Key Unit Test Scenarios:**

*Greeting Component:*
- Initial render with no stored name
- Greeting changes at time boundaries (04:59→05:00, 11:59→12:00, 16:59→17:00)
- Name storage and retrieval with special characters
- Empty name handling

*Timer Component:*
- Timer initialization at 25 minutes (example test)
- Timer reset to 25 minutes (example test)
- Timer reaches zero and stops (edge case)
- Start/stop/reset button interactions
- Format edge cases (0 seconds, 59 seconds, 3599 seconds)

*Task Component:*
- Add first task to empty list
- Delete last task from list
- Edit task with special characters
- Toggle completion on newly created task
- Sort empty list
- Sort list with only completed tasks
- Sort list with only incomplete tasks

*Quick Links Component:*
- Add first link to empty list
- Delete last link from list
- URL validation with various formats
- Open link behavior

*Storage Manager:*
- Storage unavailable scenario
- Quota exceeded scenario
- Corrupted data in storage
- Missing keys in storage

### Property-Based Testing

Property-based tests verify universal properties across randomly generated inputs. Each test runs a minimum of 100 iterations to ensure comprehensive coverage.

**Property Testing Library:** Use `fast-check` for JavaScript property-based testing.

**Test Configuration:**
```javascript
fc.assert(
  fc.property(/* generators */, (/* inputs */) => {
    // Property assertion
  }),
  { numRuns: 100 }
);
```

**Property Test Implementation:**

Each property test MUST include a comment tag referencing the design document property:

```javascript
// Feature: productivity-dashboard, Property 1: Time Display Format
test('time display format property', () => {
  fc.assert(
    fc.property(fc.integer({ min: 0, max: 23 }), fc.integer({ min: 0, max: 59 }), 
      (hours, minutes) => {
        const time = new Date();
        time.setHours(hours, minutes);
        const display = greetingComponent.formatTime(time);
        // Assert 24-hour format
        return /\d{2}:\d{2}/.test(display);
      }
    ),
    { numRuns: 100 }
  );
});
```

**Generators Needed:**

*Time Generators:*
- Random hours (0-23)
- Random minutes (0-59)
- Random seconds (0-59)
- Random dates

*String Generators:*
- Non-empty strings (for names, task text, labels)
- Whitespace-only strings (for validation testing)
- Empty strings
- Strings with special characters

*Task Generators:*
- Valid task objects
- Task lists (arrays of tasks)
- Task lists with mixed completion status

*Quick Link Generators:*
- Valid URLs with various protocols
- Invalid URL strings
- Quick link objects
- Quick link lists

**Property Test Coverage:**

Each correctness property (Properties 1-22) MUST have a corresponding property-based test:

- Property 1: Generate random times, verify 24-hour format
- Property 2: Generate random dates, verify all components present
- Property 3: Generate times across all ranges, verify correct greeting
- Property 4: Generate random names, verify inclusion in greeting
- Property 5: Generate random names, test storage round-trip
- Property 6: Generate random second values, verify MM:SS format
- Property 7: Generate random timer states, verify countdown decreases
- Property 8: Generate random timer states, verify pause preserves value
- Property 9: Generate random valid task text, verify list grows
- Property 10: Generate random tasks, test storage round-trip
- Property 11: Generate duplicate task text, verify prevention
- Property 12: Generate whitespace/empty strings, verify rejection
- Property 13: Generate random tasks and new text, verify update
- Property 14: Generate random task edits, test persistence
- Property 15: Generate empty edit text, verify rejection
- Property 16: Generate random tasks, verify double-toggle returns to original
- Property 17: Generate random completion changes, test persistence
- Property 18: Generate random task lists and deletions, verify removal
- Property 19: Generate random task deletions, test persistence
- Property 20: Generate random mixed task lists, verify sort order
- Property 21: Generate random quick links, test storage round-trip
- Property 22: Generate random quick link lists and deletions, verify removal

### Test Organization

```
tests/
├── unit/
│   ├── greeting.test.js
│   ├── timer.test.js
│   ├── tasks.test.js
│   ├── quicklinks.test.js
│   └── storage.test.js
└── properties/
    ├── greeting.properties.test.js
    ├── timer.properties.test.js
    ├── tasks.properties.test.js
    ├── quicklinks.properties.test.js
    └── storage.properties.test.js
```

### Testing Tools

- **Test Runner:** Jest or Vitest
- **Property Testing:** fast-check
- **DOM Testing:** jsdom or happy-dom
- **Coverage:** Built-in coverage tools (Jest/Vitest)

### Coverage Goals

- **Line Coverage:** Minimum 90%
- **Branch Coverage:** Minimum 85%
- **Property Coverage:** 100% of correctness properties tested
- **Edge Case Coverage:** All identified edge cases tested

### Continuous Testing

- Run unit tests on every code change
- Run property tests before commits
- Include both test suites in CI/CD pipeline
- Monitor test execution time (property tests may be slower)
- Fail builds on test failures or coverage drops
