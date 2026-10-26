import { createContext, type HTMLAttributes, type PropsWithChildren, useContext, useMemo } from 'react';

import {
    DialogClose as DialogCloseUI,
    DialogContent as DialogContentUI,
    DialogDescription as DialogDescriptionUI,
    DialogFooter as DialogFooterUI,
    DialogHeader as DialogHeaderUI,
    DialogTitle as DialogTitleUI,
    Dialog as DialogUI,
} from '@/components/ui/dialog';
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

interface DialogProps extends PropsWithChildren {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    fullHeight?: boolean;
}

const DialogContext = createContext<{ fullHeight: boolean }>({ fullHeight: false });

// Toasts live in their own portal. Interacting with one must not dismiss a form dialog.
const keepDialogForToast = (event: Event) => {
    if (event.target instanceof Element && event.target.closest('[data-slot="toast-viewport"]')) event.preventDefault();
};

// Renders a centered dialog on desktop and a bottom sheet on mobile.
export const Dialog = ({ open, onOpenChange, fullHeight = false, children }: DialogProps) => {
    const { isDesktop } = useMediaQuery();
    const value = useMemo(() => ({ fullHeight }), [fullHeight]);

    if (isDesktop) {
        return (
            <DialogUI open={open} onOpenChange={onOpenChange}>
                {children}
            </DialogUI>
        );
    }

    return (
        <DialogContext.Provider value={value}>
            <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false} repositionInputs={false}>
                {children}
            </Drawer>
        </DialogContext.Provider>
    );
};

export const DialogContent = ({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) => {
    const { isDesktop } = useMediaQuery();
    const { fullHeight } = useContext(DialogContext);

    if (isDesktop) {
        return (
            <DialogContentUI
                className={className}
                onOpenAutoFocus={(event) => event.preventDefault()}
                onInteractOutside={keepDialogForToast}
                {...props}
            >
                {children}
            </DialogContentUI>
        );
    }

    return (
        <DrawerContent
            className={cn('max-h-[90vh]', fullHeight && 'h-[90vh]', className)}
            onOpenAutoFocus={(event) => event.preventDefault()}
            onInteractOutside={keepDialogForToast}
            {...props}
        >
            {children}
        </DrawerContent>
    );
};

export const DialogHeader = ({ children, ...props }: HTMLAttributes<HTMLDivElement>) => {
    const { isDesktop } = useMediaQuery();

    if (isDesktop) {
        return <DialogHeaderUI {...props}>{children}</DialogHeaderUI>;
    }

    return <DrawerHeader {...props}>{children}</DrawerHeader>;
};

export const DialogTitle = ({ children, ...props }: HTMLAttributes<HTMLHeadingElement>) => {
    const { isDesktop } = useMediaQuery();

    if (isDesktop) {
        return <DialogTitleUI {...props}>{children}</DialogTitleUI>;
    }

    return <DrawerTitle {...props}>{children}</DrawerTitle>;
};

export const DialogDescription = ({ children, ...props }: HTMLAttributes<HTMLParagraphElement>) => {
    const { isDesktop } = useMediaQuery();

    if (isDesktop) {
        return <DialogDescriptionUI {...props}>{children}</DialogDescriptionUI>;
    }

    return <DrawerDescription {...props}>{children}</DrawerDescription>;
};

export const DialogFooter = ({ children, ...props }: HTMLAttributes<HTMLDivElement>) => {
    const { isDesktop } = useMediaQuery();

    if (isDesktop) {
        return <DialogFooterUI {...props}>{children}</DialogFooterUI>;
    }

    return <DrawerFooter {...props}>{children}</DrawerFooter>;
};

export const DialogClose = ({ children, ...props }: HTMLAttributes<HTMLButtonElement>) => {
    const { isDesktop } = useMediaQuery();

    if (isDesktop) {
        return <DialogCloseUI {...props}>{children}</DialogCloseUI>;
    }

    return <DrawerClose {...props}>{children}</DrawerClose>;
};
