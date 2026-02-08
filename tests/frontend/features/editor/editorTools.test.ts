import { TOOL_DEFS } from '../../../../src/features/editor/editorTools';

describe('editorTools', () => {
  it('exports expected tool definitions', () => {
    expect(TOOL_DEFS.map(tool => tool.id)).toEqual(['select', 'place', 'draw']);
    expect(TOOL_DEFS.map(tool => tool.key)).toEqual(['1', '2', '3']);
  });
});
