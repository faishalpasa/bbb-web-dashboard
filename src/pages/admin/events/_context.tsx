import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { getEvents } from '@/services/event';
import type { LoadFailure } from '@/types/api';
import type { EventList, EventListQuery } from '@/types/event';
import { toLoadFailure } from '@/utils/error';

interface PageContextValue {
    query: EventListQuery;
    list: EventList | null;
    failure: LoadFailure | null;
    isLoading: boolean;
    setStatus: (status: string) => void;
    goToPage: (page: number) => void;
    reload: () => void;
}

const PageContext = createContext<PageContextValue | null>(null);

export const PageContextProvider = ({ children }: PropsWithChildren) => {
    const [query, setQuery] = useState<EventListQuery>({ status: '', page: 1 });
    const [list, setList] = useState<EventList | null>(null);
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
                const response = await getEvents(query);

                // A slower earlier response must not overwrite the result of a newer tab.
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
            setStatus: (status) => setQuery({ status, page: 1 }),
            goToPage: (page) => setQuery((current) => ({ ...current, page })),
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
