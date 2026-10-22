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
                    {events.map((event) => {
                        const notAttended = event.registered - event.attended;
                        const hasRegistrations = event.registered > 0;
                        const attendedPercent = hasRegistrations ? Math.round((event.attended / event.registered) * 100) : 0;
                        const notAttendedPercent = hasRegistrations ? 100 - attendedPercent : 0;

                        return (
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
                                <div
                                    className="bg-secondary flex h-3 overflow-hidden rounded-full"
                                    role="img"
                                    aria-label={`${event.eventTitle}: ${formatNumber(event.registered)} terdaftar, ${formatNumber(event.attended)} hadir, ${formatNumber(notAttended)} tidak hadir`}
                                >
                                    <div className="bg-foreground h-full" style={{ width: `${attendedPercent}%` }} aria-hidden="true" />
                                    <div className="h-full bg-[#a45f37]" style={{ width: `${notAttendedPercent}%` }} aria-hidden="true" />
                                </div>
                                <dl className="grid grid-cols-3 gap-2">
                                    <div>
                                        <dt className="text-muted-foreground text-xs">Terdaftar</dt>
                                        <dd className="text-xl font-semibold">{formatNumber(event.registered)}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-muted-foreground text-xs">Hadir</dt>
                                        <dd className="text-foreground text-xl font-semibold">{attendedPercent}%</dd>
                                    </div>
                                    <div>
                                        <dt className="text-muted-foreground text-xs">Tidak hadir</dt>
                                        <dd className="text-xl font-semibold text-[#a45f37]">{notAttendedPercent}%</dd>
                                    </div>
                                </dl>
                                <div className="text-muted-foreground flex items-center justify-between gap-2 text-xs">
                                    <span>
                                        {formatNumber(event.attended)} hadir · {formatNumber(notAttended)} tidak hadir
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
                        );
                    })}
                </ul>
            )}
        </Panel>
    );
};
