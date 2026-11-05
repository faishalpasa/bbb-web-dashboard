import type { SelectOption } from '@/types/api';

export interface RegionOption extends SelectOption {
    code: string;
}

export interface CountryOption {
    code: string;
    name: string;
}

export type DomicileType = 'indonesia' | 'overseas';

export interface DistrictOption extends RegionOption {
    postalCode: string | null;
}

export interface VillageOption extends RegionOption {
    postalCode: string;
}
