import { Link } from '@tanstack/react-router';
import { LoaderCircle } from 'lucide-react';

import { EventFormSections } from '@/components/molecules/event-form-sections';
import { EventTypeCard } from '@/components/molecules/event-type-card';
import { FeedbackToast } from '@/components/molecules/feedback-toast';
import { PermissionGate } from '@/components/molecules/permission-gate';
import { RequiredNote } from '@/components/molecules/required-mark';
import { StatusBadge } from '@/components/molecules/status-badge';
import { Button } from '@/components/ui/button';
import { EVENT_STATUS_TONES } from '@/constants/event';
import { PERMISSIONS as P } from '@/constants/permission';
import { ROUTES } from '@/constants/route';

import { usePageContext } from '../_context';

export const PageContent = () => {
    const { form, options, isSubmitting, submitError, save } = usePageContext();

    return (
        <form
            className="space-y-4"
            onSubmit={(event) => {
                event.preventDefault();
                void save(false);
            }}
            noValidate
            data-test-id="event_new_form"
        >
            <header className="space-y-2">
                <nav aria-label="Breadcrumb" className="text-sm">
                    <Link to={ROUTES.events} className="underline underline-offset-4" data-test-id="event_new_link_breadcrumb_events">
                        Kegiatan
                    </Link>
                    <span className="text-muted-foreground"> / Kegiatan baru</span>
                </nav>
                <h1 className="text-2xl font-semibold">Kegiatan baru</h1>
                <RequiredNote />
            </header>

            {submitError && <FeedbackToast data-test-id="event_new_alert_error">{submitError}</FeedbackToast>}

            <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.7fr_1fr]">
                <EventFormSections
                    form={form}
                    formats={options?.formats ?? []}
                    timezones={options?.timezones ?? []}
                    disabled={isSubmitting}
                    data-test-id="event_new"
                />

                <div className="space-y-4 lg:sticky lg:top-6">
                    <section className="border-border bg-card space-y-3 rounded-lg border p-5" data-test-id="event_new_status">
                        <h2 className="font-semibold">Status</h2>
                        <StatusBadge tone={EVENT_STATUS_TONES.draft} label="Draf" data-test-id="event_new_badge_status" />
                        <p className="text-sm">Kegiatan berstatus draf belum terlihat oleh member.</p>
                        <div className="grid gap-2">
                            <PermissionGate permission={P.EVENT_PUBLISH}>
                                <Button
                                    type="button"
                                    className="h-11 w-full font-semibold"
                                    disabled={isSubmitting || form.registration.requiresReload}
                                    onClick={() => void save(true)}
                                    data-test-id="event_new_button_publish"
                                >
                                    {isSubmitting && <LoaderCircle className="animate-spin" />}
                                    Publikasikan
                                </Button>
                            </PermissionGate>
                            <Button
                                type="submit"
                                variant="outline"
                                className="bg-card h-11 w-full"
                                disabled={isSubmitting || form.registration.requiresReload}
                                data-test-id="event_new_button_save_draft"
                            >
                                Simpan Draf
                            </Button>
                        </div>
                    </section>

                    <EventTypeCard form={form} isSlugLocked={false} data-test-id="event_new_type" />

                    <section className="border-border bg-card space-y-2 rounded-lg border p-5" data-test-id="event_new_registration">
                        <h2 className="font-semibold">Jadwal pendaftaran member</h2>
                        <p className="text-muted-foreground text-sm">Jadwal tutup pendaftaran dihitung dari pengaturan setelah kegiatan disimpan.</p>
                    </section>
                </div>
            </div>
        </form>
    );
};
