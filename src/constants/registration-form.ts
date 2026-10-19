import type { RegistrationFieldType } from '@/types/registration-form';

export const REGISTRATION_FORM_LIMITS = { fields: 30, label: 255, input: 255, textarea: 5000, options: 50 } as const;

export const REGISTRATION_FIELD_TYPES: { value: RegistrationFieldType; label: string }[] = [
    { value: 'input', label: 'Input' },
    { value: 'textarea', label: 'Textarea' },
    { value: 'select', label: 'Select' },
    { value: 'radio', label: 'Radio' },
];
