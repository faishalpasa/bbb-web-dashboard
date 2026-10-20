import type { Identifier, PaginatedCollection, SelectOption } from '@/types/api';
import type { AdminRegistrationForm, RegistrationFormDefinition } from '@/types/registration-form';

export type EventStatus = 'draft' | 'published' | 'completed' | 'cancelled';
export type EventTimezone = 'WIB' | 'WITA' | 'WIT';
export type EventFormat = 'online' | 'offline';
export type ParticipantStatus = 'registered' | 'present' | 'absent';

export interface EventListItem {
    id: Identifier;
    title: string;
    startsAt: string | null;
    endsAt: string | null;
    timezone: EventTimezone;
    format: { value: EventFormat; label: string };
    status: { value: EventStatus; label: string };
    registered: number;
    capacity: number | null;
    attended: number | null;
    allowsNonMember: boolean;
}

export interface EventList extends PaginatedCollection<EventListItem> {
    summary: { upcomingTotal: number; total: number };
}

export interface EventOptions {
    statuses: SelectOption[];
    formats: SelectOption[];
    timezones: SelectOption[];
}

export interface EventDetail extends EventListItem {
    slug: string;
    description: string;
    venueName: string | null;
    address: string | null;
    mapUrl: string | null;
    bannerUrl: string | null;
    usesQuota: boolean;
    attendanceCode: string;
    publicPath: string;
    present: number;
    registration: { closesAt: string | null; adminAddUntil: string | null };
    registrationForm: AdminRegistrationForm;
    actions: {
        canEdit: boolean;
        canPublish: boolean;
        canCancel: boolean;
        canClose: boolean;
        canAddParticipants: boolean;
        canMarkAttendance: boolean;
    };
}

export interface EventInput {
    title: string;
    slug: string | null;
    description: string | null;
    bannerUrl: string | null;
    timezone: EventTimezone;
    startsAt: string | null;
    endsAt: string | null;
    format: EventFormat;
    venueName: string | null;
    address: string | null;
    mapUrl: string | null;
    usesQuota: boolean;
    capacity: number | null;
    allowsNonMember: boolean;
    attendanceCode: string | null;
    publish: boolean;
    registrationForm?: RegistrationFormDefinition;
}

export interface EventParticipant {
    id: Identifier;
    memberId: Identifier | null;
    memberNumber: string | null;
    name: string;
    whatsapp: string;
    registeredAt: string;
    source: 'self' | 'admin';
    status: { value: ParticipantStatus; label: string };
}

export interface ParticipantDetail {
    participant: EventParticipant;
    // null for people who registered before the form existed; never reconstructed from their profile.
    registrationResponse: import('@/types/registration-form').RegistrationResponse | null;
}

export interface ParticipantSummary {
    registered: number;
    attended: number;
    capacity: number | null;
}

export interface EventParticipantList extends PaginatedCollection<EventParticipant> {
    summary: ParticipantSummary;
}

export interface EventListQuery {
    perPage?: number;
    status: string;
    page: number;
}

export interface ParticipantListQuery {
    perPage?: number;
    search: string;
    page: number;
}

export type ParticipantInput = import('@/types/registration-form').RegistrationSubmissionInput &
    ({ memberId: string } | { name: string; email: string; consentAcknowledged: boolean });

export interface EventMemberOption {
    id: Identifier;
    name: string;
    memberNumber: string | null;
}
