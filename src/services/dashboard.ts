import type { ApiEnvelope, ServiceResponse } from '@/types/api';
import type { AdminDashboard } from '@/types/dashboard';
import { axiosClient } from '@/utils/api';
import { toServiceError } from '@/utils/error';

export const getDashboard = async (): Promise<ServiceResponse<AdminDashboard>> => {
    try {
        const { data } = await axiosClient.get<ApiEnvelope<AdminDashboard>>('/admin/dashboard');

        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};
