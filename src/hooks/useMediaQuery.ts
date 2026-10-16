import { useEffect, useState } from 'react';

const DESKTOP_MIN_WIDTH = 768;

const isDesktopWidth = () => window.innerWidth >= DESKTOP_MIN_WIDTH;

export const useMediaQuery = () => {
    const [isDesktop, setIsDesktop] = useState(isDesktopWidth);

    useEffect(() => {
        const handleResize = () => setIsDesktop(isDesktopWidth());

        handleResize();
        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return { isDesktop, isMobile: !isDesktop };
};
