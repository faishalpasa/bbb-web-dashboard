import type { ReactNode } from 'react';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/molecules/dialog';
import { Button } from '@/components/ui/button';

interface ConfirmationDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmLabel: string;
    isSubmitting: boolean;
    isConfirmDisabled?: boolean;
    error: string | null;
    isDestructive?: boolean;
    cancelLabel?: string;
    children?: ReactNode;
    'data-test-id': string;
}

export const ConfirmationDialog = ({
    open,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel,
    isSubmitting,
    isConfirmDisabled = false,
    error,
    isDestructive = false,
    cancelLabel = 'Tidak jadi',
    children,
    'data-test-id': testId,
}: ConfirmationDialogProps) => (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && !isSubmitting && onClose()}>
        <DialogContent data-test-id={testId}>
            <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
            {children}
            {error && (
                <p role="alert" className="text-destructive px-4 text-sm sm:px-0" data-test-id={`${testId}_error`}>
                    {error}
                </p>
            )}
            <DialogFooter>
                <Button
                    className="h-11 w-full font-semibold"
                    variant={isDestructive ? 'destructive' : 'default'}
                    onClick={onConfirm}
                    disabled={isSubmitting || isConfirmDisabled}
                    data-test-id={`${testId}_button_confirm`}
                >
                    {isSubmitting ? 'Memproses…' : confirmLabel}
                </Button>
                <Button
                    variant="outline"
                    className="bg-card h-11 w-full"
                    onClick={onClose}
                    disabled={isSubmitting}
                    data-test-id={`${testId}_button_keep`}
                >
                    {cancelLabel}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
);
