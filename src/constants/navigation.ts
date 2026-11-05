import { CalendarDays, FileText, LayoutDashboard, LogOut, type LucideIcon, Settings2, ShieldCheck, Users } from 'lucide-react';

import { PERMISSIONS as P, type Permission } from '@/constants/permission';
import { ROUTES, type StaticRoute } from '@/constants/route';
import type { AdminBadges } from '@/types/auth';

export interface NavigationItem {
    key: string;
    label: string;
    to: StaticRoute;
    icon: LucideIcon;
    // Visibility hint from the session; the API still authorizes every request behind the page.
    permission: Permission;
    badge?: keyof AdminBadges;
}

export const MAIN_NAVIGATION: NavigationItem[] = [
    { key: 'dashboard', label: 'Dashboard', to: ROUTES.dashboard, icon: LayoutDashboard, permission: P.DASHBOARD_VIEW },
    { key: 'members', label: 'Member', to: ROUTES.members, icon: Users, permission: P.MEMBER_VIEW },
    { key: 'events', label: 'Kegiatan', to: ROUTES.events, icon: CalendarDays, permission: P.EVENT_VIEW },
    {
        key: 'exit_requests',
        label: 'Permintaan Keluar',
        to: ROUTES.exitRequests,
        icon: LogOut,
        permission: P.EXIT_REQUEST_VIEW,
        badge: 'pendingExitRequests',
    },
];

export const SUPERADMIN_NAVIGATION: NavigationItem[] = [
    { key: 'roles', label: 'Role dan Permission', to: ROUTES.roles, icon: ShieldCheck, permission: P.ROLE_VIEW },
    { key: 'admins', label: 'Admin', to: ROUTES.admins, icon: ShieldCheck, permission: P.ADMIN_VIEW },
    { key: 'settings', label: 'Pengaturan', to: ROUTES.settings, icon: Settings2, permission: P.SETTING_VIEW },
    { key: 'audit_logs', label: 'Log', to: ROUTES.auditLogs, icon: FileText, permission: P.AUDIT_LOG_VIEW },
];
