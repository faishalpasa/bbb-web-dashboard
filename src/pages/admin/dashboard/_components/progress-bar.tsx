import { cn } from '@/lib/utils';

interface ProgressBarProps {
    percent: number;
    label: string;
    className?: string;
    barClassName?: string;
}

export const ProgressBar = ({ percent, label, className, barClassName }: ProgressBarProps) => (
    <div
        className={cn('bg-secondary h-2 overflow-hidden rounded-full', className)}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
    >
        {/* The width is the data itself, so it cannot be a static class. */}
        <div className={cn('bg-foreground h-full rounded-full', barClassName)} style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
    </div>
);
