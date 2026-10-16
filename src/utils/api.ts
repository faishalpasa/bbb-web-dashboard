import axios, { isAxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

import { clearToken, currentToken, isAuthToken, setToken } from '@/utils/token';

// The API prefix differs per environment: the Laravel API is hosted separately from this app.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

type RetriableRequestConfig = InternalAxiosRequestConfig & { authRetried?: boolean };

export const axiosClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
});

// A session that expires while the app is open ends on the sign-in screen. The app registers what that means.
let unauthorizedHandler: (() => void) | null = null;

export const setUnauthorizedHandler = (handler: (() => void) | null) => {
    unauthorizedHandler = handler;
};

axiosClient.interceptors.request.use((config) => {
    const token = currentToken();

    if (token) {
        config.headers.set('Authorization', `Bearer ${token.accessToken}`);
    }

    return config;
});

// Every endpoint that starts or renews a session (sign-in, email verification, Google exchange, password reset) answers
// with `token` next to its data. It is stored here and removed from the data so it never reaches page state.
const captureToken = (response: AxiosResponse): AxiosResponse => {
    const body: unknown = response.data;

    if (typeof body === 'object' && body !== null && 'data' in body && typeof body.data === 'object' && body.data !== null && 'token' in body.data) {
        const { token } = body.data;

        if (isAuthToken(token)) {
            setToken(token);
        }

        delete (body.data as { token?: unknown }).token;
    }

    return response;
};

// One refresh at a time: requests that fail together all wait for the same answer.
let refreshRequest: Promise<boolean> | null = null;

const refreshToken = (): Promise<boolean> => {
    const token = currentToken();

    if (!token) {
        return Promise.resolve(false);
    }

    refreshRequest ??= axios
        .post<unknown>(`${API_BASE_URL}/auth/refresh`, null, {
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                Authorization: `Bearer ${token.accessToken}`,
            },
        })
        .then((response) => {
            captureToken(response);

            return true;
        })
        .catch((error: unknown) => {
            // A refusal ends the session; a network failure or a 5xx must not log anyone out.
            if (isAxiosError(error) && error.response && error.response.status < 500) {
                clearToken();
            }

            return false;
        })
        .finally(() => {
            refreshRequest = null;
        });

    return refreshRequest;
};

axiosClient.interceptors.response.use(captureToken, async (error: unknown) => {
    if (!isAxiosError(error) || !error.config) {
        throw error;
    }

    const config: RetriableRequestConfig = error.config;
    const status = error.response?.status;
    const sentAuthorization = String(config.headers.get('Authorization') ?? '');

    // A request that carried a token and got 401 means the token expired or was revoked: renew it once and repeat the request.
    if (status === 401 && sentAuthorization !== '' && !config.authRetried) {
        config.authRetried = true;

        const stored = currentToken();
        const isRenewedMeanwhile = stored !== null && sentAuthorization !== `Bearer ${stored.accessToken}`;

        if (isRenewedMeanwhile || (await refreshToken())) {
            return axiosClient(config);
        }
    }

    // Still 401 after a renewal attempt (or with no token at all): the admin session is gone.
    if (status === 401) {
        unauthorizedHandler?.();
    }

    throw error;
});
