import { Link } from '@tanstack/react-router';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/route';
import { formatEventSchedule } from '@/utils/date';

import { usePageContext } from '../_context';
import { Panel } from './panel';
import { ProgressBar } from './progress-bar';

export const UpcomingEvents = () => {
    const { dashboard } = usePageContext();
    const events = dashboard?.upcomingEvents ?? [];

    return (
        <Panel title="Kegiatan Mendatang" data-test-id="dashboard_panel_upcoming_events">
            {events.length === 0 ? (
                <p className="text-muted-foreground px-4 py-6 text-sm" data-test-id="dashboard_text_upcoming_events_empty">
                    Belum ada kegiatan mendatang.
                </p>
            ) : (
                <ul>
                    {events.map((event) => (
                        <li key={event.id} className="border-border flex items-center gap-4 border-b px-4 py-3 last:border-b-0">
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium">{event.title}</p>
                                <p className="text-muted-foreground text-sm">{formatEventSchedule(event.startsAt)}</p>
                                {event.quota === null ? (
                                    <p className="text-muted-foreground mt-2 font-mono text-xs">{event.registered} terdaftar, tanpa kuota</p>
                                ) : (
                                    <div className="mt-2 flex items-center gap-3">
                                        <ProgressBar
                                            className="flex-1"
                                            percent={event.quota > 0 ? (event.registered / event.quota) * 100 : 0}
                                            label={`Kuota ${event.title}`}
                                        />
                                        <span className="text-muted-foreground font-mono text-xs">
                                            {event.registered}/{event.quota}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <Button asChild variant="outline" size="sm" className="shrink-0">
                                <Link
                                    to={ROUTES.eventDetail}
                                    params={{ eventId: event.id }}
                                    data-test-id={`dashboard_link_event_participants_${event.id}`}
                                >
                                    Peserta
                                </Link>
                            </Button>
                        </li>
                    ))}
                </ul>
            )}
        </Panel>
    );
};
