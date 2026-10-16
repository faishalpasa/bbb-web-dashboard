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
    error: string | null;
    isDestructive?: boolean;
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
    error,
    isDestructive = false,
    'data-test-id': testId,
}: ConfirmationDialogProps) => (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && !isSubmitting && onClose()}>
        <DialogContent data-test-id={testId}>
            <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
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
                    disabled={isSubmitting}
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
                    Tidak jadi
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
);
