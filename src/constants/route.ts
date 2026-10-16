export const ROUTES = {
    dashboard: '/',
    login: '/login',
    members: '/members',
    memberNew: '/members/new',
    memberDetail: '/members/$memberId',
    memberEdit: '/members/$memberId/edit',
    events: '/events',
    eventNew: '/events/new',
    eventDetail: '/events/$eventId',
    eventEdit: '/events/$eventId/edit',
    exitRequests: '/exit-requests',
    admins: '/admins',
    settings: '/settings',
    auditLogs: '/audit-logs',
} as const;

// Routes that need no path params, so they can be passed around as a plain `to`.
export type StaticRoute = Exclude<
    (typeof ROUTES)[keyof typeof ROUTES],
    typeof ROUTES.memberDetail | typeof ROUTES.memberEdit | typeof ROUTES.eventDetail | typeof ROUTES.eventEdit
>;
