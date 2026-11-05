import type { ServiceError } from '@/types/api';
import type { ReadingFieldName, ReadingProfile, ReadingProfileErrors, ReadingProfileFields, ReadingProfileOptions } from '@/types/reading-profile';
import { fieldErrorMessage } from '@/utils/error';
import { readingProfileFields, readingProfileInput, validateReadingProfile } from '@/utils/reading-profile';
import { useState } from 'react';

export const useReadingProfile = (initial?: ReadingProfile, initialOptions: ReadingProfileOptions | null = null) => {
    const [fields, setFields] = useState(() => readingProfileFields(initial));
    const [errors, setErrors] = useState<ReadingProfileErrors>({});
    const [options, setOptions] = useState<ReadingProfileOptions | null>(initialOptions);
    const initialize = (profile?: ReadingProfile, nextOptions?: ReadingProfileOptions) => {
        setFields(readingProfileFields(profile));
        setErrors({});
        if (nextOptions) setOptions(nextOptions);
    };
    const setField = <K extends ReadingFieldName>(name: K, value: ReadingProfileFields[K]) => {
        setFields((current) => ({ ...current, [name]: value }));
        setErrors((current) => ({ ...current, [name]: undefined }));
    };
    const toggleInterest = (id: string, checked: boolean) => {
        setFields((current) => ({
            ...current,
            readingInterestIds: checked
                ? [...new Set([...current.readingInterestIds, id])]
                : current.readingInterestIds.filter((value) => value !== id),
            readingInterestOther:
                !checked && options?.readingInterests.some((option) => option.id === id && option.code === 'other')
                    ? ''
                    : current.readingInterestOther,
        }));
        setErrors((current) => ({ ...current, readingInterestIds: undefined, readingInterestOther: undefined }));
    };
    const validate = () => {
        const next = validateReadingProfile(fields, options);
        setErrors(next);
        return Object.keys(next).length === 0;
    };
    const applyServerErrors = (error: unknown) => {
        const next: ReadingProfileErrors = {};
        for (const name of Object.keys(fields) as ReadingFieldName[]) {
            const message = fieldErrorMessage(error, name);
            if (message) next[name] = message;
        }
        // Laravel reports invalid catalogue IDs at an index; show them beside the whole multi-select.
        const indexed = Object.entries((error as ServiceError)?.data?.errors ?? {}).find(([key]) => key.startsWith('readingInterestIds.'));
        if (indexed) next.readingInterestIds = indexed[1][0];
        setErrors(next);
        return Object.keys(next).length > 0;
    };
    return {
        fields,
        errors,
        options,
        setOptions,
        initialize,
        setField,
        toggleInterest,
        validate,
        applyServerErrors,
        buildInput: () => readingProfileInput(fields),
    };
};
export type ReadingProfileForm = ReturnType<typeof useReadingProfile>;
