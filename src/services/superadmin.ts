import type { ApiEnvelope, ServiceResponse } from '@/types/api';
import type { AdminSession } from '@/types/auth';
import type {
    AdminAccount,
    AdminInvitationResult,
    AdminInviteInput,
    AdminSettings,
    AdminSettingsInput,
    AuditLogList,
    AuditLogQuery,
    InvitationDetail,
} from '@/types/superadmin';
import { axiosClient } from '@/utils/api';
import { toServiceError } from '@/utils/error';

export const getSettings = async (): Promise<ServiceResponse<AdminSettings>> => {
    try {
        const { data } = await axiosClient.get<ApiEnvelope<AdminSettings>>('/admin/settings');

        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};

export const putSettings = async (input: AdminSettingsInput): Promise<ServiceResponse<AdminSettings>> => {
    try {
        const { data } = await axiosClient.put<ApiEnvelope<AdminSettings>>('/admin/settings', input);

        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};

export const getAdmins = async (): Promise<ServiceResponse<{ items: AdminAccount[] }>> => {
    try {
        const { data } = await axiosClient.get<ApiEnvelope<{ items: AdminAccount[] }>>('/admin/admins');

        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};

export const postAdmin = async (input: AdminInviteInput): Promise<ServiceResponse<AdminInvitationResult>> => {
    try {
        const { data } = await axiosClient.post<ApiEnvelope<AdminInvitationResult>>('/admin/admins', input);

        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};

export const postDeactivateAdmin = async (adminId: string): Promise<ServiceResponse<AdminAccount>> => {
    try {
        const { data } = await axiosClient.post<ApiEnvelope<AdminAccount>>(`/admin/admins/${adminId}/deactivate`);

        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};

export const postActivateAdmin = async (adminId: string): Promise<ServiceResponse<AdminAccount>> => {
    try {
        const { data } = await axiosClient.post<ApiEnvelope<AdminAccount>>(`/admin/admins/${adminId}/activate`);

        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};

export const getAuditLogs = async (query: AuditLogQuery): Promise<ServiceResponse<AuditLogList>> => {
    try {
        const { data } = await axiosClient.get<ApiEnvelope<AuditLogList>>('/admin/audit-logs', {
            params: Object.fromEntries(Object.entries(query).filter(([, value]) => value !== '')),
        });

        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};

export const getInvitation = async (token: string): Promise<ServiceResponse<InvitationDetail>> => {
    try {
        const { data } = await axiosClient.get<ApiEnvelope<InvitationDetail>>(`/admin/invitations/${encodeURIComponent(token)}`);

        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};

export const postAcceptInvitation = async (token: string, password: string): Promise<ServiceResponse<AdminSession>> => {
    try {
        const { data } = await axiosClient.post<ApiEnvelope<AdminSession>>(`/admin/invitations/${encodeURIComponent(token)}/accept`, { password });

        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};
