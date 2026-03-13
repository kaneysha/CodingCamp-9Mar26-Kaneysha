// Test setup file
import { beforeEach } from 'vitest';

// Mock localStorage for testing
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

beforeEach(() => {
  // Reset localStorage mock before each test
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  
  // Set up DOM
  document.body.innerHTML = '';
  
  // Mock global localStorage
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true
  });
});