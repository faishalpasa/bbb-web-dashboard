import type { RegistrationFormDefinition, RegistrationSubmissionInput } from '@/types/registration-form';
export const registrationSubmission = (
    definition: RegistrationFormDefinition,
    values: Record<string, string>,
): { input: RegistrationSubmissionInput; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};
    const answers = definition.fields.map((field) => {
        const value = values[field.id]?.trim() || null;
        if (field.required && value === null) errors[field.id] = 'Isian ini wajib diisi.';
        const max = field.type === 'textarea' ? 5000 : 255;
        if (value !== null && Array.from(value).length > max) errors[field.id] = `Jawaban maksimal ${max} karakter.`;
        if (value !== null && (field.type === 'radio' || field.type === 'select') && !field.options.some((option) => option.id === value))
            errors[field.id] = 'Pilih salah satu pilihan yang tersedia.';
        return { fieldId: field.id, value };
    });
    return { input: { formVersion: definition.version, answers }, errors };
};
