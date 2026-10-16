import { createContext, type PropsWithChildren, useContext } from 'react';

interface AppContextValue {
    appName: string;
}

const appValue: AppContextValue = { appName: 'BBB BFF Admin' };
const AppContext = createContext<AppContextValue | null>(null);

// Admin session/capabilities will be added only after their API contract is agreed.
export const AppContextProvider = ({ children }: PropsWithChildren) => <AppContext.Provider value={appValue}>{children}</AppContext.Provider>;

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useAppContext harus berada di dalam AppContextProvider.');
    return context;
};
