# Skill: create-page

## Trigger

Use when asked to create or add an application page.

## Steps

1. Identify the area: `auth`, `onboarding`, `member`, `admin`, or `public`.
2. Inspect the corresponding artboard in the live design artifact; ask if missing.
3. Create a thin page entry using the page template, with local `_context.tsx` and `_components/`.
4. Add the path to `ROUTES` and register the route in `src/router.tsx`.
5. Add typed service functions and types; confirm the endpoint in `docs/contracts/frontend-api.md`.
6. Use Indonesian copy, stable test ids, and the correct responsive target.
7. Run `npm run typecheck`, `lint`, `format:check`, and `build`, and check the page in a browser.
