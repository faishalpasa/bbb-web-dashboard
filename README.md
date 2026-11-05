# BBB BFF Web Dashboard

Static admin SPA, scaffolded from `../web-app` conventions. No member/public screens or Laravel code are copied. No admin data, auth, capabilities, sidebar or final artboard UI is implemented yet.

## Local development

```bash
nvm use
cp .env.example .env
npm ci
npm run dev
```

Use Node 22 (`.nvmrc`), matching CI. Open http://localhost:5174. Member app remains on 5173; API remains on 8000. Use localhost, not 127.0.0.1.

Before integrating API auth, configure its environment to preserve both frontend origins:

```dotenv
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
```

Do not change API `FRONTEND_URL` to the admin URL: current email/Google redirects belong to the member app. Agree on admin auth/redirects before wiring them. The admin app signs in with its own Bearer token (`bbb.admin.token` in localStorage, 30 minute lifetime, refreshed on 401); see `docs/plans/bearer-auth.md` in web-app and bbb-api.

## Structure

```text
.claude/{rules,agents,commands,skills,templates}/
.agent/README.md          # alias to canonical AGENTS.md
.agents/README.md         # same convention as web-app
src/
  app-context.tsx         # app-wide state, not page filters
  router.tsx              # code-based TanStack Router, lazy named pages
  pages/admin/dashboard/
    index.tsx
    _context.tsx
    _components/page-content.tsx
  pages/{not-found,server-error}/
  components/{layout,molecules,ui}/
  constants/              # routes and environment flags
  services/               # verb-prefixed Axios services
  types/                  # typed request/response contracts
  utils/                  # shared Axios/Bearer and error handling
  hooks/
  lib/
  mocks/                  # dev-only MSW; health endpoint only
docs/{contracts,screens}/
public/                   # existing BBB logos/favicon, MSW worker
```

Run `npm run typecheck && npm run lint && npm run format:check && npm run build`.
`VITE_API_MOCKING_ENABLED=true npm run dev` enables the health mock only. Production excludes MSW. No credentials or admin privileges are faked.

Read `AGENTS.md` before working. Keep the shared API contract identical with web-app and bbb-api. Artboards 8–13 remain the source of truth. Scaffold is not a visual implementation of them.
