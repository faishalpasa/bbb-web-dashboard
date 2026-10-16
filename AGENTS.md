# BBB BFF Web Dashboard

Admin-only static SPA. Member/public pages live in `../web-app`; Laravel JSON API lives in `../bbb-api`.

## Before working

1. Read every file in `.claude/rules/` and `TASKS.md`.
2. Inspect `git status --short` and preserve unrelated work.
3. Inspect the admin artboard linked in `docs/screens/README.md` before implementing UI; never invent missing designs.
4. Read `docs/contracts/`. Admin endpoints, session and capabilities are not defined yet: agree on them before integration.

## Rules

- Match web-app: Vite, React 19, strict TypeScript, code-based TanStack Router, Tailwind 4, existing shadcn-style primitives, Axios, opt-in development MSW.
- Admin design target is 1360px; layouts also work down to mobile (below 1024px the sidebar becomes a left drawer opened from a top bar). Indonesian UI; member-facing copy addresses Ibu.
- Named arrow exports `Page<Name>`; `src/pages/<area>/<page>/{index.tsx,_context.tsx,_components/}`.
- App-wide state only in `app-context.tsx`; page state/service calls in `_context.tsx`; no business rules in React.
- Services use verb-prefixed functions, `{ data, status: true }`, and throw `ServiceError`. Pages never import Axios.
- Required fields use FormField / RequiredMark; interactive elements use `data-test-id="modul_elemen_aksi"`.
- API authorizes every action. Do not grant admin access from a member session or hard-coded capabilities.
- Dummy phase: no migrations or database access. Do not invent API fields or endpoints.
- Keep `frontend-api.md` identical across dashboard, web-app and API when changing the shared contract; notify the user.
- No commit, push, deploy, amend, rebase or remote creation without explicit request. No AI attribution. Work on development, not main.

## Commands

`npm ci`, `npm run dev` (http://localhost:5174), `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run build`.

Use localhost, not 127.0.0.1. Before API integration, allow localhost:5174 in API CORS and Sanctum alongside localhost:5173. Never overwrite the member origin. Scaffold has no admin authentication or protected data yet.
