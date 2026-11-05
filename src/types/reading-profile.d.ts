import type { SelectOption } from '@/types/api';

export interface ReadingInterestOption {
    id: string;
    code: string;
    label: string;
}
export interface ReadingProfileOptions {
    readingInterests: ReadingInterestOption[];
    literacyParticipationInterests: SelectOption[];
    preferredContactChannels: SelectOption[];
}
export interface ReadingProfile {
    instagramAccount: string | null;
    websiteUrl: string | null;
    goodreadsAccount: string | null;
    favoriteBooksAuthors: string | null;
    literacyParticipationInterest: SelectOption | null;
    preferredContactChannel: SelectOption | null;
    readingInterestOther: string | null;
    readingInterests: ReadingInterestOption[];
}
export interface ReadingProfileInput {
    instagramAccount?: string | null;
    websiteUrl?: string | null;
    goodreadsAccount?: string | null;
    favoriteBooksAuthors?: string | null;
    literacyParticipationInterest?: string | null;
    preferredContactChannel?: string | null;
    readingInterestOther?: string | null;
    readingInterestIds?: string[];
}
export interface ReadingProfileFields {
    instagramAccount: string;
    websiteUrl: string;
    goodreadsAccount: string;
    favoriteBooksAuthors: string;
    literacyParticipationInterest: string;
    preferredContactChannel: string;
    readingInterestOther: string;
    readingInterestIds: string[];
}
export type ReadingFieldName = keyof ReadingProfileFields;
export type ReadingProfileErrors = Partial<Record<ReadingFieldName, string>>;
