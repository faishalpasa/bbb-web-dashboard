import { AdminPageHeader } from '@/components/layout/admin-page-header';
import { LoaderCircle } from 'lucide-react';
import type { ReactNode } from 'react';

import { FeedbackToast } from '@/components/molecules/feedback-toast';
import { FormField } from '@/components/molecules/form-field';
import { PermissionGate } from '@/components/molecules/permission-gate';
import { RequiredNote } from '@/components/molecules/required-mark';
import { RichTextEditor } from '@/components/molecules/rich-text-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { PERMISSIONS as P } from '@/constants/permission';
import { SETTINGS_DEMO_WEEKDAYS } from '@/constants/superadmin';
import { usePermissions } from '@/hooks/usePermissions';
import { durationTextToMinutes, formatLongDate } from '@/utils/date';
import { clockMinusMinutes } from '@/utils/string';

import { type SettingsFieldName, usePageContext } from '../_context';
import { DurationField } from './duration-field';

interface CardProps {
    title: string;
    description: string;
    children: ReactNode;
    'data-test-id': string;
}

const Card = ({ title, description, children, 'data-test-id': testId }: CardProps) => (
    <section className="border-border bg-card space-y-4 rounded-lg border p-4 sm:p-5" data-test-id={testId}>
        <header>
            <h2 className="font-semibold">{title}</h2>
            <p className="text-muted-foreground text-sm">{description}</p>
        </header>
        {children}
    </section>
);

// "Contoh" line under the event rules: a Friday 19.00 event and what the two limits mean for it.
const exampleText = (registration: string, cancellation: string, attendance: string): string => {
    const registerMinutes = durationTextToMinutes(registration);
    const cancelMinutes = durationTextToMinutes(cancellation);
    const attendanceMinutes = durationTextToMinutes(attendance);

    if (registerMinutes === null || cancelMinutes === null || attendanceMinutes === null)
        return 'Isi semua batas dengan benar untuk melihat contohnya.';

    const registerUntil = clockMinusMinutes(SETTINGS_DEMO_WEEKDAYS, 5, 19, registerMinutes);
    const cancelUntil = clockMinusMinutes(SETTINGS_DEMO_WEEKDAYS, 5, 19, cancelMinutes);

    const attendanceFrom = clockMinusMinutes(SETTINGS_DEMO_WEEKDAYS, 5, 19, attendanceMinutes);
    const limits =
        registerUntil === cancelUntil
            ? `member bisa mendaftar dan membatalkan sampai ${registerUntil}`
            : `member bisa mendaftar sampai ${registerUntil} dan membatalkan sampai ${cancelUntil}`;

    return `Contoh: kegiatan Jumat 19.00 WIB, ${limits}, dan mengisi absensi mulai ${attendanceFrom}.`;
};

