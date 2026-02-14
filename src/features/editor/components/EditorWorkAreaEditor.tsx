import React from 'react';
import { EditorWorkArea } from '../types';

type EditorWorkAreaEditorProps = {
  workAreas: EditorWorkArea[];
  onChange: (next: EditorWorkArea[]) => void;
  onFocusWorkArea?: (lat: number, lon: number, radiusMeters: number) => void;
};

const formatBounds = (workArea: EditorWorkArea) => {
  if (workArea.bounds.type === 'bbox') {
    const { minLat, minLon, maxLat, maxLon } = workArea.bounds;
    return `${minLat.toFixed(2)}, ${minLon.toFixed(2)} → ${maxLat.toFixed(2)}, ${maxLon.toFixed(2)}`;
  }
  return `${workArea.bounds.coordinates.length} pts`;
};

const EARTH_RADIUS_METERS = 6_371_000;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
const toDegrees = (radians: number) => (radians * 180) / Math.PI;
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const round = (value: number, decimals: number) =>
  Number(value.toFixed(decimals));

type BboxBounds = {
  minLat: number;
  minLon: number;
  maxLat: number;
  maxLon: number;
};

const getBboxFromCenterRadius = (
  centerLat: number,
  centerLon: number,
  radiusMeters: number,
): BboxBounds => {
  const angularDistance = radiusMeters / EARTH_RADIUS_METERS;
  const latDelta = toDegrees(angularDistance);
  const cosLat = Math.cos(toRadians(centerLat));
  const lonDelta =
    Math.abs(cosLat) < 1e-6 ? 180 : toDegrees(angularDistance / cosLat);

  return {
    minLat: clamp(centerLat - latDelta, -90, 90),
    minLon: clamp(centerLon - lonDelta, -180, 180),
    maxLat: clamp(centerLat + latDelta, -90, 90),
    maxLon: clamp(centerLon + lonDelta, -180, 180),
  };
};

const getCenterRadiusFromBbox = (bounds: BboxBounds) => {
  const centerLat = (bounds.minLat + bounds.maxLat) / 2;
  const centerLon = (bounds.minLon + bounds.maxLon) / 2;
  const latDelta = Math.abs(bounds.maxLat - bounds.minLat) / 2;
  const lonDelta = Math.abs(bounds.maxLon - bounds.minLon) / 2;
  const latMeters = toRadians(latDelta) * EARTH_RADIUS_METERS;
  const cosLat = Math.cos(toRadians(centerLat));
  const lonMeters =
    Math.abs(cosLat) < 1e-6
      ? 0
      : toRadians(lonDelta) * EARTH_RADIUS_METERS * Math.abs(cosLat);

  return {
    centerLat: round(centerLat, 6),
    centerLon: round(centerLon, 6),
    radiusMeters: Math.max(0, round(Math.max(latMeters, lonMeters), 1)),
  };
};

const getPolygonCenter = (coordinates: Array<[number, number]>) => {
  if (coordinates.length === 0) {
    return { lat: 0, lon: 0 };
  }
  const sum = coordinates.reduce(
    (acc, point) => {
      acc.lat += point[0];
      acc.lon += point[1];
      return acc;
    },
    { lat: 0, lon: 0 },
  );
  return {
    lat: round(sum.lat / coordinates.length, 6),
    lon: round(sum.lon / coordinates.length, 6),
  };
};

const getPolygonFocusRadius = (
  coordinates: Array<[number, number]>,
  centerLat: number,
  centerLon: number,
) => {
  if (coordinates.length === 0) return 500;
  const metersPerDegLat = 111_320;
  const metersPerDegLon =
    metersPerDegLat * Math.max(0.000001, Math.cos(toRadians(centerLat)));
  let maxMeters = 0;
  coordinates.forEach(([lat, lon]) => {
    const dx = (lon - centerLon) * metersPerDegLon;
    const dy = (lat - centerLat) * metersPerDegLat;
    maxMeters = Math.max(maxMeters, Math.hypot(dx, dy));
  });
  return Math.max(50, round(maxMeters, 1));
};

