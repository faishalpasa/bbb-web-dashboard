import { SlidersHorizontal } from 'lucide-react';
import { type ReactNode, useState } from 'react';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/molecules/dialog';
import { Button } from '@/components/ui/button';

interface FilterDialogProps {
    /** How many filters are on right now; shown on the button so it is clear the list is narrowed. */
    activeCount: number;
    /** Called when the dialog opens, to load the draft from the filters that are on. */
    onOpen: () => void;
    /** Called by "Terapkan": the page applies its draft; the dialog then closes. */
    onApply: () => void;
    /** Called by "Atur ulang": the page clears its filters; the dialog then closes. */
    onReset: () => void;
    title?: string;
    description?: string;
    children: ReactNode;
    'data-test-id': string;
}

/**
 * A "Filter" button that opens all the filters of a list in one dialog (a bottom sheet on a phone). The page keeps a
 * draft of the filters; nothing changes in the list until "Terapkan".
 */
export const FilterDialog = ({
    activeCount,
    onOpen,
    onApply,
    onReset,
    title = 'Filter',
    description = 'Pilih filter, lalu tekan Terapkan.',
    children,
    'data-test-id': testId,
}: FilterDialogProps) => {
    const [isOpen, setIsOpen] = useState(false);

    const open = () => {
        onOpen();
        setIsOpen(true);
    };

    return (
        <>
            <Button type="button" variant="outline" className="bg-card h-10 shrink-0 gap-2 px-3" onClick={open} data-test-id={`${testId}_button`}>
                <SlidersHorizontal className="size-4" aria-hidden="true" />
                Filter
                {activeCount > 0 && (
                    <span
                        className="bg-primary text-primary-foreground inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold"
                        aria-label={`${activeCount} filter aktif`}
                        data-test-id={`${testId}_count`}
                    >
                        {activeCount}
                    </span>
                )}
            </Button>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent data-test-id={`${testId}_dialog`}>
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        <DialogDescription>{description}</DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[60vh] space-y-4 overflow-y-auto px-1 py-1">{children}</div>
                    <DialogFooter>
                        <Button
                            type="button"
                            className="h-11 w-full font-semibold"
                            onClick={() => {
                                onApply();
                                setIsOpen(false);
                            }}
                            data-test-id={`${testId}_apply`}
                        >
                            Terapkan
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="bg-card h-11 w-full"
                            onClick={() => {
                                onReset();
                                setIsOpen(false);
                            }}
                            data-test-id={`${testId}_reset`}
                        >
                            Atur ulang
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};
