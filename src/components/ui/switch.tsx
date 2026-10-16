import * as React from 'react';

import { cn } from '@/lib/utils';

interface SwitchProps extends Omit<React.ComponentProps<'button'>, 'onChange'> {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
}

// A plain toggle button with role="switch"; keeps the dependency list as it is.
const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(({ checked, onCheckedChange, className, ...props }, ref) => (
    <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
            'focus-visible:ring-ring ring-offset-background relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50',
            checked ? 'bg-primary' : 'bg-[#cfccc1]',
            className,
        )}
        {...props}
    >
        <span className={cn('pointer-events-none block size-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-[22px]' : 'translate-x-0.5')} />
    </button>
));
Switch.displayName = 'Switch';

export { Switch };
