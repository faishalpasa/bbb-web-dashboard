import { createRootRoute, createRoute, createRouter, lazyRouteComponent, Outlet } from '@tanstack/react-router';

import { ROUTES } from '@/constants/route';

const rootRoute = createRootRoute({
    component: Outlet,
    notFoundComponent: lazyRouteComponent(() => import('@/pages/not-found'), 'PageNotFound'),
    errorComponent: lazyRouteComponent(() => import('@/pages/server-error'), 'PageServerError'),
});
const dashboardRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: ROUTES.dashboard,
    component: lazyRouteComponent(() => import('@/pages/admin/dashboard'), 'PageDashboard'),
});

export const router = createRouter({ routeTree: rootRoute.addChildren([dashboardRoute]) });

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}
