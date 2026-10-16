import { AlertMessage } from '@/components/molecules/alert-message';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatLongDate } from '@/utils/date';

import { usePageContext } from '../_context';
import { ActionList } from './action-list';
import { AttendanceCard } from './attendance-card';
import { ParticipationCard } from './participation-card';
import { ProvinceCard } from './province-card';
import { StatCards } from './stat-cards';
import { UpcomingEvents } from './upcoming-events';

const DashboardSkeleton = () => (
    <div className="space-y-4" data-test-id="dashboard_loading" aria-busy="true">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[0, 1, 2, 3].map((index) => (
                <Skeleton key={index} className="h-28 rounded-lg" />
            ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_1fr]">
            <Skeleton className="h-64 rounded-lg" />
            <Skeleton className="h-64 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((index) => (
                <Skeleton key={index} className="h-48 rounded-lg" />
            ))}
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
                    <AlertMessage data-test-id="dashboard_alert_error">{failure.message}</AlertMessage>
                    <Button variant="outline" onClick={reload} data-test-id="dashboard_button_retry">
                        Coba lagi
                    </Button>
                </div>
            )}

            {dashboard && (
                <>
                    <StatCards />
                    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.15fr_1fr]">
                        <ActionList />
                        <UpcomingEvents />
                    </div>
                    <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <ParticipationCard />
                        <ProvinceCard />
                        <AttendanceCard />
                    </div>
                </>
            )}
        </div>
    );
};
