import type { Identifier } from '@/types/api';

export type MemberDashboardStatus = 'active' | 'migrated' | 'exit_requested' | 'unsubscribed';

export interface DashboardUpcomingEvent {
    id: Identifier;
    title: string;
    startsAt: string;
    registered: number;
    quota: number | null;
}

export interface DashboardEventPerformance {
    eventId: Identifier;
    eventTitle: string;
    startsAt: string;
    registered: number;
    attended: number;
    percent: number;
}

export interface AdminDashboard {
    asOf: string;
    stats: {
        members: { total: number; newThisMonth: number };
        activeMembers: { total: number };
        exitRequests: { pending: number; overdue: number; overdueAfterDays: number };
        upcomingEvents: { total: number; full: number };
    };
    actions: {
        exitRequestsPending: { count: number; overdue: number; overdueAfterDays: number };
        draftEvents: { count: number };
        incompleteMembers: { count: number; afterDays: number };
        unclosedPastEvents: { count: number };
    };
    upcomingEvents: DashboardUpcomingEvent[];
    memberGrowth: { month: string; newMembers: number }[];
    memberStatuses: { status: MemberDashboardStatus; label: string; count: number }[];
    eventPerformance: DashboardEventPerformance[];
}
