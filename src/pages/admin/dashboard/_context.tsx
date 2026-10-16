import { createContext, type PropsWithChildren, useContext } from 'react';

const pageValue = { isScaffold: true } as const;
const PageContext = createContext<typeof pageValue | null>(null);

export const PageContextProvider = ({ children }: PropsWithChildren) => <PageContext.Provider value={pageValue}>{children}</PageContext.Provider>;

export const usePageContext = () => {
    const context = useContext(PageContext);
    if (!context) throw new Error('usePageContext harus berada di dalam PageContextProvider.');
    return context;
};
