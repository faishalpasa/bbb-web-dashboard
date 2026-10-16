import type { EventTimezone } from '@/types/event';

// The API sends ISO 8601 UTC; every admin-facing time is shown in WIB.
const TIME_ZONE = 'Asia/Jakarta';
const LOCALE = 'id-ID';

const format = (iso: string, options: Intl.DateTimeFormatOptions): string =>
    new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, ...options }).format(new Date(iso));

// 6 Oktober 2026
export const formatLongDate = (iso: string): string => format(iso, { day: 'numeric', month: 'long', year: 'numeric' });

// 19 Sep 2026
export const formatShortDate = (iso: string): string => format(iso, { day: 'numeric', month: 'short', year: 'numeric' });

// Sabtu, 17 Oktober, 09.00 WIB
export const formatEventSchedule = (iso: string): string => {
    const day = format(iso, { weekday: 'long', day: 'numeric', month: 'long' });
    const time = format(iso, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

    return `${day}, ${time} WIB`;
};

// 05 Okt 2026
export const formatTableDate = (iso: string): string => format(iso, { day: '2-digit', month: 'short', year: 'numeric' });

// 5 Sep 2026 (no leading zero), used in the history table.
export const formatHistoryDate = (iso: string): string => format(iso, { day: 'numeric', month: 'short', year: 'numeric' });

// Events carry their own zone; the API still sends UTC.
const EVENT_ZONES: Record<EventTimezone, { iana: string; offsetHours: number }> = {
    WIB: { iana: 'Asia/Jakarta', offsetHours: 7 },
    WITA: { iana: 'Asia/Makassar', offsetHours: 8 },
    WIT: { iana: 'Asia/Jayapura', offsetHours: 9 },
};

const formatInZone = (iso: string, timezone: EventTimezone, options: Intl.DateTimeFormatOptions): string =>
    new Intl.DateTimeFormat(LOCALE, { timeZone: EVENT_ZONES[timezone].iana, ...options }).format(new Date(iso));

const timeInZone = (iso: string, timezone: EventTimezone): string =>
    formatInZone(iso, timezone, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

// Sabtu, 17 Okt 2026, 09.00 WIB
export const formatEventDateTime = (iso: string, timezone: EventTimezone): string =>
    `${formatInZone(iso, timezone, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}, ${timeInZone(iso, timezone)} ${timezone}`;

// Sabtu, 17 Oktober 2026, 09.00 sampai 12.00 WIB
export const formatEventRange = (startsAt: string, endsAt: string | null, timezone: EventTimezone): string => {
    const day = formatInZone(startsAt, timezone, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const end = endsAt ? ` sampai ${timeInZone(endsAt, timezone)}` : '';

    return `${day}, ${timeInZone(startsAt, timezone)}${end} ${timezone}`;
};

// 10 Okt, 14.20 (shown in WIB, like the rest of the participant table)
export const formatRegisteredAt = (iso: string): string =>
    `${format(iso, { day: 'numeric', month: 'short' })}, ${format(iso, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })}`;

// ISO UTC -> the "YYYY-MM-DDTHH:mm" wall-clock value a datetime-local input expects, in the event zone.
export const toLocalInput = (iso: string | null, timezone: EventTimezone): string => {
    if (!iso) return '';

    return new Date(new Date(iso).getTime() + EVENT_ZONES[timezone].offsetHours * 3_600_000).toISOString().slice(0, 16);
};

// The inverse of toLocalInput: wall-clock in the event zone -> ISO UTC, or null when empty.
export const fromLocalInput = (value: string, timezone: EventTimezone): string | null => {
    if (!value) return null;

    return new Date(Date.parse(`${value}:00Z`) - EVENT_ZONES[timezone].offsetHours * 3_600_000).toISOString();
};
