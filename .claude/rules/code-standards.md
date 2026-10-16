# Code Standards

## TypeScript and React

- TypeScript strict mode; never use `any` to bypass a contract.
- Functional components with arrow syntax and named exports; no default exports.
- Prefer `async/await`; avoid nested ternaries and clever compressed logic.
- Props use a named `<ComponentName>Props` interface or type.
- Use Tailwind, not inline styles, except for truly dynamic values that cannot be represented safely.
- Keep files single-purpose and extract duplicated behavior only after a real reuse boundary appears.
- Comments explain non-obvious reasons, not visible syntax.

## Data and copy

- Type every service request and response in `src/types/<domain>.d.ts`; never import raw `axios` outside `utils/api.ts`.
- UI copy is Indonesian and addresses members as “Ibu”.
- Do not expose internal enum values directly; map them to centralized Indonesian labels (`src/constants/`).
- Do not guess data fields, design details, secrets, or unresolved product behavior.

## AI instructions

- Read `TASKS.md`, all `.claude/rules/`, and relevant screenshots before changing code.
- Use the existing component and route patterns before introducing abstractions.
- Do not add a global state library or a new dependency without a concrete requirement.
- Preserve unrelated working-tree changes and stay within the requested phase.
