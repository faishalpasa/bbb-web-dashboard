import * as SheetPrimitive from '@radix-ui/react-dialog';
import * as React from 'react';

import { cn } from '@/lib/utils';

// Side panel built on the dialog primitive; used for the mobile navigation drawer.
const Sheet = SheetPrimitive.Root;
const SheetClose = SheetPrimitive.Close;
const SheetTitle = SheetPrimitive.Title;
const SheetDescription = SheetPrimitive.Description;

const SheetContent = React.forwardRef<React.ElementRef<typeof SheetPrimitive.Content>, React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>>(
    ({ className, children, ...props }, ref) => (
        <SheetPrimitive.Portal>
            <SheetPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/60" />
            <SheetPrimitive.Content
                ref={ref}
                className={cn(
                    'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left fixed inset-y-0 left-0 z-50 flex h-svh w-[280px] max-w-[85vw] flex-col shadow-lg duration-200 focus:outline-hidden',
                    className,
                )}
                {...props}
            >
                {children}
            </SheetPrimitive.Content>
        </SheetPrimitive.Portal>
    ),
);
SheetContent.displayName = 'SheetContent';

export { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle };
