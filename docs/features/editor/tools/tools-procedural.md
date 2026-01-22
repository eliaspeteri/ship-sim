# Procedural Placement Tools

## Purpose

Scatter or generate features deterministically.

## Scope

- Scatter rules
- Seeds
- Preview vs bake
- Line/curve instancing
- Base vegetation/biome fills

## Implementation Checklist

- [ ] Deterministic seed handling
- [ ] Preview overlay
- [ ] Bake to features
- [ ] Store procedural params in layer
- [ ] Polyline spacing/count placement mode
- [ ] Curve alignment + start/end offsets

---

## Line/Curve Instancing

Use polylines or bezier curves as guides to place repeated assets.

Inputs:

- Source geometry: polyline/curve (authored or derived from edges)
- Asset set: one or more assets/features to repeat
- Placement mode: `spacing` (meters) or `count` (N per line)
- Offsets: start/end padding, lateral offset, jitter (optional)
- Alignment: tangent or normal, optional rotation overrides
- Seed: for deterministic jitter/variation

Outputs:

- Instanced points/segments computed at build time
- Optional "bake to features" for manual edits

Example uses:

- Berths every 3m along a pier edge
- Bollards every 5m along a dock line
- Lighting pylons at fixed intervals along a breakwater

---

## Vegetation Base Layer

Provide a global-ish baseline vegetation/biome fill so users only refine.

Concept:

- Deterministic generator seeded per tile or per pack
- Uses biome paint + masks as constraints
- Produces a base density field plus optional asset variety
- Manual paint/mask layers override or suppress the base layer

Notes:

- Keep runtime deterministic (no per-client randomness)
- Allow local overrides near ports and shipping lanes
