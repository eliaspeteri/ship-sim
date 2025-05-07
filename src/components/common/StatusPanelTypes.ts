/**
 * Defines a line of text to be displayed, with optional styling.
 */
export interface ValueLine {
  text: string; // Can be static text or "data:key.path" for dynamic data
  className?: string; // Tailwind classes for styling this line
}

/**
 * Defines the structure and content of a single data box in the status panel.
 */
export interface BoxDefinition {
  id: string; // Unique ID for the box
  label?: string; // Optional label for the box (e.g., "HDG", "SPD")
  labelClassName?: string; // Tailwind classes for the label
  mainValue?: ValueLine; // The primary value displayed
  statusValue?: ValueLine; // An optional secondary/status value (e.g., "SNR", "NON")
  additionalLines?: ValueLine[]; // For multi-line content like POSN
  boxClassName?: string; // Tailwind classes for the box container itself
}

/**
 * Defines a row of boxes in the status panel.
 */
export type StatusPanelRow = BoxDefinition[];

/**
 * Defines the complete schema for the boxed data section of the status panel.
 * It's an array of rows, where each row contains one or more box definitions.
 */
export type StatusPanelSchema = StatusPanelRow[];
