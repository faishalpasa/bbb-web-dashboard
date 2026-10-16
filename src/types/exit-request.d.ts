import type { Identifier } from '@/types/api';

export type ExitRequestStatus = 'pending' | 'approved' | 'rejected';

export interface ExitRequest {
    id: Identifier;
    member: { id: Identifier; name: string; memberNumber: string | null };
    reason: string | null;
    submittedAt: string;
    attempt: number;
    upcomingRegistrations: number;
    waiting: { days: number; isOverdue: boolean };
    status: { value: ExitRequestStatus; label: string };
    decidedAt: string | null;
    rejectionReason: string | null;
}

export interface ExitRequestList {
    items: ExitRequest[];
    summary: { pendingTotal: number; overdueTotal: number; overdueAfterDays: number };
}
