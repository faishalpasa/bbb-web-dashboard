import type { ApiEnvelope, ServiceResponse } from '@/types/api';
import type { AdminLoginInput, AdminSession } from '@/types/auth';
import { axiosClient } from '@/utils/api';
import { toServiceError } from '@/utils/error';

// Draft contract: docs/contracts/admin-auth.md.
export const postLogin = async (input: AdminLoginInput): Promise<ServiceResponse<AdminSession>> => {
    try {
        const { data } = await axiosClient.post<ApiEnvelope<AdminSession>>('/admin/login', input);

        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};

export const getSession = async (): Promise<ServiceResponse<AdminSession>> => {
    try {
        const { data } = await axiosClient.get<ApiEnvelope<AdminSession>>('/admin/session');

        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};

export const postLogout = async (): Promise<ServiceResponse<null>> => {
    try {
        await axiosClient.post('/admin/logout');

        return { data: null, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};
