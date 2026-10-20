import { Link } from '@tanstack/react-router';
import { LoaderCircle } from 'lucide-react';

import { AlertMessage } from '@/components/molecules/alert-message';
import { MemberFormSections } from '@/components/molecules/member-form-sections';
import { RequiredNote } from '@/components/molecules/required-mark';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ROUTES } from '@/constants/route';

import { usePageContext } from '../_context';

export const PageContent = () => {
    const {
        form,
        preferences,
        sendInvitation,
        consentAcknowledged,
        isSubmitting,
        submitError,
        setSendInvitation,
        setConsentAcknowledged,
        handleSubmit,
    } = usePageContext();

    return (
        <form className="space-y-4" onSubmit={handleSubmit} noValidate data-test-id="member_new_form">
            <header className="space-y-2">
                <nav aria-label="Breadcrumb" className="text-sm">
                    <Link to={ROUTES.members} className="underline underline-offset-4" data-test-id="member_new_link_breadcrumb_members">
                        Member
                    </Link>
                    <span className="text-muted-foreground"> / Member baru</span>
                </nav>
                <h1 className="text-2xl font-semibold">Member baru</h1>
                <RequiredNote />
            </header>

            {(submitError || form.regionError) && (
                <AlertMessage data-test-id="member_new_alert_error">{submitError ?? form.regionError}</AlertMessage>
            )}

            <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.86fr_1fr]">
                <MemberFormSections form={form} preferences={preferences} isEmailEditable disabled={isSubmitting} data-test-id="member_new" />

                <div className="space-y-4">
                    <section className="border-border bg-card space-y-4 rounded-lg border p-5" data-test-id="member_new_account">
                        <h2 className="font-semibold">Akun dan persetujuan</h2>

                        <label className="flex cursor-pointer items-start gap-3 text-sm">
                            <Checkbox
                                checked={sendInvitation}
                                onCheckedChange={(checked) => setSendInvitation(checked === true)}
                                className="mt-0.5"
                                data-test-id="member_new_checkbox_invitation"
                            />
                            Kirim email undangan supaya member bisa membuat password sendiri
                        </label>
                        <label className="flex cursor-pointer items-start gap-3 text-sm">
                            <Checkbox
                                checked={consentAcknowledged}
                                onCheckedChange={(checked) => setConsentAcknowledged(checked === true)}
                                className="mt-0.5"
                                data-test-id="member_new_checkbox_consent"
                            />
                            Member sudah menyetujui Aturan Komunitas dan Kebijakan Data Pribadi
                        </label>

                        <p className="bg-secondary/70 rounded-md p-3 text-sm">
                            Tanpa undangan, member tetap terdata. Saat mendaftar atau masuk dengan email yang sama, akunnya otomatis tersambung ke
                            data ini.
                        </p>
                    </section>

                    <section className="border-border bg-card space-y-4 rounded-lg border p-5" data-test-id="member_new_actions">
                        <p className="text-sm">Nomor anggota (BFF-xxxxx) dibuat otomatis setelah disimpan. Status awal member: Aktif.</p>
                        <div className="grid gap-2">
                            <Button type="submit" className="h-11 w-full font-semibold" disabled={isSubmitting} data-test-id="member_new_button_save">
                                {isSubmitting && <LoaderCircle className="animate-spin" />}
                                Simpan Member
                            </Button>
                            <Button asChild variant="outline" className="bg-card h-11 w-full">
                                <Link to={ROUTES.members} data-test-id="member_new_link_cancel">
                                    Batal
                                </Link>
                            </Button>
                        </div>
                    </section>
                </div>
            </div>
        </form>
    );
};
