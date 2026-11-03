import { FormField } from '@/components/molecules/form-field';
import { ReadingProfileSection } from '@/components/molecules/reading-profile-section';
import { SearchableSelect } from '@/components/molecules/searchable-select';
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
        countries,
        regencies,
        districts,
        villages,
        birthYears,
        setField,
        handleDomicileTypeChange,
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
                            inputMode="tel"
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

                <FormField
                    id="participationPreference"
                    label="Preferensi kegiatan"
                    isOptional
                    error={errors.participationPreference}
                    data-test-id={`${testId}_preference`}
                >
                    <NativeSelect
                        id="participationPreference"
                        value={fields.participationPreference}
                        onChange={(event) => setField('participationPreference', event.target.value)}
                        data-test-id={`${testId}_select_preference`}
                    >
                        <option value="">Belum diisi</option>
                        {preferences
                            .filter((option) => option.value !== 'unset')
                            .map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                    </NativeSelect>
                </FormField>
            </section>

            <section className="border-border bg-card space-y-5 rounded-lg border p-4 sm:p-5" data-test-id={`${testId}_domicile`}>
                <h2 className="font-semibold">Domisili</h2>

                <fieldset className="grid gap-2 sm:max-w-xs">
                    <legend className="mb-2 text-sm leading-none font-medium">Tinggal di</legend>
                    {(
                        [
                            { value: 'indonesia', label: 'Indonesia' },
                            { value: 'overseas', label: 'Luar negeri' },
                        ] as const
                    ).map((option) => (
                        <label
                            key={option.value}
                            className="border-input bg-card has-[:checked]:border-foreground has-[:focus-visible]:ring-ring flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-3 text-sm has-[:focus-visible]:ring-2"
                        >
                            <input
                                type="radio"
                                name="domicileType"
                                value={option.value}
                                checked={fields.domicileType === option.value}
                                onChange={() => handleDomicileTypeChange(option.value)}
                                disabled={disabled}
                                className="accent-primary size-4"
                                data-test-id={`${testId}_radio_domicile_${option.value}`}
                            />
                            {option.label}
                        </label>
                    ))}
                </fieldset>

                {fields.domicileType === 'overseas' ? (
                    <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
                        <FormField id="country" label="Negara" error={errors.countryCode} data-test-id={`${testId}_country`}>
                            <SearchableSelect
                                id="country"
                                value={fields.countryCode}
                                options={countries.map((country) => ({ value: country.code, label: country.name }))}
                                onChange={(code) => setField('countryCode', code)}
                                placeholder="Pilih negara"
                                searchPlaceholder="Cari negara…"
                                emptyText="Negara tidak ditemukan."
                                aria-required="true"
                                data-test-id={`${testId}_select_country`}
                            />
                        </FormField>
                        <FormField id="overseasCity" label="Kota" isOptional error={errors.overseasCity} data-test-id={`${testId}_overseas_city`}>
                            <Input
                                id="overseasCity"
                                maxLength={120}
                                value={fields.overseasCity}
                                onChange={(event) => setField('overseasCity', event.target.value)}
                                className="bg-card h-11"
                                data-test-id={`${testId}_input_overseas_city`}
                            />
                        </FormField>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
                        <FormField id="province" label="Provinsi" error={errors.provinceCode} data-test-id={`${testId}_province`}>
                            <SearchableSelect
                                id="province"
                                value={fields.provinceCode}
                                options={provinces.map((option) => ({ value: option.code, label: option.label }))}
                                onChange={(code) => void handleProvinceChange(code)}
                                placeholder="Pilih provinsi"
                                searchPlaceholder="Cari provinsi…"
                                emptyText="Provinsi tidak ditemukan."
                                aria-required="true"
                                data-test-id={`${testId}_select_province`}
                            />
                        </FormField>

                        <FormField id="regency" label="Kabupaten atau kota" error={errors.regencyCode} data-test-id={`${testId}_regency`}>
                            <SearchableSelect
                                id="regency"
                                value={fields.regencyCode}
                                options={regencies.map((option) => ({ value: option.code, label: option.label }))}
                                onChange={(code) => void handleRegencyChange(code)}
                                placeholder={fields.provinceCode ? 'Pilih kabupaten atau kota' : 'Pilih provinsi dulu'}
                                searchPlaceholder="Cari kabupaten atau kota…"
                                emptyText="Kabupaten atau kota tidak ditemukan."
                                disabled={!fields.provinceCode}
                                aria-required="true"
                                data-test-id={`${testId}_select_regency`}
                            />
                        </FormField>

                        <FormField id="district" label="Kecamatan" error={errors.districtCode} data-test-id={`${testId}_district`}>
                            <SearchableSelect
                                id="district"
                                value={fields.districtCode}
                                options={districts.map((option) => ({ value: option.code, label: option.label }))}
                                onChange={(code) => void handleDistrictChange(code)}
                                placeholder={fields.regencyCode ? 'Pilih kecamatan' : 'Pilih kabupaten atau kota dulu'}
                                searchPlaceholder="Cari kecamatan…"
                                emptyText="Kecamatan tidak ditemukan."
                                disabled={!fields.regencyCode}
                                aria-required="true"
                                data-test-id={`${testId}_select_district`}
                            />
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
                )}
            </section>
            <ReadingProfileSection form={form.reading} disabled={disabled} data-test-id={`${testId}_reading`} />
        </div>
    );
};
