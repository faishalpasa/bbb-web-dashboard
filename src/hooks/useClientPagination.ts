import { useState } from 'react';

import { paginateItems, TABLE_PAGE_SIZES } from '@/utils/pagination';

export interface ClientPagination<T> {
    items: T[];
    page: number;
    lastPage: number;
    perPage: number;
    goToPage: (page: number) => void;
    setPerPage: (perPage: number) => void;
}

/** Only for endpoints returning their entire collection. Server-paginated lists keep their existing API queries. */
export const useClientPagination = <T>(items: readonly T[], scope = ''): ClientPagination<T> => {
    const [selection, setSelection] = useState({ scope, page: 1 });
    const [perPage, setPageSize] = useState(25);
    const pagination = paginateItems(items, selection.scope === scope ? selection.page : 1, perPage);
    return {
        ...pagination,
        perPage,
        goToPage: (next: number) => setSelection({ scope, page: Math.max(1, Math.min(pagination.lastPage, next)) }),
        setPerPage: (next: number) => {
            if (!TABLE_PAGE_SIZES.some((size) => size === next)) return;
            setPageSize(next);
            setSelection({ scope, page: 1 });
        },
    };
};
