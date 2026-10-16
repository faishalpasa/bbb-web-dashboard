import { cn } from '@/lib/utils';

interface BrandLogoProps {
    className?: string;
}

export const BrandLogo = ({ className }: BrandLogoProps) => (
    <img
        src="/images/bbb-bff-full.png"
        alt="Buibu Baca Buku Best Friends dan Family"
        className={cn('h-auto w-[180px] max-w-full object-contain', className)}
    />
);
