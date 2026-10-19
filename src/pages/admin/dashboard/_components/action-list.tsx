import { useAppContext } from '@/app-context';
import { canVisitSection } from '@/utils/permission';
import { Link } from '@tanstack/react-router';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { usePageContext } from '../_context';
import { Panel } from './panel';

export const ActionList = () => {
    const { actionRows } = usePageContext();
    const { session } = useAppContext();

    return (
        <Panel title="Perlu Tindakan" data-test-id="dashboard_panel_actions">
            {actionRows.length === 0 ? (
                <p className="text-muted-foreground px-4 py-6 text-sm" data-test-id="dashboard_text_actions_empty">
                    Tidak ada yang perlu ditindaklanjuti saat ini.
                </p>
            ) : (
                <ul>
                    {actionRows.map((row) => (
                        <li key={row.key} className="border-border flex items-center gap-3 border-b px-4 py-3 last:border-b-0">
                            <span
                                className={cn(
                                    'flex size-8 shrink-0 items-center justify-center rounded-md text-sm font-semibold',
                                    row.isUrgent ? 'bg-[#fbe5d6] text-[#8a3b12]' : 'bg-secondary',
                                )}
                            >
                                {row.count}
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium">{row.title}</p>
                                <p className="text-muted-foreground text-sm">{row.hint}</p>
                            </div>
                            {canVisitSection(session, row.to) && (
                                <Button asChild variant="outline" size="sm" className="shrink-0">
                                    <Link to={row.to} data-test-id={`dashboard_link_action_${row.key}`}>
                                        {row.buttonLabel}
                                    </Link>
                                </Button>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </Panel>
    );
};
