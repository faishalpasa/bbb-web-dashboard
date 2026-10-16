import type { ParticipationPreferenceValue } from '@/types/dashboard';

// Bar colors per preference; the labels themselves come from the API.
export const PREFERENCE_COLORS: Record<ParticipationPreferenceValue, string> = {
    online: 'bg-[#002a32]',
    offline: 'bg-[#4f7c84]',
    both: 'bg-[#b7b38f]',
    unset: 'bg-[#dcdad2]',
};
