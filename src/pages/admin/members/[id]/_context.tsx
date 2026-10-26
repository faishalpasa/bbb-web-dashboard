import { useParams } from '@tanstack/react-router';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { toast } from '@/components/ui/toast';
import { useClientPagination, type ClientPagination } from '@/hooks/useClientPagination';
import { getMember, postActivateMember, postDeactivateMember, postMemberResetPassword, putMemberNote } from '@/services/member';
import type { LoadFailure } from '@/types/api';
import type { MemberDetail, MemberHistoryItem } from '@/types/member';
import { errorMessage, toLoadFailure } from '@/utils/error';

type StatusDialog = 'deactivate' | 'activate' | null;

interface PageContextValue {
    member: MemberDetail | null;
    historyPagination: ClientPagination<MemberHistoryItem>;
    failure: LoadFailure | null;
    isLoading: boolean;
    note: string;
    noteMessage: { tone: 'success' | 'error'; text: string } | null;
    isSavingNote: boolean;
    resetMessage: { tone: 'success' | 'error'; text: string } | null;
    isSendingReset: boolean;
    statusDialog: StatusDialog;
    statusError: string | null;
    isChangingStatus: boolean;
    setNote: (value: string) => void;
    saveNote: () => Promise<void>;
    sendResetPassword: () => Promise<void>;
    openStatusDialog: (dialog: Exclude<StatusDialog, null>) => void;
    closeStatusDialog: () => void;
    confirmStatusChange: () => Promise<void>;
    reload: () => void;
}

const PageContext = createContext<PageContextValue | null>(null);

export const PageContextProvider = ({ children }: PropsWithChildren) => {
    const { memberId } = useParams({ strict: false });
    const [member, setMember] = useState<MemberDetail | null>(null);
    const historyPagination = useClientPagination(member?.history ?? [], memberId);
    const [failure, setFailure] = useState<LoadFailure | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [note, setNote] = useState('');
    const [noteMessage, setNoteMessage] = useState<PageContextValue['noteMessage']>(null);
    const [isSavingNote, setIsSavingNote] = useState(false);
    const [resetMessage, setResetMessage] = useState<PageContextValue['resetMessage']>(null);
    const [isSendingReset, setIsSendingReset] = useState(false);
    const [statusDialog, setStatusDialog] = useState<StatusDialog>(null);
    const [statusError, setStatusError] = useState<string | null>(null);
    const [isChangingStatus, setIsChangingStatus] = useState(false);
    const [reloadToken, setReloadToken] = useState(0);

    useEffect(() => {
        if (!memberId) return;

        const load = async () => {
            setIsLoading(true);
            setFailure(null);

            try {
                const response = await getMember(memberId);

                setMember(response.data);
                setNote(response.data.note);
            } catch (error) {
                setFailure(toLoadFailure(error));
            } finally {
                setIsLoading(false);
            }
        };

        void load();
    }, [memberId, reloadToken]);

    const saveNote = useCallback(async () => {
        if (!memberId) return;

        setIsSavingNote(true);
        setNoteMessage(null);

        try {
            const response = await putMemberNote(memberId, note);

            setNote(response.data.note);
            setNoteMessage({ tone: 'success', text: 'Catatan disimpan.' });
        } catch (error) {
            setNoteMessage({ tone: 'error', text: errorMessage(error) });
        } finally {
            setIsSavingNote(false);
        }
    }, [memberId, note]);

    const sendResetPassword = useCallback(async () => {
        if (!memberId) return;

        setIsSendingReset(true);
        setResetMessage(null);

        try {
            const response = await postMemberResetPassword(memberId);

            setResetMessage({ tone: 'success', text: `Link reset password dikirim ke ${response.data.email}.` });
        } catch (error) {
            setResetMessage({ tone: 'error', text: errorMessage(error) });
        } finally {
            setIsSendingReset(false);
        }
    }, [memberId]);

    const confirmStatusChange = useCallback(async () => {
        if (!memberId || !statusDialog) return;

        setIsChangingStatus(true);
        setStatusError(null);

        try {
            const response = statusDialog === 'deactivate' ? await postDeactivateMember(memberId) : await postActivateMember(memberId);

            setMember(response.data);
            setStatusDialog(null);
            toast.add({ type: 'success', title: statusDialog === 'activate' ? 'Member diaktifkan kembali.' : 'Member dinonaktifkan.' });
        } catch (error) {
            setStatusError(errorMessage(error));
        } finally {
            setIsChangingStatus(false);
        }
    }, [memberId, statusDialog]);

    const value = useMemo<PageContextValue>(
        () => ({
            member,
            historyPagination,
            failure,
            isLoading,
            note,
            noteMessage,
            isSavingNote,
            resetMessage,
            isSendingReset,
            statusDialog,
            statusError,
            isChangingStatus,
            setNote,
            saveNote,
            sendResetPassword,
            openStatusDialog: (dialog) => {
                setStatusError(null);
                setStatusDialog(dialog);
            },
            closeStatusDialog: () => setStatusDialog(null),
            confirmStatusChange,
            reload: () => setReloadToken((token) => token + 1),
        }),
        [
            member,
            historyPagination,
            failure,
            isLoading,
            note,
            noteMessage,
            isSavingNote,
            resetMessage,
            isSendingReset,
            statusDialog,
            statusError,
            isChangingStatus,
            saveNote,
            sendResetPassword,
            confirmStatusChange,
        ],
    );

    return <PageContext.Provider value={value}>{children}</PageContext.Provider>;
};

export const usePageContext = (): PageContextValue => {
    const context = useContext(PageContext);

    if (!context) throw new Error('usePageContext harus digunakan di dalam PageContextProvider.');

    return context;
};
