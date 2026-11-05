import * as Sentry from '@sentry/react';
import type { RootOptions } from 'react-dom/client';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

// Reports crashes to Sentry (project bbb-web-dashboard). Without a DSN, as in local development, nothing is sent and React keeps
// its own error handling. Member data stays out: no user details, cookies, headers, bodies or URL query (it can hold
// one-time tokens).
export const initSentry = (): RootOptions => {
    if (!SENTRY_DSN) return {};

    Sentry.init({
        dsn: SENTRY_DSN,
        environment: import.meta.env.VITE_SENTRY_ENVIRONMENT ?? 'development',
        dataCollection: { userInfo: false, cookies: false, httpHeaders: false, httpBodies: [], urlQueryParams: false },
    });

    const report = Sentry.reactErrorHandler((error) => console.error(error));

    return { onUncaughtError: report, onCaughtError: report, onRecoverableError: report };
};
