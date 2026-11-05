import type { ReadingProfile } from '@/types/reading-profile';

interface ReadingProfileSummaryProps {
    profile: ReadingProfile;
    'data-test-id': string;
}
export const ReadingProfileSummary = ({ profile, 'data-test-id': testId }: ReadingProfileSummaryProps) => (
    <section className="border-border bg-card min-w-0 space-y-3 rounded-lg border p-4" data-test-id={testId}>
        <h2 className="font-semibold">Profil tambahan dan minat bacaan</h2>
        <dl className="space-y-3 text-sm">
            {[
                ['Instagram', profile.instagramAccount],
                ['Website / weblog', profile.websiteUrl],
                ['Goodreads', profile.goodreadsAccount],
                ['Buku atau penulis favorit', profile.favoriteBooksAuthors],
                ['Partisipasi literasi', profile.literacyParticipationInterest?.label],
                ['Saluran komunikasi', profile.preferredContactChannel?.label],
                ['Minat bacaan', profile.readingInterests?.map((option) => option.label).join(', ')],
                ['Minat bacaan lainnya', profile.readingInterestOther],
            ].map(([label, value]) => (
                <div key={label}>
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="mt-1 min-w-0 [overflow-wrap:anywhere] whitespace-pre-wrap">{value || 'Belum diisi'}</dd>
                </div>
            ))}
        </dl>
    </section>
);
