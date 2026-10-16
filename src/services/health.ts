import type { ApiEnvelope, ServiceResponse } from '@/types/api';
import type { HealthData } from '@/types/health';
import { axiosClient } from '@/utils/api';
import { toServiceError } from '@/utils/error';

// Existing public contract endpoint; does not imply admin authentication.
export const getHealth = async (): Promise<ServiceResponse<HealthData>> => {
    try {
        const { data } = await axiosClient.get<ApiEnvelope<HealthData>>('/health');
        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};
