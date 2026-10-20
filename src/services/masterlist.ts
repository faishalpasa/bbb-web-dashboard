import type { ApiEnvelope, ServiceResponse } from '@/types/api';
import type { MasterlistMapping, MasterlistPreview } from '@/types/masterlist';
import { axiosClient } from '@/utils/api';
import { toServiceError } from '@/utils/error';

export const postMasterlistPreview = async (file: File, mapping: MasterlistMapping, perPage = 25): Promise<ServiceResponse<MasterlistPreview>> => {
    try {
        const body = new FormData();
        body.append('file', file);
        body.append('perPage', String(perPage));
        for (const [field, header] of Object.entries(mapping)) body.append(`mapping[${field}]`, header ?? '');
        const { data } = await axiosClient.post<ApiEnvelope<MasterlistPreview>>('/admin/member-import-previews', body);
        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};

export const getMasterlistPreview = async (id: string, page = 1, perPage = 25): Promise<ServiceResponse<MasterlistPreview>> => {
    try {
        const { data } = await axiosClient.get<ApiEnvelope<MasterlistPreview>>(`/admin/member-import-previews/${encodeURIComponent(id)}`, {
            params: { page, perPage },
        });
        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};
