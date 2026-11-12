import { AdminPageHeader } from '@/components/layout/admin-page-header';
import { Link } from '@tanstack/react-router';

import { FeedbackToast } from '@/components/molecules/feedback-toast';
import { StatusBadge } from '@/components/molecules/status-badge';
import { TablePagination } from '@/components/molecules/table-pagination';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/route';
import type { ExitRequest } from '@/types/exit-request';
import { formatLongDate } from '@/utils/date';

import { usePageContext } from '../_context';

const decisionLabel = (request: ExitRequest): string => (request.status.value === 'approved' ? 'Disetujui oleh' : 'Ditolak oleh');

export const PageContent = () => {
    const { requests, pagination, failure, isLoading, reload } = usePageContext();

    return (
        <div className="space-y-4">
            <AdminPageHeader data-test-id="exit_history_header">
                <header className="space-y-2">
                    <nav aria-label="Breadcrumb" className="text-sm">
                        <Link to={ROUTES.exitRequests} className="underline underline-offset-4" data-test-id="exit_history_link_breadcrumb">
                            Permintaan Keluar
                        </Link>
                        <span className="text-muted-foreground"> / Riwayat</span>
                    </nav>
                    <h1 className="text-2xl font-semibold">Riwayat Permintaan Keluar</h1>
                    <p className="text-muted-foreground text-sm">Permintaan yang sudah diputuskan, dari keputusan terbaru.</p>
                </header>
            </AdminPageHeader>

            {failure ? (
                <div className="max-w-xl space-y-3">
                    <FeedbackToast data-test-id="exit_history_alert_error">{failure.message}</FeedbackToast>
                    <Button variant="outline" onClick={reload} data-test-id="exit_history_button_retry">
                        Coba lagi
                    </Button>
                </div>
            ) : (
                <section className="border-border bg-card overflow-hidden rounded-lg border" aria-busy={isLoading} data-test-id="exit_history_list">
                    {isLoading && requests.length === 0 && (
                        <div className="space-y-2 p-4">
                            {[0, 1, 2].map((index) => (
                                <Skeleton key={index} className="h-6 w-full" />
                            ))}
                        </div>
                    )}

                    {!isLoading && requests.length === 0 && (
                        <p className="text-muted-foreground p-6 text-center text-sm" data-test-id="exit_history_text_empty">
                            Belum ada permintaan keluar yang diputuskan.
                        </p>
                    )}

                    {requests.length > 0 && (
                        <>
                            <div className="hidden md:block">
                                <table className="w-full text-sm">
                                    <thead className="bg-secondary/60 text-left">
                                        <tr>
                                            <th className="py-3 pr-3 pl-4 font-semibold">Member</th>
                                            <th className="px-3 py-3 font-semibold">Tanggal permintaan keluar</th>
                                            <th className="px-3 py-3 font-semibold">Keputusan</th>
                                            <th className="py-3 pr-4 pl-3 font-semibold">Diputuskan oleh</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pagination.items.map((request) => (
                                            <tr key={request.id} className="border-border border-t" data-test-id={`exit_history_row_${request.id}`}>
                                                <td className="py-3 pr-3 pl-4">
                                                    <span className="font-medium">{request.member.name}</span>
                                                    {request.member.memberNumber && (
                                                        <span className="ml-2 font-mono text-xs">{request.member.memberNumber}</span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-3">{formatLongDate(request.submittedAt)}</td>
                                                <td className="px-3 py-3">
                                                    <StatusBadge
                                                        tone={request.status.value === 'approved' ? 'success' : 'danger'}
                                                        label={request.status.label}
                                                        data-test-id={`exit_history_badge_status_${request.id}`}
                                                    />
                                                </td>
                                                <td className="py-3 pr-4 pl-3">
                                                    {request.decidedBy ?? <span className="text-muted-foreground">-</span>}
                                                    {request.decidedAt && (
                                                        <span className="text-muted-foreground block text-xs">
                                                            {formatLongDate(request.decidedAt)}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <ul className="md:hidden" data-test-id="exit_history_cards">
                                {pagination.items.map((request) => (
                                    <li
                                        key={request.id}
                                        className="border-border space-y-1 border-t p-4 first:border-t-0"
                                        data-test-id={`exit_history_card_${request.id}`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <p className="font-semibold">{request.member.name}</p>
                                            <StatusBadge
                                                tone={request.status.value === 'approved' ? 'success' : 'danger'}
                                                label={request.status.label}
                                                data-test-id={`exit_history_card_badge_status_${request.id}`}
                                            />
                                        </div>
                                        {request.member.memberNumber && <p className="font-mono text-xs">{request.member.memberNumber}</p>}
                                        <p className="text-muted-foreground text-sm">Meminta keluar {formatLongDate(request.submittedAt)}</p>
                                        <p className="text-sm">
                                            {decisionLabel(request)} {request.decidedBy ?? '-'}
                                            {request.decidedAt && (
                                                <span className="text-muted-foreground"> · {formatLongDate(request.decidedAt)}</span>
                                            )}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}

                    <footer className="border-t px-4 py-3 text-sm">
                        <TablePagination
                            total={requests.length}
                            perPage={pagination.perPage}
                            onPerPageChange={pagination.setPerPage}
                            currentPage={pagination.page}
                            lastPage={pagination.lastPage}
                            isLoading={isLoading}
                            onPageChange={pagination.goToPage}
                            data-test-id="exit_history_pagination"
                        />
                    </footer>
                </section>
            )}
        </div>
    );
};
