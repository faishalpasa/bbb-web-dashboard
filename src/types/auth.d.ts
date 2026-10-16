import type { Identifier } from '@/types/api';

export type AdminRole = 'admin' | 'superadmin';

export interface AdminUser {
    id: Identifier;
    name: string;
    email: string;
    role: AdminRole;
}

// Visibility hints only; the API authorizes every admin request.
export interface AdminCapabilities {
    manageMembers: boolean;
    manageEvents: boolean;
    manageAdmins: boolean;
    manageSettings: boolean;
    viewAuditLog: boolean;
}

export interface AdminBadges {
    pendingExitRequests: number;
}

export interface AdminSession {
    user: AdminUser;
    can: AdminCapabilities;
    badges: AdminBadges;
}

export interface AdminLoginInput {
    email: string;
    password: string;
}
