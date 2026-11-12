import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';

import { useClientPagination, type ClientPagination } from '@/hooks/useClientPagination';
import { getExitRequestHistory } from '@/services/exit-request';
import type { LoadFailure } from '@/types/api';
import type { ExitRequest } from '@/types/exit-request';
import { toLoadFailure } from '@/utils/error';

interface PageContextValue {
    requests: ExitRequest[];
    pagination: ClientPagination<ExitRequest>;
    failure: LoadFailure | null;
    isLoading: boolean;
    reload: () => void;
}

const PageContext = createContext<PageContextValue | null>(null);

export const PageContextProvider = ({ children }: PropsWithChildren) => {
    const [requests, setRequests] = useState<ExitRequest[]>([]);
    const pagination = useClientPagination(requests);
    const [failure, setFailure] = useState<LoadFailure | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [reloadToken, setReloadToken] = useState(0);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            setFailure(null);

            try {
                setRequests((await getExitRequestHistory()).data.items);
            } catch (error) {
                setFailure(toLoadFailure(error));
            } finally {
                setIsLoading(false);
            }
        };

        void load();
    }, [reloadToken]);

    return (
        <PageContext.Provider value={{ requests, pagination, failure, isLoading, reload: () => setReloadToken((token) => token + 1) }}>
            {children}
        </PageContext.Provider>
    );
};

export const usePageContext = (): PageContextValue => {
    const context = useContext(PageContext);

    if (!context) throw new Error('usePageContext harus digunakan di dalam PageContextProvider.');

    return context;
};
