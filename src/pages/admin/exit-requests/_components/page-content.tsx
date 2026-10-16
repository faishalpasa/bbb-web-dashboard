import { useAppContext } from '@/app-context';
import { AlertMessage } from '@/components/molecules/alert-message';
import { ConfirmationDialog } from '@/components/molecules/confirmation-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/molecules/dialog';
import { StatusBadge } from '@/components/molecules/status-badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsLargeScreen } from '@/hooks/useIsLargeScreen';
import { cn } from '@/lib/utils';
import { formatLongDate } from '@/utils/date';

import { usePageContext } from '../_context';
import { RejectForm } from './reject-form';

export const PageContent = () => {
    const { session } = useAppContext();
    const isLargeScreen = useIsLargeScreen();
    const {
        list,
        failure,
        isLoading,
        notice,
        approving,
        approveError,
        isApproving,
        rejecting,
        isRejecting,
        openApprove,
        closeApprove,
        confirmApprove,
        openReject,
        closeReject,
        reload,
    } = usePageContext();
    const canReview = session?.can.reviewExitRequests ?? false;
    const items = list?.items ?? [];

    return (
        <div className="space-y-4">
            <header>
                <h1 className="text-2xl font-semibold">Permintaan Keluar</h1>
                {list && (
                    <p className="text-muted-foreground text-sm" data-test-id="exit_requests_text_summary">
                        {list.summary.pendingTotal} permintaan menunggu keputusan
                    </p>
                )}
            </header>

            {notice && (
                <AlertMessage tone="success" data-test-id="exit_requests_alert_notice">
                    {notice}
                </AlertMessage>
            )}

            {failure ? (
                <div className="max-w-xl space-y-3">
                    <AlertMessage data-test-id="exit_requests_alert_error">{failure.message}</AlertMessage>
                    <Button variant="outline" onClick={reload} data-test-id="exit_requests_button_retry">
                        Coba lagi
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_420px]">
                    <div className="space-y-3" aria-busy={isLoading} data-test-id="exit_requests_list">
                        {isLoading && items.length === 0 && [0, 1, 2].map((index) => <Skeleton key={index} className="h-36 rounded-lg" />)}

                        {!isLoading && items.length === 0 && (
                            <p
                                className="border-border bg-card text-muted-foreground rounded-lg border p-6 text-center text-sm"
                                data-test-id="exit_requests_text_empty"
                            >
                                Tidak ada permintaan yang menunggu keputusan.
                            </p>
                        )}

                        {items.map((request) => (
                            <article
                                key={request.id}
                                className={cn(
                                    'border-border bg-card space-y-3 rounded-lg border p-4',
                                    rejecting?.id === request.id && 'border-foreground/40 bg-[#eaf1f1]',
                                )}
                                data-test-id={`exit_requests_card_${request.id}`}
                            >
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="font-semibold">{request.member.name}</h2>
                                        {request.member.memberNumber && <span className="font-mono text-xs">{request.member.memberNumber}</span>}
                                        {request.attempt > 1 && (
                                            <StatusBadge
                                                tone="neutral"
                                                label={`Pengajuan ke-${request.attempt}`}
                                                data-test-id={`exit_requests_badge_attempt_${request.id}`}
                                            />
                                        )}
                                    </div>
                                    <StatusBadge
                                        tone={request.waiting.isOverdue ? 'warning' : 'neutral'}
                                        label={`Menunggu ${request.waiting.days} hari`}
                                        data-test-id={`exit_requests_badge_waiting_${request.id}`}
                                    />
                                </div>

                                <div className="space-y-1 text-sm">
                                    <p className="text-muted-foreground">Diajukan {formatLongDate(request.submittedAt)}</p>
                                    <p>Alasan: {request.reason ?? <span className="text-muted-foreground">[Tidak diisi]</span>}</p>
                                    <p>
                                        Kegiatan mendatang yang terdaftar: <span className="font-mono">{request.upcomingRegistrations}</span>
                                    </p>
                                </div>

                                {canReview && (
                                    <div className="flex gap-2">
                                        <Button onClick={() => openApprove(request)} data-test-id={`exit_requests_button_approve_${request.id}`}>
                                            Setujui
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="bg-card"
                                            onClick={() => openReject(request)}
                                            data-test-id={`exit_requests_button_reject_${request.id}`}
                                        >
                                            Tolak
                                        </Button>
                                    </div>
                                )}
                            </article>
                        ))}
                    </div>

                    {isLargeScreen && rejecting && (
                        <section className="border-border bg-card sticky top-6 rounded-lg border" data-test-id="exit_requests_reject_panel">
                            <h2 className="border-border border-b px-4 py-3 font-semibold">Tolak permintaan {rejecting.member.name}</h2>
                            <div className="p-4">
                                <RejectForm data-test-id="exit_requests_reject_form" />
                            </div>
                        </section>
                    )}
                </div>
            )}

            {!isLargeScreen && (
                <Dialog open={rejecting !== null} onOpenChange={(open) => !open && !isRejecting && closeReject()}>
                    <DialogContent data-test-id="exit_requests_reject_dialog">
                        <DialogHeader>
                            <DialogTitle>Tolak permintaan {rejecting?.member.name}</DialogTitle>
                        </DialogHeader>
                        <div className="px-4 pb-4 sm:px-0 sm:pb-0">
                            <RejectForm data-test-id="exit_requests_reject_dialog_form" />
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            <ConfirmationDialog
                open={approving !== null}
                onClose={closeApprove}
                onConfirm={() => void confirmApprove()}
                title="Setujui permintaan keluar?"
                description={
                    approving
                        ? `${approving.member.name} akan dinonaktifkan dan ${approving.upcomingRegistrations} pendaftaran kegiatan mendatang dibatalkan. Member diberi tahu lewat email.`
                        : ''
                }
                confirmLabel="Setujui"
                cancelLabel="Batal"
                isSubmitting={isApproving}
                error={approveError}
                isDestructive
                data-test-id="exit_requests_dialog_approve"
            />
        </div>
    );
};
