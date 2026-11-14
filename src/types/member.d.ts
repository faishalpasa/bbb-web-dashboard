import type { Identifier, PaginatedCollection, SelectOption } from '@/types/api';
import type { ReadingProfile, ReadingProfileInput, ReadingProfileOptions } from '@/types/reading-profile';
import type { CountryOption, DistrictOption, DomicileType, RegionOption, VillageOption } from '@/types/region';

export type MemberAdminStatus = 'active' | 'exit_requested' | 'awaiting_data' | 'inactive';
export type MemberSortBy = 'memberNumber' | 'name' | 'joinedAt';
export type MemberSortDirection = 'asc' | 'desc';

export type MemberHistoryStatus = 'registered' | 'present' | 'absent';

export interface MemberListItem {
    id: Identifier;
    memberNumber: string | null;
    name: string;
    email: string;
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
    /** Ids of the chosen reading interests (favourite genres), comma-separated; a member matches any of them. */
    readingInterests: string;
    sortBy: MemberSortBy;
    sortDirection: MemberSortDirection;
    page: number;
    perPage?: number;
}

export interface MemberOptions {
    readingProfileOptions: ReadingProfileOptions;
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

export interface MemberDetail extends ReadingProfile {
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
    village: VillageOption | null;
    postalCode: string;
    domicileType: DomicileType;
    country: CountryOption | null;
    overseasCity: string | null;
    preference: SelectOption | null;
    whatsappGroupJoinedAt: string | null;
    signupMethod: { value: 'google' | 'email' | 'admin'; label: string };
    joinedAt: string;
    consent: { rulesVersion: string; acceptedAt: string } | null;
    statistics: { joined: number; attended: number; absent: number };
    history: MemberHistoryItem[];
    note: string;
    actions: { canEdit: boolean; canResetPassword: boolean; canDeactivate: boolean; canActivate: boolean; canDelete: boolean };
}

export interface MemberEditInput extends ReadingProfileInput {
    name: string;
    /** On edit, a different address changes the sign-in email; left out, the current one stays. */
    email?: string;
    birthYear: number;
    whatsapp: string;
    participationPreference: string | null;
    provinceCode: string;
    regencyCode: string;
    districtCode: string;
    villageCode: string;
    postalCode: string;
    domicileType: DomicileType;
    countryCode: string;
    overseasCity: string;
}

export interface MemberCreateInput extends MemberEditInput {
    email: string;
    sendInvitation: boolean;
    consentAcknowledged: boolean;
}
