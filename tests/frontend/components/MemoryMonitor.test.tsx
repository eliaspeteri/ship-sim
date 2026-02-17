import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import MemoryMonitor from '../../../src/components/MemoryMonitor';

describe('MemoryMonitor', () => {
  const originalPerformance = window.performance;

  afterEach(() => {
    Object.defineProperty(window, 'performance', {
      value: originalPerformance,
      configurable: true,
      writable: true,
    });
    jest.useRealTimers();
  });

  it('shows a warning when Performance memory API is unavailable', () => {
    Object.defineProperty(window, 'performance', {
      value: {
        now: () => 0,
        timeOrigin: 0,
      },
      configurable: true,
      writable: true,
    });

    render(<MemoryMonitor />);

    expect(
      screen.getByText(/Performance API memory monitoring not available/i),
    ).toBeInTheDocument();
  });

  it('renders memory stats and expands to show details', async () => {
    Object.defineProperty(window, 'performance', {
      value: {
        now: () => 0,
        timeOrigin: 0,
        memory: {
          jsHeapSizeLimit: 1024 * 1024 * 64,
          totalJSHeapSize: 1024 * 1024 * 16,
          usedJSHeapSize: 1024 * 1024 * 8,
        },
      },
      configurable: true,
      writable: true,
    });

    render(<MemoryMonitor />);

    await waitFor(() => {
      expect(screen.getByText(/Memory:/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Memory:/));

    expect(screen.getByText(/Growth rate:/)).toBeInTheDocument();
    const gcButton = screen.getByText(/Attempt GC/i);
    fireEvent.click(gcButton);
    expect(console.warn).toHaveBeenCalled();
  });
});
