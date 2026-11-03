import type { RegistrationFormDefinition, RegistrationSubmissionInput } from '@/types/registration-form';
export const registrationSubmission = (
    definition: RegistrationFormDefinition,
    values: Record<string, string | string[]>,
): { input: RegistrationSubmissionInput; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};
    const answers = definition.fields.map((field) => {
        const raw = values[field.id];
        if (field.type === 'checkbox') {
            const selected = Array.isArray(raw) ? raw : [];
            const valid = Array.isArray(raw) || raw === undefined;
            const unique = new Set(selected);
            if (
                !valid ||
                unique.size !== selected.length ||
                selected.length > 50 ||
                selected.some((id) => !field.options.some((option) => option.id === id))
            )
                errors[field.id] = 'Pilih pilihan yang tersedia tanpa duplikasi.';
            if (field.required && selected.length === 0) errors[field.id] = 'Isian ini wajib diisi.';
            const value = selected.length ? field.options.filter((option) => unique.has(option.id)).map((option) => option.id) : null;
            return { fieldId: field.id, value };
        }
        const value = typeof raw === 'string' ? raw.trim() || null : null;
        if (Array.isArray(raw)) errors[field.id] = 'Isian jawaban tidak valid.';
        if (field.required && value === null) errors[field.id] = 'Isian ini wajib diisi.';
        const max = field.type === 'textarea' ? 5000 : 255;
        if (value !== null && Array.from(value).length > max) errors[field.id] = `Jawaban maksimal ${max} karakter.`;
        if (value !== null && (field.type === 'radio' || field.type === 'select') && !field.options.some((option) => option.id === value))
            errors[field.id] = 'Pilih salah satu pilihan yang tersedia.';
        return { fieldId: field.id, value };
    });
    return { input: { formVersion: definition.version, answers }, errors };
};
