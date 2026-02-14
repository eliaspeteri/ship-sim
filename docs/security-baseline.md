# Security Baseline

## Required Production Environment

These values must be explicitly configured in production.

- `NEXTAUTH_SECRET`: required for auth/session token validation.
- `FRONTEND_ORIGINS` (preferred) or `FRONTEND_URL`: required for strict CORS origin allowlist.
- `REGISTER_RATE_LIMIT_MAX` / `REGISTER_RATE_LIMIT_WINDOW_MS`: credential registration throttling.
- `COMPILE_RATE_LIMIT_MAX` / `COMPILE_RATE_LIMIT_WINDOW_MS`: editor compile endpoint throttling.

## Runtime Expectations

- Production must not use permissive CORS fallbacks.
- Auth-required routes must return unauthorized responses without valid session/user.
- Logs must avoid secrets, raw auth tokens, and full cookie values.

## CI Guardrails

- `npm run check:security-baseline` verifies security docs and required env keys in `.env.example`.
- Security-sensitive changes should include tests for authz, input bounds, and error-shape stability.
