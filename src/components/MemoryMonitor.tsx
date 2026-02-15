import React, { useCallback, useEffect, useState, useRef } from 'react';

// Define the MemoryInfo interface which isn't in standard TypeScript definitions
interface MemoryInfo {
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
}

// Extend Window interface to include memory property on performance
interface ExtendedWindow {
  performance: {
    memory?: MemoryInfo;
  } & typeof globalThis.Performance;
  gc?: () => void;
}

interface MemoryStats {
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
  timestamp: number;
}

/**
 * Component that monitors and displays memory usage in the application
 * Uses the Performance API to track JS heap size over time
 */
export default function MemoryMonitor() {
  const [memoryStats, setMemoryStats] = useState<MemoryStats | null>(null);
  const [expanded, setExpanded] = useState(false);
  const historyRef = useRef<MemoryStats[]>([]);
  const intervalRef = useRef<number | null>(null);
  const leakDetectionRef = useRef<{
    lastReading: number;
    consecutiveIncreases: number;
  }>({ lastReading: 0, consecutiveIncreases: 0 });

  // Check if Performance API is available with memory info
  const hasMemoryAPI = () => {
    return (
      typeof window !== 'undefined' &&
      typeof window.performance !== 'undefined' &&
      'memory' in window.performance
    );
  };

  // Update memory stats
  const updateStats = useCallback(() => {
    if (!hasMemoryAPI()) return;

    const memory = (window as unknown as ExtendedWindow).performance.memory;
    if (!memory) return;

    const currentStats: MemoryStats = {
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      totalJSHeapSize: memory.totalJSHeapSize,
      usedJSHeapSize: memory.usedJSHeapSize,
      timestamp: Date.now(),
    };

    // Save to history (limit to 100 points)
    historyRef.current.push(currentStats);
    if (historyRef.current.length > 100) {
      historyRef.current.shift();
    }

    // Check for potential memory leaks (continuous growth)
    if (leakDetectionRef.current.lastReading > 0) {
      if (currentStats.usedJSHeapSize > leakDetectionRef.current.lastReading) {
        leakDetectionRef.current.consecutiveIncreases++;
      } else {
        leakDetectionRef.current.consecutiveIncreases = 0;
      }
    }
    leakDetectionRef.current.lastReading = currentStats.usedJSHeapSize;

    setMemoryStats(currentStats);
  }, []);

  useEffect(() => {
    // Only run if Performance API with memory is available
    if (!hasMemoryAPI()) return;

    // Get initial stats
    updateStats();

    // Set up interval for regular updates
    intervalRef.current = window.setInterval(() => {
      updateStats();
    }, 2000);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [updateStats]);

  // Format bytes to human-readable format
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Calculate memory growth rate (MB/minute)
  const calculateGrowthRate = () => {
    const history = historyRef.current;
    if (history.length < 2) return 0;

    const oldest = history[0];
    const newest = history[history.length - 1];

    // Calculate rate in MB per minute
    const deltaBytes = newest.usedJSHeapSize - oldest.usedJSHeapSize;
    const deltaMinutes = (newest.timestamp - oldest.timestamp) / 60000;

    if (deltaMinutes <= 0) return 0;
    return deltaBytes / (1024 * 1024) / deltaMinutes;
  };

  // Detect potential memory leak
  const hasPotentialLeak = () => {
    // If memory has continuously increased for 5 consecutive readings
    // and growth rate is > 1 MB/minute, we might have a leak
    return (
      leakDetectionRef.current.consecutiveIncreases > 5 &&
      calculateGrowthRate() > 1
    );
  };

  // Force garbage collection if available (DevTools only)
  const forceGC = () => {
    const windowWithGC = window as unknown as { gc?: () => void };
    if (typeof window !== 'undefined' && windowWithGC.gc) {
      windowWithGC.gc();
      updateStats();
    } else {
      // Use a safer approach without alert
      console.warn(
        'Garbage collection not available. Open DevTools with --enable-precise-memory-info flag for best results.',
      );
    }
  };

  // Show message if Performance API is not available
  if (!hasMemoryAPI()) {
    return (
      <div className="memory-monitor warning">
        Performance API memory monitoring not available. Open Chrome with
        --enable-precise-memory-info flag.
      </div>
    );
  }

  // No stats yet
  if (!memoryStats) {
    return (
      <div className="memory-monitor loading">
        Initializing memory monitoring...
      </div>
    );
  }

  const usedPercentage = Math.round(
    (memoryStats.usedJSHeapSize / memoryStats.jsHeapSizeLimit) * 100,
  );

  const growthRate = calculateGrowthRate();

  return (
    <div
      className={`memory-monitor ${hasPotentialLeak() ? 'warning' : ''}`}
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        background: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px',
        zIndex: 9999,
        maxWidth: expanded ? '300px' : '200px',
        transition: 'all 0.3s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          cursor: 'pointer',
          fontWeight: 'bold',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <span>Memory: {formatBytes(memoryStats.usedJSHeapSize)}</span>
        <span>{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div>
          <div>
            <div
              className="progress-bar"
              style={{
                width: '100%',
                height: '6px',
                background: '#333',
                marginTop: '5px',
                borderRadius: '3px',
              }}
            >
              <div
                style={{
                  width: `${usedPercentage}%`,
                  height: '100%',
                  background: hasPotentialLeak() ? '#ff4d4d' : '#4CAF50',
                  borderRadius: '3px',
                  transition: 'width 1s ease-in-out',
                }}
              ></div>
            </div>
            <div style={{ fontSize: '11px', marginTop: '3px' }}>
              {usedPercentage}% of {formatBytes(memoryStats.jsHeapSizeLimit)}
            </div>
          </div>

          <div style={{ marginTop: '5px' }}>
            <div>Growth rate: {growthRate.toFixed(2)} MB/min</div>
            {leakDetectionRef.current.consecutiveIncreases > 0 && (
              <div>
                Consecutive increases:{' '}
                {leakDetectionRef.current.consecutiveIncreases}
              </div>
            )}
            {hasPotentialLeak() && (
              <div
                style={{
                  color: '#ff4d4d',
                  fontWeight: 'bold',
                  marginTop: '5px',
                }}
              >
                Potential memory leak detected!
              </div>
            )}
          </div>

          <button
            onClick={forceGC}
            style={{
              background: '#4a5568',
              border: 'none',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '3px',
              marginTop: '8px',
              cursor: 'pointer',
              fontSize: '11px',
            }}
          >
            Attempt GC (DevTools)
          </button>
        </div>
      )}
    </div>
  );
}
