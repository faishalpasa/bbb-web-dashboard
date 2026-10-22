import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { getEventOptions, getEvents } from '@/services/event';
import type { LoadFailure } from '@/types/api';
import type { EventList, EventListQuery, EventOptions, EventSortBy, EventSortDirection } from '@/types/event';
import { toLoadFailure } from '@/utils/error';

const SEARCH_DEBOUNCE_MS = 350;

const INITIAL_QUERY: EventListQuery = {
    search: '',
    status: '',
    format: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'startsAt',
    sortDirection: 'desc',
    page: 1,
    perPage: 25,
};

type FilterName = 'status' | 'format' | 'dateFrom' | 'dateTo';

interface PageContextValue {
    query: EventListQuery;
    searchText: string;
    options: EventOptions | null;
    hasActiveFilter: boolean;
    list: EventList | null;
    failure: LoadFailure | null;
    isLoading: boolean;
    setSearchText: (value: string) => void;
    setFilter: (name: FilterName, value: string) => void;
    setSort: (sortBy: EventSortBy, direction?: EventSortDirection) => void;
    clearFilters: () => void;
    goToPage: (page: number) => void;
    setPerPage: (perPage: number) => void;
    reload: () => void;
}

const PageContext = createContext<PageContextValue | null>(null);

export const PageContextProvider = ({ children }: PropsWithChildren) => {
    const [query, setQuery] = useState<EventListQuery>(INITIAL_QUERY);
    const [searchText, setSearchTextState] = useState('');
    const [options, setOptions] = useState<EventOptions | null>(null);
    const [list, setList] = useState<EventList | null>(null);
    const [failure, setFailure] = useState<LoadFailure | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [reloadToken, setReloadToken] = useState(0);
    const latestRequest = useRef(0);

    useEffect(() => {
        const loadOptions = async () => {
            try {
                setOptions((await getEventOptions()).data);
            } catch {
                // The list still works without the options; the dropdowns just stay empty.
            }
        };

        void loadOptions();
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setQuery((current) => (current.search === searchText.trim() ? current : { ...current, search: searchText.trim(), page: 1 }));
        }, SEARCH_DEBOUNCE_MS);

        return () => window.clearTimeout(timer);
    }, [searchText]);

    const setFilter = useCallback((name: FilterName, value: string) => setQuery((current) => ({ ...current, [name]: value, page: 1 })), []);

    // The first click on a header sorts ascending, the next one reverses it (as on the members page).
    const setSort = useCallback((sortBy: EventSortBy, direction?: EventSortDirection) => {
        setQuery((current) => ({
            ...current,
            sortBy,
            sortDirection: direction ?? (current.sortBy === sortBy && current.sortDirection === 'asc' ? 'desc' : 'asc'),
            page: 1,
        }));
    }, []);

    const clearFilters = useCallback(() => {
        setSearchTextState('');
        setQuery((current) => ({ ...INITIAL_QUERY, perPage: current.perPage, sortBy: current.sortBy, sortDirection: current.sortDirection }));
    }, []);

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
            searchText,
            options,
            hasActiveFilter: query.search !== '' || query.status !== '' || query.format !== '' || query.dateFrom !== '' || query.dateTo !== '',
            list,
            failure,
            isLoading,
            setSearchText: setSearchTextState,
            setFilter,
            setSort,
            clearFilters,
            goToPage: (page) => setQuery((current) => ({ ...current, page })),
            setPerPage: (perPage) => setQuery((current) => ({ ...current, perPage, page: 1 })),
            reload: () => setReloadToken((token) => token + 1),
        }),
        [query, searchText, options, list, failure, isLoading, setFilter, setSort, clearFilters],
    );

    return <PageContext.Provider value={value}>{children}</PageContext.Provider>;
};

export const usePageContext = (): PageContextValue => {
    const context = useContext(PageContext);

    if (!context) throw new Error('usePageContext harus digunakan di dalam PageContextProvider.');

    return context;
};
