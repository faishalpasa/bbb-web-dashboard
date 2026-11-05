export type PaginationEntry = number | 'start-ellipsis' | 'end-ellipsis';
export const TABLE_PAGE_SIZES = [10, 20, 25, 50, 100] as const;

export const paginateItems = <T>(items: readonly T[], currentPage: number, perPage = 25) => {
    const lastPage = Math.max(1, Math.ceil(items.length / perPage));
    const page = Math.max(1, Math.min(currentPage, lastPage));
    return { items: items.slice((page - 1) * perPage, page * perPage), page, lastPage };
};

export const paginationEntries = (currentPage: number, lastPage: number, compact = false): PaginationEntry[] => {
    const last = Math.max(1, Math.floor(lastPage));
    const current = Math.min(last, Math.max(1, Math.floor(currentPage)));
    if (compact && last > 5) {
        if (current <= 2) return [1, 2, 'end-ellipsis', last];
        if (current >= last - 1) return [1, 'start-ellipsis', last - 1, last];
        return [1, 'start-ellipsis', current, 'end-ellipsis', last];
    }
    if (last <= 7) return Array.from({ length: last }, (_, index) => index + 1);
    let start = Math.max(2, current - 1);
    let end = Math.min(last - 1, current + 1);
    if (current <= 3) {
        start = 2;
        end = 4;
    }
    if (current >= last - 2) {
        start = last - 3;
        end = last - 1;
    }
    const entries: PaginationEntry[] = [1];
    if (start > 2) entries.push('start-ellipsis');
    for (let page = start; page <= end; page++) entries.push(page);
    if (end < last - 1) entries.push('end-ellipsis');
    entries.push(last);
    return entries;
};
