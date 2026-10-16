import { Link } from '@tanstack/react-router';

import { ROUTES } from '@/constants/route';
import { formatShortDate } from '@/utils/date';

import { usePageContext } from '../_context';
import { Panel } from './panel';
import { ProgressBar } from './progress-bar';

export const AttendanceCard = () => {
    const { dashboard } = usePageContext();
    const attendance = dashboard?.latestAttendance;

    return (
        <Panel
            title="Kehadiran Kegiatan Terakhir"
            description={attendance ? `${attendance.eventTitle}, ${formatShortDate(attendance.startsAt)}` : undefined}
            data-test-id="dashboard_panel_attendance"
        >
            {attendance ? (
                <div className="space-y-3 p-4">
                    <p>
                        <span className="font-mono text-3xl font-semibold">{attendance.percent}%</span>{' '}
                        <span className="text-sm">hadir dari {attendance.registered} terdaftar</span>
                    </p>
                    <ProgressBar percent={attendance.percent} label="Persentase kehadiran kegiatan terakhir" />
                    <ul className="space-y-1.5 text-sm">
                        <li className="flex items-center gap-2">
                            <span className="bg-foreground size-3 rounded-[2px]" aria-hidden="true" />
                            <span className="flex-1">Hadir</span>
                            <span className="font-mono">{attendance.attended}</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="bg-secondary border-border size-3 rounded-[2px] border" aria-hidden="true" />
                            <span className="flex-1">Tidak hadir</span>
                            <span className="font-mono">{attendance.absent}</span>
                        </li>
                    </ul>
                    <p className="text-muted-foreground text-sm">
                        Rata-rata {attendance.averageEventCount} kegiatan terakhir: {attendance.averagePercent}% hadir.
                    </p>
                    <Link
                        to={ROUTES.eventDetail}
                        params={{ eventId: attendance.eventId }}
                        className="text-sm font-semibold underline underline-offset-4"
                        data-test-id="dashboard_link_attendance_participants"
                    >
                        Lihat peserta
                    </Link>
                </div>
            ) : (
                <p className="text-muted-foreground px-4 py-6 text-sm" data-test-id="dashboard_text_attendance_empty">
                    Belum ada kegiatan yang selesai.
                </p>
            )}
        </Panel>
    );
};
