import { type BadgeTone } from '@/constants/member';
import { cn } from '@/lib/utils';

const TONE_CLASSES: Record<BadgeTone, string> = {
    success: 'bg-[#dbe8ea] text-[#0f3b45]',
    neutral: 'bg-[#e9e7de] text-[#4a4a44]',
    warning: 'bg-[#fbe5d6] text-[#8a3b12]',
    danger: 'bg-[#f8dcdc] text-[#a32222]',
    pending: 'bg-[#fbefc4] text-[#7a5b00]',
    dark: 'bg-[#002a32] text-white',
    sage: 'bg-[#e4e6d3] text-[#3f4426]',
};

interface StatusBadgeProps {
    tone: BadgeTone;
    label: string;
    'data-test-id': string;
}

export const StatusBadge = ({ tone, label, 'data-test-id': testId }: StatusBadgeProps) => (
    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap', TONE_CLASSES[tone])} data-test-id={testId}>
        {label}
    </span>
);
