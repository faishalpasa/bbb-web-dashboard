import { isAxiosError } from 'axios';

import type { ApiErrorCode, ApiErrorResponse, LoadFailure, ServiceError } from '@/types/api';

const DEFAULT_ERROR_MESSAGE = 'Terjadi kesalahan, silakan coba lagi nanti.';

export const toServiceError = (error: unknown): ServiceError => {
    if (isAxiosError<ApiErrorResponse>(error)) {
        return { data: error.response?.data, httpStatus: error.response?.status, status: false };
    }

    return { data: undefined, status: false };
};

export const isServiceError = (error: unknown): error is ServiceError =>
    typeof error === 'object' && error !== null && 'status' in error && error.status === false && 'data' in error;

export const errorMessage = (error: unknown): string => {
    if (isServiceError(error)) {
        return error.data?.message ?? DEFAULT_ERROR_MESSAGE;
    }

    return DEFAULT_ERROR_MESSAGE;
};

export const fieldErrorMessage = (error: unknown, field: string): string | undefined => {
    if (isServiceError(error)) {
        return error.data?.errors?.[field]?.[0];
    }

    return undefined;
};

export const errorCode = (error: unknown): ApiErrorCode | undefined => {
    const code = isServiceError(error) ? error.data?.code : undefined;
    return code === 'membership_restricted' ? undefined : code;
};

// A server failure or no response at all (offline, CORS, API down), as opposed to a refusal the user can fix.
export const isServerError = (error: unknown): boolean => isServiceError(error) && (error.httpStatus === undefined || error.httpStatus >= 500);

export const toLoadFailure = (error: unknown): LoadFailure => ({
    message: errorMessage(error),
    code: errorCode(error),
    isServerError: isServerError(error),
});
