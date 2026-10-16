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
