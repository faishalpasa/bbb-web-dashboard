import type { BadgeTone } from '@/constants/member';
import type { EventStatus, EventTimezone, ParticipantStatus } from '@/types/event';

// Status labels come from the API; the tone is presentation only.
export const EVENT_STATUS_TONES: Record<EventStatus, BadgeTone> = {
    draft: 'neutral',
    published: 'success',
    completed: 'dark',
    cancelled: 'danger',
};

export const PARTICIPANT_STATUS_TONES: Record<ParticipantStatus, BadgeTone> = {
    registered: 'neutral',
    present: 'success',
    absent: 'danger',
};

export const EVENT_DRAFT_PLACEHOLDER_TITLE = '[Judul kegiatan draf]';
export const EVENT_NO_SCHEDULE_LABEL = '[Belum ada jadwal]';
export const EVENT_DEFAULT_TIMEZONE: EventTimezone = 'WIB';
export const EVENT_DEFAULT_CAPACITY = '20';
