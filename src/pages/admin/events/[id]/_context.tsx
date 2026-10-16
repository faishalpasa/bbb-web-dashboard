import { useParams } from '@tanstack/react-router';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { getEvent, getEventParticipants, postCloseEvent, postEventParticipant, putParticipantAttendance } from '@/services/event';
import { getMembers } from '@/services/member';
import type { LoadFailure } from '@/types/api';
import type { EventDetail, EventParticipantList, ParticipantInput, ParticipantSummary } from '@/types/event';
import type { MemberListItem } from '@/types/member';
import { copyToClipboard } from '@/utils/clipboard';
import { errorMessage, fieldErrorMessage, toLoadFailure } from '@/utils/error';
import { normalizeWhatsapp as normalizeGuestWhatsapp } from '@/utils/string';

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
    page: number;
    searchText: string;
    summary: ParticipantSummary | null;
    notice: { tone: 'success' | 'error'; text: string } | null;
    pendingParticipantIds: string[];
    isCloseDialogOpen: boolean;
    isClosing: boolean;
    closeError: string | null;
    isAddDialogOpen: boolean;
    addTab: AddParticipantTab;
    memberSearch: string;
    memberResults: MemberListItem[];
    isSearchingMembers: boolean;
    guestFields: GuestFields;
    guestErrors: GuestErrors;
    addError: string | null;
    isAdding: boolean;
    setSearchText: (value: string) => void;
    goToPage: (page: number) => void;
    toggleAttendance: (participantId: string, present: boolean) => Promise<void>;
    copyText: (text: string, label: string) => Promise<void>;
    setCloseDialogOpen: (open: boolean) => void;
    closeEvent: () => Promise<void>;
    openAddDialog: () => void;
    closeAddDialog: () => void;
    setAddTab: (tab: AddParticipantTab) => void;
    setMemberSearch: (value: string) => void;
    setGuestField: (name: keyof GuestFields, value: string) => void;
    addMember: (memberId: string) => Promise<void>;
    addGuest: () => Promise<void>;
    reload: () => void;
}

const PageContext = createContext<PageContextValue | null>(null);

const EMPTY_GUEST: GuestFields = { name: '', email: '', whatsapp: '' };

export const PageContextProvider = ({ children }: PropsWithChildren) => {
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
    const [pendingParticipantIds, setPendingParticipantIds] = useState<string[]>([]);
    const [isCloseDialogOpen, setCloseDialogOpenState] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [closeError, setCloseError] = useState<string | null>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [addTab, setAddTab] = useState<AddParticipantTab>('member');
    const [memberSearch, setMemberSearch] = useState('');
    const [memberResults, setMemberResults] = useState<MemberListItem[]>([]);
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
        if (!eventId) return;

        const requestId = ++latestParticipantsRequest.current;

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
    }, [eventId, search, page, reloadToken]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setSearch((current) => (current === searchText.trim() ? current : searchText.trim()));
            setPage(1);
        }, SEARCH_DEBOUNCE_MS);

        return () => window.clearTimeout(timer);
    }, [searchText]);

    useEffect(() => {
        if (!isAddDialogOpen || addTab !== 'member' || !memberSearch.trim()) {
            setMemberResults([]);

            return;
        }

        let isCancelled = false;

        const timer = window.setTimeout(async () => {
            setIsSearchingMembers(true);

            try {
                const response = await getMembers({
                    search: memberSearch.trim(),
                    status: '',
                    provinceCode: '',
                    preference: '',
                    attendance: '',
                    page: 1,
                    perPage: MEMBER_SEARCH_LIMIT,
                });

                if (!isCancelled) setMemberResults(response.data.items);
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
    }, [isAddDialogOpen, addTab, memberSearch]);

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

    const value = useMemo<PageContextValue>(
        () => ({
            event,
            failure,
            isLoading,
            participants,
            participantsFailure,
            isLoadingParticipants,
            page,
            searchText,
            summary,
            notice,
            pendingParticipantIds,
            isCloseDialogOpen,
            isClosing,
            closeError,
            isAddDialogOpen,
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
            setAddTab: (tab) => {
                setAddError(null);
                setAddTab(tab);
            },
            setMemberSearch,
            setGuestField: (name, valueText) => {
                setGuestFields((current) => ({ ...current, [name]: valueText }));
                setGuestErrors((current) => ({ ...current, [name]: undefined }));
            },
            addMember: async (memberId) => {
                await submitParticipant({ memberId });
            },
            addGuest: async () => {
                const nextErrors: GuestErrors = {};

                if (!guestFields.name.trim()) nextErrors.name = 'Nama harus diisi.';
                if (!guestFields.email.trim()) nextErrors.email = 'Email harus diisi.';
                if (!guestFields.whatsapp.trim()) nextErrors.whatsapp = 'Nomor WhatsApp harus diisi.';

                if (Object.keys(nextErrors).length > 0) {
                    setGuestErrors(nextErrors);

                    return;
                }

                await submitParticipant({
                    name: guestFields.name.trim(),
                    email: guestFields.email.trim(),
                    whatsapp: normalizeGuestWhatsapp(guestFields.whatsapp),
                });
            },
            reload: () => setReloadToken((token) => token + 1),
        }),
        [
            event,
            failure,
            isLoading,
            participants,
            participantsFailure,
            isLoadingParticipants,
            page,
            searchText,
            summary,
            notice,
            pendingParticipantIds,
            isCloseDialogOpen,
            isClosing,
            closeError,
            isAddDialogOpen,
            addTab,
            memberSearch,
            memberResults,
            isSearchingMembers,
            guestFields,
            guestErrors,
            addError,
            isAdding,
            toggleAttendance,
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
