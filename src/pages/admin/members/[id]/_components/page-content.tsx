import { Link } from '@tanstack/react-router';

import { FeedbackToast } from '@/components/molecules/feedback-toast';
import { StatusBadge } from '@/components/molecules/status-badge';
import { WhatsappButton } from '@/components/molecules/whatsapp-button';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MEMBER_STATUS_TONES } from '@/constants/member';
import { PERMISSIONS as P } from '@/constants/permission';
import { ROUTES } from '@/constants/route';
import { usePermissions } from '@/hooks/usePermissions';
import { memberGreetingMessage, whatsappChatUrl } from '@/utils/string';

import { usePageContext } from '../_context';
import { InternalNote } from './internal-note';
import { MemberHistory } from './member-history';
import { MemberProfile } from './member-profile';
import { MemberStats } from './member-stats';
import { StatusDialogs } from './status-dialogs';

export const PageContent = () => {
    const { can } = usePermissions();
    const { member, failure, isLoading, resetMessage, isSendingReset, sendResetPassword, openStatusDialog, reload } = usePageContext();

    if (failure) {
        return (
            <div className="max-w-xl space-y-3">
                <FeedbackToast data-test-id="member_detail_alert_error">{failure.message}</FeedbackToast>
                <div className="flex gap-2">
                    {!failure.isServerError && (
                        <Button asChild variant="outline">
                            <Link to={ROUTES.members} data-test-id="member_detail_link_back">
                                Kembali ke daftar member
                            </Link>
                        </Button>
                    )}
                    <Button variant="outline" onClick={reload} data-test-id="member_detail_button_retry">
                        Coba lagi
                    </Button>
                </div>
            </div>
        );
    }

    if (isLoading || !member) {
        return (
            <div className="space-y-4" aria-busy="true" data-test-id="member_detail_loading">
                <Skeleton className="h-10 w-72" />
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
                    <Skeleton className="h-96 rounded-lg" />
                    <Skeleton className="h-96 rounded-lg" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <header className="space-y-2">
                <nav aria-label="Breadcrumb" className="text-sm">
                    <Link to={ROUTES.members} className="underline underline-offset-4" data-test-id="member_detail_link_breadcrumb_members">
                        Member
                    </Link>
                    <span className="text-muted-foreground"> / {member.name}</span>
                </nav>

                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl font-semibold">{member.name}</h1>
                        {member.memberNumber && <span className="font-mono text-sm">{member.memberNumber}</span>}
                        <StatusBadge
                            tone={MEMBER_STATUS_TONES[member.status.value]}
                            label={member.status.label}
                            data-test-id="member_detail_badge_status"
                        />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {member.whatsapp && (
                            <WhatsappButton
                                href={whatsappChatUrl(member.whatsapp, memberGreetingMessage(member.name))}
                                label={`Chat ${member.name} lewat WhatsApp`}
                                text="Chat"
                                data-test-id="member_detail_link_chat"
                            />
                        )}
                        {can(P.MEMBER_UPDATE) && member.actions.canEdit && (
                            <Button asChild variant="outline" className="bg-card">
                                <Link to={ROUTES.memberEdit} params={{ memberId: member.id }} data-test-id="member_detail_link_edit">
                                    Edit
                                </Link>
                            </Button>
                        )}
                        {can(P.MEMBER_RESET_PASSWORD) && member.actions.canResetPassword && (
                            <Button
                                variant="outline"
                                className="bg-card"
                                disabled={isSendingReset}
                                title="Kirim link reset password ke email member"
                                onClick={() => void sendResetPassword()}
                                data-test-id="member_detail_button_reset_password"
                            >
                                {isSendingReset ? 'Mengirim…' : 'Reset Password'}
                            </Button>
                        )}
                        {can(P.MEMBER_DEACTIVATE) && member.actions.canDeactivate && (
                            <Button
                                variant="outline"
                                className="bg-card border-destructive text-destructive hover:bg-destructive/5 hover:text-destructive"
                                onClick={() => openStatusDialog('deactivate')}
                                data-test-id="member_detail_button_deactivate"
                            >
                                Nonaktifkan
                            </Button>
                        )}
                        {can(P.MEMBER_ACTIVATE) && member.actions.canActivate && (
                            <Button onClick={() => openStatusDialog('activate')} data-test-id="member_detail_button_activate">
                                Aktifkan
                            </Button>
                        )}
                    </div>
                </div>
            </header>

            {resetMessage && (
                <FeedbackToast revision={resetMessage} tone={resetMessage.tone} data-test-id="member_detail_alert_reset">
                    {resetMessage.text}
                </FeedbackToast>
            )}

            <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.4fr_1fr]">
                <div className="space-y-4">
                    <MemberProfile />
                    <InternalNote />
                </div>
                <div className="space-y-4">
                    <MemberStats />
                    <MemberHistory />
                </div>
            </div>

            <StatusDialogs />
        </div>
    );
};
