# Conventions

## Page convention

Each route page lives in `src/pages/<area>/<page-name>/index.tsx`.

```text
src/pages/admin/members/
├── index.tsx
├── _context.tsx          # page-only state, effects, service calls, actions
├── _components/          # kebab-case files, only used by this page
└── [id]/                 # dynamic detail route with the same layout
```

- `index.tsx` is limited to `useTitle`, provider composition, and layout composition. The page component is named `Page<Name>` (for example `PageLogin`) and is a **named export** that `src/router.tsx` loads lazily.
- `_context.tsx` owns page state and exposes `usePageContext()`; `_components/page-content.tsx` renders UI from the context.
- Page-specific hooks stay in the page folder. Reusable UI moves to `src/components/` only after reuse is real.
- Register every new page in `src/router.tsx` and add its path to `ROUTES`.

## Components

- Functional arrow components and named exports; no default exports.
- Base primitives in `components/ui/`, composed reusable UI in `components/molecules/`, layout wrappers in `components/layout/`.
- Dialogs always use `@/components/molecules/dialog` (centered dialog on desktop, bottom sheet on mobile); never import `components/ui/dialog` or `drawer` directly.
- Native `<select>` through `components/ui/native-select.tsx` keeps the OS picker on mobile.

## Admin shell (pending implementation)

- Admin shell/sidebar must follow artboards 8–13 at 1360px. Do not invent navigation or capabilities.
- Member/public pages and bottom navigation remain in `../web-app`; do not recreate them here.
- `ScaffoldLayout` is a technical placeholder, not the final admin shell.
- Screens whose artboard is not implemented yet render `PlaceholderPage` and are listed in `TASKS.md`; replace, do not extend, a placeholder.

## Error pages

- Scaffold fallback pages live in `pages/not-found` and `pages/server-error`; replace their technical presentation after inspecting the artboards.
- Typed error helpers mirror web-app. Use API codes/statuses, not message matching. Do not add token UI without a defined admin flow.

## Forms

- The API's Form Requests are authoritative. Client validation improves UX but must not diverge from the server rules in the contract.
- Local form state lives in the page `_context.tsx`. Field names match the request keys in the contract (camelCase).
- Render visible labels, field errors next to the field, disabled submitting states, and 44px minimum targets.
- Every mandatory field is marked with `*` (`FormField` does it by default; use `isOptional` for the rare optional one, `RequiredMark` for hand-written labels, and `aria-required` on the control). Multi-section forms show `RequiredNote` ("Tanda * berarti wajib diisi.").
- Server field errors come from `fieldErrorMessage(error, 'field')`; other failures from `errorMessage(error)`.

## Hooks and utilities

- Custom hooks begin with `use`; reusable hook files are camelCase (`hooks/useTitle.ts`).
- Pure utilities live in `src/utils/`; no network calls or React state. `src/lib/` is only for third-party wrappers.
- Mock data lives in `src/mocks/` and is typed with the same `types/<domain>.d.ts` as the services.

## API services

- One file per domain in `src/services/`; verb-named functions returning `ServiceResponse<T>` and throwing `ServiceError`. See `architecture.md`.
- Call services from `_context.tsx` or hooks, never from presentational components.

## Styling

- Tailwind CSS for component styling; global CSS only for tokens, font faces, resets, and base styles.
- Palette: `#002A32`, `#F6F4ED`, `#B7B38F`, danger `#A32222`. The app is light only.
- DM Sans is primary; IBM Plex Mono is for member numbers, attendance codes, and numeric displays.
