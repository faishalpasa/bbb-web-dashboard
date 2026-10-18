const INDONESIA_COUNTRY_CODE = '62';

// Accepts 0812…, +62812…, 62812… and 812… and returns the stored 628… form.
export const normalizeWhatsapp = (value: string): string => {
    const digits = value.replace(/\D/g, '');

    if (digits.startsWith(INDONESIA_COUNTRY_CODE)) return digits;
    if (digits.startsWith('0')) return `${INDONESIA_COUNTRY_CODE}${digits.slice(1)}`;

    return digits ? `${INDONESIA_COUNTRY_CODE}${digits}` : '';
};

export const isValidWhatsapp = (normalized: string): boolean => /^628\d{8,12}$/.test(normalized);

// 6281234567890 -> 081234567890, for an input.
export const toLocalWhatsapp = (normalized: string): string =>
    normalized.startsWith(INDONESIA_COUNTRY_CODE) ? `0${normalized.slice(INDONESIA_COUNTRY_CODE.length)}` : normalized;

// 6281234567890 -> 0812-3456-7890, for reading in a table.
export const formatWhatsapp = (normalized: string): string => {
    const local = toLocalWhatsapp(normalized);

    return local.replace(/^(\d{4})(\d{4})(\d+)$/, '$1-$2-$3');
};

// A WhatsApp chat with the message already typed, for the admin to review and send.
export const whatsappChatUrl = (whatsapp: string, message: string): string =>
    `https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;

export const attendanceConfirmationMessage = (name: string, eventTitle: string): string =>
    `Halo Ibu ${name},\nSaya admin Buibu Baca Buku ingin mengkonfirmasi apakah ibu akan hadir di acara ${eventTitle}?`;

export const memberGreetingMessage = (name: string): string => `Halo Ibu ${name},\nSaya admin Buibu Baca Buku.`;

// "Kabupaten Bogor" -> "Kab. Bogor"; city names stay as they are.
export const abbreviateRegency = (label: string): string => label.replace(/^Kabupaten /, 'Kab. ');

// "Diskusi Buku Bulanan!" -> "diskusi-buku-bulanan", the same shape the API accepts for an event link.
export const slugify = (value: string): string =>
    value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

// "Jumat 19.00 WIB" minus N minutes -> "Jumat 18.00 WIB", rolling back over midnight into the previous weekday.
export const clockMinusMinutes = (weekdays: string[], weekdayIndex: number, hour: number, minutes: number): string => {
    const total = hour * 60 - minutes;
    const dayShift = Math.floor(total / 1440);
    const minuteOfDay = ((total % 1440) + 1440) % 1440;
    const weekday = weekdays[(((weekdayIndex + dayShift) % 7) + 7) % 7];
    const pad = (value: number): string => String(value).padStart(2, '0');

    return `${weekday} ${pad(Math.floor(minuteOfDay / 60))}.${pad(minuteOfDay % 60)} WIB`;
};
