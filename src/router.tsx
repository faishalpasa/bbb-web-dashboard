import { createRootRouteWithContext, createRoute, createRouter, lazyRouteComponent, Outlet, redirect } from '@tanstack/react-router';

import type { AppContextValue } from '@/app-context';
import { AdminLayout } from '@/components/layout/admin-layout';
import { PERMISSIONS as P, type Permission } from '@/constants/permission';
import { ROUTES } from '@/constants/route';
import { canAll, landingRoute } from '@/utils/permission';

// Route guards read the session through the app context, which RouterProvider receives as `context`.
export interface RouterContext {
    auth: AppContextValue;
}

const requireSession = async ({ context }: { context: RouterContext }) => {
    const session = await context.auth.ensureSession();

    if (!session) throw redirect({ to: ROUTES.login });
};

const requirePermission =
    (...permissions: Permission[]) =>
    async ({ context }: { context: RouterContext }) => {
        const session = await context.auth.ensureSession();

        if (!session) throw redirect({ to: ROUTES.login });
        if (!canAll(session, permissions)) throw redirect({ to: ROUTES.forbidden });
    };

// Signed-in admins have no business on the sign-in screen.
const redirectIfSignedIn = async ({ context }: { context: RouterContext }) => {
    const session = await context.auth.ensureSession();

    if (session) throw redirect({ to: landingRoute(session) });
};

const rootRoute = createRootRouteWithContext<RouterContext>()({
    component: Outlet,
    notFoundComponent: lazyRouteComponent(() => import('@/pages/not-found'), 'PageNotFound'),
    errorComponent: lazyRouteComponent(() => import('@/pages/server-error'), 'PageServerError'),
});

const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: ROUTES.login,
    beforeLoad: redirectIfSignedIn,
    component: lazyRouteComponent(() => import('@/pages/auth/login'), 'PageLogin'),
});

// Every admin screen lives inside the shell and needs an admin session.
const adminLayoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: 'admin-layout',
    beforeLoad: requireSession,
    component: AdminLayout,
});

const dashboardRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: ROUTES.dashboard,
    beforeLoad: requirePermission(P.DASHBOARD_VIEW),
    component: lazyRouteComponent(() => import('@/pages/admin/dashboard'), 'PageDashboard'),
});

const membersRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: ROUTES.members,
    beforeLoad: requirePermission(P.MEMBER_VIEW),
    component: lazyRouteComponent(() => import('@/pages/admin/members'), 'PageMembers'),
});

const memberNewRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: ROUTES.memberNew,
    beforeLoad: requirePermission(P.MEMBER_VIEW, P.MEMBER_CREATE),
    component: lazyRouteComponent(() => import('@/pages/admin/members/new'), 'PageMemberNew'),
});

const memberDetailRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: ROUTES.memberDetail,
    beforeLoad: requirePermission(P.MEMBER_VIEW),
    component: lazyRouteComponent(() => import('@/pages/admin/members/[id]'), 'PageMemberDetail'),
});

const memberEditRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: ROUTES.memberEdit,
    beforeLoad: requirePermission(P.MEMBER_VIEW, P.MEMBER_UPDATE),
    component: lazyRouteComponent(() => import('@/pages/admin/members/[id]/edit'), 'PageMemberEdit'),
});

const eventsRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: ROUTES.events,
    beforeLoad: requirePermission(P.EVENT_VIEW),
    component: lazyRouteComponent(() => import('@/pages/admin/events'), 'PageEvents'),
});

const eventNewRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: ROUTES.eventNew,
    beforeLoad: requirePermission(P.EVENT_VIEW, P.EVENT_CREATE),
    component: lazyRouteComponent(() => import('@/pages/admin/events/new'), 'PageEventNew'),
});

const eventDetailRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: ROUTES.eventDetail,
    beforeLoad: requirePermission(P.EVENT_VIEW),
    component: lazyRouteComponent(() => import('@/pages/admin/events/[id]'), 'PageEventDetail'),
});

const eventEditRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: ROUTES.eventEdit,
    beforeLoad: requirePermission(P.EVENT_VIEW, P.EVENT_UPDATE),
    component: lazyRouteComponent(() => import('@/pages/admin/events/[id]/edit'), 'PageEventEdit'),
});

const exitRequestsRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: ROUTES.exitRequests,
    beforeLoad: requirePermission(P.EXIT_REQUEST_VIEW),
    component: lazyRouteComponent(() => import('@/pages/admin/exit-requests'), 'PageExitRequests'),
});

const settingsRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: ROUTES.settings,
    beforeLoad: requirePermission(P.SETTING_VIEW),
    component: lazyRouteComponent(() => import('@/pages/admin/settings'), 'PageSettings'),
});

const adminsRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: ROUTES.admins,
    beforeLoad: requirePermission(P.ADMIN_VIEW),
    component: lazyRouteComponent(() => import('@/pages/admin/admins'), 'PageAdmins'),
});

const adminNewRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: ROUTES.adminNew,
    beforeLoad: requirePermission(P.ADMIN_VIEW, P.ADMIN_INVITE),
    component: lazyRouteComponent(() => import('@/pages/admin/admins/new'), 'PageAdminNew'),
});

const rolesRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: ROUTES.roles,
    beforeLoad: requirePermission(P.ROLE_VIEW),
    component: lazyRouteComponent(() => import('@/pages/admin/roles'), 'PageRoles'),
});

const roleNewRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: ROUTES.roleNew,
    beforeLoad: requirePermission(P.ROLE_VIEW, P.ROLE_CREATE),
    component: lazyRouteComponent(() => import('@/pages/admin/roles/new'), 'PageRoleNew'),
});

const roleDetailRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: ROUTES.roleDetail,
    beforeLoad: requirePermission(P.ROLE_VIEW),
    component: lazyRouteComponent(() => import('@/pages/admin/roles/[id]'), 'PageRoleDetail'),
});

const auditLogsRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: ROUTES.auditLogs,
    beforeLoad: requirePermission(P.AUDIT_LOG_VIEW),
    component: lazyRouteComponent(() => import('@/pages/admin/audit-logs'), 'PageAuditLogs'),
});

// Opened from the invitation email; the token is the only credential, so there is no session guard.
const invitationRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: ROUTES.invitation,
    validateSearch: (search: Record<string, unknown>): { token?: string } => ({
        token: typeof search.token === 'string' ? search.token : undefined,
    }),
    component: lazyRouteComponent(() => import('@/pages/auth/invitation'), 'PageInvitation'),
});

const forgotPasswordRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: ROUTES.forgotPassword,
    component: lazyRouteComponent(() => import('@/pages/auth/forgot-password'), 'PageForgotPassword'),
});

// Opened from the reset email; the token is the only credential, so there is no session guard.
const resetPasswordRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: ROUTES.resetPassword,
    validateSearch: (search: Record<string, unknown>): { token?: string } => ({
        token: typeof search.token === 'string' ? search.token : undefined,
    }),
    component: lazyRouteComponent(() => import('@/pages/auth/reset-password'), 'PageResetPassword'),
});

const forbiddenRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: ROUTES.forbidden,
    component: lazyRouteComponent(() => import('@/pages/access-denied'), 'PageAccessDenied'),
});
const noAccessRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: ROUTES.noAccess,
    beforeLoad: async ({ context }) => {
        const session = await context.auth.ensureSession();
        if (session && landingRoute(session) !== ROUTES.noAccess) throw redirect({ to: landingRoute(session) });
    },
    component: lazyRouteComponent(() => import('@/pages/access-denied'), 'PageNoAccess'),
});

export const router = createRouter({
    routeTree: rootRoute.addChildren([
        loginRoute,
        invitationRoute,
        forgotPasswordRoute,
        resetPasswordRoute,
        adminLayoutRoute.addChildren([
            forbiddenRoute,
            noAccessRoute,
            dashboardRoute,
            membersRoute,
            memberNewRoute,
            memberDetailRoute,
            memberEditRoute,
            eventsRoute,
            eventNewRoute,
            eventDetailRoute,
            eventEditRoute,
            exitRequestsRoute,
            settingsRoute,
            adminsRoute,
            adminNewRoute,
            rolesRoute,
            roleNewRoute,
            roleDetailRoute,
            auditLogsRoute,
        ]),
    ]),
    context: { auth: undefined! },
});

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}
