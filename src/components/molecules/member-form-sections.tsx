import { FormField } from '@/components/molecules/form-field';
import { ReadingProfileSection } from '@/components/molecules/reading-profile-section';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import type { MemberForm } from '@/hooks/useMemberForm';
import { cn } from '@/lib/utils';
import type { SelectOption } from '@/types/api';

interface MemberFormSectionsProps {
    disabled?: boolean;
    form: MemberForm;
    preferences: SelectOption[];
    isEmailEditable: boolean;
    'data-test-id': string;
}

export const MemberFormSections = ({ form, preferences, isEmailEditable, disabled, 'data-test-id': testId }: MemberFormSectionsProps) => {
    const {
        fields,
        errors,
        provinces,
        regencies,
        districts,
        villages,
        birthYears,
        setField,
        handleProvinceChange,
        handleRegencyChange,
        handleDistrictChange,
        handleVillageChange,
    } = form;

    return (
        <div className="space-y-4">
            <section className="border-border bg-card space-y-5 rounded-lg border p-4 sm:p-5" data-test-id={`${testId}_personal`}>
                <h2 className="font-semibold">Data diri</h2>

                <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
                    <FormField id="name" label="Nama lengkap" error={errors.name} data-test-id={`${testId}_name`}>
                        <Input
                            id="name"
                            value={fields.name}
                            aria-required="true"
                            autoComplete="off"
                            onChange={(event) => setField('name', event.target.value)}
                            placeholder="Nama lengkap"
                            className="bg-card h-11"
                            data-test-id={`${testId}_input_name`}
                        />
                    </FormField>

                    <FormField
                        id="birthYear"
                        label="Tahun lahir"
                        hint="Minimal usia 17 tahun."
                        error={errors.birthYear}
                        data-test-id={`${testId}_birth_year`}
                    >
                        <NativeSelect
                            id="birthYear"
                            value={fields.birthYear}
                            aria-required="true"
                            onChange={(event) => setField('birthYear', event.target.value)}
                            data-test-id={`${testId}_select_birth_year`}
                        >
                            <option value="">Pilih tahun lahir</option>
                            {birthYears.map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </NativeSelect>
                    </FormField>

                    <FormField
                        id="email"
                        label="Email"
                        hint={isEmailEditable ? 'Dipakai untuk masuk. Harus unik.' : 'Email tidak bisa diubah di sini.'}
                        error={errors.email}
                        data-test-id={`${testId}_email`}
                    >
                        <Input
                            id="email"
                            type="email"
                            value={fields.email}
                            readOnly={!isEmailEditable}
                            aria-required="true"
                            autoComplete="off"
                            onChange={(event) => setField('email', event.target.value)}
                            placeholder="nama@email.com"
                            className={cn('bg-card h-11', !isEmailEditable && 'bg-secondary text-foreground/80')}
                            data-test-id={`${testId}_input_email`}
                        />
                    </FormField>

                    <FormField
                        id="whatsapp"
                        label="Nomor WhatsApp"
                        hint="Nomor Indonesia. Disimpan sebagai 628xx."
                        error={errors.whatsapp}
                        data-test-id={`${testId}_whatsapp`}
                    >
                        <Input
                            id="whatsapp"
                            type="tel"
                            inputMode="numeric"
                            value={fields.whatsapp}
                            aria-required="true"
                            autoComplete="off"
                            onChange={(event) => setField('whatsapp', event.target.value.replace(/\D/g, ''))}
                            placeholder="081234567890"
                            className="bg-card h-11 font-mono"
                            data-test-id={`${testId}_input_whatsapp`}
                        />
                    </FormField>
                </div>

                <fieldset className="grid min-w-0 gap-2" data-test-id={`${testId}_preference`}>
                    <legend className="mb-2 text-sm leading-none font-medium">Preferensi kegiatan</legend>
                    <div className="flex flex-wrap gap-2">
                        {preferences
                            .filter((option) => option.value !== 'unset')
                            .map((option) => (
                                <label
                                    key={option.value}
                                    className="border-input bg-card has-[:checked]:border-foreground has-[:checked]:bg-secondary has-[:focus-visible]:ring-ring flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm has-[:focus-visible]:ring-2"
                                >
                                    <input
                                        type="radio"
                                        name="participationPreference"
                                        value={option.value}
                                        checked={fields.participationPreference === option.value}
                                        onChange={(event) => setField('participationPreference', event.target.value)}
                                        className="accent-foreground size-4"
                                        data-test-id={`${testId}_radio_preference_${option.value}`}
                                    />
                                    {option.label}
                                </label>
                            ))}
                    </div>
                    {errors.participationPreference && (
                        <p className="text-sm text-red-600" data-test-id={`${testId}_preference_error`}>
                            {errors.participationPreference}
                        </p>
                    )}
                </fieldset>
            </section>

            <section className="border-border bg-card space-y-5 rounded-lg border p-4 sm:p-5" data-test-id={`${testId}_domicile`}>
                <h2 className="font-semibold">Domisili</h2>

                <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
                    <FormField id="province" label="Provinsi" error={errors.provinceCode} data-test-id={`${testId}_province`}>
                        <NativeSelect
                            id="province"
                            value={fields.provinceCode}
                            aria-required="true"
                            onChange={(event) => void handleProvinceChange(event.target.value)}
                            data-test-id={`${testId}_select_province`}
                        >
                            <option value="">Pilih provinsi</option>
                            {provinces.map((province) => (
                                <option key={province.code} value={province.code}>
                                    {province.label}
                                </option>
                            ))}
                        </NativeSelect>
                    </FormField>

                    <FormField id="regency" label="Kabupaten atau kota" error={errors.regencyCode} data-test-id={`${testId}_regency`}>
                        <NativeSelect
                            id="regency"
                            value={fields.regencyCode}
                            disabled={!fields.provinceCode}
                            aria-required="true"
                            onChange={(event) => void handleRegencyChange(event.target.value)}
                            data-test-id={`${testId}_select_regency`}
                        >
                            <option value="">{fields.provinceCode ? 'Pilih kabupaten atau kota' : 'Pilih provinsi dulu'}</option>
                            {regencies.map((regency) => (
                                <option key={regency.code} value={regency.code}>
                                    {regency.label}
                                </option>
                            ))}
                        </NativeSelect>
                    </FormField>

                    <FormField id="district" label="Kecamatan" error={errors.districtCode} data-test-id={`${testId}_district`}>
                        <NativeSelect
                            id="district"
                            value={fields.districtCode}
                            disabled={!fields.regencyCode}
                            aria-required="true"
                            onChange={(event) => void handleDistrictChange(event.target.value)}
                            data-test-id={`${testId}_select_district`}
                        >
                            <option value="">{fields.regencyCode ? 'Pilih kecamatan' : 'Pilih kabupaten atau kota dulu'}</option>
                            {districts.map((district) => (
                                <option key={district.code} value={district.code}>
                                    {district.label}
                                </option>
                            ))}
                        </NativeSelect>
                    </FormField>

                    <FormField id="village" label="Kelurahan" error={errors.villageCode} data-test-id={`${testId}_village`}>
                        <NativeSelect
                            id="village"
                            value={fields.villageCode}
                            disabled={!fields.districtCode}
                            aria-required="true"
                            onChange={(event) => handleVillageChange(event.target.value)}
                            data-test-id={`${testId}_select_village`}
                        >
                            <option value="">{fields.districtCode ? 'Pilih kelurahan' : 'Pilih kecamatan dulu'}</option>
                            {villages.map((village) => (
                                <option key={village.code} value={village.code}>
                                    {village.label} - {village.postalCode}
                                </option>
                            ))}
                        </NativeSelect>
                    </FormField>
                </div>
            </section>
            <ReadingProfileSection form={form.reading} disabled={disabled} data-test-id={`${testId}_reading`} />
        </div>
    );
};
