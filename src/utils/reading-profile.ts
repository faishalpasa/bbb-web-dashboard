import type { ReadingProfile, ReadingProfileErrors, ReadingProfileFields, ReadingProfileInput, ReadingProfileOptions } from '@/types/reading-profile';

export const readingProfileFields = (profile?: ReadingProfile): ReadingProfileFields => ({
    instagramAccount: profile?.instagramAccount ?? '',
    websiteUrl: profile?.websiteUrl ?? '',
    goodreadsAccount: profile?.goodreadsAccount ?? '',
    favoriteBooksAuthors: profile?.favoriteBooksAuthors ?? '',
    literacyParticipationInterest: profile?.literacyParticipationInterest?.value ?? '',
    preferredContactChannel: profile?.preferredContactChannel?.value ?? '',
    readingInterestOther: profile?.readingInterestOther ?? '',
    readingInterestIds: profile?.readingInterests?.map((option) => option.id) ?? [],
});

export const readingProfileInput = (fields: ReadingProfileFields): ReadingProfileInput => ({
    instagramAccount: fields.instagramAccount.trim() || null,
    websiteUrl: fields.websiteUrl.trim() || null,
    goodreadsAccount: fields.goodreadsAccount.trim() || null,
    favoriteBooksAuthors: fields.favoriteBooksAuthors.trim() || null,
    literacyParticipationInterest: fields.literacyParticipationInterest || null,
    preferredContactChannel: fields.preferredContactChannel || null,
    readingInterestOther: fields.readingInterestOther.trim() || null,
    readingInterestIds: [...fields.readingInterestIds],
});

export const validateReadingProfile = (fields: ReadingProfileFields, options: ReadingProfileOptions | null): ReadingProfileErrors => {
    const errors: ReadingProfileErrors = {};
    if (!options) return { readingInterestIds: 'Pilihan profil belum dimuat. Muat ulang halaman sebelum menyimpan.' };
    const limits = {
        instagramAccount: 255,
        goodreadsAccount: 255,
        websiteUrl: 2048,
        favoriteBooksAuthors: 5000,
        readingInterestOther: 5000,
    } as const;
    for (const key of Object.keys(limits) as (keyof typeof limits)[]) {
        if (Array.from(fields[key].trim()).length > limits[key]) errors[key] = `Isian maksimal ${limits[key]} karakter.`;
    }
    if (fields.websiteUrl.trim()) {
        try {
            const url = new URL(fields.websiteUrl.trim());
            if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) errors.websiteUrl = 'Masukkan URL website HTTP atau HTTPS yang valid.';
        } catch {
            errors.websiteUrl = 'Masukkan URL website HTTP atau HTTPS yang valid.';
        }
    }
    const knownIds = new Set(options.readingInterests.map((option) => option.id));
    if (fields.readingInterestIds.some((id) => !knownIds.has(id)) || new Set(fields.readingInterestIds).size !== fields.readingInterestIds.length) {
        errors.readingInterestIds = 'Pilih minat bacaan yang valid dan tidak berulang.';
    }
    const otherId = options.readingInterests.find((option) => option.code === 'other')?.id;
    if (otherId && fields.readingInterestIds.includes(otherId) && !fields.readingInterestOther.trim())
        errors.readingInterestOther = 'Tuliskan minat bacaan lainnya.';
    return errors;
};
