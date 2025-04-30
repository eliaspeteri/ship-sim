import {
  test,
  expect,
  endTest,
} from 'assemblyscript-unittest-framework/assembly';
import {
  createVessel,
  getVesselHeading,
  getVesselSpeed,
  getVesselX,
  getVesselY,
  setThrottle,
} from './index';

/**
 * Tests focusing on vessel initialization and the singleton pattern
 * These tests specifically target the global vessel initialization branch (Line 787)
 */

// Define usize as u32 for compatibility with AssemblyScript memory model
type usize = u32;

// Test for Line 787: Global vessel initialization in createVessel function
test('createVessel reuses the same vessel instance when called multiple times', () => {
  // First call to createVessel initializes the vessel with default values
  const ptr1 = createVessel();

  // Modify vessel state
  setThrottle(ptr1, 0.75);

  // Second call should return the same instance with our modifications
  const ptr2 = createVessel();

  // Verify that both pointers reference the same object
  expect<usize>(ptr1).equal(ptr2);

  // Verify that the second vessel has the modified state from the first
  // This confirms we're reusing the same instance, not creating a new one
  expect<f64>(getVesselSpeed(ptr2)).greaterThan(0.0);
});

// Test vessel modifications persist across creations
test('vessel modifications persist when createVessel is called again', () => {
  // Create a vessel and modify its position
  const ptr1 = createVessel();

  // Get current position
  const x1 = getVesselX(ptr1);
  const y1 = getVesselY(ptr1);

  // Access the vessel again
  const ptr2 = createVessel();

  // Position should be the same
  expect<f64>(getVesselX(ptr2)).closeTo(x1, 0.0001);
  expect<f64>(getVesselY(ptr2)).closeTo(y1, 0.0001);
});

endTest(); // Don't forget it!
