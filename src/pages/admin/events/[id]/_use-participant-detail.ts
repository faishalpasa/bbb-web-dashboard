import { useCallback, useEffect, useRef, useState } from 'react';

import { getEventParticipantDetail } from '@/services/event';
import type { ParticipantDetail } from '@/types/event';
import { errorMessage } from '@/utils/error';

// Loads one participant's answers on demand; the list endpoint never carries them.
export const useParticipantDetail = (eventId: string | undefined, participantId: string | null) => {
    const [detail, setDetail] = useState<ParticipantDetail | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const latestRequest = useRef(0);

    useEffect(() => {
        setDetail(null);
        setError(null);
        if (!eventId || !participantId) {
            setIsLoading(false);
            return;
        }

        // A late response for a participant that was closed or replaced must not overwrite the current one.
        const request = ++latestRequest.current;
        setIsLoading(true);
        void getEventParticipantDetail(eventId, participantId)
            .then((response) => {
                if (request === latestRequest.current) setDetail(response.data);
            })
            .catch((failure: unknown) => {
                if (request === latestRequest.current) setError(errorMessage(failure));
            })
            .finally(() => {
                if (request === latestRequest.current) setIsLoading(false);
            });
    }, [eventId, participantId, attempt]);

    const retry = useCallback(() => setAttempt((value) => value + 1), []);

    return { detail, error, isLoading, retry };
};
