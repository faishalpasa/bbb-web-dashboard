import type { MemberAdminStatus, MemberHistoryStatus } from '@/types/member';

export type BadgeTone = 'success' | 'neutral' | 'warning' | 'danger' | 'pending' | 'dark' | 'sage';

// Status labels come from the API; the tone is presentation only.
export const MEMBER_STATUS_TONES: Record<MemberAdminStatus, BadgeTone> = {
    active: 'success',
    exit_requested: 'warning',
    awaiting_data: 'pending',
    inactive: 'neutral',
};

export const MEMBER_HISTORY_TONES: Record<MemberHistoryStatus, BadgeTone> = {
    registered: 'neutral',
    present: 'success',
    absent: 'danger',
};

export const MEMBER_PAGE_TITLES = {
    list: 'Member',
    create: 'Member baru',
    edit: 'Edit data member',
} as const;

export const POSTAL_CODE_LENGTH = 5;
