import { CalendarDays, FileText, LayoutDashboard, LogOut, type LucideIcon, Settings2, ShieldCheck, Users } from 'lucide-react';

import { ROUTES, type StaticRoute } from '@/constants/route';
import type { AdminBadges, AdminCapabilities } from '@/types/auth';

export interface NavigationItem {
    key: string;
    label: string;
    to: StaticRoute;
    icon: LucideIcon;
    // Visibility hint from the session; the API still authorizes every request behind the page.
    capability?: keyof AdminCapabilities;
    badge?: keyof AdminBadges;
}

export const MAIN_NAVIGATION: NavigationItem[] = [
    { key: 'dashboard', label: 'Dashboard', to: ROUTES.dashboard, icon: LayoutDashboard },
    { key: 'members', label: 'Member', to: ROUTES.members, icon: Users },
    { key: 'events', label: 'Kegiatan', to: ROUTES.events, icon: CalendarDays },
    { key: 'exit_requests', label: 'Permintaan Keluar', to: ROUTES.exitRequests, icon: LogOut, badge: 'pendingExitRequests' },
];

export const SUPERADMIN_NAVIGATION: NavigationItem[] = [
    { key: 'admins', label: 'Admin', to: ROUTES.admins, icon: ShieldCheck, capability: 'manageAdmins' },
    { key: 'settings', label: 'Pengaturan', to: ROUTES.settings, icon: Settings2, capability: 'manageSettings' },
    { key: 'audit_logs', label: 'Log', to: ROUTES.auditLogs, icon: FileText, capability: 'viewAuditLog' },
];
