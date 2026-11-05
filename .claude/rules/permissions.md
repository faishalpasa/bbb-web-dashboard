# Permissions

Authorization is server-authoritative. Hiding a button is not authorization; the API must reject the request regardless of the UI.

RBAC D–E: session.permissions is the effective grant list. Use PERMISSIONS and usePermissions/PermissionGate for route/sidebar/action visibility, plus API actions flags for business state. The role table below describes initial grants, not restrictions on custom roles. Legacy session.can is compatibility-only; never use it for new dashboard authorization. Role management (F) uses a module tree with parent/child switches per docs/contracts/admin-rbac.md; the catalog is migration-only.

## Roles

| Role | Scope |
| --- | --- |
| `member` | Own profile, own registrations, attendance, and exit request |
| `admin` | Dashboard, event operations, and participants |
| `superadmin` | All admin abilities plus members, exit-request review, admin management, settings, and audit logs |

## UI rules

- The API may send typed capability booleans such as `can.createMember`; they control UI visibility only.
- Derive `can<Action>` variables near the top of a component or context; do not scatter role comparisons in JSX.
- Never authorize with `user.role === ...` in React when a capability can be supplied by the API.
- Member status restrictions (`exit_requested`, `unsubscribed`) come from the session; the router sends those members to the status pages, and the API enforces it too.
- Create, edit, deactivate, close-event, manual-attendance, review, settings, and admin-management controls require matching capabilities.
- Destructive actions require the shared confirmation dialog.
- Navigation may be hidden for usability, but direct URL access must still end in the API rejecting the data.
