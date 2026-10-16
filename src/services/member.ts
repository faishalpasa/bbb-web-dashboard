import type { ApiEnvelope, ServiceResponse } from '@/types/api';
import type { MemberCreateInput, MemberDetail, MemberEditInput, MemberList, MemberListQuery, MemberOptions } from '@/types/member';
import { axiosClient } from '@/utils/api';
import { toServiceError } from '@/utils/error';

type MemberFilterQuery = Omit<MemberListQuery, 'page'>;

// Empty filters are left out so the URL only carries what the admin chose.
const compactParams = (query: Partial<MemberListQuery>): Record<string, string | number> =>
    Object.fromEntries(Object.entries(query).filter(([, value]) => value !== '' && value !== undefined));

export const getMembers = async (query: MemberListQuery): Promise<ServiceResponse<MemberList>> => {
    try {
        const { data } = await axiosClient.get<ApiEnvelope<MemberList>>('/admin/members', { params: compactParams(query) });

        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};

export const getMemberOptions = async (): Promise<ServiceResponse<MemberOptions>> => {
    try {
        const { data } = await axiosClient.get<ApiEnvelope<MemberOptions>>('/admin/members/options');

        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};

export const getMembersExport = async (query: MemberFilterQuery): Promise<ServiceResponse<Blob>> => {
    try {
        const { data } = await axiosClient.get<Blob>('/admin/members/export', { params: compactParams(query), responseType: 'blob' });

        return { data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};

export const getMember = async (memberId: string): Promise<ServiceResponse<MemberDetail>> => {
    try {
        const { data } = await axiosClient.get<ApiEnvelope<MemberDetail>>(`/admin/members/${memberId}`);

        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};

export const postMember = async (input: MemberCreateInput): Promise<ServiceResponse<MemberDetail>> => {
    try {
        const { data } = await axiosClient.post<ApiEnvelope<MemberDetail>>('/admin/members', input);

        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};

export const putMember = async (memberId: string, input: MemberEditInput): Promise<ServiceResponse<MemberDetail>> => {
    try {
        const { data } = await axiosClient.put<ApiEnvelope<MemberDetail>>(`/admin/members/${memberId}`, input);

        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};

export const postDeactivateMember = async (memberId: string): Promise<ServiceResponse<MemberDetail>> => {
    try {
        const { data } = await axiosClient.post<ApiEnvelope<MemberDetail>>(`/admin/members/${memberId}/deactivate`);

        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};

export const postActivateMember = async (memberId: string): Promise<ServiceResponse<MemberDetail>> => {
    try {
        const { data } = await axiosClient.post<ApiEnvelope<MemberDetail>>(`/admin/members/${memberId}/activate`);

        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};

export const postMemberResetPassword = async (memberId: string): Promise<ServiceResponse<{ email: string }>> => {
    try {
        const { data } = await axiosClient.post<ApiEnvelope<{ email: string }>>(`/admin/members/${memberId}/reset-password`);

        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};

export const putMemberNote = async (memberId: string, note: string): Promise<ServiceResponse<{ note: string }>> => {
    try {
        const { data } = await axiosClient.put<ApiEnvelope<{ note: string }>>(`/admin/members/${memberId}/note`, { note });

        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};
