import type { ApiEnvelope, ServiceResponse } from '@/types/api';
import type {
    EventDetail,
    EventInput,
    EventList,
    EventListQuery,
    EventMemberOption,
    EventOptions,
    EventParticipant,
    EventParticipantList,
    ParticipantDetail,
    ParticipantInput,
    ParticipantListQuery,
    ParticipantSummary,
} from '@/types/event';
import { axiosClient } from '@/utils/api';
import { toServiceError } from '@/utils/error';

const compactParams = (query: object): Record<string, string | number> =>
    Object.fromEntries(Object.entries(query).filter(([, value]) => value !== '' && value !== undefined));

export const getEventMemberOptions = async (eventId: string, search: string): Promise<ServiceResponse<{ items: EventMemberOption[] }>> => {
    try {
        const { data } = await axiosClient.get<ApiEnvelope<{ items: EventMemberOption[] }>>(
            `/admin/events/${encodeURIComponent(eventId)}/member-options`,
            { params: { search } },
        );
        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};

export const getEvents = async (query: EventListQuery): Promise<ServiceResponse<EventList>> => {
    try {
        const { data } = await axiosClient.get<ApiEnvelope<EventList>>('/admin/events', { params: compactParams(query) });

        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};

export const getEventOptions = async (): Promise<ServiceResponse<EventOptions>> => {
    try {
        const { data } = await axiosClient.get<ApiEnvelope<EventOptions>>('/admin/events/options');

        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};

export const getEvent = async (eventId: string): Promise<ServiceResponse<EventDetail>> => {
    try {
        const { data } = await axiosClient.get<ApiEnvelope<EventDetail>>(`/admin/events/${eventId}`);

        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};

export const postEvent = async (input: EventInput): Promise<ServiceResponse<EventDetail>> => {
    try {
        const { data } = await axiosClient.post<ApiEnvelope<EventDetail>>('/admin/events', input);

        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};

export const putEvent = async (eventId: string, input: EventInput): Promise<ServiceResponse<EventDetail>> => {
    try {
        const { data } = await axiosClient.put<ApiEnvelope<EventDetail>>(`/admin/events/${eventId}`, input);

        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};

export const postDuplicateEvent = async (eventId: string): Promise<ServiceResponse<EventDetail>> => {
    try {
        const { data } = await axiosClient.post<ApiEnvelope<EventDetail>>(`/admin/events/${eventId}/duplicate`);

        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};

export const postCancelEvent = async (eventId: string): Promise<ServiceResponse<EventDetail>> => {
    try {
        const { data } = await axiosClient.post<ApiEnvelope<EventDetail>>(`/admin/events/${eventId}/cancel`);

        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};

export const postCloseEvent = async (eventId: string): Promise<ServiceResponse<EventDetail>> => {
    try {
        const { data } = await axiosClient.post<ApiEnvelope<EventDetail>>(`/admin/events/${eventId}/close`);

        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};

export const postRandomAttendanceCode = async (): Promise<ServiceResponse<{ attendanceCode: string }>> => {
    try {
        const { data } = await axiosClient.post<ApiEnvelope<{ attendanceCode: string }>>('/admin/events/attendance-code');

        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};

export const postEventBanner = async (banner: File): Promise<ServiceResponse<{ bannerUrl: string }>> => {
    try {
        const body = new FormData();

        body.append('banner', banner);

        const { data } = await axiosClient.post<ApiEnvelope<{ bannerUrl: string }>>('/admin/events/banner', body);

        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};

export const getEventParticipants = async (eventId: string, query: ParticipantListQuery): Promise<ServiceResponse<EventParticipantList>> => {
    try {
        const { data } = await axiosClient.get<ApiEnvelope<EventParticipantList>>(`/admin/events/${eventId}/participants`, {
            params: compactParams(query),
        });

        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};

// Every participant that matches the search, as the CSV the API builds (no pagination).
export const getEventParticipantDetail = async (eventId: string, participantId: string): Promise<ServiceResponse<ParticipantDetail>> => {
    try {
        const { data } = await axiosClient.get<ApiEnvelope<ParticipantDetail>>(
            `/admin/events/${encodeURIComponent(eventId)}/participants/${encodeURIComponent(participantId)}`,
        );
        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};

export const getEventParticipantsExport = async (eventId: string, search: string): Promise<ServiceResponse<Blob>> => {
    try {
        const { data } = await axiosClient.get<Blob>(`/admin/events/${eventId}/participants/export`, {
            params: compactParams({ search }),
            responseType: 'blob',
        });

        return { data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};

export const getParticipantRegistrationForm = async (
    eventId: string,
    memberId: string,
): Promise<ServiceResponse<import('@/types/registration-form').RegistrationFormData>> => {
    try {
        const { data } = await axiosClient.get<ApiEnvelope<import('@/types/registration-form').RegistrationFormData>>(
            `/admin/events/${eventId}/registration-form`,
            { params: { memberId } },
        );
        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};

export const postEventParticipant = async (eventId: string, input: ParticipantInput): Promise<ServiceResponse<EventParticipant>> => {
    try {
        const { data } = await axiosClient.post<ApiEnvelope<EventParticipant>>(`/admin/events/${eventId}/participants`, input);

        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};

export const putParticipantAttendance = async (
    eventId: string,
    participantId: string,
    present: boolean,
): Promise<ServiceResponse<{ participant: EventParticipant; summary: ParticipantSummary }>> => {
    try {
        const { data } = await axiosClient.put<ApiEnvelope<{ participant: EventParticipant; summary: ParticipantSummary }>>(
            `/admin/events/${eventId}/participants/${participantId}/attendance`,
            { present },
        );

        return { data: data.data, status: true };
    } catch (error) {
        throw toServiceError(error);
    }
};
