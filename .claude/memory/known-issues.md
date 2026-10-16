# Known limitations

- API CORS/Sanctum must allow localhost:5174 alongside member localhost:5173 before integration.
- Admin session and shared-cookie behavior need agreement. Existing member credentials do not imply admin access.
- Local default Node may be 18; run nvm use before npm commands. CI uses Node 22.
- Admin artboards, auth and data flows are not implemented or browser-verified yet.
