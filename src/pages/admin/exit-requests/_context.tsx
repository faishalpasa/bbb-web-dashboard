import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { useAppContext } from '@/app-context';
import { useClientPagination, type ClientPagination } from '@/hooks/useClientPagination';
import { getExitRequests, postApproveExitRequest, postRejectExitRequest } from '@/services/exit-request';
import type { LoadFailure } from '@/types/api';
import type { ExitRequest, ExitRequestList } from '@/types/exit-request';
import { errorMessage, fieldErrorMessage, toLoadFailure } from '@/utils/error';

interface PageContextValue {
    list: ExitRequestList | null;
    pagination: ClientPagination<ExitRequest>;
    failure: LoadFailure | null;
    isLoading: boolean;
    notice: string | null;
    approving: ExitRequest | null;
    approveError: string | null;
    isApproving: boolean;
    rejecting: ExitRequest | null;
    reason: string;
    reasonError: string | null;
    rejectError: string | null;
    isRejecting: boolean;
    openApprove: (request: ExitRequest) => void;
    closeApprove: () => void;
    confirmApprove: () => Promise<void>;
    openReject: (request: ExitRequest) => void;
    closeReject: () => void;
    setReason: (value: string) => void;
    submitReject: () => Promise<void>;
    reload: () => void;
}

const PageContext = createContext<PageContextValue | null>(null);

export const PageContextProvider = ({ children }: PropsWithChildren) => {
    const { refreshSession } = useAppContext();
    const [list, setList] = useState<ExitRequestList | null>(null);
    const pagination = useClientPagination(list?.items ?? []);
    const [failure, setFailure] = useState<LoadFailure | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notice, setNotice] = useState<string | null>(null);
    const [approving, setApproving] = useState<ExitRequest | null>(null);
    const [approveError, setApproveError] = useState<string | null>(null);
    const [isApproving, setIsApproving] = useState(false);
    const [rejecting, setRejecting] = useState<ExitRequest | null>(null);
    const [reason, setReasonState] = useState('');
    const [reasonError, setReasonError] = useState<string | null>(null);
    const [rejectError, setRejectError] = useState<string | null>(null);
    const [isRejecting, setIsRejecting] = useState(false);
    const [reloadToken, setReloadToken] = useState(0);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            setFailure(null);

            try {
                setList((await getExitRequests()).data);
            } catch (error) {
                setFailure(toLoadFailure(error));
            } finally {
                setIsLoading(false);
            }
        };

        void load();
    }, [reloadToken]);

    // After a decision the list and the sidebar badge both change.
    const afterDecision = useCallback(
        async (text: string) => {
            setNotice(text);
            setReloadToken((token) => token + 1);
            await refreshSession();
        },
        [refreshSession],
    );

    const confirmApprove = useCallback(async () => {
        if (!approving) return;

        setIsApproving(true);
        setApproveError(null);

        try {
            await postApproveExitRequest(approving.id);
            setApproving(null);
            await afterDecision(`Permintaan keluar ${approving.member.name} disetujui. Keanggotaannya dinonaktifkan.`);
        } catch (error) {
            setApproveError(errorMessage(error));
        } finally {
            setIsApproving(false);
        }
    }, [approving, afterDecision]);

    const submitReject = useCallback(async () => {
        if (!rejecting) return;

        if (!reason.trim()) {
            setReasonError('Alasan penolakan harus diisi.');

            return;
        }

        setIsRejecting(true);
        setRejectError(null);

        try {
            await postRejectExitRequest(rejecting.id, reason.trim());
            setRejecting(null);
            setReasonState('');
            await afterDecision(`Permintaan keluar ${rejecting.member.name} ditolak. Alasan dikirim ke member.`);
        } catch (error) {
            const fieldError = fieldErrorMessage(error, 'reason');

            if (fieldError) setReasonError(fieldError);
            else setRejectError(errorMessage(error));
        } finally {
            setIsRejecting(false);
        }
    }, [rejecting, reason, afterDecision]);

    const value = useMemo<PageContextValue>(
        () => ({
            list,
            pagination,
            failure,
            isLoading,
            notice,
            approving,
            approveError,
            isApproving,
            rejecting,
            reason,
            reasonError,
            rejectError,
            isRejecting,
            openApprove: (request) => {
                setNotice(null);
                setApproveError(null);
                setApproving(request);
            },
            closeApprove: () => setApproving(null),
            confirmApprove,
            openReject: (request) => {
                setNotice(null);
                setReasonError(null);
                setRejectError(null);
                setReasonState('');
                setRejecting(request);
            },
            closeReject: () => setRejecting(null),
            setReason: (valueText) => {
                setReasonState(valueText);
                setReasonError(null);
            },
            submitReject,
            reload: () => setReloadToken((token) => token + 1),
        }),
        [
            list,
            pagination,
            failure,
            isLoading,
            notice,
            approving,
            approveError,
            isApproving,
            rejecting,
            reason,
            reasonError,
            rejectError,
            isRejecting,
            confirmApprove,
            submitReject,
        ],
    );

    return <PageContext.Provider value={value}>{children}</PageContext.Provider>;
};

export const usePageContext = (): PageContextValue => {
    const context = useContext(PageContext);

    if (!context) throw new Error('usePageContext harus digunakan di dalam PageContextProvider.');

    return context;
};
