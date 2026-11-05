import { Link } from '@tanstack/react-router';

import { EventPerformanceBar } from '@/components/molecules/event-performance-bar';
import { PermissionGate } from '@/components/molecules/permission-gate';
import { PERMISSIONS as P } from '@/constants/permission';
import { ROUTES } from '@/constants/route';
import { formatShortDate } from '@/utils/date';

import { usePageContext } from '../_context';
import { Panel } from './panel';

export const EventPerformanceCard = () => {
    const { dashboard } = usePageContext();
    const events = dashboard?.eventPerformance ?? [];

    return (
        <Panel
            title="Performa Kegiatan"
            description="6 kegiatan selesai terakhir. Persentase hadir = hadir ÷ terdaftar (di luar pembatalan)."
            data-test-id="dashboard_panel_event_performance"
        >
            {events.length === 0 ? (
                <p className="text-muted-foreground px-4 py-6 text-sm" data-test-id="dashboard_text_event_performance_empty">
                    Belum ada kegiatan yang selesai.
                </p>
            ) : (
                <ul className="grid gap-4 p-4 lg:grid-cols-2">
                    {events.map((event) => (
                        <li
                            key={event.eventId}
                            className="border-border min-w-0 space-y-4 rounded-lg border p-4"
                            data-test-id={`dashboard_bar_event_${event.eventId}`}
                        >
                            <div className="min-w-0">
                                <p className="truncate font-medium" title={event.eventTitle}>
                                    {event.eventTitle}
                                </p>
                                <p className="text-muted-foreground text-xs">{formatShortDate(event.startsAt)}</p>
                            </div>
                            <EventPerformanceBar
                                title={event.eventTitle}
                                registered={event.registered}
                                attended={event.attended}
                                data-test-id={`dashboard_bar_event_${event.eventId}_performance`}
                            />
                            <div className="text-muted-foreground flex items-center justify-end gap-2 text-xs">
                                <PermissionGate permission={P.EVENT_PARTICIPANT_VIEW}>
                                    <Link
                                        to={ROUTES.eventDetail}
                                        params={{ eventId: event.eventId }}
                                        className="shrink-0 underline underline-offset-2"
                                        data-test-id={`dashboard_link_event_${event.eventId}`}
                                    >
                                        Lihat peserta
                                    </Link>
                                </PermissionGate>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </Panel>
    );
};
