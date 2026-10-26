import { Link, useParams } from '@tanstack/react-router';
import { EllipsisVertical, LoaderCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { AlertMessage } from '@/components/molecules/alert-message';
import { CancelReasonField } from '@/components/molecules/cancel-reason-field';
import { ConfirmationDialog } from '@/components/molecules/confirmation-dialog';
import { EventFormSections } from '@/components/molecules/event-form-sections';
import { EventTypeCard } from '@/components/molecules/event-type-card';
import { FeedbackToast } from '@/components/molecules/feedback-toast';
import { PermissionGate } from '@/components/molecules/permission-gate';
import { RequiredNote } from '@/components/molecules/required-mark';
import { StatusBadge } from '@/components/molecules/status-badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EVENT_STATUS_TONES } from '@/constants/event';
import { PERMISSIONS as P } from '@/constants/permission';
import { ROUTES } from '@/constants/route';
import { usePermissions } from '@/hooks/usePermissions';
import { formatEventDateTime } from '@/utils/date';

import { usePageContext } from '../_context';
import { useFormContext } from '../_form-context';

export const PageContent = () => {
    const { event, failure, isLoading, reload } = usePageContext();

    if (failure) {
        return (
            <div className="max-w-xl space-y-3">
                <FeedbackToast data-test-id="event_edit_alert_load_error">{failure.message}</FeedbackToast>
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
    const { can } = usePermissions();
    const { eventId } = useParams({ strict: false });
    const {
        event,
        options,
        notice,
        isCancelDialogOpen,
        isCancelling,
        cancelError,
        cancelReason,
        setCancelReason,
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
                <FeedbackToast revision={notice} tone={submitError ? 'error' : (notice?.tone ?? 'error')} data-test-id="event_edit_alert_notice">
                    {submitError ?? notice?.text}
                </FeedbackToast>
            )}

            <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.7fr_1fr]">
                <EventFormSections
                    form={form}
                    formats={options?.formats ?? []}
                    timezones={options?.timezones ?? []}
                    disabled={isSubmitting}
                    data-test-id="event_edit"
                />

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
                        <div className="flex items-center gap-2">
                            {isDraft ? (
                                <>
                                    <PermissionGate permission={P.EVENT_PUBLISH}>
                                        <Button
                                            type="button"
                                            className="h-11 min-w-0 flex-1 px-3 font-semibold"
                                            disabled={isSubmitting || form.registration.requiresReload}
                                            onClick={() => void save(true)}
                                            data-test-id="event_edit_button_publish"
                                        >
                                            {isSubmitting && <LoaderCircle className="animate-spin" />}
                                            Publikasikan
                                        </Button>
                                    </PermissionGate>
                                    <Button
                                        type="submit"
                                        variant="outline"
                                        className="bg-card h-11 min-w-0 flex-1 px-3"
                                        disabled={isSubmitting || form.registration.requiresReload}
                                        data-test-id="event_edit_button_save_draft"
                                    >
                                        Simpan Draf
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    type="submit"
                                    className="h-11 min-w-0 flex-1 px-3 font-semibold"
                                    disabled={isSubmitting || form.registration.requiresReload}
                                    data-test-id="event_edit_button_save"
                                >
                                    {isSubmitting && <LoaderCircle className="animate-spin" />}
                                    Simpan Perubahan
                                </Button>
                            )}
                            <EventActionsMenu
                                canCancel={can(P.EVENT_CANCEL) && event.actions.canCancel}
                                isDuplicating={isDuplicating}
                                onDuplicate={() => void duplicate()}
                                onCopyAnnouncement={() => void copyAnnouncement()}
                                onCancel={() => setCancelDialogOpen(true)}
                            />
                        </div>
                    </section>

                    <EventTypeCard form={form} isSlugLocked data-test-id="event_edit_type" />

                    <section className="border-border bg-card space-y-2 rounded-lg border p-5" data-test-id="event_edit_registration">
                        <h2 className="font-semibold">Jadwal pendaftaran member</h2>
                        {event.registration.closesAt && event.registration.adminAddUntil ? (
                            <dl className="space-y-4 text-sm">
                                <div className="space-y-1">
                                    <dt>Daftar dan batal ditutup</dt>
                                    <dd className="font-mono text-xs">{formatEventDateTime(event.registration.closesAt, event.timezone)}</dd>
                                </div>
                                <div className="space-y-1">
                                    <dt>Admin masih bisa menambah sampai</dt>
                                    <dd className="font-mono text-xs">{formatEventDateTime(event.registration.adminAddUntil, event.timezone)}</dd>
                                </div>
                            </dl>
                        ) : (
                            <p className="text-muted-foreground text-sm">Isi waktu mulai untuk melihat jadwal pendaftaran.</p>
                        )}
                        <p className="text-muted-foreground text-xs">Aturan ini diambil dari Pengaturan dan berlaku untuk semua kegiatan.</p>
                    </section>
                </div>
            </div>

            <ConfirmationDialog
                open={can(P.EVENT_CANCEL) && isCancelDialogOpen}
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
            >
                <CancelReasonField
                    value={cancelReason}
                    onChange={setCancelReason}
                    disabled={isCancelling}
                    data-test-id="event_edit_dialog_cancel_reason"
                />
            </ConfirmationDialog>
        </form>
    );
};

