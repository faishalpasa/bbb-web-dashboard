import { type ChangeEvent, useRef } from 'react';

import { DateTimeField } from '@/components/molecules/date-time-field';
import { FormField } from '@/components/molecules/form-field';
import { RegistrationFormBuilder } from '@/components/molecules/registration-form-builder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { EventForm } from '@/hooks/useEventForm';
import { cn } from '@/lib/utils';
import type { SelectOption } from '@/types/api';
import { NUMBER_INPUT_PROPS } from '@/utils/number-input';

interface EventFormSectionsProps {
    form: EventForm;
    formats: SelectOption[];
    timezones: SelectOption[];
    disabled?: boolean;
    'data-test-id': string;
}

const Section = ({ title, children, 'data-test-id': testId }: { title: string; children: React.ReactNode; 'data-test-id': string }) => (
    <section className="border-border bg-card space-y-5 rounded-lg border p-4 sm:p-5" data-test-id={testId}>
        <h2 className="font-semibold">{title}</h2>
        {children}
    </section>
);

interface ToggleRowProps {
    id: string;
    label: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    'data-test-id': string;
}

const ToggleRow = ({ id, label, description, checked, onChange, 'data-test-id': testId }: ToggleRowProps) => (
    <div className="flex items-start gap-3">
        <Switch id={id} checked={checked} onCheckedChange={onChange} aria-labelledby={`${id}-label`} className="mt-0.5" data-test-id={testId} />
        <div>
            <Label id={`${id}-label`} htmlFor={id} className="cursor-pointer text-sm font-medium">
                {label}
            </Label>
            <p className="text-muted-foreground text-sm">{description}</p>
        </div>
    </div>
);

