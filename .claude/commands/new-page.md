# New Page

Create a page following the project convention.

## Usage

```text
/project:new-page <area>/<page-name>
```

Argument: **$ARGUMENTS**

## Steps

1. Inspect the matching artboard in the live design artifact (`docs/screens/README.md`); ask if it is missing.
2. Create `src/pages/$ARGUMENTS/index.tsx` with a named `Page<Name>` export and `useTitle`.
3. Add `_context.tsx` (state, effects, service calls) and `_components/page-content.tsx`.
4. Add the path to `src/constants/route.ts` and register the route in `src/router.tsx`.
5. Add typed service functions in `src/services/<domain>.ts` and types in `src/types/<domain>.d.ts` (and the matching mock handler while the endpoint is missing).
6. Add stable `data-test-id` attributes and verify the required viewport.

Do not import raw Axios or hard-code route paths in JSX.
