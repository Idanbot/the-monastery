import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

if (typeof window !== 'undefined') {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  Object.defineProperty(window, 'ResizeObserver', { writable: true, value: ResizeObserverMock });
  Object.defineProperty(globalThis, 'ResizeObserver', { writable: true, value: ResizeObserverMock });

  if (!URL.createObjectURL) {
    URL.createObjectURL = vi.fn(() => 'blob:test');
  }
  if (!URL.revokeObjectURL) {
    URL.revokeObjectURL = vi.fn();
  }

  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = vi.fn();
  }

  Object.defineProperty(window, 'scrollTo', {
    writable: true,
    value: vi.fn()
  });

  Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
    writable: true,
    value: vi.fn()
  });

  Object.defineProperty(HTMLAnchorElement.prototype, 'click', {
    writable: true,
    value: vi.fn()
  });

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  });
}
