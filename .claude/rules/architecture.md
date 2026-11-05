# Architecture

## System

```text
Browser -> web app (static SPA, this repository)  --HTTP /api, Authorization: Bearer-->  Laravel API (bbb-api)
```

- This repository is only the web app: Vite + React 19 + TypeScript + TanStack Router, deployed as static files (Vercel, Netlify, Cloudflare Pages, or any static host).
- The API is a separate Laravel project. The web app knows it only through `docs/contracts/frontend-api.md` and `VITE_API_BASE_URL`.
- Do not import anything from the API repository and do not rely on server-rendered pages, props, or flash data.

## Request flow

```text
Page -> _context.tsx / hook -> services/<domain>.ts -> axiosClient (utils/api.ts) -> API -> typed JSON { data }
```

- Pages never import `axios`. Contexts and hooks call `src/services/*`; services call the shared `axiosClient` from `@/utils/api`.
- `utils/api.ts` owns the base URL and the `Authorization: Bearer` header: it attaches the stored access token, and a `401` on a request that carried a token calls `POST /api/auth/refresh` once and retries. The token lives in `utils/token.ts` (localStorage).
- Authentication is a JWT access token returned by login (and by email verification, Google exchange, and refresh). Never put the token in a URL, log it, or render server HTML. The app and API no longer need a shared parent domain; the API only allow-lists the origin through CORS.
- Admin session/auth/capabilities are pending contract agreement. Do not reuse the member session as proof of admin access. App-wide session state will live in `app-context.tsx` once defined.

## Service functions

- One file per domain in `src/services/<domain>.ts`, functions named by HTTP verb: `getEvents`, `postLogin`, `putProfile`, `deleteRegistration`.
- Each function returns `Promise<ServiceResponse<T>>` (`{ data, status: true }`) and throws `ServiceError` (`{ data: ApiErrorResponse | undefined, status: false }`) via `toServiceError`.
- The page `_context.tsx` or hook owns `try/catch` and shows messages with `errorMessage()` / `fieldErrorMessage()` from `@/utils/error`.

```ts
export const getEvents = async (query: EventListQuery): Promise<ServiceResponse<PaginatedCollection<EventSummary>>> => {
    try {
        const { data } = await axiosClient.get<ApiEnvelope<PaginatedCollection<EventSummary>>>('/member/events', { params: query });

        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};
```

## Routing

- `src/router.tsx` defines all routes with TanStack Router (code-based). Pages are lazy-loaded with `lazyRouteComponent` and exported by name.
- Paths live in `src/constants/route.ts` (`ROUTES`). Never hard-code a path in JSX; use `<Link to={ROUTES.x}>` and `useNavigate()`.
- One-time tokens in the URL (for example the email verification `?token=`) are read once and removed from the address bar immediately with `navigate({ replace: true })`.
- Set the document title with `useTitle()`.
- Admin guards are not implemented yet. Add them after defining the admin session and capabilities contract, and enforce authorization in the API as well. The scaffold route exposes no protected data.

## Page-level state

- Every page with state uses `_context.tsx` to own fields, filters, dialog state, data fetching, and derived values, and exposes a focused `usePageContext()` hook.
- `app-context.tsx` owns only app-wide state (session, `handleCheckAuth`). Never put page filters or form drafts in it.
- Reusable stateful behavior goes in `src/hooks/`; domain rules stay on the server.

## Mock API (offline development)

`VITE_API_MOCKING_ENABLED=true` on the Vite dev server starts MSW, which answers the same `/api/*` requests from `src/mocks/`. Production builds never include the mocks. Prefer the real local API; keep the mocks aligned with the contract.

## Dates

The API sends ISO 8601 UTC. Convert to WIB/WITA/WIT only at presentation with helpers in `src/utils/date.ts`.
