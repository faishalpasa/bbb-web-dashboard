import type { RegistrationFormDefinition, RegistrationSubmissionInput } from '@/types/registration-form';
import { fieldErrorMessage, isServiceError } from '@/utils/error';
import { registrationSubmission } from '@/utils/registration-submission';
import { useState } from 'react';

export const useRegistrationAnswers = (definition: RegistrationFormDefinition | undefined) => {
    const [values, setValues] = useState<Record<string, string>>({});
    const [errors, setErrors] = useState<Record<string, string | undefined>>({});
    const [blocked, setBlocked] = useState(false);
    const reset = () => {
        setValues({});
        setErrors({});
        setBlocked(false);
    };
    const build = (): RegistrationSubmissionInput | null => {
        if (!definition || blocked) return null;
        const { input, errors: next } = registrationSubmission(definition, values);
        setErrors(next);
        return Object.keys(next).length ? null : input;
    };
    const applyErrors = (error: unknown, input: RegistrationSubmissionInput) => {
        const next: Record<string, string | undefined> = {};
        input.answers.forEach((answer, index) => {
            next[answer.fieldId] = fieldErrorMessage(error, `answers.${index}.value`) ?? fieldErrorMessage(error, `answers.${index}.fieldId`);
        });
        setErrors(next);
        if (isServiceError(error) && error.data?.code === 'registration_form_changed') setBlocked(true);
    };
    return {
        values,
        errors,
        blocked,
        reset,
        build,
        applyErrors,
        setValue: (id: string, value: string) => {
            setValues((current) => ({ ...current, [id]: value }));
            setErrors((current) => ({ ...current, [id]: undefined }));
        },
    };
};
