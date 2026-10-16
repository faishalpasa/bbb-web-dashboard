import { PUBLIC_WEB_URL } from '@/constants/env';
import type { EventDetail } from '@/types/event';
import { formatEventRange } from '@/utils/date';

export const publicEventUrl = (slug: string): string => `${PUBLIC_WEB_URL || '[domain]'}/e/${slug}`;

// Plain text the admin can paste into WhatsApp or social media.
export const buildAnnouncement = (event: EventDetail): string => {
    const lines = [event.title];

    if (event.startsAt) lines.push(formatEventRange(event.startsAt, event.endsAt, event.timezone));

    if (event.format.value === 'offline') {
        lines.push([event.venueName, event.address].filter(Boolean).join(', '));
    } else {
        lines.push('Online');
    }

    if (event.description) lines.push('', event.description);

    lines.push('', `Daftar di ${publicEventUrl(event.slug)}`);

    return lines.filter((line, index, all) => line !== '' || all[index - 1] !== '').join('\n');
};
