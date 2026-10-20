import type { MasterlistField, MasterlistRow } from '@/types/masterlist';

export const MASTERLIST_FIELDS: ReadonlyArray<{ value: MasterlistField; label: string }> = [
    { value: 'email', label: 'Email' },
    { value: 'name', label: 'Nama' },
    { value: 'joined_at', label: 'Tanggal bergabung' },
    { value: 'birth_year', label: 'Tahun lahir' },
    { value: 'phone_wa', label: 'WhatsApp' },
    { value: 'domicile', label: 'Domisili (raw)' },
    { value: 'instagram_account', label: 'Instagram' },
    { value: 'website_url', label: 'Website' },
    { value: 'goodreads_account', label: 'Goodreads' },
    { value: 'favorite_books_authors', label: 'Buku / penulis favorit' },
    { value: 'literacy_participation_interest', label: 'Minat komunitas literasi' },
    { value: 'preferred_contact_channel', label: 'Saluran kontak' },
    { value: 'reading_interests', label: 'Minat bacaan' },
    { value: 'reading_interest_other', label: 'Minat Lainnya' },
];

export const MASTERLIST_STATUS = { valid: 'Valid', warning: 'Perlu review', invalid: 'Tidak valid / skip' } as const;

export const masterlistStatusLabel = (row: Pick<MasterlistRow, 'status' | 'provenance'>): string =>
    row.status === 'warning' && row.provenance.review_policy === 'approved_deferred_profile_v1'
        ? 'Diterima dengan catatan'
        : MASTERLIST_STATUS[row.status];
