import { useReadingProfile } from '@/hooks/useReadingProfile';
import type { ReadingProfileOptions } from '@/types/reading-profile';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getDistricts, getProvinces, getRegencies, getVillages } from '@/services/region';
import type { MemberDetail, MemberEditInput } from '@/types/member';
import type { DistrictOption, RegionOption, VillageOption } from '@/types/region';
import { fieldErrorMessage } from '@/utils/error';
import { isValidWhatsapp, normalizeWhatsapp, toLocalWhatsapp } from '@/utils/string';

const MIN_MEMBER_AGE = 17;
const MAX_MEMBER_AGE = 100;

export type MemberFieldName =
    | 'name'
    | 'birthYear'
    | 'email'
    | 'whatsapp'
    | 'participationPreference'
    | 'provinceCode'
    | 'regencyCode'
    | 'districtCode'
    | 'villageCode'
    | 'postalCode';

export type MemberFormErrors = Partial<Record<MemberFieldName, string>>;

export interface MemberFormFields {
    name: string;
    birthYear: string;
    email: string;
    whatsapp: string;
    participationPreference: string;
    provinceCode: string;
    regencyCode: string;
    districtCode: string;
    villageCode: string;
    postalCode: string;
}

const EMPTY_FIELDS: MemberFormFields = {
    name: '',
    birthYear: '',
    email: '',
    whatsapp: '',
    participationPreference: '',
    provinceCode: '',
    regencyCode: '',
    districtCode: '',
    villageCode: '',
    postalCode: '',
};

