import { Link } from '@tanstack/react-router';

import { PermissionGate } from '@/components/molecules/permission-gate';
import { PERMISSIONS as P } from '@/constants/permission';
import { ROUTES } from '@/constants/route';
import { formatShortDate } from '@/utils/date';
import { formatNumber } from '@/utils/number';

import { usePageContext } from '../_context';
import { Panel } from './panel';

export const EventPerformanceCard = () => {
    const { dashboard } = usePageContext();
    const events = dashboard?.eventPerformance ?? [];
    const maximum = Math.max(1, ...events.map(({ registered }) => registered));

    return (
        <Panel
            title="Performa Kegiatan"
            description="Pendaftar dan peserta hadir pada 6 kegiatan selesai terakhir"
            data-test-id="dashboard_panel_event_performance"
        >
            {events.length === 0 ? (
                <p className="text-muted-foreground px-4 py-6 text-sm" data-test-id="dashboard_text_event_performance_empty">
                    Belum ada kegiatan yang selesai.
                </p>
            ) : (
                <div className="space-y-5 p-4">
                    <div className="text-muted-foreground flex gap-4 text-xs" aria-hidden="true">
                        <span>
                            <span className="bg-secondary mr-1 inline-block size-2.5 rounded-sm align-middle" />
                            Terdaftar
                        </span>
                        <span>
                            <span className="bg-foreground mr-1 inline-block size-2.5 rounded-sm align-middle" />
                            Hadir
                        </span>
                    </div>
                    <ul className="grid gap-x-6 gap-y-5 lg:grid-cols-2">
                        {events.map((event) => (
                            <li key={event.eventId} className="min-w-0" data-test-id={`dashboard_bar_event_${event.eventId}`}>
                                <div className="flex items-start justify-between gap-3 text-sm">
                                    <div className="min-w-0">
                                        <p className="truncate font-medium" title={event.eventTitle}>
                                            {event.eventTitle}
                                        </p>
                                        <p className="text-muted-foreground text-xs">{formatShortDate(event.startsAt)}</p>
                                    </div>
                                    <span className="shrink-0 font-mono">{event.percent}%</span>
                                </div>
                                <div
                                    className="mt-2 space-y-1"
                                    role="img"
                                    aria-label={`${event.eventTitle}: ${formatNumber(event.registered)} terdaftar, ${formatNumber(event.attended)} hadir`}
                                >
                                    <div className="bg-secondary h-2.5 rounded-sm" style={{ width: `${(event.registered / maximum) * 100}%` }} />
                                    <div className="bg-foreground h-2.5 rounded-sm" style={{ width: `${(event.attended / maximum) * 100}%` }} />
                                </div>
                                <div className="text-muted-foreground mt-1 flex items-center justify-between gap-2 text-xs">
                                    <span>
                                        {formatNumber(event.registered)} terdaftar · {formatNumber(event.attended)} hadir
                                    </span>
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
                </div>
            )}
        </Panel>
    );
};
