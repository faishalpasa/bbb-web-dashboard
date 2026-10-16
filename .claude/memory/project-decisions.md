# Dashboard decisions

- Admin SPA lives in web-dashboard; member/public SPA stays in web-app; API stays in bbb-api.
- Match web-app coding and agent conventions. Run admin on localhost:5174 with Node 22.
- No admin authentication, capabilities or business endpoint is assumed. Define contracts before integration.
- Keep shared contract copies identical. No API changes were needed for scaffold creation.
- Only a technical placeholder is implemented; inspect artboards 8–13 before building the actual admin UI.
