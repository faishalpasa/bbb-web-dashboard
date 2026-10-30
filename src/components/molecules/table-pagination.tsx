import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

import { NativeSelect } from '@/components/ui/native-select';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink } from '@/components/ui/pagination';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { paginationEntries, TABLE_PAGE_SIZES } from '@/utils/pagination';

interface TablePaginationProps {
    currentPage: number;
    lastPage: number;
    total: number;
    perPage: number;
    pageSizes?: readonly number[];
    isLoading?: boolean;
    onPageChange: (page: number) => void;
    onPerPageChange: (perPage: number) => void;
    'data-test-id': string;
    'aria-label'?: string;
}

export const TablePagination = ({
    currentPage,
    lastPage,
    total,
    perPage,
    pageSizes = TABLE_PAGE_SIZES,
    isLoading = false,
    onPageChange,
    onPerPageChange,
    'data-test-id': testId,
    'aria-label': label = 'Halaman tabel',
}: TablePaginationProps) => {
    const { isDesktop } = useMediaQuery();
    const arrow = (page: number, name: string, icon: ReactNode, suffix: string) => (
        <PaginationItem>
            <PaginationLink asChild>
                <button
                    type="button"
                    aria-label={name}
                    disabled={isLoading || page < 1 || page > lastPage || page === currentPage}
                    onClick={() => onPageChange(page)}
                    data-test-id={`${testId}_${suffix}`}
                >
                    {icon}
                </button>
            </PaginationLink>
        </PaginationItem>
    );
    return (
        <div className="flex w-full flex-wrap items-center justify-between gap-x-6 gap-y-3" data-test-id={`${testId}_footer`}>
            <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                <label htmlFor={`${testId}-size`}>Tampilkan</label>
                <NativeSelect
                    id={`${testId}-size`}
                    value={perPage}
                    disabled={isLoading}
                    aria-label="Jumlah baris per halaman"
                    className="h-11 w-20 text-xs"
                    onChange={(event) => onPerPageChange(Number(event.target.value))}
                    data-test-id={`${testId}_page_size`}
                >
                    {pageSizes.map((size) => (
                        <option key={size} value={size}>
                            {size}
                        </option>
                    ))}
                </NativeSelect>
                <span data-test-id={`${testId}_total`}>dari {total.toLocaleString('id-ID')} total data.</span>
            </div>
            <Pagination className="ml-auto" aria-label={label} data-test-id={testId}>
                <PaginationContent>
                    {arrow(currentPage - 1, 'Halaman sebelumnya', <ChevronLeft aria-hidden="true" className="size-4" />, 'previous')}
                    {paginationEntries(currentPage, lastPage, !isDesktop).map((entry) => (
                        <PaginationItem key={entry}>
                            {typeof entry === 'number' ? (
                                <PaginationLink asChild isActive={entry === currentPage}>
                                    <button
                                        type="button"
                                        aria-label={`Halaman ${entry}`}
                                        disabled={isLoading || entry === currentPage}
                                        onClick={() => onPageChange(entry)}
                                        data-test-id={`${testId}_page_${entry}`}
                                    >
                                        {entry}
                                    </button>
                                </PaginationLink>
                            ) : (
                                <PaginationEllipsis data-test-id={`${testId}_${entry}`} />
                            )}
                        </PaginationItem>
                    ))}
                    {arrow(currentPage + 1, 'Halaman berikutnya', <ChevronRight aria-hidden="true" className="size-4" />, 'next')}
                </PaginationContent>
            </Pagination>
        </div>
    );
};
