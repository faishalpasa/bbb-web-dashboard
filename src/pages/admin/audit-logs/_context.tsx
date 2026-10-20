import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { getAuditLogs } from '@/services/superadmin';
import type { LoadFailure } from '@/types/api';
import type { AuditLogList, AuditLogQuery } from '@/types/superadmin';
import { toLoadFailure } from '@/utils/error';

interface PageContextValue {
    query: AuditLogQuery;
    list: AuditLogList | null;
    failure: LoadFailure | null;
    isLoading: boolean;
    setType: (type: string) => void;
    goToPage: (page: number) => void;
    setPerPage: (perPage: number) => void;
    reload: () => void;
}

const PageContext = createContext<PageContextValue | null>(null);

export const PageContextProvider = ({ children }: PropsWithChildren) => {
    const [query, setQuery] = useState<AuditLogQuery>({ type: '', page: 1, perPage: 25 });
    const [list, setList] = useState<AuditLogList | null>(null);
    const [failure, setFailure] = useState<LoadFailure | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [reloadToken, setReloadToken] = useState(0);
    const latestRequest = useRef(0);

    useEffect(() => {
        const requestId = ++latestRequest.current;

        const load = async () => {
            setIsLoading(true);
            setFailure(null);

            try {
                const response = await getAuditLogs(query);

                if (requestId === latestRequest.current) setList(response.data);
            } catch (error) {
                if (requestId === latestRequest.current) setFailure(toLoadFailure(error));
            } finally {
                if (requestId === latestRequest.current) setIsLoading(false);
            }
        };

        void load();
    }, [query, reloadToken]);

    const value = useMemo<PageContextValue>(
        () => ({
            query,
            list,
            failure,
            isLoading,
            setType: (type) => setQuery((current) => ({ ...current, type, page: 1 })),
            goToPage: (page) => setQuery((current) => ({ ...current, page })),
            setPerPage: (perPage) => setQuery((current) => ({ ...current, perPage, page: 1 })),
            reload: () => setReloadToken((token) => token + 1),
        }),
        [query, list, failure, isLoading],
    );

    return <PageContext.Provider value={value}>{children}</PageContext.Provider>;
};

export const usePageContext = (): PageContextValue => {
    const context = useContext(PageContext);

    if (!context) throw new Error('usePageContext harus digunakan di dalam PageContextProvider.');

    return context;
};
