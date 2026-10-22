import { useEffect, useState } from 'react';

const secondsUntil = (targetTime: string | null): number => {
    if (!targetTime) {
        return 0;
    }

    return Math.max(0, Math.ceil((Date.parse(targetTime) - Date.now()) / 1000));
};

export const useCountdown = (targetTime: string | null): number => {
    const [secondsRemaining, setSecondsRemaining] = useState(() => secondsUntil(targetTime));

    useEffect(() => {
        setSecondsRemaining(secondsUntil(targetTime));

        if (!targetTime) {
            return;
        }

        const interval = window.setInterval(() => {
            const nextSeconds = secondsUntil(targetTime);

            setSecondsRemaining(nextSeconds);

            if (nextSeconds === 0) {
                window.clearInterval(interval);
            }
        }, 1000);

        return () => window.clearInterval(interval);
    }, [targetTime]);

    return secondsRemaining;
};
