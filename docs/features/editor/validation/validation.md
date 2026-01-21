# Validation System

## Purpose

Provide deterministic checks for authored data before submission or publish.

## Scope

- Layer-level validation
- Feature-level validation
- Cross-layer validation
- UI feedback in inspector and viewport

## Out of Scope

- Compilation pipeline
- Moderation policies

## Implementation Checklist

- [ ] Validation rules registry per layer type
- [ ] Run validation on change and on demand
- [ ] Error/warn classification
- [ ] Error list surfaced in inspector
- [ ] Viewport highlights for invalid features
- [ ] Block publish when critical errors exist
