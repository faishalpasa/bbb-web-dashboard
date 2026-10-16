import { createRootRouteWithContext, createRoute, createRouter, lazyRouteComponent, Outlet, redirect } from '@tanstack/react-router';

import type { AppContextValue } from '@/app-context';
import { AdminLayout } from '@/components/layout/admin-layout';
import { PlaceholderPage } from '@/components/layout/placeholder-page';
import { ROUTES, type StaticRoute } from '@/constants/route';

// Route guards read the session through the app context, which RouterProvider receives as `context`.
export interface RouterContext {
    auth: AppContextValue;
}

const requireSession = async ({ context }: { context: RouterContext }) => {
    const session = await context.auth.ensureSession();

    if (!session) throw redirect({ to: ROUTES.login });
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
    component: lazyRouteComponent(() => import('@/pages/admin/members'), 'PageMembers'),
});

const memberNewRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: ROUTES.memberNew,
    component: lazyRouteComponent(() => import('@/pages/admin/members/new'), 'PageMemberNew'),
});

const memberDetailRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: ROUTES.memberDetail,
    component: lazyRouteComponent(() => import('@/pages/admin/members/[id]'), 'PageMemberDetail'),
});

const memberEditRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: ROUTES.memberEdit,
    component: lazyRouteComponent(() => import('@/pages/admin/members/[id]/edit'), 'PageMemberEdit'),
});

const eventsRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: ROUTES.events,
    component: lazyRouteComponent(() => import('@/pages/admin/events'), 'PageEvents'),
});

const eventNewRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: ROUTES.eventNew,
    component: lazyRouteComponent(() => import('@/pages/admin/events/new'), 'PageEventNew'),
});

const eventDetailRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: ROUTES.eventDetail,
    component: lazyRouteComponent(() => import('@/pages/admin/events/[id]'), 'PageEventDetail'),
});

const eventEditRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: ROUTES.eventEdit,
    component: lazyRouteComponent(() => import('@/pages/admin/events/[id]/edit'), 'PageEventEdit'),
});

const exitRequestsRoute = createRoute({
    getParentRoute: () => adminLayoutRoute,
    path: ROUTES.exitRequests,
    component: lazyRouteComponent(() => import('@/pages/admin/exit-requests'), 'PageExitRequests'),
});

const placeholderRoute = (path: StaticRoute, title: string, testId: string) =>
    createRoute({
        getParentRoute: () => adminLayoutRoute,
        path,
        component: () => <PlaceholderPage title={title} testId={testId} />,
    });

const placeholderRoutes = [
    placeholderRoute(ROUTES.admins, 'Admin', 'admins_placeholder'),
    placeholderRoute(ROUTES.settings, 'Pengaturan', 'settings_placeholder'),
    placeholderRoute(ROUTES.auditLogs, 'Log', 'audit_logs_placeholder'),
];

export const router = createRouter({
    routeTree: rootRoute.addChildren([
        loginRoute,
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
            ...placeholderRoutes,
        ]),
    ]),
    context: { auth: undefined! },
});

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}
