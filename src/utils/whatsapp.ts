import { DEFAULT_PHONE_COUNTRY, PHONE_COUNTRIES, type PhoneCountry } from '@/constants/phone-countries';

// A WhatsApp number is sent and stored as international digits without "+": 6281234567890, 4917781621395.
const INDONESIA_PATTERN = /^628\d{8,12}$/;
const OTHER_COUNTRY_PATTERN = /^(?!62)[1-9]\d{7,14}$/;

const DIAL_BY_ISO = new Map(PHONE_COUNTRIES.map((country) => [country.iso, country.dial]));
const ISO_BY_DIAL = new Map<string, string>();

for (const country of PHONE_COUNTRIES) {
    if (!ISO_BY_DIAL.has(country.dial)) ISO_BY_DIAL.set(country.dial, country.iso);
}

const regionNames = new Intl.DisplayNames(['id'], { type: 'region' });

export const dialCodeOf = (iso: string): string => DIAL_BY_ISO.get(iso) ?? DIAL_BY_ISO.get(DEFAULT_PHONE_COUNTRY) ?? '62';

// "ID" -> the flag emoji: two regional-indicator letters. Windows desktop browsers draw them as the letters, which still reads fine.
export const flagOf = (iso: string): string =>
    [...iso.toUpperCase()].map((letter) => String.fromCodePoint(0x1f1e6 + letter.charCodeAt(0) - 65)).join('');

export const countryNameOf = (iso: string): string => {
    try {
        return regionNames.of(iso) ?? iso;
    } catch {
        return iso;
    }
};

export interface PhoneCountryOption extends PhoneCountry {
    name: string;
}

// Indonesia first (nearly everyone), then the rest by Indonesian name.
export const phoneCountryOptions = (): PhoneCountryOption[] => {
    const collator = new Intl.Collator('id');
    const options = PHONE_COUNTRIES.map((country) => ({ ...country, name: countryNameOf(country.iso) }));

    return [
        ...options.filter((option) => option.iso === DEFAULT_PHONE_COUNTRY),
        ...options.filter((option) => option.iso !== DEFAULT_PHONE_COUNTRY).sort((first, second) => collator.compare(first.name, second.name)),
    ];
};

// A number typed with its own country code ("+49 177…", "0049 177…") ignores the chosen country.
export const hasInternationalPrefix = (value: string): boolean => /^\s*(\+|00)/.test(value);

/** What goes to the API: the chosen country's code in front of the number, without the trunk "0" people type locally. */
export const composeWhatsapp = (iso: string, national: string): string => {
    const digits = national.replace(/\D/g, '');

    if (digits === '') return '';

    if (hasInternationalPrefix(national)) return digits.replace(/^00/, '');

    // Indonesians often type 62812… themselves; do not put the code in front twice.
    if (iso === DEFAULT_PHONE_COUNTRY && digits.startsWith('62')) return digits;

    return `${dialCodeOf(iso)}${digits.replace(/^0/, '')}`;
};

export const isValidWhatsapp = (digits: string): boolean => INDONESIA_PATTERN.test(digits) || OTHER_COUNTRY_PATTERN.test(digits);

/** The country whose dialling code starts these digits (longest code first), and what follows it. */
export const matchDialPrefix = (digits: string): { iso: string; rest: string } | null => {
    for (const length of [3, 2, 1]) {
        const iso = ISO_BY_DIAL.get(digits.slice(0, length));

        if (iso) return { iso, rest: digits.slice(length) };
    }

    return null;
};

/**
 * The inverse, to fill the form from a stored number (or from the 0812… a migrated account may still hold). The number
 * is shown without the trunk 0, because the country code in front already stands for it: +62 813…, not +62 0813….
 */
export const splitWhatsapp = (value: string): { iso: string; national: string } => {
    const digits = value.replace(/\D/g, '');

    if (digits === '') return { iso: DEFAULT_PHONE_COUNTRY, national: '' };

    if (digits.startsWith('0')) return { iso: DEFAULT_PHONE_COUNTRY, national: digits.replace(/^0/, '') };

    const match = matchDialPrefix(digits);

    if (!match) return { iso: DEFAULT_PHONE_COUNTRY, national: digits };

    return { iso: match.iso, national: match.rest };
};
