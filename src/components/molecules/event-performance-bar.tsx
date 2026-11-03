import { formatNumber } from '@/utils/number';

interface EventPerformanceBarProps {
    title: string;
    registered: number;
    attended: number;
    'data-test-id': string;
}

// Teal for the people who came and the brand pink for those who did not, the same two colors everywhere a bar appears.
export const EventPerformanceBar = ({ title, registered, attended, 'data-test-id': testId }: EventPerformanceBarProps) => {
    const notAttended = Math.max(registered - attended, 0);
    const hasRegistrations = registered > 0;
    const attendedPercent = hasRegistrations ? Math.round((attended / registered) * 100) : 0;
    const notAttendedPercent = hasRegistrations ? 100 - attendedPercent : 0;

    return (
        <div className="space-y-3" data-test-id={testId}>
            <div
                className="bg-muted flex h-3 overflow-hidden rounded-full"
                role="img"
                aria-label={`${title}: ${formatNumber(registered)} terdaftar, ${formatNumber(attended)} hadir, ${formatNumber(notAttended)} tidak hadir`}
            >
                <div className="bg-teal h-full" style={{ width: `${attendedPercent}%` }} aria-hidden="true" />
                <div className="bg-primary h-full" style={{ width: `${notAttendedPercent}%` }} aria-hidden="true" />
            </div>
            <dl className="grid grid-cols-3 gap-2">
                <div>
                    <dt className="text-muted-foreground text-xs">Terdaftar</dt>
                    <dd className="text-xl font-semibold">{formatNumber(registered)}</dd>
                </div>
                <div>
                    <dt className="text-muted-foreground flex items-center gap-1.5 text-xs">
                        <span className="bg-teal size-2.5 rounded-full" aria-hidden="true" />
                        Hadir
                    </dt>
                    <dd className="text-xl font-semibold">{attendedPercent}%</dd>
                </div>
                <div>
                    <dt className="text-muted-foreground flex items-center gap-1.5 text-xs">
                        <span className="bg-primary border-border size-2.5 rounded-full border" aria-hidden="true" />
                        Tidak hadir
                    </dt>
                    <dd className="text-xl font-semibold">{notAttendedPercent}%</dd>
                </div>
            </dl>
            <p className="text-muted-foreground text-xs">
                {formatNumber(attended)} hadir · {formatNumber(notAttended)} tidak hadir
            </p>
        </div>
    );
};
