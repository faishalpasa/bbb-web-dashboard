import { EllipsisVertical } from 'lucide-react';
import { type ReactNode, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// One row of a menu: an icon and a label, as tall as a touch target on a phone and compact on a desktop.
export const ROW_ACTION_ITEM_CLASS =
    'hover:bg-secondary focus-visible:bg-secondary flex min-h-11 w-full items-center gap-3 rounded-sm px-3 text-left text-sm focus-visible:outline-hidden md:min-h-9';

interface RowActionsMenuProps {
    /** Names the row, so the button reads "Aksi untuk <label>" to a screen reader. */
    label: string;
    /** The menu items; call `close` from an item's click so the menu closes when it is used. */
    children: (close: () => void) => ReactNode;
    'data-test-id': string;
}

/** Every action on a table row behind one "..." button that opens a small popover menu. */
export const RowActionsMenu = ({ label, children, 'data-test-id': testId }: RowActionsMenuProps) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="flex justify-end">
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="bg-card size-11 md:size-9"
                        aria-label={`Aksi untuk ${label}`}
                        aria-haspopup="menu"
                        title="Aksi"
                        data-test-id={`${testId}_button`}
                    >
                        <EllipsisVertical aria-hidden="true" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-56 p-1" data-test-id={`${testId}_menu`}>
                    <div role="menu" aria-label={`Aksi untuk ${label}`}>
                        {children(() => setIsOpen(false))}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
};
