import { useEffect } from 'react';

const APP_NAME = 'BBB BFF';

export const useTitle = (title: string) => {
    useEffect(() => {
        const previousTitle = document.title;
        const pageTitle = `${title} - ${APP_NAME}`;
        document.title = pageTitle;

        return () => {
            if (document.title === pageTitle) document.title = previousTitle;
        };
    }, [title]);
};
