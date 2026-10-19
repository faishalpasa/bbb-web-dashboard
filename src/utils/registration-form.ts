import { REGISTRATION_FORM_LIMITS as LIMITS } from '@/constants/registration-form';
import type { RegistrationField, RegistrationFieldType, RegistrationFormDefinition, RegistrationOption } from '@/types/registration-form';

export type RegistrationFormErrors = Record<string, string>;

export const hasRegistrationOptions = (type: RegistrationFieldType): boolean => type === 'select' || type === 'radio';

export const newRegistrationOption = (id = crypto.randomUUID()): RegistrationOption => ({ id, label: '' });

export const newRegistrationField = (type: RegistrationFieldType = 'input', id = crypto.randomUUID()): RegistrationField => ({
    id,
    type,
    label: '',
    required: false,
    options: hasRegistrationOptions(type) ? [newRegistrationOption()] : [],
});

export const cloneRegistrationDefinition = (form: RegistrationFormDefinition): RegistrationFormDefinition => ({
    version: form.version,
    fields: form.fields.map((field) => ({ ...field, options: field.options.map((option) => ({ ...option })) })),
});

// IDs and options travel with the question, regardless of drag/drop or keyboard reorder.
export const reorderRegistrationFields = (fields: RegistrationField[], activeId: string, overId: string): RegistrationField[] => {
    const from = fields.findIndex((field) => field.id === activeId);
    const to = fields.findIndex((field) => field.id === overId);
    if (from < 0 || to < 0 || from === to) return fields;
    const next = [...fields];
    next.splice(to, 0, next.splice(from, 1)[0]);
    return next;
};

export const registrationPayload = (form: RegistrationFormDefinition): RegistrationFormDefinition => ({
    version: form.version,
    fields: form.fields.map((field) => ({
        id: field.id,
        type: field.type,
        label: field.label.trim(),
        required: field.required,
        options: hasRegistrationOptions(field.type) ? field.options.map((option) => ({ id: option.id, label: option.label.trim() })) : [],
    })),
});

export const validateRegistrationDefinition = (form: RegistrationFormDefinition): RegistrationFormErrors => {
    const errors: RegistrationFormErrors = {};
    if (form.fields.length > LIMITS.fields) errors.form = `Maksimal ${LIMITS.fields} pertanyaan tambahan.`;
    for (const field of form.fields) {
        if (!field.label.trim()) errors[`field.${field.id}.label`] = 'Label pertanyaan harus diisi.';
        else if (Array.from(field.label.trim()).length > LIMITS.label) errors[`field.${field.id}.label`] = `Label maksimal ${LIMITS.label} karakter.`;
        if (hasRegistrationOptions(field.type)) {
            if (field.options.length === 0) errors[`field.${field.id}.options`] = 'Tambahkan minimal satu pilihan.';
            if (field.options.length > LIMITS.options) errors[`field.${field.id}.options`] = `Maksimal ${LIMITS.options} pilihan.`;
            for (const option of field.options) {
                if (!option.label.trim()) errors[`option.${option.id}.label`] = 'Label pilihan harus diisi.';
                else if (Array.from(option.label.trim()).length > LIMITS.label)
                    errors[`option.${option.id}.label`] = `Label pilihan maksimal ${LIMITS.label} karakter.`;
            }
        }
    }
    return errors;
};

// Map server array indexes against the submitted snapshot, never against a later reordered draft.
export const registrationServerErrors = (
    server: Record<string, string[]> | undefined,
    submitted: RegistrationFormDefinition,
): RegistrationFormErrors => {
    const errors: RegistrationFormErrors = {};
    for (const [key, messages] of Object.entries(server ?? {})) {
        if (!key.startsWith('registrationForm') || !messages[0]) continue;
        const match = /^registrationForm\.fields\.(\d+)(?:\.(\w+))?(?:\.(\d+)(?:\.(\w+))?)?$/.exec(key);
        const field = match ? submitted.fields[Number(match[1])] : undefined;
        if (!match || !field) {
            errors.form = messages[0];
            continue;
        }
        const option = match[3] !== undefined ? field.options[Number(match[3])] : undefined;
        if (option) errors[`option.${option.id}.${match[4] ?? 'label'}`] = messages[0];
        else errors[`field.${field.id}.${match[2] ?? 'label'}`] = messages[0];
    }
    return errors;
};
