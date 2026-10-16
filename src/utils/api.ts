import axios, { isAxiosError, type InternalAxiosRequestConfig } from 'axios';

// The API prefix and origin differ per environment: the Laravel API is hosted separately from this app.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';
export const API_ORIGIN = import.meta.env.VITE_API_ORIGIN ?? '';

type RetriableRequestConfig = InternalAxiosRequestConfig & { csrfRetried?: boolean };

export const axiosClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
    withCredentials: true,
    withXSRFToken: true,
});

// Sanctum SPA auth: mutations need the XSRF-TOKEN cookie that /sanctum/csrf-cookie sets.
let csrfCookieRequest: Promise<unknown> | null = null;

const ensureCsrfCookie = (): Promise<unknown> => {
    csrfCookieRequest ??= axios.get(`${API_ORIGIN}/sanctum/csrf-cookie`, { withCredentials: true }).catch((error: unknown) => {
        csrfCookieRequest = null;

        throw error;
    });

    return csrfCookieRequest;
};

// Register an admin sign-in redirect once the admin session contract exists.
let unauthorizedHandler: (() => void) | null = null;

export const setUnauthorizedHandler = (handler: (() => void) | null) => {
    unauthorizedHandler = handler;
};

axiosClient.interceptors.request.use(async (config) => {
    if (config.method && config.method.toLowerCase() !== 'get') {
        await ensureCsrfCookie();
    }

    return config;
});

// A 419 means the CSRF cookie expired with the session; fetch a new one and retry the request once.
axiosClient.interceptors.response.use(undefined, async (error: unknown) => {
    // Handler is deliberately unregistered until admin authentication is implemented.
    if (isAxiosError(error) && error.response?.status === 401) {
        unauthorizedHandler?.();
    }

    if (isAxiosError(error) && error.response?.status === 419 && error.config) {
        const config: RetriableRequestConfig = error.config;

        if (!config.csrfRetried) {
            config.csrfRetried = true;
            csrfCookieRequest = null;

            return axiosClient(config);
        }
    }

    throw error;
});
