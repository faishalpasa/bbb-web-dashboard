import { Link, useParams } from '@tanstack/react-router';
import { LoaderCircle } from 'lucide-react';

import { AlertMessage } from '@/components/molecules/alert-message';
import { ConfirmationDialog } from '@/components/molecules/confirmation-dialog';
import { EventFormSections } from '@/components/molecules/event-form-sections';
import { EventTypeCard } from '@/components/molecules/event-type-card';
import { RequiredNote } from '@/components/molecules/required-mark';
import { StatusBadge } from '@/components/molecules/status-badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EVENT_STATUS_TONES } from '@/constants/event';
import { ROUTES } from '@/constants/route';
import { formatEventDateTime } from '@/utils/date';

import { usePageContext } from '../_context';
import { useFormContext } from '../_form-context';

export const PageContent = () => {
    const { event, failure, isLoading, reload } = usePageContext();

    if (failure) {
        return (
            <div className="max-w-xl space-y-3">
                <AlertMessage data-test-id="event_edit_alert_load_error">{failure.message}</AlertMessage>
                <div className="flex gap-2">
                    {!failure.isServerError && (
                        <Button asChild variant="outline">
                            <Link to={ROUTES.events} data-test-id="event_edit_link_back">
                                Kembali ke daftar kegiatan
                            </Link>
                        </Button>
                    )}
                    <Button variant="outline" onClick={reload} data-test-id="event_edit_button_retry">
                        Coba lagi
                    </Button>
                </div>
            </div>
        );
    }

    if (isLoading || !event) {
        return (
            <div className="space-y-4" aria-busy="true" data-test-id="event_edit_loading">
                <Skeleton className="h-10 w-72" />
                <Skeleton className="h-96 rounded-lg" />
            </div>
        );
    }

    return <EditForm />;
};

