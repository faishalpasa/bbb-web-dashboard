import { FormField } from '@/components/molecules/form-field';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import type { ReadingProfileForm } from '@/hooks/useReadingProfile';

const selectorKey = (name: string) => name.replace(/[A-Z]/g, (letter) => '_' + letter.toLowerCase());

interface ReadingProfileSectionProps {
    form: ReadingProfileForm;
    disabled?: boolean;
    'data-test-id': string;
}

export const ReadingProfileSection = ({ form, disabled = false, 'data-test-id': testId }: ReadingProfileSectionProps) => {
    const { fields, errors, options, setField, toggleInterest } = form;
    const otherSelected =
        options?.readingInterests.some((option) => option.code === 'other' && fields.readingInterestIds.includes(option.id)) ?? false;
    return (
        <fieldset disabled={disabled || !options} className="border-border bg-card min-w-0 space-y-5 rounded-lg border p-4" data-test-id={testId}>
            <legend className="sr-only">Profil tambahan dan minat bacaan</legend>
            <h2 className="font-semibold">Profil tambahan dan minat bacaan</h2>
            <p className="text-muted-foreground text-sm">Opsional. Ibu boleh melengkapinya sekarang atau nanti.</p>
            {(['instagramAccount', 'websiteUrl', 'goodreadsAccount'] as const).map((name) => (
                <FormField
                    key={name}
                    id={`${testId}-${name}`}
                    label={{ instagramAccount: 'Akun Instagram', websiteUrl: 'Website / weblog', goodreadsAccount: 'Akun Goodreads' }[name]}
                    isOptional
                    error={errors[name]}
                    data-test-id={`${testId}_${selectorKey(name)}`}
                >
                    <Input
                        className="bg-card h-11"
                        id={`${testId}-${name}`}
                        value={fields[name]}
                        type={name === 'websiteUrl' ? 'url' : 'text'}
                        maxLength={name === 'websiteUrl' ? 2048 : 255}
                        onChange={(event) => setField(name, event.target.value)}
                        aria-invalid={!!errors[name]}
                        aria-describedby={errors[name] ? `${testId}-${name}-error` : undefined}
                        data-test-id={`${testId}_input_${selectorKey(name)}`}
                    />
                </FormField>
            ))}
            <FormField
                id={`${testId}-favoriteBooksAuthors`}
                label="Buku atau penulis favorit"
                isOptional
                error={errors.favoriteBooksAuthors}
                data-test-id={`${testId}_favorite_books_authors`}
            >
                <Textarea
                    id={`${testId}-favoriteBooksAuthors`}
                    maxLength={5000}
                    value={fields.favoriteBooksAuthors}
                    aria-invalid={!!errors.favoriteBooksAuthors}
                    aria-describedby={errors.favoriteBooksAuthors ? `${testId}-favoriteBooksAuthors-error` : undefined}
                    onChange={(event) => setField('favoriteBooksAuthors', event.target.value)}
                    data-test-id={`${testId}_input_favorite_books_authors`}
                />
            </FormField>
            {(['literacyParticipationInterest', 'preferredContactChannel'] as const).map((name) => (
                <FormField
                    key={name}
                    id={`${testId}-${name}`}
                    label={name === 'literacyParticipationInterest' ? 'Ingin berpartisipasi di komunitas literasi?' : 'Saluran komunikasi pilihan'}
                    isOptional
                    error={errors[name]}
                    data-test-id={`${testId}_${selectorKey(name)}`}
                >
                    <NativeSelect
                        id={`${testId}-${name}`}
                        value={fields[name]}
                        aria-invalid={!!errors[name]}
                        aria-describedby={errors[name] ? `${testId}-${name}-error` : undefined}
                        onChange={(event) => setField(name, event.target.value)}
                        data-test-id={`${testId}_select_${selectorKey(name)}`}
                    >
                        <option value="">Belum diisi</option>
                        {(name === 'literacyParticipationInterest'
                            ? options?.literacyParticipationInterests
                            : options?.preferredContactChannels
                        )?.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </NativeSelect>
                </FormField>
            ))}
            <fieldset className="min-w-0 space-y-2" aria-describedby={errors.readingInterestIds ? `${testId}-interests-error` : undefined}>
                <legend className="mb-2 text-sm font-medium">Minat bacaan (boleh pilih lebih dari satu)</legend>
                <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                    {options?.readingInterests.map((option) => (
                        <label key={option.id} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
                            <input
                                type="checkbox"
                                className="accent-primary size-5 shrink-0"
                                checked={fields.readingInterestIds.includes(option.id)}
                                onChange={(event) => toggleInterest(option.id, event.target.checked)}
                                data-test-id={`${testId}_checkbox_${option.code}`}
                            />
                            <span>{option.label}</span>
                        </label>
                    ))}
                </div>
                {errors.readingInterestIds && (
                    <p id={`${testId}-interests-error`} role="alert" className="text-destructive text-sm">
                        {errors.readingInterestIds}
                    </p>
                )}
            </fieldset>
            {otherSelected && (
                <FormField
                    id={`${testId}-readingInterestOther`}
                    label="Minat bacaan lainnya"
                    error={errors.readingInterestOther}
                    data-test-id={`${testId}_reading_interest_other`}
                >
                    <Textarea
                        id={`${testId}-readingInterestOther`}
                        aria-required="true"
                        aria-invalid={!!errors.readingInterestOther}
                        aria-describedby={errors.readingInterestOther ? `${testId}-readingInterestOther-error` : undefined}
                        maxLength={5000}
                        value={fields.readingInterestOther}
                        onChange={(event) => setField('readingInterestOther', event.target.value)}
                        data-test-id={`${testId}_input_reading_interest_other`}
                    />
                </FormField>
            )}
            {!options && (
                <p role="alert" className="text-destructive text-sm">
                    Pilihan profil belum dimuat. Muat ulang halaman sebelum menyimpan.
                </p>
            )}
        </fieldset>
    );
};
