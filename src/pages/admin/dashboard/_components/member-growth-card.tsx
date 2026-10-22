import { formatNumber } from '@/utils/number';

import { usePageContext } from '../_context';
import { Panel } from './panel';

const monthLabel = (month: string): string =>
    new Intl.DateTimeFormat('id-ID', { month: 'short', timeZone: 'UTC' }).format(new Date(`${month}-01T00:00:00Z`));

export const MemberGrowthCard = () => {
    const { dashboard } = usePageContext();
    const months = dashboard?.memberGrowth ?? [];
    const maximum = Math.max(1, ...months.map(({ newMembers }) => newMembers));

    return (
        <Panel title="Pertumbuhan Member" description="Member baru per bulan, 6 bulan terakhir" data-test-id="dashboard_panel_member_growth">
            <div className="p-4">
                <div className="border-border grid h-44 grid-cols-6 items-end gap-2 border-b">
                    {months.map(({ month, newMembers }) => (
                        <div
                            key={month}
                            className="flex h-full min-w-0 flex-col justify-end gap-1 text-center"
                            role="img"
                            aria-label={`${formatNumber(newMembers)} member baru pada ${month}`}
                            data-test-id={`dashboard_bar_growth_${month}`}
                        >
                            <span className="font-mono text-xs" aria-hidden="true">
                                {formatNumber(newMembers)}
                            </span>
                            <div className="flex h-32 items-end">
                                <div
                                    className="bg-foreground w-full rounded-t-sm"
                                    style={{ height: newMembers > 0 ? `${Math.max(4, (newMembers / maximum) * 100)}%` : '0%' }}
                                    aria-hidden="true"
                                />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="text-muted-foreground grid grid-cols-6 gap-2 pt-2 text-center text-xs" aria-hidden="true">
                    {months.map(({ month }) => (
                        <span key={month}>{monthLabel(month)}</span>
                    ))}
                </div>
            </div>
        </Panel>
    );
};
