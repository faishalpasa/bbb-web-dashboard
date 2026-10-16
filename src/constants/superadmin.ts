import type { BadgeTone } from '@/constants/member';
import type { AdminAccountStatus, AuditLogType } from '@/types/superadmin';

export const ADMIN_ACCOUNT_TONES: Record<AdminAccountStatus, BadgeTone> = {
    active: 'success',
    inactive: 'neutral',
    invited: 'pending',
};

export const AUDIT_LOG_TONES: Record<AuditLogType, BadgeTone> = {
    export: 'success',
    settings: 'neutral',
    admins: 'sage',
};

// The "Semua" tab sends no type filter; the other tabs come from the API.
export const AUDIT_ALL_TAB = { value: '', label: 'Semua' };

export const SETTINGS_DEMO_WEEKDAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
