import { Link } from '@tanstack/react-router';

import { CancelReasonField } from '@/components/molecules/cancel-reason-field';
import { ConfirmationDialog } from '@/components/molecules/confirmation-dialog';
import { FeedbackToast } from '@/components/molecules/feedback-toast';
import { StatusBadge } from '@/components/molecules/status-badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EVENT_STATUS_TONES } from '@/constants/event';
import { PERMISSIONS as P } from '@/constants/permission';
import { ROUTES } from '@/constants/route';
import { usePermissions } from '@/hooks/usePermissions';
import { formatEventRange } from '@/utils/date';
import { publicEventUrl } from '@/utils/event';

import { usePageContext } from '../_context';
import { AddParticipantDialog } from './add-participant-dialog';
import { ParticipantDetailDialog } from './participant-detail-dialog';
import { ParticipantTable } from './participant-table';

export const PageContent = () => {
    const { can } = usePermissions();
    const {
        event,
        failure,
        isLoading,
        summary,
        notice,
        isCloseDialogOpen,
        isClosing,
        closeError,
        setCloseDialogOpen,
        closeEvent,
        openAddDialog,
        copyText,
        reload,
        duplicateEvent,
        isDuplicating,
        cancelEvent,
        isCancelling,
        isCancelDialogOpen,
        setCancelDialogOpen,
        cancelError,
        cancelReason,
        setCancelReason,
    } = usePageContext();

    if (failure) {
        return (
            <div className="max-w-xl space-y-3">
                <FeedbackToast data-test-id="event_detail_alert_error">{failure.message}</FeedbackToast>
                <div className="flex gap-2">
                    {!failure.isServerError && (
                        <Button asChild variant="outline">
                            <Link to={ROUTES.events} data-test-id="event_detail_link_back">
                                Kembali ke daftar kegiatan
                            </Link>
                        </Button>
                    )}
                    <Button variant="outline" onClick={reload} data-test-id="event_detail_button_retry">
                        Coba lagi
                    </Button>
                </div>
            </div>
        );
    }

    if (isLoading || !event) {
        return (
            <div className="space-y-4" aria-busy="true" data-test-id="event_detail_loading">
                <Skeleton className="h-10 w-72" />
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {[0, 1, 2, 3].map((index) => (
                        <Skeleton key={index} className="h-24 rounded-lg" />
                    ))}
                </div>
                <Skeleton className="h-80 rounded-lg" />
            </div>
        );
    }

    const publicUrl = publicEventUrl(event.slug);
    const place = event.format.value === 'offline' ? [event.venueName, event.address].filter(Boolean).join(', ') : 'Online';

    return (
        <div className="space-y-4">
            <header className="space-y-2">
                <nav aria-label="Breadcrumb" className="text-sm">
                    <Link to={ROUTES.events} className="underline underline-offset-4" data-test-id="event_detail_link_breadcrumb_events">
                        Kegiatan
                    </Link>
                    <span className="text-muted-foreground"> / {can(P.EVENT_PARTICIPANT_VIEW) ? 'Peserta' : 'Detail'}</span>
                </nav>

                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
                    <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-2xl font-semibold">{event.title}</h1>
                            <StatusBadge
                                tone={EVENT_STATUS_TONES[event.status.value]}
                                label={event.status.label}
                                data-test-id="event_detail_badge_status"
                            />
                        </div>
                        <p className="text-muted-foreground text-sm" data-test-id="event_detail_text_schedule">
                            {event.startsAt ? `${formatEventRange(event.startsAt, event.endsAt, event.timezone)}. ` : ''}
                            {place ? `${event.format.label}, ${place}.` : ''}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {can(P.EVENT_UPDATE) && event.actions.canEdit && (
                            <Button asChild variant="outline" className="bg-card">
                                <Link to={ROUTES.eventEdit} params={{ eventId: event.id }} data-test-id="event_detail_link_edit">
                                    Edit Kegiatan
                                </Link>
                            </Button>
                        )}
                        {can(P.EVENT_PARTICIPANT_CREATE) && event.actions.canAddParticipants && (
                            <Button variant="outline" className="bg-card" onClick={openAddDialog} data-test-id="event_detail_button_add_participant">
                                Tambah Peserta
                            </Button>
                        )}
                        {can(P.EVENT_CLOSE) && event.actions.canClose && (
                            <Button onClick={() => setCloseDialogOpen(true)} data-test-id="event_detail_button_close">
                                Tutup Acara
                            </Button>
                        )}
                        {can(P.EVENT_DUPLICATE) && (
                            <Button
                                variant="warning"
                                disabled={isDuplicating}
                                onClick={() => void duplicateEvent()}
                                data-test-id="event_detail_button_duplicate"
                            >
                                {isDuplicating ? 'Menduplikasi…' : 'Duplikat Kegiatan'}
                            </Button>
                        )}
                        {can(P.EVENT_CANCEL) && event.actions.canCancel && (
                            <Button variant="destructive" onClick={() => setCancelDialogOpen(true)} data-test-id="event_detail_button_cancel">
                                Batalkan Kegiatan
                            </Button>
                        )}
                    </div>
                </div>
            </header>

            {notice && (
                <FeedbackToast revision={notice} tone={notice.tone} data-test-id="event_detail_alert_notice">
                    {notice.text}
                </FeedbackToast>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-[1fr_1fr_1fr_1.5fr]">
                {[
                    { key: 'registered', label: 'Terdaftar', value: String(summary?.registered ?? event.registered) },
                    { key: 'attended', label: 'Hadir', value: String(summary?.attended ?? event.present) },
                    {
                        key: 'capacity',
                        label: 'Kapasitas',
                        value: (summary?.capacity ?? event.capacity) === null ? 'Tanpa kuota' : String(summary?.capacity ?? event.capacity),
                    },
                ].map((card) => (
                    <section key={card.key} className="border-border bg-card rounded-lg border p-4" data-test-id={`event_detail_card_${card.key}`}>
                        <h2 className="text-sm">{card.label}</h2>
                        <p className="font-mono text-2xl font-semibold">{card.value}</p>
                    </section>
                ))}
                <p className="bg-secondary/70 rounded-lg p-4 text-sm sm:col-span-3 lg:col-span-1" data-test-id="event_detail_text_note">
                    Peserta yang belum ditandai akan menjadi Tidak hadir saat acara ditutup. Salah tandai bisa dibatalkan dengan tombol X, bahkan
                    setelah acara ditutup.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.6fr]">
                <section
                    className="border-border bg-card flex items-center justify-between gap-3 rounded-lg border p-4"
                    data-test-id="event_detail_code"
                >
                    <div>
                        <h2 className="text-sm">Kode kehadiran</h2>
                        <p className="font-mono text-2xl font-semibold tracking-wider">{event.attendanceCode}</p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void copyText(event.attendanceCode, 'Kode kehadiran')}
                        data-test-id="event_detail_button_copy_code"
                    >
                        Salin
                    </Button>
                </section>
                <section
                    className="border-border bg-card flex items-center justify-between gap-3 rounded-lg border p-4"
                    data-test-id="event_detail_public_link"
                >
                    <div className="min-w-0">
                        <h2 className="text-sm">Link pendaftaran publik (member dan non-member)</h2>
                        <p className="wrap-anywhere font-mono text-sm underline" title={publicUrl}>
                            {publicUrl}
                        </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => void copyText(publicUrl, 'Link')} data-test-id="event_detail_button_copy_link">
                        Salin
                    </Button>
                </section>
            </div>

            {can(P.EVENT_PARTICIPANT_VIEW) && <ParticipantTable />}
            {can(P.EVENT_PARTICIPANT_CREATE) && <AddParticipantDialog />}
            {can(P.EVENT_PARTICIPANT_VIEW) && <ParticipantDetailDialog />}

            <ConfirmationDialog
                open={can(P.EVENT_CANCEL) && isCancelDialogOpen}
                onClose={() => setCancelDialogOpen(false)}
                onConfirm={() => void cancelEvent()}
                title="Batalkan kegiatan?"
                description="Seluruh peserta terdaftar akan diberi tahu lewat email."
                confirmLabel="Batalkan Kegiatan"
                cancelLabel="Kembali"
                isSubmitting={isCancelling}
                error={cancelError}
                isDestructive
                data-test-id="event_detail_dialog_cancel"
            >
                <CancelReasonField
                    value={cancelReason}
                    onChange={setCancelReason}
                    disabled={isCancelling}
                    data-test-id="event_detail_dialog_cancel_reason"
                />
            </ConfirmationDialog>
            <ConfirmationDialog
                open={can(P.EVENT_CLOSE) && isCloseDialogOpen}
                onClose={() => setCloseDialogOpen(false)}
                onConfirm={() => void closeEvent()}
                title="Tutup acara?"
                description="Peserta yang belum ditandai hadir akan menjadi Tidak hadir dan statistik kehadiran dihitung final. Tanda hadir masih bisa dikoreksi setelah acara ditutup."
                confirmLabel="Tutup Acara"
                cancelLabel="Batal"
                isSubmitting={isClosing}
                error={closeError}
                data-test-id="event_detail_dialog_close"
            />
        </div>
    );
};
