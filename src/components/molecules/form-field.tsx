import type { PropsWithChildren } from 'react';

import InputError from '@/components/input-error';
import { RequiredMark } from '@/components/molecules/required-mark';
import { Label } from '@/components/ui/label';

interface FormFieldProps extends PropsWithChildren {
    id: string;
    label: string;
    hint?: string;
    isOptional?: boolean;
    error?: string;
    'data-test-id': string;
}

export const FormField = ({ id, label, hint, isOptional = false, error, children, 'data-test-id': testId }: FormFieldProps) => (
    // min-w-0: a grid item otherwise grows to its content, and a date input on a phone is wider than the card.
    <div className="grid min-w-0 gap-2">
        <Label htmlFor={id}>
            {label}
            {!isOptional && <RequiredMark />}
        </Label>
        {children}
        {hint && (
            <p id={`${id}-hint`} className="text-muted-foreground text-xs">
                {hint}
            </p>
        )}
        <InputError id={`${id}-error`} message={error} data-test-id={`${testId}_error`} />
    </div>
);
