# Testing Guardrails

## Typed Fixtures First

- Prefer typed fixture builders over inline object literals.
- `any` in tests is allowed only at adapter boundaries that cannot be typed cleanly.
- If `any` is necessary, add a short comment explaining the boundary.

## Testing Pyramid

- Unit tests: pure helpers/selectors/parsers.
- Boundary tests: API/socket/route behavior at request-event boundaries.
- UI tests: user-visible behavior and flows, not implementation wiring.

## Mocking Policy

- Mock only expensive rendering, external IO, or nondeterministic integrations.
- Avoid broad module mocks when a narrower seam can be injected.
- Prefer scenario-local mock setup to global mega-fixtures.

## Regression Policy

- New tests should use typed builders (for example `tests/frontend/helpers/builders.ts`).
- New brittle patterns (`router.stack` traversal, broad `any` fixtures, deep private-state poking) are considered regressions.
