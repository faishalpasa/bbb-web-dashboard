export type Identifier = string;

export interface ApiEnvelope<T> {
    data: T;
}

export type ApiErrorCode = 'token_expired' | 'token_used' | 'token_invalid';

export interface ApiErrorResponse {
    message?: string;
    adminWhatsappUrl?: string | null;
    code?: ApiErrorCode | 'membership_restricted';
    errors?: Record<string, string[]>;
}

export interface PaginationMeta {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
}

export interface PaginatedCollection<T> {
    items: T[];
    meta: PaginationMeta;
}

export interface SelectOption {
    value: string;
    label: string;
}

export interface ServiceResponse<T> {
    data: T;
    status: true;
}

export interface ServiceError {
    data: ApiErrorResponse | undefined;
    httpStatus?: number;
    status: false;
}

// What a page needs to render a failed initial load: the message, a machine-readable code, and whether the server itself failed.
export interface LoadFailure {
    message: string;
    code?: ApiErrorCode;
    isServerError: boolean;
}
