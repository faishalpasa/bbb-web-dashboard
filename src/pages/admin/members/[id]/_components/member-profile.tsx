import type { ReactNode } from 'react';

import { ReadingProfileSummary } from '@/components/molecules/reading-profile-summary';
import { StatusBadge } from '@/components/molecules/status-badge';
import { formatLongDate } from '@/utils/date';
import { formatWhatsapp } from '@/utils/string';

import { usePageContext } from '../_context';

interface ProfileRowProps {
    label: string;
    children: ReactNode;
    'data-test-id': string;
}

const ProfileRow = ({ label, children, 'data-test-id': testId }: ProfileRowProps) => (
    <div
        className="border-border grid grid-cols-1 gap-1 border-b py-2.5 text-sm last:border-b-0 sm:grid-cols-[150px_1fr] sm:gap-4"
        data-test-id={testId}
    >
        <dt className="text-muted-foreground">{label}</dt>
        <dd>{children}</dd>
    </div>
);

export const MemberProfile = () => {
    const { member } = usePageContext();

    if (!member) return null;

    const domicile = [member.district?.label, member.regency?.label, `${member.province?.label ?? ''} ${member.postalCode}`.trim()]
        .filter(Boolean)
        .join(', ');

    return (
        <div className="space-y-4">
            <section className="border-border bg-card rounded-lg border p-5" data-test-id="member_detail_profile">
                <h2 className="mb-2 font-semibold">Data diri</h2>
                <dl>
                    <ProfileRow label="Nama" data-test-id="member_detail_row_name">
                        {member.name}
                    </ProfileRow>
                    <ProfileRow label="Tahun lahir" data-test-id="member_detail_row_birth_year">
                        {member.birthYear}
                    </ProfileRow>
                    <ProfileRow label="Email" data-test-id="member_detail_row_email">
                        <span className="mr-2">{member.email}</span>
                        {member.isEmailVerified && (
                            <StatusBadge tone="success" label="Terverifikasi" data-test-id="member_detail_badge_email_verified" />
                        )}
                    </ProfileRow>
                    <ProfileRow label="No. WhatsApp" data-test-id="member_detail_row_whatsapp">
                        <span className="font-mono">{formatWhatsapp(member.whatsapp)}</span>
                    </ProfileRow>
                    <ProfileRow label="Domisili" data-test-id="member_detail_row_domicile">
                        {domicile}
                    </ProfileRow>
                    <ProfileRow label="Preferensi" data-test-id="member_detail_row_preference">
                        {member.preference?.label ?? <span className="text-[#8a6d1f]">Belum diisi</span>}
                    </ProfileRow>
                    <ProfileRow label="Grup WhatsApp" data-test-id="member_detail_row_whatsapp_group">
                        {member.whatsappGroupJoinedAt ? `Sudah bergabung, ${formatLongDate(member.whatsappGroupJoinedAt)}` : 'Belum bergabung'}
                    </ProfileRow>
                    <ProfileRow label="Daftar lewat" data-test-id="member_detail_row_signup">
                        {member.signupMethod.label}
                    </ProfileRow>
                    <ProfileRow label="Bergabung" data-test-id="member_detail_row_joined">
                        {formatLongDate(member.joinedAt)}
                    </ProfileRow>
                    <ProfileRow label="Persetujuan" data-test-id="member_detail_row_consent">
                        {member.consent
                            ? `Aturan versi ${member.consent.rulesVersion}, ${formatLongDate(member.consent.acceptedAt)}`
                            : 'Belum menyetujui'}
                    </ProfileRow>
                </dl>
            </section>
            <ReadingProfileSummary profile={member} data-test-id="member_detail_reading_summary" />
        </div>
    );
};
