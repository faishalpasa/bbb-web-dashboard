import type { MemberDashboardStatus } from '@/types/dashboard';
import { formatNumber } from '@/utils/number';

import { usePageContext } from '../_context';
import { Panel } from './panel';

const STATUS_COLORS: Record<MemberDashboardStatus, string> = {
    active: 'bg-[#002a32]',
    migrated: 'bg-[#b7b38f]',
    exit_requested: 'bg-[#a45f37]',
    unsubscribed: 'bg-[#dcdad2]',
};

export const MemberStatusCard = () => {
    const { dashboard } = usePageContext();
    const statuses = dashboard?.memberStatuses ?? [];
    const total = dashboard?.stats.members.total ?? 0;

    return (
        <Panel title="Status Keanggotaan" description="Komposisi seluruh member saat ini" data-test-id="dashboard_panel_member_status">
            <ul className="space-y-4 p-4">
                {statuses.map(({ status, label, count }) => (
                    <li key={status} data-test-id={`dashboard_bar_status_${status}`}>
                        <div className="mb-1 flex justify-between gap-3 text-sm">
                            <span>{label}</span>
                            <span className="font-mono">{formatNumber(count)}</span>
                        </div>
                        <div
                            className="bg-secondary h-3 overflow-hidden rounded-sm"
                            role="progressbar"
                            aria-label={`${label}: ${formatNumber(count)} dari ${formatNumber(total)} member`}
                            aria-valuemin={0}
                            aria-valuemax={total}
                            aria-valuenow={count}
                        >
                            <div className={`h-full ${STATUS_COLORS[status]}`} style={{ width: `${total > 0 ? (count / total) * 100 : 0}%` }} />
                        </div>
                    </li>
                ))}
            </ul>
        </Panel>
    );
};
