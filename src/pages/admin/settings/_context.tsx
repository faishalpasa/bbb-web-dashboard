import { createContext, type FormEventHandler, type PropsWithChildren, useContext, useEffect, useState } from 'react';

import { toast } from '@/components/ui/toast';
import { getSettings, putSettings } from '@/services/superadmin';
import type { LoadFailure } from '@/types/api';
import type { AdminSettings } from '@/types/superadmin';
import { durationTextError, durationTextToMinutes, formatMinutesDuration, toDurationText } from '@/utils/date';
import { errorMessage, fieldErrorMessage, toLoadFailure } from '@/utils/error';
import { isValidWhatsapp, normalizeWhatsapp, toLocalWhatsapp } from '@/utils/string';

export type SettingsFieldName =
    | 'registrationCloseMinutes'
    | 'cancellationCloseMinutes'
    | 'attendanceOpenMinutes'
    | 'engagedWindowMonths'
    | 'adminWhatsapp'
    | 'whatsappGroupUrl'
    | 'faqContent'
    | 'privacyPolicyContent'
    | 'rulesSummary';

export type SettingsFields = Record<SettingsFieldName, string>;
export type SettingsErrors = Partial<Record<SettingsFieldName, string>>;

const FIELD_NAMES: SettingsFieldName[] = [
    'registrationCloseMinutes',
    'cancellationCloseMinutes',
    'attendanceOpenMinutes',
    'engagedWindowMonths',
    'adminWhatsapp',
    'whatsappGroupUrl',
    'faqContent',
    'privacyPolicyContent',
    'rulesSummary',
];

interface PageContextValue {
    settings: AdminSettings | null;
    fields: SettingsFields | null;
    errors: SettingsErrors;
    failure: LoadFailure | null;
    isLoading: boolean;
    isSaving: boolean;
    notice: { tone: 'success' | 'error'; text: string } | null;
    setField: (name: SettingsFieldName, value: string) => void;
    handleSubmit: FormEventHandler<HTMLFormElement>;
    isConfirmOpen: boolean;
    confirmSubmit: () => Promise<void>;
    closeConfirm: () => void;
    reload: () => void;
}

// Typed as "jam:menit" in the form, sent as minutes.
const DURATION_FIELDS = ['registrationCloseMinutes', 'cancellationCloseMinutes', 'attendanceOpenMinutes'] as const;

const PageContext = createContext<PageContextValue | null>(null);

const toFields = (settings: AdminSettings): SettingsFields => ({
    registrationCloseMinutes: toDurationText(settings.registrationCloseMinutes),
    cancellationCloseMinutes: toDurationText(settings.cancellationCloseMinutes),
    attendanceOpenMinutes: toDurationText(settings.attendanceOpenMinutes),
    engagedWindowMonths: String(settings.engagedWindowMonths),
    adminWhatsapp: settings.adminWhatsapp ? toLocalWhatsapp(settings.adminWhatsapp) : '',
    whatsappGroupUrl: settings.whatsappGroupUrl ?? '',
    faqContent: settings.faqContent,
    privacyPolicyContent: settings.privacyPolicyContent,
    rulesSummary: settings.rulesSummary,
});

