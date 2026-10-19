import { LoaderCircle } from 'lucide-react';
import type { ReactNode } from 'react';

import { AlertMessage } from '@/components/molecules/alert-message';
import { FormField } from '@/components/molecules/form-field';
import { PermissionGate } from '@/components/molecules/permission-gate';
import { RequiredNote } from '@/components/molecules/required-mark';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { PERMISSIONS as P } from '@/constants/permission';
import { SETTINGS_DEMO_WEEKDAYS } from '@/constants/superadmin';
import { usePermissions } from '@/hooks/usePermissions';
import { formatLongDate } from '@/utils/date';
import { clockMinusMinutes } from '@/utils/string';

import { type SettingsFieldName, usePageContext } from '../_context';

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
const exampleText = (registration: string, cancellation: string): string => {
    const toNumber = (value: string): number | null => (value.trim() !== '' && Number.isFinite(Number(value)) ? Number(value) : null);
    const registerMinutes = toNumber(registration);
    const cancelMinutes = toNumber(cancellation);

    if (registerMinutes === null || cancelMinutes === null) return 'Isi kedua batas untuk melihat contohnya.';

    const registerUntil = clockMinusMinutes(SETTINGS_DEMO_WEEKDAYS, 5, 19, registerMinutes);
    const cancelUntil = clockMinusMinutes(SETTINGS_DEMO_WEEKDAYS, 5, 19, cancelMinutes);

    return registerUntil === cancelUntil
        ? `Contoh: kegiatan Jumat 19.00 WIB, member bisa mendaftar dan membatalkan sampai ${registerUntil}.`
        : `Contoh: kegiatan Jumat 19.00 WIB, member bisa mendaftar sampai ${registerUntil} dan membatalkan sampai ${cancelUntil}.`;
};

export const PageContent = () => {
    const { can } = usePermissions();
    const { settings, fields, errors, failure, isLoading, isSaving, notice, setField, handleSubmit, reload } = usePageContext();

    const numberField = (name: SettingsFieldName, id: string, label: string) =>
        fields && (
            <FormField id={id} label={label} error={errors[name]} data-test-id={`settings_${id}`}>
                <Input
                    id={id}
                    inputMode="numeric"
                    value={fields[name]}
                    aria-required="true"
                    onChange={(event) => setField(name, event.target.value.replace(/\D/g, ''))}
                    className="bg-card h-11 font-mono"
                    data-test-id={`settings_input_${id}`}
                />
            </FormField>
        );

    if (failure) {
        return (
            <div className="max-w-xl space-y-3">
                <AlertMessage data-test-id="settings_alert_error">{failure.message}</AlertMessage>
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
                <Skeleton className="h-48 max-w-3xl rounded-lg" />
                <Skeleton className="h-40 max-w-3xl rounded-lg" />
            </div>
        );
    }

    return (
        <form
            className="space-y-4"
            onSubmit={(event) => {
                if (can(P.SETTING_UPDATE)) void handleSubmit(event);
                else event.preventDefault();
            }}
            noValidate
            data-test-id="settings_form"
        >
            <fieldset disabled={!can(P.SETTING_UPDATE) || isSaving} className="contents">
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

                {notice && (
                    <AlertMessage tone={notice.tone} data-test-id="settings_alert_notice">
                        {notice.text}
                    </AlertMessage>
                )}

                <div className="max-w-3xl space-y-4">
                    <Card
                        title="Aturan kegiatan"
                        description="Berlaku untuk semua kegiatan. Admin tetap bisa menambah peserta sampai akhir hari acara."
                        data-test-id="settings_card_events"
                    >
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            {numberField('registrationCloseMinutes', 'registrationCloseMinutes', 'Batas member mendaftar (menit sebelum acara)')}
                            {numberField('cancellationCloseMinutes', 'cancellationCloseMinutes', 'Batas member membatalkan (menit sebelum acara)')}
                            {numberField('engagedWindowMonths', 'engagedWindowMonths', 'Member terlibat (hadir dalam N bulan terakhir)')}
                        </div>
                        <p className="bg-secondary/70 rounded-md px-3 py-2 text-sm" data-test-id="settings_text_example">
                            {exampleText(fields.registrationCloseMinutes, fields.cancellationCloseMinutes)}
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
                                inputMode="numeric"
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
                        <FormField
                            id="shareRecommendationUrl"
                            label="Link Berbagi Rekomendasi"
                            isOptional
                            hint="Harus diawali https://"
                            error={errors.shareRecommendationUrl}
                            data-test-id="settings_share_recommendation_url"
                        >
                            <Input
                                id="shareRecommendationUrl"
                                type="url"
                                value={fields.shareRecommendationUrl}
                                onChange={(event) => setField('shareRecommendationUrl', event.target.value)}
                                placeholder="https://..."
                                className="bg-card h-11 font-mono"
                                data-test-id="settings_input_share_recommendation_url"
                            />
                        </FormField>
                    </Card>

                    <Card
                        title="Aturan komunitas"
                        description="Ringkasan tampil di halaman sukses daftar dan di email konfirmasi."
                        data-test-id="settings_card_rules"
                    >
                        <FormField
                            id="rulesSummary"
                            label="Ringkasan aturan"
                            isOptional
                            error={errors.rulesSummary}
                            data-test-id="settings_rules_summary"
                        >
                            <Textarea
                                id="rulesSummary"
                                value={fields.rulesSummary}
                                maxLength={5000}
                                onChange={(event) => setField('rulesSummary', event.target.value)}
                                placeholder="[Tulis ringkasan aturan komunitas di sini.]"
                                className="min-h-32"
                                data-test-id="settings_input_rules_summary"
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
