# AI Engineering Guardrails

## Purpose

This document gives AI agents project-specific guardrails to prevent recurring issues tracked in `docs/refactor-backlog.md`.

Use this as a default policy for new code, refactors, and tests.

## Core Principles

1. Keep modules focused and small. Avoid god components/modules and mixed responsibilities.
2. Prefer explicit contracts over implicit behavior.
3. Keep server state authoritative and consistent across HTTP, socket, and persistence paths.
4. Fail safely and explicitly. Do not hide or silently swallow correctness/security concerns.
5. Optimize for maintainability first, then optimize performance with measurement.

## Hard Rules For New Code

1. No new large orchestration files. Split by domain and lifecycle concerns.
2. No render-path global store pulls (`getState()` in JSX render wiring). Use reactive selectors/hooks.
3. No duplicate derivation logic across features. Extract shared selectors/helpers.
4. Keep nesting depth low (target max depth `3`).
5. Keep function/method params to `<= 3`; otherwise use typed parameter objects.
6. Do not add new `.module.css` unless explicitly approved as an exception. Use Tailwind-first styling.
7. Do not use blocking sync operations (`*Sync`) on hot/request paths.
8. Do not add unauthenticated mutation endpoints.
9. Do not add user-scoped routes without subject binding (self vs admin policy).
10. No secret-bearing query params.

## Lint Guardrails

1. ESLint enforces `max-depth` target `3` and `max-params` target `3` for app code.
2. If a function needs more than three inputs, prefer a typed parameter object.
3. Allowed exceptions are explicit interop boundaries (for example WASM ABI bridge functions), not general app logic.

## Concurrency And State Integrity

1. Treat every mutable state transition as race-prone by default.
2. Use transactional writes or conditional updates with explicit preconditions for state transitions.
3. Add idempotency safeguards for retried or duplicate mutation requests.
4. Avoid read-modify-write balance updates without atomic DB semantics.
5. Add explicit start/stop lifecycle control for timers/interval loops.
6. Avoid overlapping async interval work; use in-flight guards where needed.

## API Contract Quality

1. Validate input at boundaries with explicit schemas (shape, ranges, required fields).
2. Keep error response shape consistent across routes.
3. Preserve backward compatibility for existing routes unless versioned.
4. Prefer explicit versioning plan (`/api/v1` or documented compatibility policy) before breaking response changes.
5. Return controlled upstream error mappings for proxy routes (for example: timeout/network failure).

## Testing Strategy

1. Prioritize tests by risk area, not file count.
2. Prefer boundary/integration-style tests over framework-internal coupling.
3. Minimize mock fan-out and private-state poking.
4. Add regression tests for authorization, concurrency-sensitive transitions, and state consistency.
5. Add property-style tests for simulation/rules invariants where deterministic assertions are hard.
6. Keep fixtures typed; do not introduce `any` in tests for convenience.
7. If an untyped external payload boundary forces `any`, isolate it in one adapter helper with a type guard and a short justification comment.
8. For every changed behavior, cover happy path, at least one sad path, and at least one edge/boundary case.

## Observability And Operability

1. Use structured logs with stable fields (`source`, `event`, `userId`, `vesselId`, `spaceId`, `requestId`).
2. Propagate correlation/request IDs from request entry to downstream logs.
3. Keep metrics actionable (latency, error rate, throughput, queue/timer health, rate-limit hits).
4. Ensure sensitive values are redacted from logs.
5. Do not rely only on volatile in-memory logs for production-grade debugging paths.

## Domain Correctness

1. Keep server authoritative for physics-critical and economy-critical transitions.
2. Enforce ruleset invariants consistently (COLREGS penalties, mission progression, economy side effects).
3. Reject client updates that violate physics/domain bounds.
4. Keep anti-cheat checks explicit, testable, and centralized.

## Accessibility And UX Robustness

1. Interactive UI elements must use semantic controls (`button`, `input`, `select`, etc.) by default.
2. Use ARIA `role` only when no native element can express the widget semantics.
3. Valid `role` examples: `role="dialog"` for modal containers, `role="tablist"`/`role="tab"` for custom tabs, `role="meter"` for meter-like readouts.
4. Do not add redundant/conflicting roles to native elements that already provide correct semantics.
5. Modal/dialog UIs must include dialog semantics and keyboard behavior.
6. Preserve keyboard navigation and visible focus states.
7. Respect reduced-motion preferences for animated surfaces.
8. Validate mobile interaction edge cases and touch-friendly controls.

## Dependency And Supply-Chain Posture

1. Prefer non-breaking dependency updates first.
2. Triage vulnerabilities by runtime exposure and exploitability; do not backlog every advisory by default.
3. If an audit fix requires a breaking change and is accepted, add one explicit backlog item with migration plan and rollback plan.
4. Track accepted temporary risk with owner, rationale, and review date.
5. Keep env/secret hygiene explicit: required vars, fail-fast behavior, and no insecure defaults in deployed environments.
6. Do not disable security checks in CI without a documented exception and follow-up ticket.

## PR Acceptance Checklist For AI Agents

1. Lint passes.
2. Relevant tests pass.
3. Type safety preserved or improved.
4. No new auth/authorization regression.
5. No new duplicated derivation logic.
6. No new blocking sync hot-path operations.
7. No new brittle tests coupled to internals.
8. No API contract drift without explicit intent.
9. No new accessibility regressions in touched UI.
10. Changed behavior includes happy-path, sad-path, and edge-case automated coverage.

## Code Smell Checklist (Provided Reference List)

1. Afraid To Fail
2. Alternative Classes with Different Interfaces
3. Base Class Depends on Subclass
4. Binary Operator in Name
5. Boolean Blindness
6. Callback Hell
7. Clever Code
8. Combinatorial Explosion
9. Complicated Boolean Expression
10. Complicated Regex Expression
11. Conditional Complexity
12. Data Clump
13. Dead Code
14. Divergent Change
15. Dubious Abstraction
16. Duplicated Code
17. Fallacious Comment
18. Fallacious Method Name
19. Fate over Action
20. Feature Envy
21. Flag Argument
22. Global Data
23. Hidden Dependencies
24. Imperative Loops
25. Inappropriate Static
26. Incomplete Library Class
27. Inconsistent Names
28. Inconsistent Style
29. Indecent Exposure
30. Insider Trading
31. Large Class
32. Lazy Element
33. Long Method
34. Long Parameter List
35. Magic Number
36. Message Chain
37. Middle Man
38. Mutable Data
39. Null Check
40. Obscured Intent
41. Oddball Solution
42. Parallel Inheritance Hierarchies
43. Primitive Obsession
44. Refused Bequest
45. Required Setup or Teardown Code
46. Shotgun Surgery
47. Side Effects
48. Special Case
49. Speculative Generality
50. Status Variable
51. Temporary Field
52. Tramp Data
53. Type Embedded in Name
54. Uncommunicative Name
55. Vertical Separation
56. What Comment

## Suggested Usage In Prompts

When asking an AI to implement or refactor, include:

1. "Follow `docs/ai-engineering-guardrails.md`."
2. "Apply the PR Acceptance Checklist."
3. "Call out any triggered code-smell names in your review summary."
