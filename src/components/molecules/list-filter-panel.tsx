import { SlidersHorizontal } from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/molecules/dialog';
import { Button } from '@/components/ui/button';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface ListFilterPanelProps {
    search: ReactNode;
    children: ReactNode;
    title: string;
    hasActiveFilter: boolean;
    'data-test-id': string;
}

export const ListFilterPanel = ({ search, children, title, hasActiveFilter, 'data-test-id': testId }: ListFilterPanelProps) => {
    const { isDesktop } = useMediaQuery(1024);
    const [isOpen, setIsOpen] = useState(false);
    const [isStuck, setIsStuck] = useState(false);
    const stickySentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isDesktop || !stickySentinelRef.current) return;

        const observer = new IntersectionObserver(([entry]) => setIsStuck(!entry.isIntersecting), {
            rootMargin: '-24px 0px 0px 0px',
        });
        observer.observe(stickySentinelRef.current);

        return () => observer.disconnect();
    }, [isDesktop]);

    if (isDesktop) {
        return (
            <>
                <div ref={stickySentinelRef} className="-mb-px h-px" aria-hidden="true" />
                <section className="bg-background lg:sticky lg:top-6 lg:z-20" data-test-id={testId}>
                    {isStuck && (
                        <div
                            className="bg-background pointer-events-none absolute -inset-x-6 -top-6 bottom-0 -z-10"
                            aria-hidden="true"
                            data-test-id={`${testId}_backdrop`}
                        />
                    )}
                    <div className="border-border bg-card grid grid-cols-1 gap-4 rounded-lg border p-4 lg:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))] lg:shadow-sm">
                        {search}
                        {children}
                    </div>
                </section>
            </>
        );
    }

    return (
        <>
            <section className="flex min-w-0 items-end gap-2" data-test-id={testId}>
                <div className="min-w-0 flex-1">{search}</div>
                <Button
                    variant="outline"
                    size="icon"
                    className="bg-card relative size-11 shrink-0"
                    aria-label={title}
                    aria-haspopup="dialog"
                    aria-expanded={isOpen}
                    onClick={() => setIsOpen(true)}
                    data-test-id={`${testId}_button_open`}
                >
                    <SlidersHorizontal aria-hidden="true" />
                    {hasActiveFilter && <span className="bg-primary absolute top-1 right-1 size-2 rounded-full" aria-hidden="true" />}
                </Button>
            </section>
            <Dialog open={isOpen} onOpenChange={setIsOpen} mobileUntil={1024}>
                <DialogContent data-test-id={`${testId}_sheet`}>
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        <DialogDescription>Perubahan filter langsung memperbarui daftar.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 overflow-y-auto px-4 pb-4" data-vaul-no-drag>
                        {children}
                    </div>
                    <DialogFooter className="pb-[max(1rem,env(safe-area-inset-bottom))]">
                        <Button className="h-11 w-full" onClick={() => setIsOpen(false)} data-test-id={`${testId}_button_done`}>
                            Selesai
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};
