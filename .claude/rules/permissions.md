# Permissions

Authorization is server-authoritative. Hiding a button is not authorization; the API must reject the request regardless of the UI.

## Roles

| Role | Scope |
| --- | --- |
| `member` | Own profile, own registrations, attendance, and exit request |
| `admin` | Member and event operations, participants, exit-request review |
| `superadmin` | All admin abilities plus admin management, settings, and audit logs |

## UI rules

- The API may send typed capability booleans such as `can.createMember`; they control UI visibility only.
- Derive `can<Action>` variables near the top of a component or context; do not scatter role comparisons in JSX.
- Never authorize with `user.role === ...` in React when a capability can be supplied by the API.
- Member status restrictions (`exit_requested`, `unsubscribed`) come from the session; the router sends those members to the status pages, and the API enforces it too.
- Create, edit, deactivate, close-event, manual-attendance, review, settings, and admin-management controls require matching capabilities.
- Destructive actions require the shared confirmation dialog.
- Navigation may be hidden for usability, but direct URL access must still end in the API rejecting the data.
