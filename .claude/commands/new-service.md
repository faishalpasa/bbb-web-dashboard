# New Service

Add an Axios service function for an API endpoint.

## Usage

```text
/project:new-service <domain> <function-name>
```

Arguments: **$ARGUMENTS**

## Pattern

- File: `src/services/<domain>.ts`; types in `src/types/<domain>.d.ts`.
- Import `axiosClient` from `@/utils/api` and `toServiceError` from `@/utils/error`.
- Return `ServiceResponse<T>`; wrap the call in `try/catch` and `throw toServiceError(error)`. Follow `.claude/templates/service-template.md`.
- Confirm the endpoint in `docs/contracts/frontend-api.md` first; add it there if it is new and tell the user.
- Add the matching MSW handler while the API endpoint is missing.
