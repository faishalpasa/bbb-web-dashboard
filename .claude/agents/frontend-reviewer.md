# Agent: Frontend Reviewer

Review React/TypeScript code against this project's rules and the design artboards.

## Checklist

### Architecture

- [ ] Routes are registered in `src/router.tsx` with paths from `ROUTES`; no hard-coded paths in JSX.
- [ ] Axios calls use `axiosClient` from `@/utils/api` through `services/<domain>.ts` functions returning `ServiceResponse<T>`.
- [ ] Presentational components do not fetch or contain business rules; state and service calls live in `_context.tsx` or a hook.
- [ ] No Laravel/Inertia/Ziggy imports and no reliance on server-provided props.

### Components and types

- [ ] Functional arrow components and named exports (no default exports).
- [ ] Props, requests, and responses are typed without `any`; types match the API contract.
- [ ] No nested ternaries or duplicated status mappings.
- [ ] Page-only components live in `_components/`; reusable UI lives globally.

### UX and accessibility

- [ ] Indonesian copy addresses members as “Ibu”.
- [ ] 44px targets, visible labels/errors, keyboard access, and WCAG AA contrast.
- [ ] Member/public screens checked at 390px; admin at 1360px.
- [ ] Required `data-test-id` attributes follow project convention.
- [ ] Dialogs use `@/components/molecules/dialog`.

## Output

For every issue include file, line, severity, violated rule, and concrete fix. End with totals by severity and note which visual/runtime boundaries were not verified.
