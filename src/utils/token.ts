import { STORAGE_KEYS } from '@/constants/storage';
import type { AuthToken } from '@/types/auth';

// Only the access token and its expiry are kept; nothing from the session body is stored with it.
export type StoredToken = Pick<AuthToken, 'accessToken' | 'expiresAt'>;

export const isAuthToken = (value: unknown): value is StoredToken =>
    typeof value === 'object' &&
    value !== null &&
    'accessToken' in value &&
    typeof value.accessToken === 'string' &&
    value.accessToken !== '' &&
    'expiresAt' in value &&
    typeof value.expiresAt === 'string';

const readStoredToken = (): StoredToken | null => {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEYS.adminToken);
        const parsed: unknown = raw === null ? null : JSON.parse(raw);

        return isAuthToken(parsed) ? { accessToken: parsed.accessToken, expiresAt: parsed.expiresAt } : null;
    } catch {
        return null;
    }
};

// Without storage (private mode) the token lives for this page load only, so the person has to sign in again after a reload.
let memoryToken: StoredToken | null = null;

// Storage first so a token renewed in another tab wins; memory only matters when storage is unavailable.
export const currentToken = (): StoredToken | null => readStoredToken() ?? memoryToken;

export const setToken = (token: StoredToken): void => {
    memoryToken = { accessToken: token.accessToken, expiresAt: token.expiresAt };

    try {
        window.localStorage.setItem(STORAGE_KEYS.adminToken, JSON.stringify(memoryToken));
    } catch {
        // Kept in memory only.
    }
};

export const clearToken = (): void => {
    memoryToken = null;

    try {
        window.localStorage.removeItem(STORAGE_KEYS.adminToken);
    } catch {
        // Nothing stored to remove.
    }
};
