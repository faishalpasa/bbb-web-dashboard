import type { ApiEnvelope, ServiceResponse } from '@/types/api';
import type { AdminForgotPasswordResult, AdminLoginInput, AdminResetTokenData, AdminSession } from '@/types/auth';
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

// "Lupa password": always answers 200, so nothing here reveals which emails belong to admins.
export const postForgotPassword = async (email: string): Promise<ServiceResponse<AdminForgotPasswordResult>> => {
    try {
        const { data } = await axiosClient.post<ApiEnvelope<AdminForgotPasswordResult>>('/admin/password/forgot', { email });

        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};

export const postVerifyResetToken = async (token: string): Promise<ServiceResponse<AdminResetTokenData>> => {
    try {
        const { data } = await axiosClient.post<ApiEnvelope<AdminResetTokenData>>('/admin/password/verify-token', { token });

        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};

// Signs the admin in with the new password; the session token is stored by the API client.
export const postResetPassword = async (token: string, password: string): Promise<ServiceResponse<AdminSession>> => {
    try {
        const { data } = await axiosClient.post<ApiEnvelope<AdminSession>>('/admin/password/reset', { token, password });

        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};
