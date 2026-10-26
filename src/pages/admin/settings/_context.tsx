import { createContext, type FormEventHandler, type PropsWithChildren, useContext, useEffect, useState } from 'react';

import { toast } from '@/components/ui/toast';
import { getSettings, putSettings } from '@/services/superadmin';
import type { LoadFailure } from '@/types/api';
import type { AdminSettings } from '@/types/superadmin';
import { errorMessage, fieldErrorMessage, toLoadFailure } from '@/utils/error';
import { isValidWhatsapp, normalizeWhatsapp, toLocalWhatsapp } from '@/utils/string';

export type SettingsFieldName =
    | 'registrationCloseMinutes'
    | 'cancellationCloseMinutes'
    | 'engagedWindowMonths'
    | 'adminWhatsapp'
    | 'whatsappGroupUrl'
    | 'shareRecommendationUrl'
    | 'rulesSummary';

export type SettingsFields = Record<SettingsFieldName, string>;
export type SettingsErrors = Partial<Record<SettingsFieldName, string>>;

const FIELD_NAMES: SettingsFieldName[] = [
    'registrationCloseMinutes',
    'cancellationCloseMinutes',
    'engagedWindowMonths',
    'adminWhatsapp',
    'whatsappGroupUrl',
    'shareRecommendationUrl',
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
    reload: () => void;
}

const PageContext = createContext<PageContextValue | null>(null);

const toFields = (settings: AdminSettings): SettingsFields => ({
    registrationCloseMinutes: String(settings.registrationCloseMinutes),
    cancellationCloseMinutes: String(settings.cancellationCloseMinutes),
    engagedWindowMonths: String(settings.engagedWindowMonths),
    adminWhatsapp: settings.adminWhatsapp ? toLocalWhatsapp(settings.adminWhatsapp) : '',
    whatsappGroupUrl: settings.whatsappGroupUrl ?? '',
    shareRecommendationUrl: settings.shareRecommendationUrl ?? '',
    rulesSummary: settings.rulesSummary,
});

export const PageContextProvider = ({ children }: PropsWithChildren) => {
    const [settings, setSettings] = useState<AdminSettings | null>(null);
    const [fields, setFields] = useState<SettingsFields | null>(null);
    const [errors, setErrors] = useState<SettingsErrors>({});
    const [failure, setFailure] = useState<LoadFailure | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
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

    const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
        event.preventDefault();

        if (!fields) return;

        const whatsapp = normalizeWhatsapp(fields.adminWhatsapp);

        if (fields.adminWhatsapp.trim() && !isValidWhatsapp(whatsapp)) {
            setErrors({ adminWhatsapp: 'Nomor WhatsApp tidak valid.' });
            toast.add({ type: 'error', title: 'Periksa isian formulir yang ditandai.' });

            return;
        }

        setIsSaving(true);
        setErrors({});
        setNotice(null);

        try {
            const response = await putSettings({
                registrationCloseMinutes: Number(fields.registrationCloseMinutes),
                cancellationCloseMinutes: Number(fields.cancellationCloseMinutes),
                engagedWindowMonths: Number(fields.engagedWindowMonths),
                adminWhatsapp: fields.adminWhatsapp.trim() ? whatsapp : null,
                whatsappGroupUrl: fields.whatsappGroupUrl.trim() || null,
                shareRecommendationUrl: fields.shareRecommendationUrl.trim() || null,
                rulesSummary: fields.rulesSummary,
            });

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
