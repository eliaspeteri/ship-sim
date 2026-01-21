export const TOOL_DEFS = [
  { id: 'select', label: 'Select', key: '1', icon: 'S' },
  { id: 'place', label: 'Place', key: '2', icon: 'P' },
  { id: 'draw', label: 'Draw', key: '3', icon: 'D' },
] as const;

export type ToolId = (typeof TOOL_DEFS)[number]['id'];
export type ToolDef = (typeof TOOL_DEFS)[number];
