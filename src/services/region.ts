import type { ApiEnvelope, ServiceResponse } from '@/types/api';
import type { DistrictOption, RegionOption, VillageOption } from '@/types/region';
import { axiosClient } from '@/utils/api';
import { toServiceError } from '@/utils/error';

export const getProvinces = async (): Promise<ServiceResponse<RegionOption[]>> => {
    try {
        const { data } = await axiosClient.get<ApiEnvelope<RegionOption[]>>('/regions/provinces');

        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};

export const getRegencies = async (provinceCode: string): Promise<ServiceResponse<RegionOption[]>> => {
    try {
        const { data } = await axiosClient.get<ApiEnvelope<RegionOption[]>>('/regions/regencies', { params: { provinceCode } });

        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};

export const getDistricts = async (regencyCode: string): Promise<ServiceResponse<DistrictOption[]>> => {
    try {
        const { data } = await axiosClient.get<ApiEnvelope<DistrictOption[]>>('/regions/districts', { params: { regencyCode } });

        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};

export const getVillages = async (districtCode: string): Promise<ServiceResponse<VillageOption[]>> => {
    try {
        const { data } = await axiosClient.get<ApiEnvelope<VillageOption[]>>('/regions/villages', { params: { districtCode } });

        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};