const EditForm = () => {
    const { eventId } = useParams({ strict: false });
    const {
        event,
        options,
        notice,
        isCancelDialogOpen,
        isCancelling,
        cancelError,
        isDuplicating,
        setCancelDialogOpen,
        duplicate,
        copyAnnouncement,
        cancelEvent,
    } = usePageContext();
    const { form, isSubmitting, submitError, save } = useFormContext();

    if (!event || !eventId) return null;

    const isDraft = event.status.value === 'draft';

    if (!event.actions.canEdit) {
        return (
            <div className="max-w-xl space-y-3">
                <AlertMessage data-test-id="event_edit_alert_locked">Kegiatan yang sudah selesai atau dibatalkan tidak bisa diubah.</AlertMessage>
                <Button asChild variant="outline">
                    <Link to={ROUTES.eventDetail} params={{ eventId }} data-test-id="event_edit_link_detail">
                        Lihat peserta
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <form
            className="space-y-4"
            onSubmit={(submitEvent) => {
                submitEvent.preventDefault();
                void save(false);
            }}
            noValidate
            data-test-id="event_edit_form"
        >
            <header className="space-y-2">
                <nav aria-label="Breadcrumb" className="text-sm">
                    <Link to={ROUTES.events} className="underline underline-offset-4" data-test-id="event_edit_link_breadcrumb_events">
                        Kegiatan
                    </Link>
                    <span className="text-muted-foreground"> / </span>
                    <Link
                        to={ROUTES.eventDetail}
                        params={{ eventId }}
                        className="underline underline-offset-4"
                        data-test-id="event_edit_link_breadcrumb_detail"
                    >
                        {event.title}
                    </Link>
                    <span className="text-muted-foreground"> / Edit</span>
                </nav>
                <h1 className="text-2xl font-semibold">Edit kegiatan</h1>
                <RequiredNote />
            </header>

            {(submitError || notice) && (
                <AlertMessage tone={submitError ? 'error' : (notice?.tone ?? 'error')} data-test-id="event_edit_alert_notice">
                    {submitError ?? notice?.text}
                </AlertMessage>
            )}

            <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.7fr_1fr]">
                <EventFormSections form={form} formats={options?.formats ?? []} timezones={options?.timezones ?? []} data-test-id="event_edit" />

                <div className="space-y-4 lg:sticky lg:top-6">
                    <section className="border-border bg-card space-y-3 rounded-lg border p-5" data-test-id="event_edit_status">
                        <h2 className="font-semibold">Status</h2>
                        <StatusBadge
                            tone={EVENT_STATUS_TONES[event.status.value]}
                            label={event.status.label}
                            data-test-id="event_edit_badge_status"
                        />
                        <p className="text-sm">
                            {isDraft ? 'Kegiatan berstatus draf belum terlihat oleh member.' : 'Kegiatan sudah terlihat oleh member.'}
                        </p>
                        <div className="grid gap-2">
                            {isDraft ? (
                                <>
                                    <Button
                                        type="button"
                                        className="h-11 w-full font-semibold"
                                        disabled={isSubmitting}
                                        onClick={() => void save(true)}
                                        data-test-id="event_edit_button_publish"
                                    >
                                        {isSubmitting && <LoaderCircle className="animate-spin" />}
                                        Publikasikan
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="outline"
                                        className="bg-card h-11 w-full"
                                        disabled={isSubmitting}
                                        data-test-id="event_edit_button_save_draft"
                                    >
                                        Simpan Draf
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    type="submit"
                                    className="h-11 w-full font-semibold"
                                    disabled={isSubmitting}
                                    data-test-id="event_edit_button_save"
                                >
                                    {isSubmitting && <LoaderCircle className="animate-spin" />}
                                    Simpan Perubahan
                                </Button>
                            )}
                        </div>
                    </section>

                    <EventTypeCard form={form} isSlugLocked data-test-id="event_edit_type" />

                    <section className="border-border bg-card space-y-2 rounded-lg border p-5" data-test-id="event_edit_registration">
                        <h2 className="font-semibold">Jadwal pendaftaran member</h2>
                        {event.registration.closesAt && event.registration.adminAddUntil ? (
                            <dl className="space-y-1 text-sm">
                                <div className="flex justify-between gap-3">
                                    <dt>Daftar dan batal ditutup</dt>
                                    <dd className="text-right font-mono text-xs">
                                        {formatEventDateTime(event.registration.closesAt, event.timezone)}
                                    </dd>
                                </div>
                                <div className="flex justify-between gap-3">
                                    <dt>Admin masih bisa menambah sampai</dt>
                                    <dd className="text-right font-mono text-xs">
                                        {formatEventDateTime(event.registration.adminAddUntil, event.timezone)}
                                    </dd>
                                </div>
                            </dl>
                        ) : (
                            <p className="text-muted-foreground text-sm">Isi waktu mulai untuk melihat jadwal pendaftaran.</p>
                        )}
                        <p className="text-muted-foreground text-xs">Aturan ini diambil dari Pengaturan dan berlaku untuk semua kegiatan.</p>
                    </section>

                    <section className="border-border bg-card space-y-3 rounded-lg border p-5" data-test-id="event_edit_other">
                        <h2 className="font-semibold">Lainnya</h2>
                        <div className="grid gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="bg-card w-full"
                                disabled={isDuplicating}
                                onClick={() => void duplicate()}
                                data-test-id="event_edit_button_duplicate"
                            >
                                {isDuplicating ? 'Menduplikasi…' : 'Duplikat kegiatan'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="bg-card w-full"
                                onClick={() => void copyAnnouncement()}
                                data-test-id="event_edit_button_copy_announcement"
                            >
                                Salin teks pengumuman
                            </Button>
                            {event.actions.canCancel && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="bg-card border-destructive text-destructive hover:bg-destructive/5 hover:text-destructive w-full"
                                    onClick={() => setCancelDialogOpen(true)}
                                    data-test-id="event_edit_button_cancel_event"
                                >
                                    Batalkan kegiatan
                                </Button>
                            )}
                        </div>
                        <p className="text-muted-foreground text-xs">
                            Membatalkan kegiatan mengirim email ke semua pendaftar dan tidak dihitung sebagai ketidakhadiran.
                        </p>
                    </section>
                </div>
            </div>

            <ConfirmationDialog
                open={isCancelDialogOpen}
                onClose={() => setCancelDialogOpen(false)}
                onConfirm={() => void cancelEvent()}
                title="Batalkan kegiatan?"
                description="Semua pendaftar diberi tahu lewat email dan kegiatan tidak dihitung sebagai ketidakhadiran. Pembatalan tidak bisa diurungkan."
                confirmLabel="Batalkan kegiatan"
                cancelLabel="Tidak jadi"
                isSubmitting={isCancelling}
                error={cancelError}
                isDestructive
                data-test-id="event_edit_dialog_cancel"
            />
        </form>
    );
};
