import type { ApiEnvelope, ServiceResponse } from '@/types/api';
import type { ExitRequest, ExitRequestList } from '@/types/exit-request';
import { axiosClient } from '@/utils/api';
import { toServiceError } from '@/utils/error';

export const getExitRequests = async (): Promise<ServiceResponse<ExitRequestList>> => {
    try {
        const { data } = await axiosClient.get<ApiEnvelope<ExitRequestList>>('/admin/exit-requests');

        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};

export const postApproveExitRequest = async (exitRequestId: string): Promise<ServiceResponse<ExitRequest>> => {
    try {
        const { data } = await axiosClient.post<ApiEnvelope<ExitRequest>>(`/admin/exit-requests/${exitRequestId}/approve`);

        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};

export const postRejectExitRequest = async (exitRequestId: string, reason: string): Promise<ServiceResponse<ExitRequest>> => {
    try {
        const { data } = await axiosClient.post<ApiEnvelope<ExitRequest>>(`/admin/exit-requests/${exitRequestId}/reject`, { reason });

        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};
