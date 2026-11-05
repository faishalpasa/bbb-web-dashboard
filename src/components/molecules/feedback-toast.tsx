import { useEffect, useRef } from 'react';

import { toast } from '@/components/ui/toast';

interface FeedbackToastProps {
    children: string | null | undefined;
    tone?: 'success' | 'error';
    revision?: unknown;
    'data-test-id': string;
}

// Bridge existing page-owned response state to the global toaster, without firing during render.
// A new notice object replays identical messages for separate actions (e.g. copying twice).
export const FeedbackToast = ({ children, tone = 'error', revision, 'data-test-id': testId }: FeedbackToastProps) => {
    const previous = useRef<{ message: string; tone: string; revision: unknown } | null>(null);
    const lastToast = useRef<string | null>(null);
    useEffect(() => {
        if (!children) {
            previous.current = null;
            return;
        }
        const last = previous.current;
        if (last?.message === children && last.tone === tone && last.revision === revision) return;
        previous.current = { message: children, tone, revision };
        if (lastToast.current) toast.close(lastToast.current);
        lastToast.current = toast.add({ title: children, type: tone, priority: tone === 'error' ? 'high' : 'low', data: { testId } });
    }, [children, tone, revision, testId]);

    return null;
};
