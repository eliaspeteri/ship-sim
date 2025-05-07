/**
 * Check if a number is finite and return a fallback value if not
 * @param v value to check
 * @param fallback set value to fallback if v is not a finite number
 * @returns v if it is a finite number, otherwise fallback
 */
export const safe = (v: unknown, fallback: unknown): unknown =>
  typeof v === 'number' && isFinite(v) ? v : fallback;