export const EventFormSections = ({ form, formats, timezones, disabled = false, 'data-test-id': testId }: EventFormSectionsProps) => {
    const { fields, errors, isUploadingBanner, isGeneratingCode, codeError, setField, setTitle, regenerateCode, uploadBanner } = form;
    const bannerInput = useRef<HTMLInputElement>(null);

    const handleBannerChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        event.target.value = '';

        if (file) void uploadBanner(file);
    };

    return (
        <fieldset disabled={disabled} className="min-w-0 space-y-4">
            <legend className="sr-only">Data kegiatan</legend>
            <Section title="Informasi" data-test-id={`${testId}_information`}>
                <FormField id="title" label="Judul" error={errors.title} data-test-id={`${testId}_title`}>
                    <Input
                        id="title"
                        value={fields.title}
                        aria-required="true"
                        autoComplete="off"
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="Judul kegiatan"
                        className="bg-card h-11"
                        data-test-id={`${testId}_input_title`}
                    />
                </FormField>

                <FormField id="description" label="Deskripsi" isOptional error={errors.description} data-test-id={`${testId}_description`}>
                    <Textarea
                        id="description"
                        value={fields.description}
                        onChange={(event) => setField('description', event.target.value)}
                        placeholder="Teks biasa. Baris baru akan tampil apa adanya."
                        className="min-h-28"
                        data-test-id={`${testId}_input_description`}
                    />
                </FormField>

                <div className="grid gap-2" data-test-id={`${testId}_banner`}>
                    <Label className="text-sm font-medium">Banner</Label>
                    <div className="flex flex-wrap items-center gap-4">
                        <div
                            className="border-input bg-secondary/60 text-muted-foreground flex aspect-video w-48 shrink-0 items-center justify-center overflow-hidden rounded-md border border-dashed text-xs"
                            data-test-id={`${testId}_banner_preview`}
                        >
                            {fields.bannerUrl ? (
                                <img src={fields.bannerUrl} alt="Pratinjau banner" className="size-full object-cover" />
                            ) : (
                                'Rasio 16:9'
                            )}
                        </div>
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="bg-card"
                                    disabled={isUploadingBanner}
                                    onClick={() => bannerInput.current?.click()}
                                    data-test-id={`${testId}_button_upload_banner`}
                                >
                                    {isUploadingBanner ? 'Mengunggah…' : 'Unggah banner'}
                                </Button>
                                {fields.bannerUrl && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setField('bannerUrl', '')}
                                        data-test-id={`${testId}_button_remove_banner`}
                                    >
                                        Hapus
                                    </Button>
                                )}
                            </div>
                            <p className="text-muted-foreground text-xs">JPG atau PNG. Ukuran disesuaikan otomatis.</p>
                        </div>
                        <input
                            ref={bannerInput}
                            type="file"
                            accept="image/png,image/jpeg"
                            className="hidden"
                            onChange={handleBannerChange}
                            data-test-id={`${testId}_input_banner`}
                        />
                    </div>
                    {errors.bannerUrl && (
                        <p className="text-sm text-red-600" data-test-id={`${testId}_banner_error`}>
                            {errors.bannerUrl}
                        </p>
                    )}
                </div>
            </Section>

            <Section title="Waktu" data-test-id={`${testId}_schedule`}>
                <div className="grid max-w-lg gap-4">
                    <FormField id="startsAt" label="Mulai" error={errors.startsAt} data-test-id={`${testId}_starts_at`}>
                        <DateTimeField
                            id="startsAt"
                            value={fields.startsAt}
                            onChange={(value) => setField('startsAt', value)}
                            invalid={Boolean(errors.startsAt)}
                            data-test-id={`${testId}_input_starts_at`}
                        />
                    </FormField>
                    <FormField id="endsAt" label="Selesai" error={errors.endsAt} data-test-id={`${testId}_ends_at`}>
                        <DateTimeField
                            id="endsAt"
                            value={fields.endsAt}
                            onChange={(value) => setField('endsAt', value)}
                            invalid={Boolean(errors.endsAt)}
                            data-test-id={`${testId}_input_ends_at`}
                        />
                    </FormField>
                    <FormField id="timezone" label="Zona waktu" error={errors.timezone} data-test-id={`${testId}_timezone`}>
                        <NativeSelect
                            id="timezone"
                            value={fields.timezone}
                            aria-required="true"
                            onChange={(event) => setField('timezone', event.target.value as EventForm['fields']['timezone'])}
                            data-test-id={`${testId}_select_timezone`}
                        >
                            {timezones.map((zone) => (
                                <option key={zone.value} value={zone.value}>
                                    {zone.label}
                                </option>
                            ))}
                        </NativeSelect>
                    </FormField>
                </div>
                <p className="text-muted-foreground -mt-2 text-sm">Jam diisi sesuai zona waktu acara, dalam pilihan per 30 menit.</p>
            </Section>

            <Section title="Lokasi" data-test-id={`${testId}_location`}>
                <fieldset className="grid gap-2" data-test-id={`${testId}_format`}>
                    <legend className="mb-2 text-sm leading-none font-medium">Jenis kegiatan</legend>
                    <div className="flex gap-2">
                        {formats.map((option) => (
                            <label
                                key={option.value}
                                className={cn(
                                    'border-input bg-card has-[:checked]:border-foreground has-[:checked]:bg-secondary has-[:focus-visible]:ring-ring flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm has-[:focus-visible]:ring-2',
                                )}
                            >
                                <input
                                    type="radio"
                                    name="format"
                                    value={option.value}
                                    checked={fields.format === option.value}
                                    onChange={() => setField('format', option.value as EventForm['fields']['format'])}
                                    className="accent-foreground size-4"
                                    data-test-id={`${testId}_radio_format_${option.value}`}
                                />
                                {option.label}
                            </label>
                        ))}
                    </div>
                </fieldset>

                {fields.format === 'offline' && (
                    <>
                        <FormField id="venueName" label="Nama tempat" error={errors.venueName} data-test-id={`${testId}_venue_name`}>
                            <Input
                                id="venueName"
                                value={fields.venueName}
                                aria-required="true"
                                onChange={(event) => setField('venueName', event.target.value)}
                                placeholder="Nama tempat"
                                className="bg-card h-11"
                                data-test-id={`${testId}_input_venue_name`}
                            />
                        </FormField>
                        <FormField id="address" label="Alamat" error={errors.address} data-test-id={`${testId}_address`}>
                            <Input
                                id="address"
                                value={fields.address}
                                aria-required="true"
                                onChange={(event) => setField('address', event.target.value)}
                                placeholder="Alamat lengkap"
                                className="bg-card h-11"
                                data-test-id={`${testId}_input_address`}
                            />
                        </FormField>
                    </>
                )}

                <FormField
                    id="mapUrl"
                    label={fields.format === 'online' ? 'Link meeting' : 'Link Maps'}
                    isOptional={fields.format === 'offline'}
                    hint="Untuk kegiatan online, isi link meeting. Link hanya tampil untuk peserta yang sudah terdaftar."
                    error={errors.mapUrl}
                    data-test-id={`${testId}_map_url`}
                >
                    <Input
                        id="mapUrl"
                        type="url"
                        value={fields.mapUrl}
                        aria-required={fields.format === 'online'}
                        onChange={(event) => setField('mapUrl', event.target.value)}
                        placeholder="https://maps.app.goo.gl/..."
                        className="bg-card h-11 font-mono"
                        data-test-id={`${testId}_input_map_url`}
                    />
                </FormField>
            </Section>

            <Section title="Kuota" data-test-id={`${testId}_quota`}>
                <ToggleRow
                    id="usesQuota"
                    label="Pakai kuota peserta"
                    description="Jika dimatikan, informasi kuota tidak tampil di aplikasi member dan halaman publik."
                    checked={fields.usesQuota}
                    onChange={(checked) => setField('usesQuota', checked)}
                    data-test-id={`${testId}_switch_quota`}
                />
                {fields.usesQuota && (
                    <FormField
                        id="capacity"
                        label="Kapasitas peserta"
                        hint="Tidak bisa diturunkan di bawah jumlah peserta yang sudah terdaftar."
                        error={errors.capacity}
                        data-test-id={`${testId}_capacity`}
                    >
                        <Input
                            id="capacity"
                            {...NUMBER_INPUT_PROPS}
                            value={fields.capacity}
                            aria-required="true"
                            onChange={(event) => setField('capacity', event.target.value.replace(/\D/g, ''))}
                            className="bg-card h-11 w-40 font-mono"
                            data-test-id={`${testId}_input_capacity`}
                        />
                    </FormField>
                )}
            </Section>

            <Section title="Absensi kehadiran" data-test-id={`${testId}_attendance`}>
                <FormField
                    id="attendanceCode"
                    label="Kode kehadiran"
                    hint="Huruf dan angka tanpa spasi. Panitia membagikan kode ini saat acara berlangsung, lalu member memasukkannya untuk mencatat kehadiran."
                    error={errors.attendanceCode ?? codeError ?? undefined}
                    data-test-id={`${testId}_attendance_code`}
                >
                    <div className="flex gap-2">
                        <Input
                            id="attendanceCode"
                            value={fields.attendanceCode}
                            maxLength={12}
                            aria-required="true"
                            autoComplete="off"
                            onChange={(event) => setField('attendanceCode', event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                            className="bg-card h-11 flex-1 font-mono tracking-wider"
                            data-test-id={`${testId}_input_attendance_code`}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            className="bg-card h-11"
                            disabled={isGeneratingCode}
                            onClick={() => void regenerateCode()}
                            data-test-id={`${testId}_button_random_code`}
                        >
                            Buat Kode Acak
                        </Button>
                    </div>
                </FormField>
            </Section>
            <RegistrationFormBuilder builder={form.registration} disabled={disabled} />
        </fieldset>
    );
};
