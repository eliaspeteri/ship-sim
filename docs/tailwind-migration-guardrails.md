# Tailwind Migration Guardrails

## Scope and policy

- Tailwind is the default styling path for component and page UI.
- New `.module.css` files and imports are blocked by `npm run check:styles`.
- `src/styles/globals.css` is restricted to:
  - Tailwind import and theme tokens
  - global reset/base defaults
  - app-wide CSS variables
- Component-level selectors and page-specific selectors are not allowed in `globals.css`.

## Token mapping rules

Use semantic tokens for reusable primitives instead of hard-coded values:

- panel: `bg-ui-panel`, `border-ui-panel-border`, `rounded-ui-panel`, `shadow-ui-panel`
- card: `bg-ui-card`, `border-ui-card-border`, `rounded-ui-card`
- overlay: `bg-ui-overlay`, `border-ui-overlay-border`, `shadow-ui-overlay`
- pill: `bg-ui-pill`, `border-ui-pill-border`, `rounded-full`
- action accents: `text-ui-accent`, `bg-ui-accent`, `hover:bg-ui-accent-strong`
- spacing: `px-ui-panel-x`, `py-ui-panel-y`

When a module CSS value repeats across multiple components, map it to semantic theme tokens first, then migrate usages.

## Allowed exceptions

Tailwind exceptions are allowed only when utility classes are impractical:

- complex pseudo-element geometry (`::before`, `::after`) for instrument visuals
- browser-specific UI controls and quirks that require raw selectors
- low-level third-party override hooks that cannot be expressed with utility classes

Every exception must:

- stay local to the owning component/module
- include a short comment explaining why Tailwind was not feasible
- avoid introducing global selectors
- be listed in the allowlist inside `scripts/check-no-css-modules.js`

## CI/Review checks

- Run `npm run check:styles` locally before pushing.
- CI runs the same check to prevent `.module.css` regressions.
- Add or update snapshot coverage for key styled surfaces when changing major layout/panel styles.

## Migration order

1. migrate repeated visual primitives to semantic Tailwind tokens
2. convert module class usage to utility classes
3. delete migrated module CSS
4. keep exception CSS minimal and documented
