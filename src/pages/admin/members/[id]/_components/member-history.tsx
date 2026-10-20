import { StatusBadge } from '@/components/molecules/status-badge';
import { TablePagination } from '@/components/molecules/table-pagination';
import { MEMBER_HISTORY_TONES } from '@/constants/member';
import { formatHistoryDate } from '@/utils/date';

import { usePageContext } from '../_context';

export const MemberHistory = () => {
    const { member, historyPagination, isLoading } = usePageContext();

    if (!member) return null;

    return (
        <section className="border-border bg-card overflow-hidden rounded-lg border" data-test-id="member_detail_history">
            <h2 className="px-5 py-3 font-semibold">Riwayat kegiatan</h2>
            {member.history.length === 0 ? (
                <p className="text-muted-foreground border-border border-t px-5 py-6 text-sm" data-test-id="member_detail_history_empty">
                    Belum ikut kegiatan apa pun.
                </p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[420px] text-sm">
                        <thead className="bg-secondary/60 text-left">
                            <tr>
                                <th className="px-5 py-2.5 font-semibold">Kegiatan</th>
                                <th className="px-3 py-2.5 font-semibold">Tanggal</th>
                                <th className="py-2.5 pr-5 pl-3 font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historyPagination.items.map((item) => (
                                <tr key={item.eventId} className="border-border border-t" data-test-id={`member_detail_history_row_${item.eventId}`}>
                                    <td className="px-5 py-3">{item.title}</td>
                                    <td className="px-3 py-3">{formatHistoryDate(item.startsAt)}</td>
                                    <td className="py-3 pr-5 pl-3">
                                        <StatusBadge
                                            tone={MEMBER_HISTORY_TONES[item.status.value]}
                                            label={item.status.label}
                                            data-test-id={`member_detail_history_badge_${item.eventId}`}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <footer className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3 text-sm">
                <span className="sr-only">{member.history.length} kegiatan</span>
                <TablePagination
                    total={member.history.length}
                    perPage={historyPagination.perPage}
                    onPerPageChange={historyPagination.setPerPage}
                    currentPage={historyPagination.page}
                    lastPage={historyPagination.lastPage}
                    isLoading={isLoading}
                    onPageChange={historyPagination.goToPage}
                    data-test-id="member_history_pagination"
                />
            </footer>
        </section>
    );
};
