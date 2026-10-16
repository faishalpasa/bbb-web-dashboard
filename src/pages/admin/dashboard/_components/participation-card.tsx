import { cn } from '@/lib/utils';

import { usePageContext } from '../_context';
import { PREFERENCE_COLORS } from '../constants';
import { Panel } from './panel';

export const ParticipationCard = () => {
    const { dashboard } = usePageContext();
    const preferences = dashboard?.participationPreferences ?? [];

    return (
        <Panel title="Preferensi Partisipasi" description="Dari member berstatus aktif" data-test-id="dashboard_panel_participation">
            <div className="space-y-4 p-4">
                <div className="flex h-3 overflow-hidden rounded-sm" role="img" aria-label="Komposisi preferensi partisipasi">
                    {preferences.map((item) => (
                        // Segment width is the percentage itself, so it is the one inline style here.
                        <div key={item.value} className={PREFERENCE_COLORS[item.value]} style={{ width: `${item.percent}%` }} />
                    ))}
                </div>
                <ul className="space-y-2">
                    {preferences.map((item) => (
                        <li key={item.value} className="flex items-center gap-2 text-sm">
                            <span className={cn('size-3 rounded-[2px]', PREFERENCE_COLORS[item.value])} aria-hidden="true" />
                            <span className="flex-1">{item.label}</span>
                            <span className="font-mono">{item.percent}%</span>
                        </li>
                    ))}
                </ul>
            </div>
        </Panel>
    );
};
