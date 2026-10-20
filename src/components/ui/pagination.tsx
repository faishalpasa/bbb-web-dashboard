import { Slot } from '@radix-ui/react-slot';
import { MoreHorizontal } from 'lucide-react';
import type { ComponentProps } from 'react';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// shadcn composition; asChild supports native buttons for our state-driven SPA tables.
export const Pagination = ({ className, ...props }: ComponentProps<'nav'>) => (
    <nav aria-label="Pagination" className={cn('flex max-w-full justify-center', className)} {...props} />
);

export const PaginationContent = ({ className, ...props }: ComponentProps<'ul'>) => (
    <ul className={cn('flex flex-row flex-wrap items-center gap-1', className)} {...props} />
);

export const PaginationItem = ({ className, ...props }: ComponentProps<'li'>) => <li className={cn('', className)} {...props} />;

interface PaginationLinkProps extends ComponentProps<'a'> {
    isActive?: boolean;
    asChild?: boolean;
}

export const PaginationLink = ({ className, isActive = false, asChild = false, ...props }: PaginationLinkProps) => {
    const Component = asChild ? Slot : 'a';
    return <Component aria-current={isActive ? 'page' : undefined}
        className={cn(buttonVariants({ variant: isActive ? 'outline' : 'ghost', size: 'icon' }), 'size-11 font-mono', isActive && 'bg-secondary text-foreground disabled:opacity-100', className)} {...props} />;
};

export const PaginationEllipsis = ({ className, ...props }: ComponentProps<'span'>) => (
    <span aria-hidden="true" className={cn('flex h-11 w-6 items-center justify-center', className)} {...props}><MoreHorizontal className="size-4" /></span>
);
