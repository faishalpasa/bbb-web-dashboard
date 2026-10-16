import { ChevronDown } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

// Native select keeps the OS picker on mobile, which is the primary member target.
const NativeSelect = React.forwardRef<HTMLSelectElement, React.ComponentProps<'select'>>(({ className, children, ...props }, ref) => (
    <div className="relative">
        <select
            ref={ref}
            className={cn(
                'border-input bg-card ring-offset-background focus-visible:ring-ring h-11 w-full appearance-none rounded-md border px-3 pr-10 text-base focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed md:text-sm',
                className,
            )}
            {...props}
        >
            {children}
        </select>
        <ChevronDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" aria-hidden="true" />
    </div>
));
NativeSelect.displayName = 'NativeSelect';

export { NativeSelect };