interface EventActionsMenuProps {
    canCancel: boolean;
    isDuplicating: boolean;
    onDuplicate: () => void;
    onCopyAnnouncement: () => void;
    onCancel: () => void;
}

const EventActionsMenu = ({ canCancel, isDuplicating, onDuplicate, onCopyAnnouncement, onCancel }: EventActionsMenuProps) => {
    const { can } = usePermissions();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        containerRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();

        const handlePointerDown = (event: PointerEvent) => {
            if (event.target instanceof Node && !containerRef.current?.contains(event.target)) {
                setIsOpen(false);
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
                triggerRef.current?.focus();
            }
        };

        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    const runAction = (action: () => void) => {
        setIsOpen(false);
        action();
    };

    return (
        <div ref={containerRef} className="relative">
            <Button
                ref={triggerRef}
                type="button"
                variant="outline"
                size="icon"
                className="bg-card h-11 w-11"
                aria-label="Buka menu lainnya"
                aria-haspopup="menu"
                aria-expanded={isOpen}
                aria-controls="event-edit-more-menu"
                onClick={() => setIsOpen((currentValue) => !currentValue)}
                data-test-id="event_edit_button_more"
            >
                <EllipsisVertical className="size-5" />
            </Button>

            {isOpen && (
                <div
                    id="event-edit-more-menu"
                    role="menu"
                    aria-label="Lainnya"
                    className="border-border bg-popover absolute top-full right-0 z-20 mt-2 w-60 rounded-md border p-1 shadow-lg"
                    data-test-id="event_edit_menu_more"
                >
                    <p className="text-muted-foreground px-3 py-2 text-xs font-semibold tracking-wide uppercase">Lainnya</p>
                    {can(P.EVENT_DUPLICATE) && (
                        <button
                            type="button"
                            role="menuitem"
                            className="hover:bg-accent focus-visible:bg-accent focus-visible:ring-ring w-full rounded-sm px-3 py-2 text-left text-sm outline-hidden focus-visible:ring-2"
                            disabled={isDuplicating}
                            onClick={() => runAction(onDuplicate)}
                            data-test-id="event_edit_button_duplicate"
                        >
                            {isDuplicating ? 'Menduplikasi…' : 'Duplikat kegiatan'}
                        </button>
                    )}
                    <button
                        type="button"
                        role="menuitem"
                        className="hover:bg-accent focus-visible:bg-accent focus-visible:ring-ring w-full rounded-sm px-3 py-2 text-left text-sm outline-hidden focus-visible:ring-2"
                        onClick={() => runAction(onCopyAnnouncement)}
                        data-test-id="event_edit_button_copy_announcement"
                    >
                        Salin teks pengumuman
                    </button>
                    {canCancel && (
                        <button
                            type="button"
                            role="menuitem"
                            className="text-destructive hover:bg-destructive/5 focus-visible:bg-destructive/5 focus-visible:ring-destructive w-full rounded-sm px-3 py-2 text-left text-sm outline-hidden focus-visible:ring-2"
                            onClick={() => runAction(onCancel)}
                            data-test-id="event_edit_button_cancel_event"
                        >
                            Batalkan kegiatan
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
