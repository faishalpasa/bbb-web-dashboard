import type { ReactNode } from 'react';

import { ConfirmationDialog } from '@/components/molecules/confirmation-dialog';

interface SubmitConfirmationDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmLabel: string;
    isSubmitting: boolean;
    children?: ReactNode;
    'data-test-id': string;
}

// Asked after the form passes its own checks and before anything is sent. A failed save closes it, so the page's own
// field and form errors stay in view instead of hiding behind the dialog.
export const SubmitConfirmationDialog = ({ children, ...props }: SubmitConfirmationDialogProps) => (
    <ConfirmationDialog {...props} cancelLabel="Periksa lagi" error={null}>
        {children}
    </ConfirmationDialog>
);
