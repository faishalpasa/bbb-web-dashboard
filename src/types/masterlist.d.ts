import type { PaginationMeta } from '@/types/api';

export type MasterlistField =
    | 'email'
    | 'name'
    | 'joined_at'
    | 'birth_year'
    | 'phone_wa'
    | 'domicile'
    | 'instagram_account'
    | 'website_url'
    | 'goodreads_account'
    | 'literacy_participation_interest'
    | 'favorite_books_authors'
    | 'reading_interests'
    | 'reading_interest_other'
    | 'preferred_contact_channel';
export type MasterlistMapping = Partial<Record<MasterlistField, string | null>>;
export interface MasterlistRow {
    row_number: number;
    status: 'valid' | 'warning' | 'invalid';
    values: Record<string, string | number | string[] | null>;
    raw: Record<string, string | number | boolean | null>;
    provenance: Record<string, string | string[]>;
    issues: { field: string; severity: 'warning' | 'error'; code: string; message: string }[];
}
export interface MasterlistPreview {
    import_id: string;
    filename: string;
    file_hash: string;
    detected_columns: string[];
    suggested_mapping: MasterlistMapping;
    summary: { total_rows: number; valid_rows: number; warning_rows: number; invalid_rows: number };
    rows: MasterlistRow[];
    meta: PaginationMeta;
    created_at: string;
    expires_at: string;
    can_import: false;
    parser_version: string;
    fallback_joined_at: string;
}
