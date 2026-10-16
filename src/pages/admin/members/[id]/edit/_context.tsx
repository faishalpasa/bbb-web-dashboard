import { useNavigate, useParams } from '@tanstack/react-router';
import { createContext, type PropsWithChildren, useContext, useEffect, useState } from 'react';

import { ROUTES } from '@/constants/route';
import { getMember, getMemberOptions } from '@/services/member';
import type { LoadFailure, SelectOption } from '@/types/api';
import type { MemberDetail } from '@/types/member';
import { toLoadFailure } from '@/utils/error';

import { MemberEditFormProvider } from './_form-context';

interface PageContextValue {
    member: MemberDetail | null;
    preferences: SelectOption[];
    failure: LoadFailure | null;
    isLoading: boolean;
    goToDetail: () => void;
    reload: () => void;
}

const PageContext = createContext<PageContextValue | null>(null);

export const PageContextProvider = ({ children }: PropsWithChildren) => {
    const { memberId } = useParams({ strict: false });
    const navigate = useNavigate();
    const [member, setMember] = useState<MemberDetail | null>(null);
    const [preferences, setPreferences] = useState<SelectOption[]>([]);
    const [failure, setFailure] = useState<LoadFailure | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [reloadToken, setReloadToken] = useState(0);

    useEffect(() => {
        if (!memberId) return;

        const load = async () => {
            setIsLoading(true);
            setFailure(null);

            try {
                const [memberResponse, optionsResponse] = await Promise.all([getMember(memberId), getMemberOptions()]);

                setMember(memberResponse.data);
                setPreferences(optionsResponse.data.preferences);
            } catch (error) {
                setFailure(toLoadFailure(error));
            } finally {
                setIsLoading(false);
            }
        };

        void load();
    }, [memberId, reloadToken]);

    const value: PageContextValue = {
        member,
        preferences,
        failure,
        isLoading,
        goToDetail: () => {
            if (memberId) void navigate({ to: ROUTES.memberDetail, params: { memberId } });
        },
        reload: () => setReloadToken((token) => token + 1),
    };

    return (
        <PageContext.Provider value={value}>
            {member ? <MemberEditFormProvider member={member}>{children}</MemberEditFormProvider> : children}
        </PageContext.Provider>
    );
};

export const usePageContext = (): PageContextValue => {
    const context = useContext(PageContext);

    if (!context) throw new Error('usePageContext harus digunakan di dalam PageContextProvider.');

    return context;
};