const SERVER_FIELD_NAMES: MemberFieldName[] = [
    'name',
    'birthYear',
    'email',
    'whatsapp',
    'participationPreference',
    'provinceCode',
    'regencyCode',
    'districtCode',
    'villageCode',
    'postalCode',
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const memberBirthYears = (): number[] => {
    const latest = new Date().getFullYear() - MIN_MEMBER_AGE;

    return Array.from({ length: MAX_MEMBER_AGE - MIN_MEMBER_AGE + 1 }, (_, index) => latest - index);
};

const fieldsFromMember = (member: MemberDetail): MemberFormFields => ({
    name: member.name,
    birthYear: String(member.birthYear),
    email: member.email,
    whatsapp: toLocalWhatsapp(member.whatsapp),
    participationPreference: member.preference?.value ?? '',
    provinceCode: member.province?.code ?? '',
    regencyCode: member.regency?.code ?? '',
    districtCode: member.district?.code ?? '',
    villageCode: member.village?.code ?? '',
    postalCode: member.postalCode,
});

// Shared by the create and edit member screens: field state and the region cascade through village.
export const useMemberForm = (member?: MemberDetail, options: ReadingProfileOptions | null = null) => {
    const reading = useReadingProfile(member, options);
    const [fields, setFields] = useState<MemberFormFields>(() => (member ? fieldsFromMember(member) : EMPTY_FIELDS));
    const [errors, setErrors] = useState<MemberFormErrors>({});
    const [provinces, setProvinces] = useState<RegionOption[]>([]);
    const [regencies, setRegencies] = useState<RegionOption[]>([]);
    const [districts, setDistricts] = useState<DistrictOption[]>([]);
    const [villages, setVillages] = useState<VillageOption[]>([]);
    // A slow answer for a district the admin already left must not replace the list of the current one.
    const villageRequest = useRef(0);
    const resetVillages = () => {
        villageRequest.current++;
        setVillages([]);
    };
    const [regionError, setRegionError] = useState<string | null>(null);

    useEffect(() => {
        let isCancelled = false;

        const loadRegions = async () => {
            try {
                const provinceResponse = await getProvinces();
                const regencyResponse = member?.province ? await getRegencies(member.province.code) : null;
                const districtResponse = member?.regency ? await getDistricts(member.regency.code) : null;
                const villageResponse = member?.district ? await getVillages(member.district.code) : null;

                if (isCancelled) return;

                setProvinces(provinceResponse.data);
                setRegencies(regencyResponse?.data ?? []);
                setDistricts(districtResponse?.data ?? []);
                setVillages(villageResponse?.data ?? []);
            } catch {
                if (!isCancelled) setRegionError('Daftar wilayah gagal dimuat. Muat ulang halaman untuk mencoba lagi.');
            }
        };

        void loadRegions();

        return () => {
            isCancelled = true;
        };
    }, [member]);

    const setField = useCallback((name: MemberFieldName, value: string) => {
        setFields((current) => ({ ...current, [name]: value }));
        setErrors((current) => ({ ...current, [name]: undefined }));
    }, []);

    const handleProvinceChange = async (provinceCode: string) => {
        setFields((current) => ({ ...current, provinceCode, regencyCode: '', districtCode: '', villageCode: '', postalCode: '' }));
        setRegencies([]);
        setDistricts([]);
        resetVillages();

        if (!provinceCode) return;

        try {
            setRegencies((await getRegencies(provinceCode)).data);
        } catch {
            setRegionError('Daftar kabupaten atau kota gagal dimuat.');
        }
    };

    const handleRegencyChange = async (regencyCode: string) => {
        setFields((current) => ({ ...current, regencyCode, districtCode: '', villageCode: '', postalCode: '' }));
        setDistricts([]);
        resetVillages();

        if (!regencyCode) return;

        try {
            setDistricts((await getDistricts(regencyCode)).data);
        } catch {
            setRegionError('Daftar kecamatan gagal dimuat.');
        }
    };

    const handleDistrictChange = async (districtCode: string) => {
        setFields((current) => ({ ...current, districtCode, villageCode: '', postalCode: '' }));
        setErrors((current) => ({ ...current, districtCode: undefined, villageCode: undefined, postalCode: undefined }));
        resetVillages();

        if (!districtCode) return;

        const request = ++villageRequest.current;

        try {
            const response = await getVillages(districtCode);

            if (request === villageRequest.current) setVillages(response.data);
        } catch {
            if (request === villageRequest.current) setRegionError('Daftar kelurahan gagal dimuat.');
        }
    };

    // The postal code is not typed by hand: it follows the selected village.
    const handleVillageChange = (villageCode: string) => {
        const village = villages.find((option) => option.code === villageCode);

        setFields((current) => ({ ...current, villageCode, postalCode: village?.postalCode ?? '' }));
        setErrors((current) => ({ ...current, villageCode: undefined, postalCode: undefined }));
    };

    // Mirrors the API rules for quick feedback; the server stays authoritative.
    const validate = (options: { requireEmail: boolean }): MemberEditInput | null => {
        const readingValid = reading.validate();
        const nextErrors: MemberFormErrors = {};
        const whatsapp = normalizeWhatsapp(fields.whatsapp);

        if (!fields.name.trim()) nextErrors.name = 'Nama lengkap harus diisi.';
        if (!fields.birthYear) nextErrors.birthYear = 'Pilih tahun lahir.';
        if (options.requireEmail && !fields.email.trim()) nextErrors.email = 'Email harus diisi.';
        else if (options.requireEmail && !EMAIL_PATTERN.test(fields.email.trim())) nextErrors.email = 'Email tidak valid.';
        if (!fields.whatsapp.trim()) nextErrors.whatsapp = 'Nomor WhatsApp harus diisi.';
        else if (!isValidWhatsapp(whatsapp)) nextErrors.whatsapp = 'Nomor WhatsApp tidak valid.';
        if (!fields.provinceCode) nextErrors.provinceCode = 'Pilih provinsi.';
        if (!fields.regencyCode) nextErrors.regencyCode = 'Pilih kabupaten atau kota.';
        if (!fields.districtCode) nextErrors.districtCode = 'Pilih kecamatan.';
        if (!fields.villageCode) nextErrors.villageCode = 'Pilih kelurahan.';

        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0 || !readingValid) return null;

        return {
            ...reading.buildInput(),
            name: fields.name.trim(),
            birthYear: Number(fields.birthYear),
            whatsapp,
            participationPreference: fields.participationPreference || null,
            provinceCode: fields.provinceCode,
            regencyCode: fields.regencyCode,
            districtCode: fields.districtCode,
            villageCode: fields.villageCode,
            // There is no postal code field: it always comes from the selected kelurahan.
            postalCode: villages.find((village) => village.code === fields.villageCode)?.postalCode ?? fields.postalCode,
        };
    };

    const applyServerErrors = (error: unknown): boolean => {
        const readingError = reading.applyServerErrors(error);
        const nextErrors: MemberFormErrors = {};

        for (const name of SERVER_FIELD_NAMES) {
            const message = fieldErrorMessage(error, name);

            if (message) nextErrors[name] = message;
        }

        // The postal code has no field of its own; a problem with it belongs to the kelurahan it came from.
        if (nextErrors.postalCode && !nextErrors.villageCode) nextErrors.villageCode = nextErrors.postalCode;

        setErrors(nextErrors);

        return Object.keys(nextErrors).length > 0 || readingError;
    };

    return {
        reading,
        fields,
        errors,
        provinces,
        regencies,
        districts,
        villages,
        regionError,
        birthYears: memberBirthYears(),
        setField,
        handleProvinceChange,
        handleRegencyChange,
        handleDistrictChange,
        handleVillageChange,
        validate,
        applyServerErrors,
    };
};

export type MemberForm = ReturnType<typeof useMemberForm>;
