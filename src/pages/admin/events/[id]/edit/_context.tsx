import { useNavigate, useParams } from '@tanstack/react-router';
import { createContext, type PropsWithChildren, useContext, useEffect, useState } from 'react';

import { ROUTES } from '@/constants/route';
import { getEvent, getEventOptions, postCancelEvent, postDuplicateEvent } from '@/services/event';
import type { LoadFailure } from '@/types/api';
import type { EventDetail, EventOptions } from '@/types/event';
import { copyToClipboard } from '@/utils/clipboard';
import { errorMessage, toLoadFailure } from '@/utils/error';
import { buildAnnouncement } from '@/utils/event';

import { EventEditFormProvider } from './_form-context';

interface PageContextValue {
    event: EventDetail | null;
    options: EventOptions | null;
    failure: LoadFailure | null;
    isLoading: boolean;
    notice: { tone: 'success' | 'error'; text: string } | null;
    isCancelDialogOpen: boolean;
    isCancelling: boolean;
    cancelError: string | null;
    isDuplicating: boolean;
    setCancelDialogOpen: (open: boolean) => void;
    duplicate: () => Promise<void>;
    copyAnnouncement: () => Promise<void>;
    cancelEvent: () => Promise<void>;
    reload: () => void;
}

const PageContext = createContext<PageContextValue | null>(null);

export const PageContextProvider = ({ children }: PropsWithChildren) => {
    const { eventId } = useParams({ strict: false });
    const navigate = useNavigate();
    const [event, setEvent] = useState<EventDetail | null>(null);
    const [options, setOptions] = useState<EventOptions | null>(null);
    const [failure, setFailure] = useState<LoadFailure | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notice, setNotice] = useState<PageContextValue['notice']>(null);
    const [isCancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [cancelError, setCancelError] = useState<string | null>(null);
    const [isDuplicating, setIsDuplicating] = useState(false);
    const [reloadToken, setReloadToken] = useState(0);

    useEffect(() => {
        if (!eventId) return;

        let cancelled = false;

        const load = async () => {
            setIsLoading(true);
            setFailure(null);
            // Moving from one event's edit screen to another (after "Duplikat") must not show the previous event's values.
            setEvent((current) => (current?.id === eventId ? current : null));

            try {
                const [eventResponse, optionsResponse] = await Promise.all([getEvent(eventId), getEventOptions()]);

                if (cancelled) return;

                setEvent(eventResponse.data);
                setOptions(optionsResponse.data);
            } catch (error) {
                if (!cancelled) setFailure(toLoadFailure(error));
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        void load();
        return () => {
            cancelled = true;
        };
    }, [eventId, reloadToken]);

    const duplicate = async () => {
        if (!eventId) return;

        setIsDuplicating(true);
        setNotice(null);

        try {
            const response = await postDuplicateEvent(eventId);

            void navigate({ to: ROUTES.eventEdit, params: { eventId: response.data.id } });
        } catch (error) {
            setNotice({ tone: 'error', text: errorMessage(error) });
        } finally {
            setIsDuplicating(false);
        }
    };

    const copyAnnouncement = async () => {
        if (!event) return;

        const isCopied = await copyToClipboard(buildAnnouncement(event));

        setNotice(
            isCopied
                ? { tone: 'success', text: 'Teks pengumuman disalin.' }
                : { tone: 'error', text: 'Teks pengumuman gagal disalin. Salin manual dari halaman publik.' },
        );
    };

    const cancelEvent = async () => {
        if (!eventId) return;

        setIsCancelling(true);
        setCancelError(null);

        try {
            await postCancelEvent(eventId);
            void navigate({ to: ROUTES.eventDetail, params: { eventId } });
        } catch (error) {
            setCancelError(errorMessage(error));
        } finally {
            setIsCancelling(false);
        }
    };

    const value: PageContextValue = {
        event,
        options,
        failure,
        isLoading,
        notice,
        isCancelDialogOpen,
        isCancelling,
        cancelError,
        isDuplicating,
        setCancelDialogOpen: (open) => {
            setCancelError(null);
            setCancelDialogOpen(open);
        },
        duplicate,
        copyAnnouncement,
        cancelEvent,
        reload: () => setReloadToken((token) => token + 1),
    };

    return (
        <PageContext.Provider value={value}>
            {event ? (
                <EventEditFormProvider key={`${event.id}:${reloadToken}`} event={event}>
                    {children}
                </EventEditFormProvider>
            ) : (
                children
            )}
        </PageContext.Provider>
    );
};

export const usePageContext = (): PageContextValue => {
    const context = useContext(PageContext);

    if (!context) throw new Error('usePageContext harus digunakan di dalam PageContextProvider.');

    return context;
};
