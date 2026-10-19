import { useNavigate, useParams } from '@tanstack/react-router';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { PERMISSIONS as P } from '@/constants/permission';
import { ROUTES } from '@/constants/route';
import { usePermissions } from '@/hooks/usePermissions';
import {
    getEvent,
    getEventMemberOptions,
    getEventParticipants,
    getEventParticipantsExport,
    postCancelEvent,
    postCloseEvent,
    postDuplicateEvent,
    postEventParticipant,
    putParticipantAttendance,
} from '@/services/event';
import type { LoadFailure } from '@/types/api';
import type { EventDetail, EventMemberOption, EventParticipant, EventParticipantList, ParticipantInput, ParticipantSummary } from '@/types/event';
import { copyToClipboard } from '@/utils/clipboard';
import { errorMessage, fieldErrorMessage, toLoadFailure } from '@/utils/error';

const SEARCH_DEBOUNCE_MS = 350;
const MEMBER_SEARCH_LIMIT = 5;

export type AddParticipantTab = 'member' | 'guest';

export interface GuestFields {
    name: string;
    email: string;
    whatsapp: string;
}

export type GuestErrors = Partial<Record<keyof GuestFields, string>>;

interface PageContextValue {
    event: EventDetail | null;
    failure: LoadFailure | null;
    isLoading: boolean;
    participants: EventParticipantList | null;
    participantsFailure: LoadFailure | null;
    isLoadingParticipants: boolean;
    isExporting: boolean;
    page: number;
    searchText: string;
    summary: ParticipantSummary | null;
    notice: { tone: 'success' | 'error'; text: string } | null;
    pendingParticipantIds: string[];
    isCloseDialogOpen: boolean;
    isClosing: boolean;
    closeError: string | null;
    isAddDialogOpen: boolean;
    detailParticipant: EventParticipant | null;
    addTab: AddParticipantTab;
    memberSearch: string;
    memberResults: EventMemberOption[];
    isSearchingMembers: boolean;
    guestFields: GuestFields;
    guestErrors: GuestErrors;
    addError: string | null;
    isAdding: boolean;
    setSearchText: (value: string) => void;
    goToPage: (page: number) => void;
    toggleAttendance: (participantId: string, present: boolean) => Promise<void>;
    exportParticipants: () => Promise<void>;
    copyText: (text: string, label: string) => Promise<void>;
    setCloseDialogOpen: (open: boolean) => void;
    closeEvent: () => Promise<void>;
    duplicateEvent: () => Promise<void>;
    isDuplicating: boolean;
    cancelEvent: () => Promise<void>;
    isCancelling: boolean;
    isCancelDialogOpen: boolean;
    setCancelDialogOpen: (open: boolean) => void;
    cancelError: string | null;
    openAddDialog: () => void;
    openDetail: (participant: EventParticipant) => void;
    closeDetail: () => void;
    closeAddDialog: () => void;
    setAddTab: (tab: AddParticipantTab) => void;
    setMemberSearch: (value: string) => void;
    setGuestField: (name: keyof GuestFields, value: string) => void;
    submitParticipant: (input: ParticipantInput) => Promise<unknown>;
    reload: () => void;
}

const PageContext = createContext<PageContextValue | null>(null);

const EMPTY_GUEST: GuestFields = { name: '', email: '', whatsapp: '' };

