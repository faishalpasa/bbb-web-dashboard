import { Link } from '@tanstack/react-router';

import { FeedbackToast } from '@/components/molecules/feedback-toast';
import { Button } from '@/components/ui/button';
import { PERMISSIONS as P } from '@/constants/permission';
import { ROUTES } from '@/constants/route';
import { usePermissions } from '@/hooks/usePermissions';

import { usePageContext } from '../_context';
import { EventFilters } from './event-filters';
import { EventTable } from './event-table';

export const PageContent = () => {
    const { can } = usePermissions();
    const { list, failure, reload } = usePageContext();
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

            <EventFilters />

            <section className="border-border bg-card overflow-hidden rounded-lg border">
                {failure ? (
                    <div className="space-y-3 p-4">
                        <FeedbackToast data-test-id="events_alert_error">{failure.message}</FeedbackToast>
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
