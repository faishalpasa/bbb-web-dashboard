import { useState } from 'react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface PasswordInputProps extends Omit<React.ComponentProps<typeof Input>, 'type'> {
    'data-test-id': string;
}

export const PasswordInput = ({ className, 'data-test-id': testId, ...props }: PasswordInputProps) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div className="relative">
            <Input type={isVisible ? 'text' : 'password'} className={cn('bg-card h-11 pr-16', className)} data-test-id={testId} {...props} />
            <button
                type="button"
                className="text-foreground focus-visible:ring-ring absolute inset-y-0 right-0 flex min-h-11 items-center px-3 text-xs font-semibold focus-visible:ring-2 focus-visible:outline-none"
                onClick={() => setIsVisible((current) => !current)}
                aria-label={isVisible ? 'Sembunyikan password' : 'Lihat password'}
                data-test-id={`${testId}_visibility`}
            >
                {isVisible ? 'Tutup' : 'Lihat'}
            </button>
        </div>
    );
};
