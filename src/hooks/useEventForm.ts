import { useCallback, useEffect, useRef, useState } from 'react';

import { EVENT_DEFAULT_CAPACITY, EVENT_DEFAULT_TIMEZONE } from '@/constants/event';
import { postEventBanner, postRandomAttendanceCode } from '@/services/event';
import type { EventDetail, EventFormat, EventInput, EventTimezone } from '@/types/event';
import { fromLocalInput, toLocalInput } from '@/utils/date';
import { errorMessage, fieldErrorMessage } from '@/utils/error';
import { slugify } from '@/utils/string';

export type EventFieldName =
    | 'title'
    | 'slug'
    | 'description'
    | 'bannerUrl'
    | 'timezone'
    | 'startsAt'
    | 'endsAt'
    | 'format'
    | 'venueName'
    | 'address'
    | 'mapUrl'
    | 'capacity'
    | 'attendanceCode';

export type EventFormErrors = Partial<Record<EventFieldName, string>>;

export interface EventFormFields {
    title: string;
    slug: string;
    description: string;
    bannerUrl: string;
    timezone: EventTimezone;
    startsAt: string;
    endsAt: string;
    format: EventFormat;
    venueName: string;
    address: string;
    mapUrl: string;
    usesQuota: boolean;
    capacity: string;
    allowsNonMember: boolean;
    attendanceCode: string;
}

const EMPTY_FIELDS: EventFormFields = {
    title: '',
    slug: '',
    description: '',
    bannerUrl: '',
    timezone: EVENT_DEFAULT_TIMEZONE,
    startsAt: '',
    endsAt: '',
    format: 'offline',
    venueName: '',
    address: '',
    mapUrl: '',
    usesQuota: true,
    capacity: EVENT_DEFAULT_CAPACITY,
    allowsNonMember: true,
    attendanceCode: '',
};

const SERVER_FIELD_NAMES: EventFieldName[] = [
    'title',
    'slug',
    'description',
    'bannerUrl',
    'timezone',
    'startsAt',
    'endsAt',
    'format',
    'venueName',
    'address',
    'mapUrl',
    'capacity',
    'attendanceCode',
];

const fieldsFromEvent = (event: EventDetail): EventFormFields => ({
    title: event.title,
    slug: event.slug,
    description: event.description,
    bannerUrl: event.bannerUrl ?? '',
    timezone: event.timezone,
    startsAt: toLocalInput(event.startsAt, event.timezone),
    endsAt: toLocalInput(event.endsAt, event.timezone),
    format: event.format.value,
    venueName: event.venueName ?? '',
    address: event.address ?? '',
    mapUrl: event.mapUrl ?? '',
    usesQuota: event.usesQuota,
    capacity: event.capacity === null ? EVENT_DEFAULT_CAPACITY : String(event.capacity),
    allowsNonMember: event.allowsNonMember,
    attendanceCode: event.attendanceCode,
});

// Shared by the create and edit event screens: field state, the title -> link follow-along, banner upload and the random code.
export const useEventForm = (event?: EventDetail) => {
    const [fields, setFields] = useState<EventFormFields>(() => (event ? fieldsFromEvent(event) : EMPTY_FIELDS));
    const [errors, setErrors] = useState<EventFormErrors>({});
    const [isSlugEdited, setIsSlugEdited] = useState(Boolean(event));
    const [isUploadingBanner, setIsUploadingBanner] = useState(false);
    const [isGeneratingCode, setIsGeneratingCode] = useState(false);
    const [codeError, setCodeError] = useState<string | null>(null);
    const hasRequestedCode = useRef(false);

    const setField = useCallback(<Name extends keyof EventFormFields>(name: Name, value: EventFormFields[Name]) => {
        setFields((current) => ({ ...current, [name]: value }));
        setErrors((current) => ({ ...current, [name]: undefined }));
    }, []);

    const setTitle = (title: string) => {
        setFields((current) => ({ ...current, title, slug: isSlugEdited ? current.slug : slugify(title) }));
        setErrors((current) => ({ ...current, title: undefined, slug: undefined }));
    };

    const setSlug = (slug: string) => {
        setIsSlugEdited(true);
        setField('slug', slug.toLowerCase().replace(/[^a-z0-9-]/g, ''));
    };

    const regenerateCode = useCallback(async () => {
        setIsGeneratingCode(true);
        setCodeError(null);

        try {
            const response = await postRandomAttendanceCode();

            setFields((current) => ({ ...current, attendanceCode: response.data.attendanceCode }));
            setErrors((current) => ({ ...current, attendanceCode: undefined }));
        } catch (error) {
            setCodeError(errorMessage(error));
        } finally {
            setIsGeneratingCode(false);
        }
    }, []);

    useEffect(() => {
        // A new event starts with a ready-made code, so saving a draft never needs a manual step.
        if (event || hasRequestedCode.current) return;

        hasRequestedCode.current = true;
        void regenerateCode();
    }, [event, regenerateCode]);

    const uploadBanner = async (file: File) => {
        setIsUploadingBanner(true);
        setErrors((current) => ({ ...current, bannerUrl: undefined }));

        try {
            const response = await postEventBanner(file);

            setFields((current) => ({ ...current, bannerUrl: response.data.bannerUrl }));
        } catch (error) {
            setErrors((current) => ({ ...current, bannerUrl: fieldErrorMessage(error, 'banner') ?? errorMessage(error) }));
        } finally {
            setIsUploadingBanner(false);
        }
    };

    // Only the title is required to keep a draft; the API enforces everything else when publishing.
    const buildInput = (publish: boolean): EventInput | null => {
        if (!fields.title.trim()) {
            setErrors({ title: 'Judul harus diisi.' });

            return null;
        }

        setErrors({});

        return {
            title: fields.title.trim(),
            // An untouched link is left to the API, which makes it unique.
            slug: isSlugEdited ? fields.slug || null : null,
            description: fields.description.trim() || null,
            bannerUrl: fields.bannerUrl || null,
            timezone: fields.timezone,
            startsAt: fromLocalInput(fields.startsAt, fields.timezone),
            endsAt: fromLocalInput(fields.endsAt, fields.timezone),
            format: fields.format,
            venueName: fields.venueName.trim() || null,
            address: fields.address.trim() || null,
            mapUrl: fields.mapUrl.trim() || null,
            usesQuota: fields.usesQuota,
            capacity: fields.usesQuota ? Number(fields.capacity) || null : null,
            allowsNonMember: fields.allowsNonMember,
            attendanceCode: fields.attendanceCode.trim() || null,
            publish,
        };
    };

    const applyServerErrors = (error: unknown): boolean => {
        const nextErrors: EventFormErrors = {};

        for (const name of SERVER_FIELD_NAMES) {
            const message = fieldErrorMessage(error, name);

            if (message) nextErrors[name] = message;
        }

        setErrors(nextErrors);

        return Object.keys(nextErrors).length > 0;
    };

    return {
        fields,
        errors,
        isUploadingBanner,
        isGeneratingCode,
        codeError,
        setField,
        setTitle,
        setSlug,
        regenerateCode,
        uploadBanner,
        buildInput,
        applyServerErrors,
    };
};

export type EventForm = ReturnType<typeof useEventForm>;
