import { useState } from 'react';

import { FilterDialog } from '@/components/molecules/filter-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import type { SelectOption } from '@/types/api';
import type { MemberSortBy, MemberSortDirection } from '@/types/member';

import { type MemberFilterValues, usePageContext } from '../_context';

interface FilterSelectProps {
    id: string;
    label: string;
    allLabel: string;
    value: string;
    options: SelectOption[];
    onChange: (value: string) => void;
}

const FilterSelect = ({ id, label, allLabel, value, options, onChange }: FilterSelectProps) => (
    <div className="grid min-w-0 gap-1.5">
        <Label htmlFor={id} className="text-xs font-normal">
            {label}
        </Label>
        <NativeSelect id={id} value={value} onChange={(event) => onChange(event.target.value)} className="h-10" data-test-id={`members_select_${id}`}>
            <option value="">{allLabel}</option>
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </NativeSelect>
    </div>
);

const splitIds = (value: string): string[] => value.split(',').filter(Boolean);

export const MemberFilters = () => {
    const { query, searchText, options, setSearchText, applyFilters, resetFilters } = usePageContext();
    const [draft, setDraft] = useState<MemberFilterValues>(query);

    const interests = options?.readingProfileOptions.readingInterests ?? [];
    const chosenInterests = splitIds(draft.readingInterests);
    // One count per filter that is on; the genres count as one filter however many are chosen.
    const activeCount = [query.status, query.provinceCode, query.preference, query.attendance, query.readingInterests].filter(
        (value) => value !== '',
    ).length;

    const setField = <K extends keyof MemberFilterValues>(name: K, value: MemberFilterValues[K]) =>
        setDraft((current) => ({ ...current, [name]: value }));
    const toggleInterest = (id: string, isChecked: boolean) =>
        setField('readingInterests', (isChecked ? [...chosenInterests, id] : chosenInterests.filter((chosen) => chosen !== id)).join(','));
    const selectSort = (value: string) => {
        const [sortBy, sortDirection] = value.split(':') as [MemberSortBy, MemberSortDirection];

        setDraft((current) => ({ ...current, sortBy, sortDirection }));
    };

    return (
        <section className="flex items-center gap-2" data-test-id="members_filters">
            <div className="min-w-0 flex-1">
                <Label htmlFor="search" className="sr-only">
                    Pencarian
                </Label>
                <Input
                    id="search"
                    type="search"
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    placeholder="Cari nama, email, no. WhatsApp, atau nomor member"
                    className="bg-card h-10"
                    data-test-id="members_input_search"
                />
            </div>
            <FilterDialog
                activeCount={activeCount}
                onOpen={() => setDraft(query)}
                onApply={() => applyFilters(draft)}
                onReset={resetFilters}
                description="Pilih filter member, lalu tekan Terapkan."
                data-test-id="members_filter"
            >
                <FilterSelect
                    id="status"
                    label="Status"
                    allLabel="Semua status"
                    value={draft.status}
                    options={options?.statuses ?? []}
                    onChange={(value) => setField('status', value)}
                />
                <FilterSelect
                    id="province"
                    label="Provinsi"
                    allLabel="Semua provinsi"
                    value={draft.provinceCode}
                    options={(options?.provinces ?? []).map((province) => ({ value: province.code, label: province.label }))}
                    onChange={(value) => setField('provinceCode', value)}
                />
                <FilterSelect
                    id="preference"
                    label="Preferensi"
                    allLabel="Semua preferensi"
                    value={draft.preference}
                    options={options?.preferences ?? []}
                    onChange={(value) => setField('preference', value)}
                />
                <FilterSelect
                    id="attendance"
                    label="Kehadiran"
                    allLabel="Semua"
                    value={draft.attendance}
                    options={options?.attendance ?? []}
                    onChange={(value) => setField('attendance', value)}
                />
                {interests.length > 0 && (
                    <fieldset className="grid gap-2" data-test-id="members_filter_interests">
                        <legend className="text-xs">Genre favorit (cocok dengan salah satu)</legend>
                        <div className="grid gap-1 sm:grid-cols-2">
                            {interests.map((interest) => (
                                <label key={interest.id} className="flex min-h-9 cursor-pointer items-center gap-2 text-sm">
                                    <Checkbox
                                        checked={chosenInterests.includes(interest.id)}
                                        onCheckedChange={(checked) => toggleInterest(interest.id, checked === true)}
                                        data-test-id={`members_filter_interest_${interest.code}`}
                                    />
                                    {interest.label}
                                </label>
                            ))}
                        </div>
                    </fieldset>
                )}
                <div className="grid min-w-0 gap-1.5 md:hidden">
                    <Label htmlFor="sort" className="text-xs font-normal">
                        Urutkan
                    </Label>
                    <NativeSelect
                        id="sort"
                        value={`${draft.sortBy}:${draft.sortDirection}`}
                        onChange={(event) => selectSort(event.target.value)}
                        className="h-10"
                        data-test-id="members_select_sort"
                    >
                        <option value="joinedAt:desc">Tanggal bergabung: terbaru</option>
                        <option value="joinedAt:asc">Tanggal bergabung: terlama</option>
                        <option value="memberNumber:asc">Nomor member: naik</option>
                        <option value="memberNumber:desc">Nomor member: turun</option>
                        <option value="name:asc">Nama: A–Z</option>
                        <option value="name:desc">Nama: Z–A</option>
                    </NativeSelect>
                </div>
            </FilterDialog>
        </section>
    );
};
