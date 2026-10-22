import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { ROUTES, type StaticRoute } from '@/constants/route';
import { getDashboard } from '@/services/dashboard';
import type { LoadFailure } from '@/types/api';
import type { AdminDashboard } from '@/types/dashboard';
import { toLoadFailure } from '@/utils/error';
import { formatNumber } from '@/utils/number';

export interface ActionRow {
    key: string;
    count: number;
    title: string;
    hint: string;
    buttonLabel: string;
    to: StaticRoute;
    isUrgent: boolean;
}

export interface StatCard {
    key: string;
    label: string;
    value: string;
    hint: string;
}

interface PageContextValue {
    dashboard: AdminDashboard | null;
    failure: LoadFailure | null;
    isLoading: boolean;
    statCards: StatCard[];
    actionRows: ActionRow[];
    reload: () => void;
}

const PageContext = createContext<PageContextValue | null>(null);

const buildStatCards = ({ stats }: AdminDashboard): StatCard[] => [
    {
        key: 'members',
        label: 'Member',
        value: formatNumber(stats.members.total),
        hint: `${formatNumber(stats.members.newThisMonth)} member baru bulan ini`,
    },
    {
        key: 'active_members',
        label: 'Member Aktif',
        value: formatNumber(stats.activeMembers.total),
        hint: `${formatNumber(stats.members.total)} total member`,
    },
    {
        key: 'exit_requests',
        label: 'Permintaan Keluar',
        value: formatNumber(stats.exitRequests.pending),
        hint: `${stats.exitRequests.overdue} menunggu lebih dari ${stats.exitRequests.overdueAfterDays} hari`,
    },
    {
        key: 'upcoming_events',
        label: 'Kegiatan Mendatang',
        value: formatNumber(stats.upcomingEvents.total),
        hint: `${stats.upcomingEvents.full} di antaranya kuota penuh`,
    },
];

// A row with nothing to do is left out instead of showing a zero.
const buildActionRows = ({ actions }: AdminDashboard): ActionRow[] => {
    const rows: ActionRow[] = [
        {
            key: 'exit_requests',
            count: actions.exitRequestsPending.count,
            title: 'Permintaan keluar menunggu keputusan',
            hint: `${actions.exitRequestsPending.overdue} sudah lebih dari ${actions.exitRequestsPending.overdueAfterDays} hari`,
            buttonLabel: 'Tinjau',
            to: ROUTES.exitRequests,
            isUrgent: actions.exitRequestsPending.overdue > 0,
        },
        {
            key: 'draft_events',
            count: actions.draftEvents.count,
            title: 'Kegiatan draf belum dipublikasikan',
            hint: 'Belum terlihat oleh member',
            buttonLabel: 'Lihat',
            to: ROUTES.events,
            isUrgent: false,
        },
        {
            key: 'incomplete_members',
            count: actions.incompleteMembers.count,
            title: 'Member belum melengkapi data',
            hint: `Status menunggu data lebih dari ${actions.incompleteMembers.afterDays} hari`,
            buttonLabel: 'Lihat',
            to: ROUTES.members,
            isUrgent: false,
        },
        {
            key: 'unclosed_events',
            count: actions.unclosedPastEvents.count,
            title: 'Kegiatan sudah lewat dan belum ditutup',
            hint: 'Statistik kehadiran belum final',
            buttonLabel: 'Tutup Acara',
            to: ROUTES.events,
            isUrgent: false,
        },
    ];

    return rows.filter((row) => row.count > 0);
};

export const PageContextProvider = ({ children }: PropsWithChildren) => {
    const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
    const [failure, setFailure] = useState<LoadFailure | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const load = useCallback(async () => {
        setIsLoading(true);
        setFailure(null);

        try {
            const response = await getDashboard();

            setDashboard(response.data);
        } catch (error) {
            setFailure(toLoadFailure(error));
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const value = useMemo<PageContextValue>(
        () => ({
            dashboard,
            failure,
            isLoading,
            statCards: dashboard ? buildStatCards(dashboard) : [],
            actionRows: dashboard ? buildActionRows(dashboard) : [],
            reload: () => void load(),
        }),
        [dashboard, failure, isLoading, load],
    );

    return <PageContext.Provider value={value}>{children}</PageContext.Provider>;
};

export const usePageContext = (): PageContextValue => {
    const context = useContext(PageContext);

    if (!context) throw new Error('usePageContext harus digunakan di dalam PageContextProvider.');

    return context;
};
