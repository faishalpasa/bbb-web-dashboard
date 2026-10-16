import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { ROUTES } from '@/constants/route';
import { getSession, postLogout } from '@/services/auth';
import type { AdminSession } from '@/types/auth';
import { setUnauthorizedHandler } from '@/utils/api';

export interface AppContextValue {
    appName: string;
    session: AdminSession | null;
    setSession: (session: AdminSession | null) => void;
    // Resolves the current session once and reuses it; route guards call this before every protected page.
    ensureSession: () => Promise<AdminSession | null>;
    // Re-reads the session, for numbers that change after an action (the exit request badge).
    refreshSession: () => Promise<void>;
    handleLogout: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

const fetchSession = async (): Promise<AdminSession | null> => {
    try {
        const response = await getSession();

        return response.data;
    } catch {
        return null;
    }
};

export const AppContextProvider = ({ children }: PropsWithChildren) => {
    const [session, setSessionState] = useState<AdminSession | null>(null);
    const sessionRequest = useRef<Promise<AdminSession | null> | null>(null);

    const setSession = useCallback((nextSession: AdminSession | null) => {
        sessionRequest.current = Promise.resolve(nextSession);
        setSessionState(nextSession);
    }, []);

    const ensureSession = useCallback(() => {
        sessionRequest.current ??= fetchSession().then((resolved) => {
            setSessionState(resolved);

            return resolved;
        });

        return sessionRequest.current;
    }, []);

    useEffect(() => {
        // A full navigation drops every cached page and the cached session along with it.
        setUnauthorizedHandler(() => {
            if (window.location.pathname !== ROUTES.login) window.location.assign(ROUTES.login);
        });

        return () => setUnauthorizedHandler(null);
    }, []);

    const refreshSession = useCallback(async () => {
        const refreshed = await fetchSession();

        // A failed refresh keeps the current session; the 401 handler already deals with a lost one.
        if (refreshed) setSession(refreshed);
    }, [setSession]);

    const handleLogout = useCallback(async () => {
        try {
            await postLogout();
        } finally {
            // The local session is dropped even when the request fails, so the admin never stays stuck in the app.
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
