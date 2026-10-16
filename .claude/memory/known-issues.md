# Known limitations

- API `CORS_ALLOWED_ORIGINS` must include localhost:5174 alongside member localhost:5173 (no Sanctum or cookies any more).
- Admin session and shared-cookie behavior: resolved by the Bearer migration (separate admin token, 30 min TTL); see `docs/plans/bearer-auth.md` in web-app and bbb-api. Existing member credentials do not imply admin access.
- Local default Node may be 18; run nvm use before npm commands. CI uses Node 22.
- Admin artboards, auth and data flows are not implemented or browser-verified yet.
