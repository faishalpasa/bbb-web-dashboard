import type { Identifier } from '@/types/api';

// The Bearer token the API returns next to the data of any endpoint that starts or renews a session.
export interface AuthToken {
    accessToken: string;
    tokenType: 'Bearer';
    expiresAt: string;
}

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
    reviewExitRequests: boolean;
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
