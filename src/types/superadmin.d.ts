import type { Identifier, PaginatedCollection, SelectOption } from '@/types/api';
import type { AdminRoleSummary } from '@/types/auth';

export interface AdminSettings {
    registrationCloseMinutes: number;
    cancellationCloseMinutes: number;
    engagedWindowMonths: number;
    adminWhatsapp: string | null;
    whatsappGroupUrl: string | null;
    shareRecommendationUrl: string | null;
    rulesSummary: string;
    rulesVersion: number;
    updatedBy: string;
    updatedAt: string;
}

export type AdminSettingsInput = Omit<AdminSettings, 'rulesVersion' | 'updatedBy' | 'updatedAt'>;

export type AdminAccountStatus = 'active' | 'inactive' | 'invited';

export interface AdminAccount {
    id: Identifier;
    name: string;
    email: string;
    role: { value: string; label: string };
    roleInfo: AdminRoleSummary;
    status: { value: AdminAccountStatus; label: string };
    isCurrentUser: boolean;
    actions: { canDeactivate: boolean; canActivate: boolean; canChangeRole: boolean };
}

export interface AdminInvitationResult extends AdminAccount {
    invitationPath: string;
}

export interface AdminInviteInput {
    name: string;
    email: string;
    roleId: string;
}

export type AuditLogType = 'export' | 'settings' | 'admins' | 'members' | 'events';

export interface AuditLogEntry {
    id: Identifier;
    at: string;
    actor: string;
    type: { value: AuditLogType; label: string };
    detail: string;
}

export interface AuditLogList extends PaginatedCollection<AuditLogEntry> {
    types: SelectOption[];
}

export interface AuditLogQuery {
    type: string;
    page: number;
}

export interface InvitationDetail {
    name: string;
    email: string;
    role: string;
    invitedBy: string | null;
}
