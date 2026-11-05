import type { ApiEnvelope, ServiceResponse } from '@/types/api';
import type { AdminRoleSummary } from '@/types/auth';
import type { PermissionOption, RoleCreateInput, RoleDetail, RoleListItem, RoleUpdateInput } from '@/types/role';
import type { AdminAccount } from '@/types/superadmin';
import { axiosClient } from '@/utils/api';
import { toServiceError } from '@/utils/error';

export const getPermissions = async (): Promise<ServiceResponse<{ items: PermissionOption[] }>> => {
    try {
        const { data } = await axiosClient.get<ApiEnvelope<{ items: PermissionOption[] }>>('/admin/permissions');
        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};
export const getRoles = async (): Promise<ServiceResponse<{ items: RoleListItem[] }>> => {
    try {
        const { data } = await axiosClient.get<ApiEnvelope<{ items: RoleListItem[] }>>('/admin/roles');
        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};
export const getRole = async (id: string): Promise<ServiceResponse<RoleDetail>> => {
    try {
        const { data } = await axiosClient.get<ApiEnvelope<RoleDetail>>(`/admin/roles/${encodeURIComponent(id)}`);
        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};
export const postRole = async (input: RoleCreateInput): Promise<ServiceResponse<RoleDetail>> => {
    try {
        const { data } = await axiosClient.post<ApiEnvelope<RoleDetail>>('/admin/roles', input);
        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};
export const putRole = async (id: string, input: RoleUpdateInput): Promise<ServiceResponse<RoleDetail>> => {
    try {
        const { data } = await axiosClient.put<ApiEnvelope<RoleDetail>>(`/admin/roles/${encodeURIComponent(id)}`, input);
        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};
export const deleteRole = async (id: string): Promise<void> => {
    try {
        await axiosClient.delete(`/admin/roles/${encodeURIComponent(id)}`);
    } catch (error) {
        throw toServiceError(error);
    }
};
export const getAdminRoleOptions = async (): Promise<ServiceResponse<{ items: AdminRoleSummary[] }>> => {
    try {
        const { data } = await axiosClient.get<ApiEnvelope<{ items: AdminRoleSummary[] }>>('/admin/admins/role-options');
        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};
export const putAdminRole = async (adminId: string, roleId: string): Promise<ServiceResponse<AdminAccount>> => {
    try {
        const { data } = await axiosClient.put<ApiEnvelope<AdminAccount>>(`/admin/admins/${encodeURIComponent(adminId)}/role`, { roleId });
        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};
