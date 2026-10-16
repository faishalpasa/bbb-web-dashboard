import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { getMemberOptions, getMembers, getMembersExport } from '@/services/member';
import type { LoadFailure } from '@/types/api';
import type { MemberList, MemberListQuery, MemberOptions } from '@/types/member';
import { errorMessage, toLoadFailure } from '@/utils/error';

const SEARCH_DEBOUNCE_MS = 350;

const INITIAL_QUERY: MemberListQuery = { search: '', status: '', provinceCode: '', preference: '', attendance: '', page: 1 };

type FilterName = 'status' | 'provinceCode' | 'preference' | 'attendance';

interface PageContextValue {
    query: MemberListQuery;
    searchText: string;
    options: MemberOptions | null;
    list: MemberList | null;
    failure: LoadFailure | null;
    isLoading: boolean;
    isExporting: boolean;
    exportError: string | null;
    rangeStart: number;
    rangeEnd: number;
    setSearchText: (value: string) => void;
    setFilter: (name: FilterName, value: string) => void;
    goToPage: (page: number) => void;
    reload: () => void;
    exportMembers: () => Promise<void>;
}

const PageContext = createContext<PageContextValue | null>(null);

export const PageContextProvider = ({ children }: PropsWithChildren) => {
    const [query, setQuery] = useState<MemberListQuery>(INITIAL_QUERY);
    const [searchText, setSearchTextState] = useState('');
    const [options, setOptions] = useState<MemberOptions | null>(null);
    const [list, setList] = useState<MemberList | null>(null);
    const [failure, setFailure] = useState<LoadFailure | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);
    const [reloadToken, setReloadToken] = useState(0);
    const latestRequest = useRef(0);

    useEffect(() => {
        const loadOptions = async () => {
            try {
                setOptions((await getMemberOptions()).data);
            } catch {
                // The list still works without filter options; the selects just stay empty.
            }
        };

        void loadOptions();
    }, []);

    useEffect(() => {
        const requestId = ++latestRequest.current;

        const load = async () => {
            setIsLoading(true);
            setFailure(null);

            try {
                const response = await getMembers(query);

                // A slower earlier response must not overwrite the result of a newer filter.
                if (requestId === latestRequest.current) setList(response.data);
            } catch (error) {
                if (requestId === latestRequest.current) setFailure(toLoadFailure(error));
            } finally {
                if (requestId === latestRequest.current) setIsLoading(false);
            }
        };

        void load();
    }, [query, reloadToken]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setQuery((current) => (current.search === searchText.trim() ? current : { ...current, search: searchText.trim(), page: 1 }));
        }, SEARCH_DEBOUNCE_MS);

        return () => window.clearTimeout(timer);
    }, [searchText]);

    const setFilter = useCallback((name: FilterName, value: string) => {
        setQuery((current) => ({ ...current, [name]: value, page: 1 }));
    }, []);

    const goToPage = useCallback((page: number) => setQuery((current) => ({ ...current, page })), []);

    const exportMembers = useCallback(async () => {
        setIsExporting(true);
        setExportError(null);

        try {
            const response = await getMembersExport({
                search: query.search,
                status: query.status,
                provinceCode: query.provinceCode,
                preference: query.preference,
                attendance: query.attendance,
            });
            const url = URL.createObjectURL(response.data);
            const link = document.createElement('a');

            link.href = url;
            link.download = 'member-bbb-bff.csv';
            link.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            setExportError(errorMessage(error));
        } finally {
            setIsExporting(false);
        }
    }, [query]);

    const value = useMemo<PageContextValue>(() => {
        const meta = list?.meta;
        const rangeStart = meta && meta.total > 0 ? (meta.currentPage - 1) * meta.perPage + 1 : 0;
        const rangeEnd = meta ? Math.min(meta.total, meta.currentPage * meta.perPage) : 0;

        return {
            query,
            searchText,
            options,
            list,
            failure,
            isLoading,
            isExporting,
            exportError,
            rangeStart,
            rangeEnd,
            setSearchText: setSearchTextState,
            setFilter,
            goToPage,
            reload: () => setReloadToken((token) => token + 1),
            exportMembers,
        };
    }, [query, searchText, options, list, failure, isLoading, isExporting, exportError, setFilter, goToPage, exportMembers]);

    return <PageContext.Provider value={value}>{children}</PageContext.Provider>;
};

export const usePageContext = (): PageContextValue => {
    const context = useContext(PageContext);

    if (!context) throw new Error('usePageContext harus digunakan di dalam PageContextProvider.');

    return context;
};
