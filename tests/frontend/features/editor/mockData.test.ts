import {
  editorLayers,
  editorPacks,
} from '../../../../src/features/editor/mockData';

describe('editor mock data', () => {
  it('exposes sample packs with work areas', () => {
    expect(editorPacks.length).toBeGreaterThan(0);
    expect(editorPacks[0].workAreas?.length).toBeGreaterThan(0);
    expect(editorPacks.map(pack => pack.id)).toContain('pack-hampton-roads');
  });

  it('exposes sample layers', () => {
    expect(editorLayers.length).toBeGreaterThan(0);
    expect(editorLayers.some(layer => layer.geometry === 'polygon')).toBe(true);
    expect(editorLayers.some(layer => layer.isLocked)).toBe(true);
  });
});
