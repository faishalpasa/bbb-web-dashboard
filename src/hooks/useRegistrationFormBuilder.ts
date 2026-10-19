import { useRef, useState } from 'react';

import { REGISTRATION_FORM_LIMITS as LIMITS } from '@/constants/registration-form';
import type { AdminRegistrationForm, RegistrationField, RegistrationFieldType, RegistrationFormDefinition } from '@/types/registration-form';
import { errorMessage, isServiceError } from '@/utils/error';
import {
    cloneRegistrationDefinition,
    hasRegistrationOptions,
    newRegistrationField,
    newRegistrationOption,
    registrationPayload,
    registrationServerErrors,
    reorderRegistrationFields,
    validateRegistrationDefinition,
    type RegistrationFormErrors,
} from '@/utils/registration-form';

export const useRegistrationFormBuilder = (initial?: AdminRegistrationForm, isEditing = false) => {
    const [definition, setDefinition] = useState<RegistrationFormDefinition>(() =>
        cloneRegistrationDefinition(initial ?? { version: 1, fields: [] }),
    );
    const [errors, setErrors] = useState<RegistrationFormErrors>({});
    const [requiresReload, setRequiresReload] = useState(false);
    const submitted = useRef(definition);
    const available = !isEditing || initial !== undefined;
    const lockedAt = initial?.lockedAt ?? null;
    const readOnly = !available || lockedAt !== null || requiresReload;

    const change = (update: (fields: RegistrationField[]) => RegistrationField[]) => {
        if (readOnly) return;
        setDefinition((current) => ({ ...current, fields: update(current.fields) }));
        setErrors({});
    };

    const addField = () => {
        const field = newRegistrationField();
        change((fields) => (fields.length < LIMITS.fields ? [...fields, field] : fields));
    };
    const removeField = (id: string) => change((fields) => fields.filter((field) => field.id !== id));
    const updateField = (id: string, patch: Partial<Pick<RegistrationField, 'label' | 'required'>>) =>
        change((fields) => fields.map((field) => (field.id === id ? { ...field, ...patch } : field)));
    const setType = (id: string, type: RegistrationFieldType) => {
        const fallbackOption = newRegistrationOption();
        change((fields) =>
            fields.map((field) =>
                field.id === id
                    ? { ...field, type, options: hasRegistrationOptions(type) ? (field.options.length ? field.options : [fallbackOption]) : [] }
                    : field,
            ),
        );
    };
    const addOption = (id: string) => {
        const option = newRegistrationOption();
        change((fields) =>
            fields.map((field) =>
                field.id === id && hasRegistrationOptions(field.type) && field.options.length < LIMITS.options
                    ? { ...field, options: [...field.options, option] }
                    : field,
            ),
        );
    };
    const updateOption = (id: string, optionId: string, label: string) =>
        change((fields) =>
            fields.map((field) =>
                field.id === id
                    ? { ...field, options: field.options.map((option) => (option.id === optionId ? { ...option, label } : option)) }
                    : field,
            ),
        );
    const removeOption = (id: string, optionId: string) =>
        change((fields) =>
            fields.map((field) => (field.id === id ? { ...field, options: field.options.filter((option) => option.id !== optionId) } : field)),
        );
    const reorder = (activeId: string, overId: string) => change((fields) => reorderRegistrationFields(fields, activeId, overId));

    const buildInput = (): RegistrationFormDefinition | null | undefined => {
        if (!available) return undefined; // Legacy API: metadata edits must not invent or erase a form.
        if (requiresReload) return null;
        const nextErrors = validateRegistrationDefinition(definition);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length) return null;
        const input = registrationPayload(definition);
        submitted.current = cloneRegistrationDefinition(input);
        return input;
    };
    const applyServerErrors = (error: unknown): boolean => {
        if (!isServiceError(error)) return false;
        const nextErrors = registrationServerErrors(error.data?.errors, submitted.current);
        if (error.data?.code === 'registration_form_changed' || error.data?.code === 'registration_form_locked') {
            setRequiresReload(true);
            nextErrors.form = errorMessage(error);
        }
        setErrors(nextErrors);
        return Object.keys(nextErrors).length > 0;
    };

    return {
        definition,
        errors,
        available,
        lockedAt,
        readOnly,
        requiresReload,
        addField,
        removeField,
        updateField,
        setType,
        addOption,
        updateOption,
        removeOption,
        reorder,
        buildInput,
        applyServerErrors,
    };
};

export type RegistrationFormBuilder = ReturnType<typeof useRegistrationFormBuilder>;
