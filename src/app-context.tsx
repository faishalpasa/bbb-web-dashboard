import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { ROUTES } from '@/constants/route';
import { getSession, postLogout } from '@/services/auth';
import type { AdminSession } from '@/types/auth';
import { setSessionUpdatedHandler, setUnauthorizedHandler } from '@/utils/api';
import { isServiceError } from '@/utils/error';
import { SessionCache } from '@/utils/session-cache';
import { clearToken, currentToken } from '@/utils/token';

export interface AppContextValue {
    appName: string;
    session: AdminSession | null;
    setSession: (session: AdminSession | null) => void;
    // Resolves the current session once and reuses it; route guards call this before every protected page.
    ensureSession: (force?: boolean) => Promise<AdminSession | null>;
    // Re-reads the session, for numbers that change after an action (the exit request badge).
    refreshSession: () => Promise<void>;
    handleLogout: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

const fetchSession = async (): Promise<AdminSession | null> => {
    if (!currentToken()) return null;
    try {
        const response = await getSession();

        return response.data;
    } catch (error) {
        if (isServiceError(error) && error.httpStatus === 401) return null;
        throw error;
    }
};

export const AppContextProvider = ({ children }: PropsWithChildren) => {
    const [session, setSessionState] = useState<AdminSession | null>(null);
    const cache = useRef(new SessionCache(fetchSession));

    const setSession = useCallback((nextSession: AdminSession | null) => {
        cache.current.replace(nextSession);
        setSessionState(nextSession);
    }, []);

    const ensureSession = useCallback((force = false) => {
        return cache.current.get(force).then((resolved) => {
            setSessionState(resolved);

            return resolved;
        });
    }, []);

    useEffect(() => {
        // A full navigation drops every cached page and the cached session along with it.
        setUnauthorizedHandler(() => {
            clearToken();
            setSession(null);
            if (window.location.pathname !== ROUTES.login) window.location.assign(ROUTES.login);
        });
        setSessionUpdatedHandler(setSession);

        return () => {
            setUnauthorizedHandler(null);
            setSessionUpdatedHandler(null);
        };
    }, [setSession]);

    const refreshSession = useCallback(async () => {
        await ensureSession(true);
    }, [ensureSession]);

    useEffect(() => {
        const refresh = () => {
            if (document.visibilityState === 'visible') void ensureSession(true).catch(() => undefined);
        };
        window.addEventListener('focus', refresh);
        document.addEventListener('visibilitychange', refresh);
        return () => {
            window.removeEventListener('focus', refresh);
            document.removeEventListener('visibilitychange', refresh);
        };
    }, [ensureSession]);

    const handleLogout = useCallback(async () => {
        try {
            await postLogout();
        } finally {
            // The local session is dropped even when the request fails, so the admin never stays stuck in the app.
            clearToken();
            setSession(null);
        }
    }, [setSession]);

    const value = useMemo<AppContextValue>(
        () => ({ appName: 'BBB BFF Admin', session, setSession, ensureSession, refreshSession, handleLogout }),
        [session, setSession, ensureSession, refreshSession, handleLogout],
    );

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextValue => {
    const context = useContext(AppContext);

    if (!context) throw new Error('useAppContext harus berada di dalam AppContextProvider.');

    return context;
};