export const PageContent = () => {
    const { can } = usePermissions();
    const { settings, fields, errors, failure, isLoading, isSaving, notice, setField, handleSubmit, reload } = usePageContext();

    const durationField = (name: SettingsFieldName, label: string, hint?: string) =>
        fields && (
            <DurationField
                id={name}
                label={label}
                hint={hint}
                error={errors[name]}
                value={fields[name]}
                onChange={(value) => setField(name, value)}
            />
        );

    if (failure) {
        return (
            <div className="max-w-xl space-y-3">
                <FeedbackToast data-test-id="settings_alert_error">{failure.message}</FeedbackToast>
                <Button variant="outline" onClick={reload} data-test-id="settings_button_retry">
                    Coba lagi
                </Button>
            </div>
        );
    }

    if (isLoading || !fields || !settings) {
        return (
            <div className="space-y-4" aria-busy="true" data-test-id="settings_loading">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-48 rounded-lg" />
                <Skeleton className="h-40 rounded-lg" />
            </div>
        );
    }

    return (
        <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
                if (can(P.SETTING_UPDATE)) void handleSubmit(event);
                else event.preventDefault();
            }}
            noValidate
            data-test-id="settings_form"
        >
            <fieldset disabled={!can(P.SETTING_UPDATE) || isSaving} className="contents">
                <AdminPageHeader data-test-id="settings_header">
                    <header className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold">Pengaturan</h1>
                            <p className="text-muted-foreground text-sm">Perubahan pengaturan langsung berlaku untuk semua member.</p>
                            <div className="mt-2">
                                <RequiredNote />
                            </div>
                        </div>
                        <PermissionGate permission={P.SETTING_UPDATE}>
                            <Button type="submit" disabled={isSaving} data-test-id="settings_button_save">
                                {isSaving && <LoaderCircle className="animate-spin" />}
                                Simpan Pengaturan
                            </Button>
                        </PermissionGate>
                    </header>
                </AdminPageHeader>

                {notice && (
                    <FeedbackToast revision={notice} tone={notice.tone} data-test-id="settings_alert_notice">
                        {notice.text}
                    </FeedbackToast>
                )}

                <div className="space-y-4">
                    <Card
                        title="Aturan kegiatan"
                        description="Berlaku untuk semua kegiatan. Admin tetap bisa menambah peserta sampai akhir hari acara."
                        data-test-id="settings_card_events"
                    >
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            {durationField('registrationCloseMinutes', 'Batas member mendaftar (sebelum acara)')}
                            {durationField('cancellationCloseMinutes', 'Batas member membatalkan (sebelum acara)')}
                            {durationField(
                                'attendanceOpenMinutes',
                                'Absensi dibuka (sebelum acara)',
                                'Tidak boleh lebih besar dari batas member mendaftar.',
                            )}
                        </div>
                        <p className="bg-secondary/70 rounded-md px-3 py-2 text-sm" data-test-id="settings_text_example">
                            {exampleText(fields.registrationCloseMinutes, fields.cancellationCloseMinutes, fields.attendanceOpenMinutes)}
                        </p>
                    </Card>

                    <Card
                        title="Kontak admin"
                        description="Dipakai di tombol Hubungi Admin, halaman status, dan email ke member."
                        data-test-id="settings_card_contact"
                    >
                        <FormField
                            id="adminWhatsapp"
                            label="Nomor WhatsApp admin"
                            isOptional
                            hint="Nomor Indonesia. Disimpan sebagai 62812... untuk tautan WhatsApp."
                            error={errors.adminWhatsapp}
                            data-test-id="settings_admin_whatsapp"
                        >
                            <Input
                                id="adminWhatsapp"
                                type="tel"
                                inputMode="tel"
                                value={fields.adminWhatsapp}
                                onChange={(event) => setField('adminWhatsapp', event.target.value.replace(/\D/g, ''))}
                                placeholder="081234567000"
                                className="bg-card h-11 max-w-xs font-mono"
                                data-test-id="settings_input_admin_whatsapp"
                            />
                        </FormField>
                    </Card>

                    <Card
                        title="Link grup"
                        description="Link grup sering berganti. Pastikan link masih aktif sebelum menyimpan, karena member baru langsung memakainya."
                        data-test-id="settings_card_links"
                    >
                        <FormField
                            id="whatsappGroupUrl"
                            label="Link grup WhatsApp"
                            isOptional
                            hint="Harus diawali https://chat.whatsapp.com/"
                            error={errors.whatsappGroupUrl}
                            data-test-id="settings_whatsapp_group_url"
                        >
                            <Input
                                id="whatsappGroupUrl"
                                type="url"
                                value={fields.whatsappGroupUrl}
                                onChange={(event) => setField('whatsappGroupUrl', event.target.value)}
                                placeholder="https://chat.whatsapp.com/..."
                                className="bg-card h-11 font-mono"
                                data-test-id="settings_input_whatsapp_group_url"
                            />
                        </FormField>
                    </Card>

                    <Card
                        title="Aturan komunitas, FAQ, dan Kebijakan Data Pribadi"
                        description="Ketiganya dibuka sebagai popup dari menu profil member. Aturan Komunitas juga tampil di halaman sukses daftar dan di email konfirmasi (sebagai teks biasa)."
                        data-test-id="settings_card_rules"
                    >
                        <FormField
                            id="rulesSummary"
                            label="Aturan Komunitas"
                            isOptional
                            error={errors.rulesSummary}
                            data-test-id="settings_rules_summary"
                        >
                            <RichTextEditor
                                id="rulesSummary"
                                value={fields.rulesSummary}
                                onChange={(html) => setField('rulesSummary', html)}
                                aria-label="Isi Aturan Komunitas"
                                data-test-id="settings_editor_rules"
                            />
                        </FormField>
                        <FormField id="faqContent" label="FAQ" isOptional error={errors.faqContent} data-test-id="settings_faq_content">
                            <RichTextEditor
                                id="faqContent"
                                value={fields.faqContent}
                                onChange={(html) => setField('faqContent', html)}
                                aria-label="Isi FAQ"
                                data-test-id="settings_editor_faq"
                            />
                        </FormField>
                        <FormField
                            id="privacyPolicyContent"
                            label="Kebijakan Data Pribadi"
                            isOptional
                            error={errors.privacyPolicyContent}
                            data-test-id="settings_privacy_content"
                        >
                            <RichTextEditor
                                id="privacyPolicyContent"
                                value={fields.privacyPolicyContent}
                                onChange={(html) => setField('privacyPolicyContent', html)}
                                aria-label="Isi Kebijakan Data Pribadi"
                                data-test-id="settings_editor_privacy"
                            />
                        </FormField>
                        <p className="text-sm" data-test-id="settings_text_rules_version">
                            Versi aturan <span className="font-mono">{settings.rulesVersion}</span>
                        </p>
                    </Card>

                    <p className="text-muted-foreground text-sm" data-test-id="settings_text_updated">
                        Terakhir diubah oleh {settings.updatedBy} pada {formatLongDate(settings.updatedAt)}. Setiap perubahan tercatat di Log.
                    </p>
                </div>
            </fieldset>
        </form>
    );
};
