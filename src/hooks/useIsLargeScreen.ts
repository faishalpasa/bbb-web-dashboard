import { useEffect, useState } from 'react';

const LARGE_MIN_WIDTH = 1024;

const isLargeWidth = () => window.innerWidth >= LARGE_MIN_WIDTH;

// Matches Tailwind's `lg` breakpoint, where the admin sidebar becomes permanent.
export const useIsLargeScreen = (): boolean => {
    const [isLarge, setIsLarge] = useState(isLargeWidth);

    useEffect(() => {
        const handleResize = () => setIsLarge(isLargeWidth());

        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return isLarge;
};
