import type { Identifier, PaginatedCollection, SelectOption } from '@/types/api';
import type { DistrictOption, RegionOption } from '@/types/region';

export type MemberAdminStatus = 'active' | 'exit_requested' | 'email_bounced' | 'awaiting_data' | 'inactive';

export type MemberHistoryStatus = 'registered' | 'present' | 'absent';

export interface MemberListItem {
    id: Identifier;
    memberNumber: string | null;
    name: string;
    whatsapp: string;
    regency: string | null;
    province: string | null;
    preference: SelectOption | null;
    status: { value: MemberAdminStatus; label: string };
    joinedEvents: number;
    attendedEvents: number;
    joinedAt: string;
}

export interface MemberList extends PaginatedCollection<MemberListItem> {
    summary: { activeTotal: number; total: number };
}

export interface MemberListQuery {
    search: string;
    status: string;
    provinceCode: string;
    preference: string;
    attendance: string;
    page: number;
    perPage?: number;
}

export interface MemberOptions {
    statuses: SelectOption[];
    preferences: SelectOption[];
    attendance: SelectOption[];
    provinces: RegionOption[];
    birthYearMin: number;
    birthYearMax: number;
}

export interface MemberHistoryItem {
    eventId: Identifier;
    title: string;
    startsAt: string;
    status: { value: MemberHistoryStatus; label: string };
}

export interface MemberDetail {
    id: Identifier;
    memberNumber: string | null;
    status: { value: MemberAdminStatus; label: string };
    name: string;
    birthYear: number;
    email: string;
    isEmailVerified: boolean;
    whatsapp: string;
    province: RegionOption | null;
    regency: RegionOption | null;
    district: DistrictOption | null;
    postalCode: string;
    preference: SelectOption | null;
    whatsappGroupJoinedAt: string | null;
    signupMethod: { value: 'google' | 'email' | 'admin'; label: string };
    joinedAt: string;
    consent: { rulesVersion: string; acceptedAt: string } | null;
    statistics: { joined: number; attended: number; absent: number };
    history: MemberHistoryItem[];
    note: string;
    actions: { canEdit: boolean; canResetPassword: boolean; canDeactivate: boolean; canActivate: boolean };
}

export interface MemberEditInput {
    name: string;
    birthYear: number;
    whatsapp: string;
    participationPreference: string | null;
    provinceCode: string;
    regencyCode: string;
    districtCode: string;
    postalCode: string;
}

export interface MemberCreateInput extends MemberEditInput {
    email: string;
    sendInvitation: boolean;
    consentAcknowledged: boolean;
}
