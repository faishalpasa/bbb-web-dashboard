# BBB BFF admin implementation checklist

Launch target: 30 October 2026. Admin-only app; member/public work remains in web-app. Check items only after verification.

## Handoff (16 October 2026)

- Local path: `/Users/pasa/Projects/BBB/web-dashboard`; origin: `git@github.com:faishalpasa/bbb-web-dashboard.git`; working branch: `development`.
- Git initialized on `development`, origin connected. User authorized the initial scaffold commit/push on 16 October 2026. Check `git status` and `git log` for current publication state; continue working on `development`.
- Continue with section 1 only. Read `AGENTS.md`, all `.claude/rules/`, `docs/contracts/`, and `docs/HANDOFF.md` before changing code.
- Member app (`../web-app`) is complete through membership exit part B; its latest published commit is `3371913`. API (`../bbb-api`) latest published commit is `e813fc2`; both development.
- Public event `/e/{slug}` is not implemented and belongs to web-app, not dashboard.
- Local dashboard server was left running on 5174; member Vite 5173 was stopped at the user's request. Recheck processes before starting servers.

## 0. Scaffold

- [x] Vite + React + strict TypeScript + Tailwind + code-based TanStack Router on localhost:5174.
- [x] Match web-app agent guidance, page/context/components, services/types/utils, primitives, tokens, fonts, logo assets and quality scripts.
- [x] Dev-only MSW skeleton and Axios/CSRF infrastructure; no invented admin auth or endpoints. Runtime transport tests remain for integration.
- [x] Typecheck, lint, format check and build passed with Node 22.23.3; browser startup and fallback-route/back-link smoke tested at 1360px. This does not verify the admin artboards or authenticated API flows.

## 1. Admin foundation (next)

- [ ] Inspect admin artboards in Chrome at 1360px; export only if necessary.
- [ ] Agree admin session/auth/capabilities contract with the API, including 401/403, redirect destination and shared-cookie behavior. (Draft in docs/contracts/admin-auth.md, implemented as dummy `/api/admin/*`; awaiting approval.)
- [x] Allow both 5173 and 5174 origins in API local CORS/Sanctum; do not break member redirects. (`.env.example` updated; FRONTEND_URL unchanged.)
- [x] Login (email + password, adapted from member artboard 1a) and route guard; verified at 1360px against the real dummy API.
- [x] Admin shell/sidebar (left drawer below 1024px) and capability-gated navigation (admin biasa hanya Dashboard dan Kegiatan; Member/Permintaan Keluar/Admin/Pengaturan/Log khusus superadmin).
- [x] Dashboard (artboard 8) with dummy `GET /api/admin/dashboard` (docs/contracts/admin-dashboard.md) and Pest tests; checked at 1360px as superadmin and admin. Loading/error/401 states built; error/401 not yet exercised in a browser.

## 2. Admin flows

- [x] Member list/filter/create/detail/edit, confirmed deactivation (plus dummy export CSV, reset-password acknowledgement, internal note, and reactivation added at the user's request). Checked at 1360px and 375px against the real dummy API (`docs/contracts/admin-members.md`). Not yet covered by Playwright.
- [x] Event list/create/edit, participants, attendance code generation, manual Present/X, close event (plus add participant dialog, dummy banner upload, duplicate, announcement text, cancel at the user's request). Checked at 1360px and 375px against the real dummy API (`docs/contracts/admin-events.md`). Not yet covered by Playwright; the public page `/e/{slug}` still belongs to web-app.
- [x] Exit-request review (approve with confirmation, reject with a required reason; dummy `/api/admin/exit-requests`, docs/contracts/admin-exit-requests.md). Checked at 1360px and 375px against the real dummy API. Not yet covered by Playwright; the member-side exit flow is still session-based and not linked to these dummy requests.
- [x] Superadmin settings, admin management, invitations and audit log (dummy `/api/admin/{settings,admins,invitations,audit-logs}`, docs/contracts/admin-superadmin.md; invitation email is a template, so the dummy response hands back the activation link). Checked at 1360px and 375px against the real dummy API, including the 403 for a plain admin. Not yet covered by Playwright.
- [ ] Masterlist import mock-first: upload, column mapping, preview summary, row issues, confirmation, result and error report (see docs/contracts/masterlist-import.md).
- [ ] Masterlist scenarios: duplicates, invalid regional codes, missing district/postal code, under-age rows. Wait for an anonymized sample before finalizing parser/mapping.

## 3. Verification and delivery

- [ ] Browser flows at 1360px against real dummy API, including loading/error and authorization refusals.
- [ ] Accessibility and Playwright coverage.
- [ ] Hosting/SPA fallback/domain setup.

## Decisions/inputs still needed

- Admin auth/session/capability shapes, dummy admin credentials and redirect destinations; member login does not grant admin access.
- Real production domains/hosting and shared-domain cookie setup; preserve member auth while adding admin.
- Anonymized masterlist sample. Do not import personal member data into external services.
- Live Claude artboard access through signed-in Chrome; ask for exports if unavailable.

Origin connection was explicitly requested. Commit/push/deploy still require a separate explicit request. No backend database/migrations until the user ends the dummy phase.

## Bearer auth migration (`docs/plans/bearer-auth.md` in web-app and bbb-api)

- [x] Phase 3 (web-dashboard): admin Bearer token (`bbb.admin.token`), refresh on 401, no CSRF handshake, logout revokes the token. Checked in the browser at the dev server against the local API: sign-in, reload, expired-token refresh, logout (token revoked), and a POST (add guest participant) with no `/sanctum/csrf-cookie` request.
- [ ] Invitation accept link is still limited by the dummy phase: the invited account only exists in the inviting admin's session.