export const PageContextProvider = ({ children }: PropsWithChildren) => {
    const [settings, setSettings] = useState<AdminSettings | null>(null);
    const [fields, setFields] = useState<SettingsFields | null>(null);
    const [errors, setErrors] = useState<SettingsErrors>({});
    const [failure, setFailure] = useState<LoadFailure | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isConfirmOpen, setConfirmOpen] = useState(false);
    const [notice, setNotice] = useState<PageContextValue['notice']>(null);
    const [reloadToken, setReloadToken] = useState(0);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            setFailure(null);

            try {
                const response = await getSettings();

                setSettings(response.data);
                setFields(toFields(response.data));
            } catch (error) {
                setFailure(toLoadFailure(error));
            } finally {
                setIsLoading(false);
            }
        };

        void load();
    }, [reloadToken]);

    const setField = (name: SettingsFieldName, value: string) => {
        setFields((current) => (current ? { ...current, [name]: value } : current));
        setErrors((current) => ({ ...current, [name]: undefined }));
        setNotice(null);
    };

    // Runs the form's own checks and returns what would be sent, or null with the errors shown.
    const buildInput = () => {
        if (!fields) return null;

        const whatsapp = normalizeWhatsapp(fields.adminWhatsapp);

        if (fields.adminWhatsapp.trim() && !isValidWhatsapp(whatsapp)) {
            setErrors({ adminWhatsapp: 'Nomor WhatsApp tidak valid.' });
            toast.add({ type: 'error', title: 'Periksa isian formulir yang ditandai.' });

            return null;
        }

        const durationErrors: SettingsErrors = {};

        for (const name of DURATION_FIELDS) {
            const message = durationTextError(fields[name], true);

            if (message) durationErrors[name] = message;
        }

        if (Object.keys(durationErrors).length > 0) {
            setErrors(durationErrors);
            toast.add({ type: 'error', title: 'Periksa isian formulir yang ditandai.' });

            return null;
        }

        const registrationMinutes = durationTextToMinutes(fields.registrationCloseMinutes) ?? 0;
        const cancellationMinutes = durationTextToMinutes(fields.cancellationCloseMinutes) ?? 0;
        const attendanceMinutes = durationTextToMinutes(fields.attendanceOpenMinutes) ?? 0;

        // The API checks this too; saying it here saves a round trip. Attendance may not open earlier than registration closes.
        if (attendanceMinutes > registrationMinutes) {
            setErrors({
                attendanceOpenMinutes: `Waktu buka absensi tidak boleh lebih besar dari batas member mendaftar (${formatMinutesDuration(registrationMinutes)}).`,
            });
            toast.add({ type: 'error', title: 'Periksa isian formulir yang ditandai.' });

            return null;
        }

        return {
            registrationCloseMinutes: registrationMinutes,
            cancellationCloseMinutes: cancellationMinutes,
            attendanceOpenMinutes: attendanceMinutes,
            engagedWindowMonths: Number(fields.engagedWindowMonths),
            adminWhatsapp: fields.adminWhatsapp.trim() ? whatsapp : null,
            whatsappGroupUrl: fields.whatsappGroupUrl.trim() || null,
            faqContent: fields.faqContent,
            privacyPolicyContent: fields.privacyPolicyContent,
            rulesSummary: fields.rulesSummary,
        };
    };

    const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        if (isSaving) return;
        if (buildInput()) setConfirmOpen(true);
    };

    const confirmSubmit = async () => {
        if (isSaving) return;
        const input = buildInput();

        if (!input) {
            setConfirmOpen(false);
            return;
        }

        setIsSaving(true);
        setErrors({});
        setNotice(null);

        try {
            const response = await putSettings(input);

            setSettings(response.data);
            setFields(toFields(response.data));
            setNotice({ tone: 'success', text: 'Pengaturan disimpan dan langsung berlaku untuk semua member.' });
        } catch (error) {
            const next: SettingsErrors = {};

            for (const name of FIELD_NAMES) {
                const message = fieldErrorMessage(error, name);

                if (message) next[name] = message;
            }

            setErrors(next);

            if (Object.keys(next).length === 0) setNotice({ tone: 'error', text: errorMessage(error) });
            else toast.add({ type: 'error', title: 'Periksa isian formulir yang ditandai.' });
        } finally {
            setIsSaving(false);
            setConfirmOpen(false);
        }
    };

    return (
        <PageContext.Provider
            value={{
                settings,
                fields,
                errors,
                failure,
                isLoading,
                isSaving,
                notice,
                setField,
                handleSubmit,
                isConfirmOpen,
                confirmSubmit,
                closeConfirm: () => setConfirmOpen(false),
                reload: () => setReloadToken((token) => token + 1),
            }}
        >
            {children}
        </PageContext.Provider>
    );
};

export const usePageContext = (): PageContextValue => {
    const context = useContext(PageContext);

    if (!context) throw new Error('usePageContext harus digunakan di dalam PageContextProvider.');

    return context;
};
