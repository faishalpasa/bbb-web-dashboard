import { createRootRouteWithContext, createRoute, createRouter, lazyRouteComponent, Outlet, redirect } from '@tanstack/react-router';

import type { AppContextValue } from '@/app-context';
import { AdminLayout } from '@/components/layout/admin-layout';
import { ROUTES } from '@/constants/route';
import type { AdminCapabilities } from '@/types/auth';

// Route guards read the session through the app context, which RouterProvider receives as `context`.
export interface RouterContext {
    auth: AppContextValue;
}

const requireSession = async ({ context }: { context: RouterContext }) => {
    const session = await context.auth.ensureSession();

    if (!session) throw redirect({ to: ROUTES.login });
};

const requireCapability =
    (capability: keyof AdminCapabilities) =>
    async ({ context }: { context: RouterContext }) => {
        const session = await context.auth.ensureSession();

        if (!session) throw redirect({ to: ROUTES.login });
        if (!session.can[capability]) throw redirect({ to: ROUTES.dashboard });
    };

// Signed-in admins have no business on the sign-in screen.
const redirectIfSignedIn = async ({ context }: { context: RouterContext }) => {
    const session = await context.auth.ensureSession();

    if (session) throw redirect({ to: ROUTES.dashboard });
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
    component: lazyRouteComponent(() => import('@/pages/admin/dashboard'), 'PageDashboard'),
});

const membersRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: ROUTES.members,
    beforeLoad: requireCapability('manageMembers'),
    component: lazyRouteComponent(() => import('@/pages/admin/members'), 'PageMembers'),
});

const memberNewRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: ROUTES.memberNew,
    beforeLoad: requireCapability('manageMembers'),
    component: lazyRouteComponent(() => import('@/pages/admin/members/new'), 'PageMemberNew'),
});

const memberDetailRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: ROUTES.memberDetail,
    beforeLoad: requireCapability('manageMembers'),
    component: lazyRouteComponent(() => import('@/pages/admin/members/[id]'), 'PageMemberDetail'),
});

const memberEditRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: ROUTES.memberEdit,
    beforeLoad: requireCapability('manageMembers'),
    component: lazyRouteComponent(() => import('@/pages/admin/members/[id]/edit'), 'PageMemberEdit'),
});

const eventsRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: ROUTES.events,
    beforeLoad: requireCapability('manageEvents'),
    component: lazyRouteComponent(() => import('@/pages/admin/events'), 'PageEvents'),
});

const eventNewRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: ROUTES.eventNew,
    beforeLoad: requireCapability('manageEvents'),
    component: lazyRouteComponent(() => import('@/pages/admin/events/new'), 'PageEventNew'),
});

const eventDetailRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: ROUTES.eventDetail,
    beforeLoad: requireCapability('manageEvents'),
    component: lazyRouteComponent(() => import('@/pages/admin/events/[id]'), 'PageEventDetail'),
});

const eventEditRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: ROUTES.eventEdit,
    beforeLoad: requireCapability('manageEvents'),
    component: lazyRouteComponent(() => import('@/pages/admin/events/[id]/edit'), 'PageEventEdit'),
});

const exitRequestsRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: ROUTES.exitRequests,
    beforeLoad: requireCapability('reviewExitRequests'),
    component: lazyRouteComponent(() => import('@/pages/admin/exit-requests'), 'PageExitRequests'),
});

const settingsRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: ROUTES.settings,
    beforeLoad: requireCapability('manageSettings'),
    component: lazyRouteComponent(() => import('@/pages/admin/settings'), 'PageSettings'),
});

const adminsRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: ROUTES.admins,
    beforeLoad: requireCapability('manageAdmins'),
    component: lazyRouteComponent(() => import('@/pages/admin/admins'), 'PageAdmins'),
});

const auditLogsRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: ROUTES.auditLogs,
    beforeLoad: requireCapability('viewAuditLog'),
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

export const router = createRouter({
    routeTree: rootRoute.addChildren([
        loginRoute,
        invitationRoute,
        adminLayoutRoute.addChildren([
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
