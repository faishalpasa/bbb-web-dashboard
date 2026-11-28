import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { toast } from '@/components/ui/toast';
import { deleteEvent, getEventOptions, getEvents, getEventsExport } from '@/services/event';
import type { LoadFailure } from '@/types/api';
import type { EventList, EventListItem, EventListQuery, EventOptions, EventSortBy, EventSortDirection } from '@/types/event';
import { errorMessage, toLoadFailure } from '@/utils/error';

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

/** The filters set in the filter dialog; they are applied together. */
export type EventFilterValues = Pick<EventListQuery, FilterName>;

interface PageContextValue {
    query: EventListQuery;
    searchText: string;
    options: EventOptions | null;
    hasActiveFilter: boolean;
    list: EventList | null;
    failure: LoadFailure | null;
    isLoading: boolean;
    isExporting: boolean;
    exportError: string | null;
    draftToDelete: EventListItem | null;
    isDeleting: boolean;
    deleteError: string | null;
    openDeleteDraft: (event: EventListItem) => void;
    closeDeleteDraft: () => void;
    deleteDraft: () => Promise<void>;
    setSearchText: (value: string) => void;
    applyFilters: (values: EventFilterValues) => void;
    resetFilters: () => void;
    setSort: (sortBy: EventSortBy, direction?: EventSortDirection) => void;
    goToPage: (page: number) => void;
    setPerPage: (perPage: number) => void;
    reload: () => void;
    exportEvents: () => Promise<void>;
}

const PageContext = createContext<PageContextValue | null>(null);

export const PageContextProvider = ({ children }: PropsWithChildren) => {
    const [query, setQuery] = useState<EventListQuery>(INITIAL_QUERY);
    const [searchText, setSearchTextState] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);
    const [options, setOptions] = useState<EventOptions | null>(null);
    const [list, setList] = useState<EventList | null>(null);
    const [failure, setFailure] = useState<LoadFailure | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [reloadToken, setReloadToken] = useState(0);
    const [draftToDelete, setDraftToDelete] = useState<EventListItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
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

    const applyFilters = useCallback((values: EventFilterValues) => setQuery((current) => ({ ...current, ...values, page: 1 })), []);

    // Clears the dialog's filters and keeps the search text, the sort and the page size.
    const resetFilters = useCallback(() => setQuery((current) => ({ ...current, status: '', format: '', dateFrom: '', dateTo: '', page: 1 })), []);

    // The first click on a header sorts ascending, the next one reverses it (as on the members page).
    const setSort = useCallback((sortBy: EventSortBy, direction?: EventSortDirection) => {
        setQuery((current) => ({
            ...current,
            sortBy,
            sortDirection: direction ?? (current.sortBy === sortBy && current.sortDirection === 'asc' ? 'desc' : 'asc'),
            page: 1,
        }));
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

    // Exports what the list currently shows: the same filters and sort, every page of it.
    const exportEvents = useCallback(async () => {
        setIsExporting(true);
        setExportError(null);

        try {
            const response = await getEventsExport(query);
            const url = URL.createObjectURL(response.data);
            const link = document.createElement('a');

            link.href = url;
            link.download = 'kegiatan-bbb-bff.csv';
            link.click();
            URL.revokeObjectURL(url);
            toast.add({ type: 'success', title: 'File expor kegiatan siap diunduh.' });
        } catch (error) {
            setExportError(errorMessage(error));
        } finally {
            setIsExporting(false);
        }
    }, [query]);

    const openDeleteDraft = useCallback((event: EventListItem) => {
        setDeleteError(null);
        setDraftToDelete(event);
    }, []);

    const closeDeleteDraft = useCallback(() => {
        setDraftToDelete(null);
        setDeleteError(null);
    }, []);

    const deleteDraft = useCallback(async () => {
        if (!draftToDelete || isDeleting) return;
        setIsDeleting(true);
        setDeleteError(null);
        try {
            await deleteEvent(draftToDelete.id);
            toast.add({ type: 'success', title: 'Draf kegiatan dihapus.' });
            setDraftToDelete(null);
            if (list?.items.length === 1 && query.page > 1) {
                setQuery((current) => ({ ...current, page: current.page - 1 }));
            } else {
                setReloadToken((token) => token + 1);
            }
        } catch (error) {
            setDeleteError(errorMessage(error));
        } finally {
            setIsDeleting(false);
        }
    }, [draftToDelete, isDeleting, list, query.page]);

    const value = useMemo<PageContextValue>(
        () => ({
            query,
            searchText,
            options,
            hasActiveFilter: query.search !== '' || query.status !== '' || query.format !== '' || query.dateFrom !== '' || query.dateTo !== '',
            list,
            failure,
            isLoading,
            isExporting,
            exportError,
            draftToDelete,
            isDeleting,
            deleteError,
            openDeleteDraft,
            closeDeleteDraft,
            deleteDraft,
            setSearchText: setSearchTextState,
            applyFilters,
            resetFilters,
            setSort,
            goToPage: (page) => setQuery((current) => ({ ...current, page })),
            setPerPage: (perPage) => setQuery((current) => ({ ...current, perPage, page: 1 })),
            reload: () => setReloadToken((token) => token + 1),
            exportEvents,
        }),
        [
            query,
            searchText,
            options,
            list,
            failure,
            isLoading,
            isExporting,
            exportError,
            draftToDelete,
            isDeleting,
            deleteError,
            openDeleteDraft,
            closeDeleteDraft,
            deleteDraft,
            applyFilters,
            resetFilters,
            setSort,
            exportEvents,
        ],
    );

    return <PageContext.Provider value={value}>{children}</PageContext.Provider>;
};

export const usePageContext = (): PageContextValue => {
    const context = useContext(PageContext);

    if (!context) throw new Error('usePageContext harus digunakan di dalam PageContextProvider.');

    return context;
};
