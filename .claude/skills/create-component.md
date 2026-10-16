# Skill: create-component

## Trigger

Use when asked to create or add a React component.

## Steps

1. Decide whether it is page-specific (`pages/.../_components/`) or genuinely reusable (`components/`).
2. Read the relevant screenshot and `component-template.md`.
3. Define strict props and use a named arrow export.
4. Use Tailwind and shared primitives; add `data-test-id` to interactive elements.
5. Keep fetching in hooks/context and Axios calls in domain services.
6. Verify format, lint, build, accessibility basics, and the target viewport.

Do not invent missing visual details or embed server business rules.

