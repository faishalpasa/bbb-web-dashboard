# Testing

## Frontend selectors

Every interactive or meaningful element added to a page must have a stable `data-test-id` for future Playwright coverage.

Pattern: `data-test-id="[module]_[element]_[action]"`

```tsx
<button data-test-id="events_button_register">Daftar</button>
<input data-test-id="members_input_search" />
<div data-test-id="dashboard_card_member_summary">...</div>
```

- Use `snake_case`. Repeated row actions append the stable record identifier.
- Tag the actual interactive DOM child when using `asChild`.
- Shared components forward the test id and derive ids for internal controls.
- Dialog trigger and dialog content each need an id.
- Hidden file inputs, select triggers, tabs, pagination, external links, and clickable cards are not exempt.

## Required verification

- `npm run typecheck`, `npm run lint`, `npm run format:check`, and `npm run build`.
- A build does not prove visual fidelity. Compare member/public pages at 390px and admin pages at 1360px against the live design artifact in `docs/screens/README.md`.
- Exercise flows against the real local API (or the MSW mocks) in a browser, including error states and token/redirect behavior.
- Do not check a `TASKS.md` item until its acceptance checks pass.
- Backend rules (cutoffs, capacity, rate limits) are tested in the API repository; do not re-implement them in the web app.
