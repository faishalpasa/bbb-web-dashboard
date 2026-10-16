import type { Identifier } from '@/types/api';

export type ParticipationPreferenceValue = 'online' | 'offline' | 'both' | 'unset';

export interface DashboardUpcomingEvent {
    id: Identifier;
    title: string;
    startsAt: string;
    registered: number;
    quota: number | null;
}

export interface DashboardAttendance {
    eventId: Identifier;
    eventTitle: string;
    startsAt: string;
    registered: number;
    attended: number;
    absent: number;
    percent: number;
    averagePercent: number;
    averageEventCount: number;
}

export interface AdminDashboard {
    asOf: string;
    stats: {
        members: { total: number; newThisMonth: number };
        engaged: { total: number; minAttendance: number; windowMonths: number };
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
    participationPreferences: { value: ParticipationPreferenceValue; label: string; percent: number }[];
    provinces: { name: string; percent: number }[];
    latestAttendance: DashboardAttendance | null;
}