const EditorWorkAreaEditor: React.FC<EditorWorkAreaEditorProps> = ({
  workAreas,
  onChange,
  onFocusWorkArea,
}) => {
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const updateWorkAreas = (next: EditorWorkArea[]) => {
    onChange(next);
  };

  const updateWorkArea = (id: string, update: Partial<EditorWorkArea>) => {
    updateWorkAreas(
      workAreas.map(area => (area.id === id ? { ...area, ...update } : area)),
    );
  };

  const updateBboxFields = (id: string, update: Partial<BboxBounds>) => {
    updateWorkAreas(
      workAreas.map(area => {
        if (area.id !== id || area.bounds.type !== 'bbox') return area;
        if (area.isLocked) return area;
        return {
          ...area,
          bounds: {
            ...area.bounds,
            ...update,
          },
        };
      }),
    );
  };

  const updateBbox = (
    id: string,
    field: 'minLat' | 'minLon' | 'maxLat' | 'maxLon',
    value: number,
  ) => {
    updateBboxFields(id, { [field]: value });
  };

  const updateBboxFromCenterRadius = (
    ...args: [
      id: string,
      centerLat: number,
      centerLon: number,
      radiusMeters: number,
    ]
  ) => {
    const [id, centerLat, centerLon, radiusMeters] = args;
    updateBboxFields(
      id,
      getBboxFromCenterRadius(centerLat, centerLon, Math.max(0, radiusMeters)),
    );
  };

  const updateZoom = (id: string, index: 0 | 1, value: number) => {
    updateWorkAreas(
      workAreas.map(area => {
        if (area.id !== id) return area;
        const nextZoom: [number, number] = [...area.allowedZoom] as [
          number,
          number,
        ];
        nextZoom[index] = value;
        return {
          ...area,
          allowedZoom: nextZoom,
        };
      }),
    );
  };

  const handleAdd = () => {
    const newArea: EditorWorkArea = {
      id: `wa-${Date.now()}`,
      name: 'New Work Area',
      bounds: {
        type: 'bbox',
        minLat: 0,
        minLon: 0,
        maxLat: 0.1,
        maxLon: 0.1,
      },
      allowedZoom: [8, 14],
      sources: ['terrain', 'bathymetry'],
    };
    updateWorkAreas([...workAreas, newArea]);
    setEditingId(newArea.id);
  };

  const handleRemove = (id: string) => {
    updateWorkAreas(workAreas.filter(area => area.id !== id));
    if (editingId === id) {
      setEditingId(null);
    }
  };

  return (
    <div className="grid gap-2.5">
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-[0.14em] text-editor-muted">
          Work Areas
        </div>
        <button
          type="button"
          className="cursor-pointer rounded-full border border-editor-quiet-border bg-editor-quiet-bg px-2 py-1 text-[11px] text-editor-muted"
          onClick={handleAdd}
          title="Create a new work area"
        >
          Add
        </button>
      </div>
      {workAreas.length === 0 ? (
        <div className="rounded-[10px] border border-editor-row-border bg-editor-row-bg px-2.5 py-2 text-[12px] text-editor-muted">
          No work areas defined yet.
        </div>
      ) : null}
      {workAreas.map(area => {
        const isEditing = editingId === area.id;
        const bboxCenter =
          area.bounds.type === 'bbox'
            ? getCenterRadiusFromBbox(area.bounds)
            : null;
        const polygonCenter =
          area.bounds.type === 'polygon'
            ? getPolygonCenter(area.bounds.coordinates)
            : null;
        const centerLat = bboxCenter?.centerLat ?? polygonCenter?.lat ?? 0;
        const centerLon = bboxCenter?.centerLon ?? polygonCenter?.lon ?? 0;
        const radiusMeters =
          bboxCenter?.radiusMeters ??
          (area.bounds.type === 'polygon'
            ? getPolygonFocusRadius(
                area.bounds.coordinates,
                centerLat,
                centerLon,
              )
            : 500);
        const boundsLocked = area.isLocked ?? false;
        return (
          <div
            key={area.id}
            className="box-border grid gap-2 rounded-[10px] border border-editor-row-border bg-editor-row-bg px-2.5 py-2"
          >
            <div className="grid gap-2">
              {isEditing ? (
                <input
                  className="w-full min-w-0 rounded-[8px] border border-editor-control-border bg-editor-control-bg px-2 py-1 text-[12px] text-editor-text"
                  value={area.name}
                  title="Work area name shown in the editor"
                  onChange={event =>
                    updateWorkArea(area.id, { name: event.target.value })
                  }
                />
              ) : (
                <div className="font-semibold">{area.name}</div>
              )}
              <div className="flex flex-wrap items-center gap-2">
                {onFocusWorkArea ? (
                  <button
                    type="button"
                    className="cursor-pointer rounded-full border border-editor-control-border bg-editor-control-bg px-2 py-1 text-[11px] text-editor-muted"
                    onClick={() =>
                      onFocusWorkArea(centerLat, centerLon, radiusMeters)
                    }
                    title="Move camera to work area center"
                  >
                    Focus
                  </button>
                ) : null}
                <button
                  type="button"
                  className="cursor-pointer rounded-full border border-editor-control-border bg-editor-control-bg px-2 py-1 text-[11px] text-editor-muted"
                  onClick={() =>
                    updateWorkArea(area.id, { isLocked: !boundsLocked })
                  }
                  title={
                    boundsLocked
                      ? 'Unlock work area bounds'
                      : 'Lock work area bounds'
                  }
                >
                  {boundsLocked ? 'Unlock' : 'Lock'}
                </button>
                <button
                  type="button"
                  className="cursor-pointer rounded-full border border-editor-control-border bg-editor-control-bg px-2 py-1 text-[11px] text-editor-muted"
                  onClick={() => setEditingId(isEditing ? null : area.id)}
                  title={
                    isEditing ? 'Close work area editor' : 'Edit work area'
                  }
                >
                  {isEditing ? 'Done' : 'Edit'}
                </button>
                <button
                  type="button"
                  className="cursor-pointer rounded-full border border-editor-control-border bg-editor-control-bg px-2 py-1 text-[11px] text-editor-muted"
                  onClick={() => handleRemove(area.id)}
                  title="Remove this work area"
                >
                  Remove
                </button>
              </div>
            </div>
            {isEditing ? (
              area.bounds.type === 'bbox' ? (
                <div className="grid gap-2">
                  <div className="grid gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <label
                        className="grid min-w-0 gap-1 text-[11px] text-editor-muted"
                        title="Center latitude for the work area"
                      >
                        Center Lat
                        <input
                          type="number"
                          step="0.0001"
                          min={-90}
                          max={90}
                          className="w-full min-w-0 rounded-[8px] border border-editor-control-border bg-editor-control-bg px-2 py-1 text-[12px] text-editor-text disabled:cursor-not-allowed disabled:opacity-60"
                          value={centerLat}
                          disabled={boundsLocked}
                          title="Center latitude (-90 to 90)"
                          onChange={event =>
                            updateBboxFromCenterRadius(
                              area.id,
                              Number(event.target.value),
                              centerLon,
                              radiusMeters,
                            )
                          }
                        />
                      </label>
                      <label
                        className="grid min-w-0 gap-1 text-[11px] text-editor-muted"
                        title="Center longitude for the work area"
                      >
                        Center Lon
                        <input
                          type="number"
                          step="0.0001"
                          min={-180}
                          max={180}
                          className="w-full min-w-0 rounded-[8px] border border-editor-control-border bg-editor-control-bg px-2 py-1 text-[12px] text-editor-text disabled:cursor-not-allowed disabled:opacity-60"
                          value={centerLon}
                          disabled={boundsLocked}
                          title="Center longitude (-180 to 180)"
                          onChange={event =>
                            updateBboxFromCenterRadius(
                              area.id,
                              centerLat,
                              Number(event.target.value),
                              radiusMeters,
                            )
                          }
                        />
                      </label>
                    </div>
                    <label
                      className="grid min-w-0 gap-1 text-[11px] text-editor-muted"
                      title="Radius in meters used to compute the bounding box"
                    >
                      Radius (m)
                      <input
                        type="number"
                        step="10"
                        min={0}
                        className="w-full min-w-0 rounded-[8px] border border-editor-control-border bg-editor-control-bg px-2 py-1 text-[12px] text-editor-text disabled:cursor-not-allowed disabled:opacity-60"
                        value={radiusMeters}
                        disabled={boundsLocked}
                        title="Radius in meters"
                        onChange={event =>
                          updateBboxFromCenterRadius(
                            area.id,
                            centerLat,
                            centerLon,
                            Number(event.target.value),
                          )
                        }
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label
                      className="grid min-w-0 gap-1 text-[11px] text-editor-muted"
                      title="Southern latitude bound (-90 to 90)"
                    >
                      Min Lat
                      <input
                        type="number"
                        step="0.01"
                        min={-90}
                        max={90}
                        className="w-full min-w-0 rounded-[8px] border border-editor-control-border bg-editor-control-bg px-2 py-1 text-[12px] text-editor-text disabled:cursor-not-allowed disabled:opacity-60"
                        value={area.bounds.minLat}
                        disabled={boundsLocked}
                        title="Minimum latitude (-90 to 90)"
                        onChange={event =>
                          updateBbox(
                            area.id,
                            'minLat',
                            Number(event.target.value),
                          )
                        }
                      />
                    </label>
                    <label
                      className="grid min-w-0 gap-1 text-[11px] text-editor-muted"
                      title="Western longitude bound (-180 to 180)"
                    >
                      Min Lon
                      <input
                        type="number"
                        step="0.01"
                        min={-180}
                        max={180}
                        className="w-full min-w-0 rounded-[8px] border border-editor-control-border bg-editor-control-bg px-2 py-1 text-[12px] text-editor-text disabled:cursor-not-allowed disabled:opacity-60"
                        value={area.bounds.minLon}
                        disabled={boundsLocked}
                        title="Minimum longitude (-180 to 180)"
                        onChange={event =>
                          updateBbox(
                            area.id,
                            'minLon',
                            Number(event.target.value),
                          )
                        }
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label
                      className="grid min-w-0 gap-1 text-[11px] text-editor-muted"
                      title="Northern latitude bound (-90 to 90)"
                    >
                      Max Lat
                      <input
                        type="number"
                        step="0.01"
                        min={-90}
                        max={90}
                        className="w-full min-w-0 rounded-[8px] border border-editor-control-border bg-editor-control-bg px-2 py-1 text-[12px] text-editor-text disabled:cursor-not-allowed disabled:opacity-60"
                        value={area.bounds.maxLat}
                        disabled={boundsLocked}
                        title="Maximum latitude (-90 to 90)"
                        onChange={event =>
                          updateBbox(
                            area.id,
                            'maxLat',
                            Number(event.target.value),
                          )
                        }
                      />
                    </label>
                    <label
                      className="grid min-w-0 gap-1 text-[11px] text-editor-muted"
                      title="Eastern longitude bound (-180 to 180)"
                    >
                      Max Lon
                      <input
                        type="number"
                        step="0.01"
                        min={-180}
                        max={180}
                        className="w-full min-w-0 rounded-[8px] border border-editor-control-border bg-editor-control-bg px-2 py-1 text-[12px] text-editor-text disabled:cursor-not-allowed disabled:opacity-60"
                        value={area.bounds.maxLon}
                        disabled={boundsLocked}
                        title="Maximum longitude (-180 to 180)"
                        onChange={event =>
                          updateBbox(
                            area.id,
                            'maxLon',
                            Number(event.target.value),
                          )
                        }
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label
                      className="grid min-w-0 gap-1 text-[11px] text-editor-muted"
                      title="Minimum allowed tile zoom for this work area"
                    >
                      Min Zoom
                      <input
                        type="number"
                        min={0}
                        max={22}
                        className="w-full min-w-0 rounded-[8px] border border-editor-control-border bg-editor-control-bg px-2 py-1 text-[12px] text-editor-text"
                        value={area.allowedZoom[0]}
                        title="Minimum zoom (0 to 22)"
                        onChange={event =>
                          updateZoom(area.id, 0, Number(event.target.value))
                        }
                      />
                    </label>
                    <label
                      className="grid min-w-0 gap-1 text-[11px] text-editor-muted"
                      title="Maximum allowed tile zoom for this work area"
                    >
                      Max Zoom
                      <input
                        type="number"
                        min={0}
                        max={22}
                        className="w-full min-w-0 rounded-[8px] border border-editor-control-border bg-editor-control-bg px-2 py-1 text-[12px] text-editor-text"
                        value={area.allowedZoom[1]}
                        title="Maximum zoom (0 to 22)"
                        onChange={event =>
                          updateZoom(area.id, 1, Number(event.target.value))
                        }
                      />
                    </label>
                  </div>
                  <div className="grid gap-2">
                    <div
                      className="text-[11px] text-editor-muted"
                      title="Tile sources allowed for this work area"
                    >
                      Sources
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-editor-muted">
                      {['terrain', 'bathymetry', 'imagery'].map(source => (
                        <label
                          key={source}
                          className="flex items-center gap-2 rounded-[8px] border border-editor-control-border bg-editor-control-bg px-2 py-1"
                          title={`Enable ${source} tiles for this work area`}
                        >
                          <input
                            type="checkbox"
                            checked={area.sources.includes(source)}
                            onChange={event => {
                              const next = event.target.checked
                                ? [...area.sources, source]
                                : area.sources.filter(item => item !== source);
                              updateWorkArea(area.id, { sources: next });
                            }}
                          />
                          {source}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-editor-muted">
                  Polygon bounds editing is not implemented yet.
                </div>
              )
            ) : (
              <div className="grid gap-1 text-[11px] text-editor-muted">
                <div>
                  {area.bounds.type.toUpperCase()} · {formatBounds(area)}
                </div>
                <div>
                  Zoom {area.allowedZoom[0]}–{area.allowedZoom[1]}
                  {area.isLocked ? ' · Locked' : ''}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default EditorWorkAreaEditor;
