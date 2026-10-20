import { Link, useParams } from '@tanstack/react-router';
import { LoaderCircle } from 'lucide-react';

import { AlertMessage } from '@/components/molecules/alert-message';
import { MemberFormSections } from '@/components/molecules/member-form-sections';
import { RequiredNote } from '@/components/molecules/required-mark';
import { StatusBadge } from '@/components/molecules/status-badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MEMBER_STATUS_TONES } from '@/constants/member';
import { ROUTES } from '@/constants/route';
import { formatLongDate } from '@/utils/date';

import { usePageContext } from '../_context';
import { useFormContext } from '../_form-context';

export const PageContent = () => {
    const { memberId } = useParams({ strict: false });
    const { member, preferences, failure, isLoading, reload } = usePageContext();

    if (failure) {
        return (
            <div className="max-w-xl space-y-3">
                <AlertMessage data-test-id="member_edit_alert_error">{failure.message}</AlertMessage>
                <div className="flex gap-2">
                    {!failure.isServerError && (
                        <Button asChild variant="outline">
                            <Link to={ROUTES.members} data-test-id="member_edit_link_back">
                                Kembali ke daftar member
                            </Link>
                        </Button>
                    )}
                    <Button variant="outline" onClick={reload} data-test-id="member_edit_button_retry">
                        Coba lagi
                    </Button>
                </div>
            </div>
        );
    }

    if (isLoading || !member || !memberId) {
        return (
            <div className="space-y-4" aria-busy="true" data-test-id="member_edit_loading">
                <Skeleton className="h-10 w-72" />
                <Skeleton className="h-96 rounded-lg" />
            </div>
        );
    }

    return <EditForm memberId={memberId} preferences={preferences} />;
};

interface EditFormProps {
    memberId: string;
    preferences: ReturnType<typeof usePageContext>['preferences'];
}

const EditForm = ({ memberId, preferences }: EditFormProps) => {
    const { member } = usePageContext();
    const { form, isSubmitting, submitError, handleSubmit } = useFormContext();

    if (!member) return null;

    return (
        <form className="space-y-4" onSubmit={handleSubmit} noValidate data-test-id="member_edit_form">
            <header className="space-y-2">
                <nav aria-label="Breadcrumb" className="text-sm">
                    <Link to={ROUTES.members} className="underline underline-offset-4" data-test-id="member_edit_link_breadcrumb_members">
                        Member
                    </Link>
                    <span className="text-muted-foreground"> / </span>
                    <Link
                        to={ROUTES.memberDetail}
                        params={{ memberId }}
                        className="underline underline-offset-4"
                        data-test-id="member_edit_link_breadcrumb_detail"
                    >
                        {member.name}
                    </Link>
                    <span className="text-muted-foreground"> / Edit data</span>
                </nav>
                <h1 className="text-2xl font-semibold">Edit data member</h1>
                <RequiredNote />
            </header>

            {(submitError || form.regionError) && (
                <AlertMessage data-test-id="member_edit_alert_submit">{submitError ?? form.regionError}</AlertMessage>
            )}

            <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.86fr_1fr]">
                <MemberFormSections
                    form={form}
                    preferences={preferences}
                    isEmailEditable={false}
                    disabled={isSubmitting}
                    data-test-id="member_edit"
                />

                <div className="space-y-4">
                    <section className="border-border bg-card space-y-3 rounded-lg border p-5" data-test-id="member_edit_membership">
                        <h2 className="font-semibold">Keanggotaan</h2>
                        <dl className="text-sm">
                            <div className="border-border flex justify-between border-b py-2">
                                <dt>Nomor anggota</dt>
                                <dd className="font-mono">{member.memberNumber ?? '-'}</dd>
                            </div>
                            <div className="border-border flex items-center justify-between border-b py-2">
                                <dt>Status</dt>
                                <dd>
                                    <StatusBadge
                                        tone={MEMBER_STATUS_TONES[member.status.value]}
                                        label={member.status.label}
                                        data-test-id="member_edit_badge_status"
                                    />
                                </dd>
                            </div>
                            <div className="border-border flex justify-between border-b py-2">
                                <dt>Daftar lewat</dt>
                                <dd>{member.signupMethod.label}</dd>
                            </div>
                            <div className="flex justify-between py-2">
                                <dt>Bergabung</dt>
                                <dd>{formatLongDate(member.joinedAt)}</dd>
                            </div>
                        </dl>
                        <p className="text-muted-foreground text-sm">
                            Nomor anggota dan status tidak diubah dari form ini. Untuk status, pakai aksi di halaman detail.
                        </p>
                    </section>

                    <section className="border-border bg-card space-y-4 rounded-lg border p-5" data-test-id="member_edit_actions">
                        <p className="text-sm">Perubahan langsung terlihat oleh member.</p>
                        <div className="grid gap-2">
                            <Button
                                type="submit"
                                className="h-11 w-full font-semibold"
                                disabled={isSubmitting}
                                data-test-id="member_edit_button_save"
                            >
                                {isSubmitting && <LoaderCircle className="animate-spin" />}
                                Simpan Perubahan
                            </Button>
                            <Button asChild variant="outline" className="bg-card h-11 w-full">
                                <Link to={ROUTES.memberDetail} params={{ memberId }} data-test-id="member_edit_link_cancel">
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
