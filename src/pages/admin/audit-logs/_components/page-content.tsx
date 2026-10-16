import { AlertMessage } from '@/components/molecules/alert-message';
import { StatusBadge } from '@/components/molecules/status-badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AUDIT_ALL_TAB, AUDIT_LOG_TONES } from '@/constants/superadmin';
import { cn } from '@/lib/utils';
import { formatLogTime } from '@/utils/date';

import { usePageContext } from '../_context';

export const PageContent = () => {
    const { query, list, failure, isLoading, setType, goToPage, reload } = usePageContext();
    const items = list?.items ?? [];
    const meta = list?.meta;
    const tabs = [AUDIT_ALL_TAB, ...(list?.types ?? [])];

    return (
        <div className="space-y-4">
            <header>
                <h1 className="text-2xl font-semibold">Log</h1>
                <p className="text-muted-foreground text-sm">Riwayat ekspor data, perubahan pengaturan, dan kelola admin. Hanya superadmin.</p>
            </header>

            <section className="border-border bg-card overflow-hidden rounded-lg border" data-test-id="audit_logs_root" aria-busy={isLoading}>
                <div className="flex gap-1 overflow-x-auto p-3" role="tablist" aria-label="Jenis log" data-test-id="audit_logs_tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab.value || 'all'}
                            type="button"
                            role="tab"
                            aria-selected={query.type === tab.value}
                            onClick={() => setType(tab.value)}
                            className={cn(
                                'focus-visible:ring-ring min-h-9 shrink-0 rounded-md px-3 text-sm font-medium focus-visible:ring-2 focus-visible:outline-none',
                                query.type === tab.value ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary',
                            )}
                            data-test-id={`audit_logs_tab_${tab.value || 'all'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {failure ? (
                    <div className="space-y-3 p-4">
                        <AlertMessage data-test-id="audit_logs_alert_error">{failure.message}</AlertMessage>
                        <Button variant="outline" onClick={reload} data-test-id="audit_logs_button_retry">
                            Coba lagi
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="hidden md:block">
                            <table className="w-full text-sm">
                                <thead className="bg-secondary/60 text-left">
                                    <tr>
                                        <th className="py-3 pr-3 pl-4 font-semibold">Waktu</th>
                                        <th className="px-3 py-3 font-semibold">Pelaku</th>
                                        <th className="px-3 py-3 font-semibold">Tindakan</th>
                                        <th className="py-3 pr-4 pl-3 font-semibold">Rincian</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading && items.length === 0
                                        ? [0, 1, 2, 3, 4].map((index) => (
                                              <tr key={index} className="border-border border-t">
                                                  <td colSpan={4} className="px-4 py-3">
                                                      <Skeleton className="h-5 w-full" />
                                                  </td>
                                              </tr>
                                          ))
                                        : items.map((entry) => (
                                              <tr key={entry.id} className="border-border border-t" data-test-id={`audit_logs_row_${entry.id}`}>
                                                  <td className="py-3 pr-3 pl-4 whitespace-nowrap">{formatLogTime(entry.at)}</td>
                                                  <td className="px-3 py-3 font-semibold">{entry.actor}</td>
                                                  <td className="px-3 py-3">
                                                      <StatusBadge
                                                          tone={AUDIT_LOG_TONES[entry.type.value]}
                                                          label={entry.type.label}
                                                          data-test-id={`audit_logs_badge_type_${entry.id}`}
                                                      />
                                                  </td>
                                                  <td className="py-3 pr-4 pl-3">{entry.detail}</td>
                                              </tr>
                                          ))}
                                </tbody>
                            </table>
                        </div>

                        <ul className="md:hidden" data-test-id="audit_logs_cards">
                            {items.map((entry) => (
                                <li key={entry.id} className="border-border space-y-1 border-t p-4" data-test-id={`audit_logs_card_${entry.id}`}>
                                    <div className="flex items-start justify-between gap-3">
                                        <p className="text-sm font-semibold">{entry.actor}</p>
                                        <StatusBadge
                                            tone={AUDIT_LOG_TONES[entry.type.value]}
                                            label={entry.type.label}
                                            data-test-id={`audit_logs_card_badge_type_${entry.id}`}
                                        />
                                    </div>
                                    <p className="text-sm">{entry.detail}</p>
                                    <p className="text-muted-foreground text-xs">{formatLogTime(entry.at)}</p>
                                </li>
                            ))}
                        </ul>

                        {!isLoading && items.length === 0 && (
                            <p
                                className="text-muted-foreground border-border border-t px-4 py-8 text-center text-sm"
                                data-test-id="audit_logs_text_empty"
                            >
                                Belum ada catatan di tab ini.
                            </p>
                        )}

                        <footer className="border-border flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm">
                            <p data-test-id="audit_logs_text_note">Log hanya bisa dibaca dan tidak bisa diubah.</p>
                            {meta && meta.lastPage > 1 && (
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={isLoading || query.page <= 1}
                                        onClick={() => goToPage(query.page - 1)}
                                        data-test-id="audit_logs_button_previous"
                                    >
                                        Sebelumnya
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={isLoading || query.page >= meta.lastPage}
                                        onClick={() => goToPage(query.page + 1)}
                                        data-test-id="audit_logs_button_next"
                                    >
                                        Berikutnya
                                    </Button>
                                </div>
                            )}
                        </footer>
                    </>
                )}
            </section>
        </div>
    );
};