export const PageContextProvider = ({ children }: PropsWithChildren) => {
    const navigate = useNavigate();
    const { can } = usePermissions();
    const canViewParticipants = can(P.EVENT_PARTICIPANT_VIEW);
    const canAddParticipants = can(P.EVENT_PARTICIPANT_CREATE);
    const canEditEvent = can(P.EVENT_UPDATE);
    const { eventId } = useParams({ strict: false });
    const [event, setEvent] = useState<EventDetail | null>(null);
    const [failure, setFailure] = useState<LoadFailure | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [participants, setParticipants] = useState<EventParticipantList | null>(null);
    const [participantsFailure, setParticipantsFailure] = useState<LoadFailure | null>(null);
    const [isLoadingParticipants, setIsLoadingParticipants] = useState(true);
    const [page, setPage] = useState(1);
    const [searchText, setSearchText] = useState('');
    const [search, setSearch] = useState('');
    const [summary, setSummary] = useState<ParticipantSummary | null>(null);
    const [notice, setNotice] = useState<PageContextValue['notice']>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [pendingParticipantIds, setPendingParticipantIds] = useState<string[]>([]);
    const [isCloseDialogOpen, setCloseDialogOpenState] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [closeError, setCloseError] = useState<string | null>(null);
    const [isDuplicating, setIsDuplicating] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [isCancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [cancelError, setCancelError] = useState<string | null>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [detailParticipant, setDetailParticipant] = useState<EventParticipant | null>(null);
    const [addTab, setAddTab] = useState<AddParticipantTab>('member');
    const [memberSearch, setMemberSearch] = useState('');
    const [memberResults, setMemberResults] = useState<EventMemberOption[]>([]);
    const [isSearchingMembers, setIsSearchingMembers] = useState(false);
    const [guestFields, setGuestFields] = useState<GuestFields>(EMPTY_GUEST);
    const [guestErrors, setGuestErrors] = useState<GuestErrors>({});
    const [addError, setAddError] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [reloadToken, setReloadToken] = useState(0);
    const latestParticipantsRequest = useRef(0);

    useEffect(() => {
        if (!eventId) return;

        const load = async () => {
            setIsLoading(true);
            setFailure(null);

            try {
                setEvent((await getEvent(eventId)).data);
            } catch (error) {
                setFailure(toLoadFailure(error));
            } finally {
                setIsLoading(false);
            }
        };

        void load();
    }, [eventId, reloadToken]);

    useEffect(() => {
        const requestId = ++latestParticipantsRequest.current;
        if (!eventId || !canViewParticipants) {
            setParticipants(null);
            setSummary(null);
            setIsLoadingParticipants(false);
            return;
        }

        const load = async () => {
            setIsLoadingParticipants(true);
            setParticipantsFailure(null);

            try {
                const response = await getEventParticipants(eventId, { search, page });

                if (requestId !== latestParticipantsRequest.current) return;

                setParticipants(response.data);
                setSummary(response.data.summary);
            } catch (error) {
                if (requestId === latestParticipantsRequest.current) setParticipantsFailure(toLoadFailure(error));
            } finally {
                if (requestId === latestParticipantsRequest.current) setIsLoadingParticipants(false);
            }
        };

        void load();
        return () => {
            latestParticipantsRequest.current = requestId + 1;
        };
    }, [eventId, search, page, reloadToken, canViewParticipants]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setSearch((current) => (current === searchText.trim() ? current : searchText.trim()));
            setPage(1);
        }, SEARCH_DEBOUNCE_MS);

        return () => window.clearTimeout(timer);
    }, [searchText]);

    useEffect(() => {
        if (!canAddParticipants || !eventId || !isAddDialogOpen || addTab !== 'member' || memberSearch.trim().length < 2) {
            setMemberResults([]);
            setIsSearchingMembers(false);

            return;
        }

        let isCancelled = false;
        setMemberResults([]);
        setIsSearchingMembers(true);
        setAddError(null);

        const timer = window.setTimeout(async () => {
            try {
                const response = await getEventMemberOptions(eventId, memberSearch.trim());

                if (!isCancelled) setMemberResults(response.data.items.slice(0, MEMBER_SEARCH_LIMIT));
            } catch (error) {
                if (!isCancelled) setAddError(errorMessage(error));
            } finally {
                if (!isCancelled) setIsSearchingMembers(false);
            }
        }, SEARCH_DEBOUNCE_MS);

        return () => {
            isCancelled = true;
            window.clearTimeout(timer);
        };
    }, [isAddDialogOpen, addTab, memberSearch, eventId, canAddParticipants]);

    const refreshEvent = useCallback(async () => {
        if (!eventId) return;

        try {
            setEvent((await getEvent(eventId)).data);
        } catch {
            // The counts shown come from the participant summary; a failed refresh only leaves the header action state stale.
        }
    }, [eventId]);

    const toggleAttendance = useCallback(
        async (participantId: string, present: boolean) => {
            if (!eventId) return;

            setPendingParticipantIds((current) => [...current, participantId]);
            setNotice(null);

            try {
                const response = await putParticipantAttendance(eventId, participantId, present);

                setSummary(response.data.summary);
                setParticipants((current) =>
                    current
                        ? { ...current, items: current.items.map((item) => (item.id === participantId ? response.data.participant : item)) }
                        : current,
                );
            } catch (error) {
                setNotice({ tone: 'error', text: errorMessage(error) });
            } finally {
                setPendingParticipantIds((current) => current.filter((id) => id !== participantId));
            }
        },
        [eventId],
    );

    const copyText = useCallback(async (text: string, label: string) => {
        const isCopied = await copyToClipboard(text);

        setNotice(isCopied ? { tone: 'success', text: `${label} disalin.` } : { tone: 'error', text: `${label} gagal disalin.` });
    }, []);

    const closeEvent = useCallback(async () => {
        if (!eventId) return;

        setIsClosing(true);
        setCloseError(null);

        try {
            setEvent((await postCloseEvent(eventId)).data);
            setCloseDialogOpenState(false);
            setReloadToken((token) => token + 1);
        } catch (error) {
            setCloseError(errorMessage(error));
        } finally {
            setIsClosing(false);
        }
    }, [eventId]);

    const finishAdding = useCallback(async () => {
        setIsAddDialogOpen(false);
        setSearchText('');
        setSearch('');
        setPage(1);
        setNotice({ tone: 'success', text: 'Peserta ditambahkan.' });
        setReloadToken((token) => token + 1);
        await refreshEvent();
    }, [refreshEvent]);

    const submitParticipant = useCallback(
        async (input: ParticipantInput): Promise<unknown> => {
            if (!eventId) return null;

            setIsAdding(true);
            setAddError(null);
            setGuestErrors({});

            try {
                await postEventParticipant(eventId, input);
                await finishAdding();

                return null;
            } catch (error) {
                setGuestErrors({
                    name: fieldErrorMessage(error, 'name'),
                    email: fieldErrorMessage(error, 'email'),
                    whatsapp: fieldErrorMessage(error, 'whatsapp'),
                });
                setAddError(fieldErrorMessage(error, 'memberId') ?? (fieldErrorMessage(error, 'email') ? null : errorMessage(error)));

                return error;
            } finally {
                setIsAdding(false);
            }
        },
        [eventId, finishAdding],
    );

    // Exports what the list currently shows: the same applied search, every page of it.
    const exportParticipants = useCallback(async () => {
        if (!event || !eventId) return;

        setIsExporting(true);
        setNotice(null);

        try {
            const response = await getEventParticipantsExport(eventId, search);
            const url = URL.createObjectURL(response.data);
            const link = document.createElement('a');

            link.href = url;
            link.download = `peserta-${event.slug}.csv`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            setNotice({ tone: 'error', text: errorMessage(error) });
        } finally {
            setIsExporting(false);
        }
    }, [event, eventId, search]);

    const duplicateEvent = useCallback(async () => {
        if (!eventId) return;
        setIsDuplicating(true);
        setNotice(null);
        try {
            const response = await postDuplicateEvent(eventId);
            void navigate({ to: canEditEvent ? ROUTES.eventEdit : ROUTES.eventDetail, params: { eventId: response.data.id } });
        } catch (error) {
            setNotice({ tone: 'error', text: errorMessage(error) });
        } finally {
            setIsDuplicating(false);
        }
    }, [eventId, canEditEvent, navigate]);

    const cancelEvent = useCallback(async () => {
        if (!eventId) return;
        setIsCancelling(true);
        setCancelError(null);
        try {
            const response = await postCancelEvent(eventId);
            setEvent(response.data);
            setCancelDialogOpen(false);
            setReloadToken((token) => token + 1);
            setNotice({ tone: 'success', text: 'Kegiatan dibatalkan.' });
        } catch (error) {
            setCancelError(errorMessage(error));
        } finally {
            setIsCancelling(false);
        }
    }, [eventId]);

    const value = useMemo<PageContextValue>(
        () => ({
            event,
            failure,
            isLoading,
            participants,
            participantsFailure,
            isLoadingParticipants,
            isExporting,
            page,
            searchText,
            summary,
            notice,
            pendingParticipantIds,
            isCloseDialogOpen,
            isClosing,
            closeError,
            duplicateEvent,
            isDuplicating,
            cancelEvent,
            isCancelling,
            isCancelDialogOpen,
            setCancelDialogOpen,
            cancelError,
            isAddDialogOpen,
            detailParticipant,
            addTab,
            memberSearch,
            memberResults,
            isSearchingMembers,
            guestFields,
            guestErrors,
            addError,
            isAdding,
            setSearchText,
            goToPage: setPage,
            toggleAttendance,
            exportParticipants,
            copyText,
            setCloseDialogOpen: (open) => {
                setCloseError(null);
                setCloseDialogOpenState(open);
            },
            closeEvent,
            openAddDialog: () => {
                setAddError(null);
                setGuestErrors({});
                setGuestFields(EMPTY_GUEST);
                setMemberSearch('');
                setAddTab('member');
                setIsAddDialogOpen(true);
            },
            closeAddDialog: () => setIsAddDialogOpen(false),
            openDetail: setDetailParticipant,
            closeDetail: () => setDetailParticipant(null),
            setAddTab: (tab) => {
                setAddError(null);
                setAddTab(tab);
            },
            setMemberSearch,
            setGuestField: (name, valueText) => {
                setGuestFields((current) => ({ ...current, [name]: valueText }));
                setGuestErrors((current) => ({ ...current, [name]: undefined }));
            },
            submitParticipant,
            reload: () => setReloadToken((token) => token + 1),
        }),
        [
            event,
            failure,
            isLoading,
            participants,
            participantsFailure,
            isLoadingParticipants,
            isExporting,
            page,
            searchText,
            summary,
            notice,
            pendingParticipantIds,
            isCloseDialogOpen,
            isClosing,
            closeError,
            duplicateEvent,
            isDuplicating,
            cancelEvent,
            isCancelling,
            isCancelDialogOpen,
            cancelError,
            isAddDialogOpen,
            detailParticipant,
            addTab,
            memberSearch,
            memberResults,
            isSearchingMembers,
            guestFields,
            guestErrors,
            addError,
            isAdding,
            toggleAttendance,
            exportParticipants,
            copyText,
            closeEvent,
            submitParticipant,
        ],
    );

    return <PageContext.Provider value={value}>{children}</PageContext.Provider>;
};

export const usePageContext = (): PageContextValue => {
    const context = useContext(PageContext);

    if (!context) throw new Error('usePageContext harus digunakan di dalam PageContextProvider.');

    return context;
};
