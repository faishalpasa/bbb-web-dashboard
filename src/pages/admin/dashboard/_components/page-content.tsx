import { FeedbackToast } from '@/components/molecules/feedback-toast';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatLongDate } from '@/utils/date';

import { usePageContext } from '../_context';
import { ActionList } from './action-list';
import { EventPerformanceCard } from './event-performance-card';
import { MemberGrowthCard } from './member-growth-card';
import { MemberStatusCard } from './member-status-card';
import { StatCards } from './stat-cards';
import { UpcomingEvents } from './upcoming-events';

const DashboardSkeleton = () => (
    <div className="space-y-4" data-test-id="dashboard_loading" aria-busy="true">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[0, 1, 2, 3].map((index) => (
                <Skeleton key={index} className="h-28 rounded-lg" />
            ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Skeleton className="h-64 rounded-lg" />
            <Skeleton className="h-64 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Skeleton className="h-64 rounded-lg" />
            <Skeleton className="h-64 rounded-lg" />
            <Skeleton className="h-80 rounded-lg lg:col-span-2" />
        </div>
    </div>
);

export const PageContent = () => {
    const { dashboard, failure, isLoading, reload } = usePageContext();

    return (
        <div className="space-y-4">
            <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h1 className="text-2xl font-semibold">Dashboard</h1>
                {dashboard && (
                    <p className="text-muted-foreground text-sm" data-test-id="dashboard_text_as_of">
                        Data per {formatLongDate(dashboard.asOf)}
                    </p>
                )}
            </header>

            {isLoading && !dashboard && <DashboardSkeleton />}

            {failure && (
                <div className="max-w-xl space-y-3">
                    <FeedbackToast data-test-id="dashboard_alert_error">{failure.message}</FeedbackToast>
                    <Button variant="outline" onClick={reload} data-test-id="dashboard_button_retry">
                        Coba lagi
                    </Button>
                </div>
            )}

            {dashboard && (
                <>
                    <StatCards />
                    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
                        <ActionList />
                        <UpcomingEvents />
                    </div>
                    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
                        <MemberGrowthCard />
                        <MemberStatusCard />
                        <div className="lg:col-span-2">
                            <EventPerformanceCard />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
