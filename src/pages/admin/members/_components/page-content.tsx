import { Link } from '@tanstack/react-router';
import { Download } from 'lucide-react';

import { FeedbackToast } from '@/components/molecules/feedback-toast';
import { Button } from '@/components/ui/button';
import { PERMISSIONS as P } from '@/constants/permission';
import { ROUTES } from '@/constants/route';
import { usePermissions } from '@/hooks/usePermissions';
import { formatNumber } from '@/utils/number';

import { usePageContext } from '../_context';
import { MemberFilters } from './member-filters';
import { MemberTable } from './member-table';

export const PageContent = () => {
    const { can } = usePermissions();
    const { list, failure, isExporting, exportError, exportMembers, reload } = usePageContext();
    const canManageMembers = can(P.MEMBER_CREATE);

    return (
        <div className="space-y-4">
            <header className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold">Member</h1>
                    {list && (
                        <p className="text-muted-foreground text-sm" data-test-id="members_text_summary">
                            {formatNumber(list.summary.activeTotal)} member aktif dari {formatNumber(list.summary.total)} data
                        </p>
                    )}
                </div>
                <div className="flex w-full min-w-0 flex-wrap gap-2 sm:w-auto">
                    {canManageMembers && (
                        <Button asChild>
                            <Link to={ROUTES.memberNew} data-test-id="members_link_create">
                                Tambah Member
                            </Link>
                        </Button>
                    )}
                    {can(P.MEMBER_EXPORT) && (
                        <Button variant="outline" onClick={() => void exportMembers()} disabled={isExporting} data-test-id="members_button_export">
                            <Download aria-hidden="true" />
                            {isExporting ? 'Menyiapkan…' : 'Expor'}
                        </Button>
                    )}
                </div>
            </header>

            {exportError && <FeedbackToast data-test-id="members_alert_export_error">{exportError}</FeedbackToast>}

            <MemberFilters />

            {failure ? (
                <div className="max-w-xl space-y-3">
                    <FeedbackToast data-test-id="members_alert_error">{failure.message}</FeedbackToast>
                    <Button variant="outline" onClick={reload} data-test-id="members_button_retry">
                        Coba lagi
                    </Button>
                </div>
            ) : (
                <MemberTable />
            )}
        </div>
    );
};
