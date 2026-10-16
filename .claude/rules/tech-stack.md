# Tech Stack

- Vite 6, React 19, TypeScript 5 (strict), TanStack Router v1 (code-based routes).
- Tailwind CSS 4, Radix primitives (shadcn/ui style), `vaul` for the mobile bottom sheet, `lucide-react` icons.
- Axios through the shared `axiosClient` (`src/utils/api.ts`) against the Laravel API with JWT `Authorization: Bearer` auth (`docs/plans/bearer-auth.md`).
- MSW 2 for opt-in, dev-only API mocks.
- ESLint and Prettier. Playwright may be added when browser automation begins.
- Fonts: DM Sans and IBM Plex Mono through `@fontsource` (no runtime CDN).

## Path aliases

`@/` maps to `src/`. Use it for internal imports.

## Explicit exclusions

- No Laravel, Inertia, Ziggy, Blade, or any server-rendered HTML.
- No SSR and no Node runtime in production; the build is static files.
- No raw `axios` imports outside `src/utils/api.ts`.
- No global state library; app-wide state stays in `app-context.tsx`.
- No cookie-session auth and no CSRF handshake (`docs/plans/bearer-auth.md`).
