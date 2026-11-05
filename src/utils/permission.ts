import { PERMISSIONS as P, type Permission } from '@/constants/permission';
import { ROUTES } from '@/constants/route';
import type { AdminSession } from '@/types/auth';

export const can = (session: AdminSession | null, permission: Permission): boolean => session?.permissions?.includes(permission) ?? false;
export const canAll = (session: AdminSession | null, permissions: readonly Permission[]): boolean =>
    permissions.every((permission) => can(session, permission));
export const canAny = (session: AdminSession | null, permissions: readonly Permission[]): boolean =>
    permissions.some((permission) => can(session, permission));

const LANDINGS = [
    [P.DASHBOARD_VIEW, ROUTES.dashboard],
    [P.MEMBER_VIEW, ROUTES.members],
    [P.EVENT_VIEW, ROUTES.events],
    [P.EXIT_REQUEST_VIEW, ROUTES.exitRequests],
    [P.ADMIN_VIEW, ROUTES.admins],
    [P.ROLE_VIEW, ROUTES.roles],
    [P.SETTING_VIEW, ROUTES.settings],
    [P.AUDIT_LOG_VIEW, ROUTES.auditLogs],
] as const;

export const landingRoute = (session: AdminSession) => LANDINGS.find(([permission]) => can(session, permission))?.[1] ?? ROUTES.noAccess;

export const canVisitSection = (session: AdminSession | null, path: string): boolean =>
    LANDINGS.some(([permission, route]) => route === path && can(session, permission));
