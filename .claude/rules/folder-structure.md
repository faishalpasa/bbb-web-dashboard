# Folder Structure

```text
src/                       # mirrors reklub/admin-dashboard
├── main.tsx               # entry: starts MSW (dev), renders AppContextProvider + RouterProvider
├── router.tsx             # TanStack Router route tree
├── app-context.tsx        # global state only (session, handleCheckAuth)
├── index.css              # tokens, font faces, resets
├── vite-env.d.ts
├── types/                 # one <domain>.d.ts per domain (api, auth, member, event, ...)
├── constants/             # one <domain>.ts per domain; route.ts holds ROUTES; env.ts holds flags
├── services/              # Axios calls, one <domain>.ts per domain
├── utils/                 # pure helpers; check here before writing new ones
│   ├── api.ts             # shared axiosClient + CSRF handshake
│   ├── error.ts           # toServiceError, errorMessage, fieldErrorMessage
│   ├── date.ts, string.ts, device.ts
├── hooks/                 # reusable hooks, camelCase files: useTitle.ts
├── lib/                   # third-party wrappers (utils.ts = cn)
├── mocks/                 # MSW worker, handlers, mock db, fixtures (dev only)
├── components/
│   ├── ui/                # base primitives (shadcn)
│   ├── molecules/         # composed reusable UI (responsive dialog, form field, ...)
│   └── layout/            # layout wrappers (auth, member, admin, public) and global shells
└── pages/                 # one folder per route
    ├── auth/              # add when the admin auth contract is defined
    ├── admin/{dashboard,events,exit-requests,members,settings,admins,audit-logs}
    └── {not-found,server-error}
        # every page: index.tsx, _context.tsx, _components/, and [id]/ for detail routes
public/                    # existing BBB assets and mockServiceWorker.js; no member PWA
docs/                      # contracts/ (API boundary) and screens/ (design references)
```

Do not create empty directories speculatively. Add each path when its first real file is introduced.
