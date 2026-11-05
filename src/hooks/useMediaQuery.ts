import { useEffect, useState } from 'react';

const DESKTOP_MIN_WIDTH = 768;

export const useMediaQuery = (minWidth = DESKTOP_MIN_WIDTH) => {
    const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= minWidth);

    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= minWidth);

        handleResize();
        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, [minWidth]);

    return { isDesktop, isMobile: !isDesktop };
};
