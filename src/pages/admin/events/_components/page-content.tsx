import { Link } from '@tanstack/react-router';

import { AlertMessage } from '@/components/molecules/alert-message';
import { Button } from '@/components/ui/button';
import { EVENT_TABS } from '@/constants/event';
import { PERMISSIONS as P } from '@/constants/permission';
import { ROUTES } from '@/constants/route';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';

import { usePageContext } from '../_context';
import { EventTable } from './event-table';

export const PageContent = () => {
    const { can } = usePermissions();
    const { query, list, failure, setStatus, reload } = usePageContext();
    const canManageEvents = can(P.EVENT_CREATE);

    return (
        <div className="space-y-4">
            <header className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold">Kegiatan</h1>
                    {list && (
                        <p className="text-muted-foreground text-sm" data-test-id="events_text_summary">
                            {list.summary.upcomingTotal} kegiatan mendatang
                        </p>
                    )}
                </div>
                {canManageEvents && (
                    <Button asChild>
                        <Link to={ROUTES.eventNew} data-test-id="events_link_create">
                            Kegiatan Baru
                        </Link>
                    </Button>
                )}
            </header>

            <section className="border-border bg-card overflow-hidden rounded-lg border">
                <div className="flex gap-1 overflow-x-auto p-3" role="tablist" aria-label="Status kegiatan" data-test-id="events_tabs">
                    {EVENT_TABS.map((tab) => (
                        <button
                            key={tab.value || 'all'}
                            type="button"
                            role="tab"
                            aria-selected={query.status === tab.value}
                            onClick={() => setStatus(tab.value)}
                            className={cn(
                                'focus-visible:ring-ring min-h-9 shrink-0 rounded-md px-3 text-sm font-medium focus-visible:ring-2 focus-visible:outline-none',
                                query.status === tab.value ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary',
                            )}
                            data-test-id={`events_tab_${tab.value || 'all'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {failure ? (
                    <div className="space-y-3 p-4">
                        <AlertMessage data-test-id="events_alert_error">{failure.message}</AlertMessage>
                        <Button variant="outline" onClick={reload} data-test-id="events_button_retry">
                            Coba lagi
                        </Button>
                    </div>
                ) : (
                    <EventTable />
                )}
            </section>
        </div>
    );
};
