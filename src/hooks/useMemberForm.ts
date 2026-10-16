import { useCallback, useEffect, useState } from 'react';

import { POSTAL_CODE_LENGTH } from '@/constants/member';
import { getDistricts, getProvinces, getRegencies } from '@/services/region';
import type { MemberDetail, MemberEditInput } from '@/types/member';
import type { DistrictOption, RegionOption } from '@/types/region';
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
    postalCode: member.postalCode,
});

// Shared by the create and edit member screens: field state, the province -> regency -> district cascade, and validation.
export const useMemberForm = (member?: MemberDetail) => {
    const [fields, setFields] = useState<MemberFormFields>(() => (member ? fieldsFromMember(member) : EMPTY_FIELDS));
    const [errors, setErrors] = useState<MemberFormErrors>({});
    const [provinces, setProvinces] = useState<RegionOption[]>([]);
    const [regencies, setRegencies] = useState<RegionOption[]>([]);
    const [districts, setDistricts] = useState<DistrictOption[]>([]);
    const [regionError, setRegionError] = useState<string | null>(null);

    useEffect(() => {
        let isCancelled = false;

        const loadRegions = async () => {
            try {
                const provinceResponse = await getProvinces();
                const regencyResponse = member?.province ? await getRegencies(member.province.code) : null;
                const districtResponse = member?.regency ? await getDistricts(member.regency.code) : null;

                if (isCancelled) return;

                setProvinces(provinceResponse.data);
                setRegencies(regencyResponse?.data ?? []);
                setDistricts(districtResponse?.data ?? []);
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
        setFields((current) => ({ ...current, provinceCode, regencyCode: '', districtCode: '', postalCode: '' }));
        setRegencies([]);
        setDistricts([]);

        if (!provinceCode) return;

        try {
            setRegencies((await getRegencies(provinceCode)).data);
        } catch {
            setRegionError('Daftar kabupaten atau kota gagal dimuat.');
        }
    };

    const handleRegencyChange = async (regencyCode: string) => {
        setFields((current) => ({ ...current, regencyCode, districtCode: '', postalCode: '' }));
        setDistricts([]);

        if (!regencyCode) return;

        try {
            setDistricts((await getDistricts(regencyCode)).data);
        } catch {
            setRegionError('Daftar kecamatan gagal dimuat.');
        }
    };

    // The postal code follows the district until the admin types a different one.
    const handleDistrictChange = (districtCode: string) => {
        const district = districts.find((option) => option.code === districtCode);

        setFields((current) => ({ ...current, districtCode, postalCode: district?.postalCode ?? '' }));
        setErrors((current) => ({ ...current, districtCode: undefined, postalCode: undefined }));
    };

    // Mirrors the API rules for quick feedback; the server stays authoritative.
    const validate = (options: { requireEmail: boolean }): MemberEditInput | null => {
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
        if (!fields.postalCode) nextErrors.postalCode = 'Kode pos harus diisi.';
        else if (fields.postalCode.length !== POSTAL_CODE_LENGTH) nextErrors.postalCode = `Kode pos terdiri dari ${POSTAL_CODE_LENGTH} angka.`;

        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) return null;

        return {
            name: fields.name.trim(),
            birthYear: Number(fields.birthYear),
            whatsapp,
            participationPreference: fields.participationPreference || null,
            provinceCode: fields.provinceCode,
            regencyCode: fields.regencyCode,
            districtCode: fields.districtCode,
            postalCode: fields.postalCode,
        };
    };

    const applyServerErrors = (error: unknown): boolean => {
        const nextErrors: MemberFormErrors = {};

        for (const name of SERVER_FIELD_NAMES) {
            const message = fieldErrorMessage(error, name);

            if (message) nextErrors[name] = message;
        }

        setErrors(nextErrors);

        return Object.keys(nextErrors).length > 0;
    };

    return {
        fields,
        errors,
        provinces,
        regencies,
        districts,
        regionError,
        birthYears: memberBirthYears(),
        setField,
        handleProvinceChange,
        handleRegencyChange,
        handleDistrictChange,
        validate,
        applyServerErrors,
    };
};

export type MemberForm = ReturnType<typeof useMemberForm>;
