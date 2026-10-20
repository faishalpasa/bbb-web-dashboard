import type { SelectOption } from '@/types/api';

export interface RegionOption extends SelectOption {
    code: string;
}

export interface DistrictOption extends RegionOption {
    postalCode: string | null;
}

export interface VillageOption extends RegionOption {
    postalCode: string;
}
