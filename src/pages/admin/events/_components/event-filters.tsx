import { useState } from 'react';

import { DatePickerField } from '@/components/molecules/date-picker-field';
import { FilterDialog } from '@/components/molecules/filter-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import type { SelectOption } from '@/types/api';

import { type EventFilterValues, usePageContext } from '../_context';

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
        <NativeSelect id={id} value={value} onChange={(event) => onChange(event.target.value)} className="h-10" data-test-id={`events_select_${id}`}>
            <option value="">{allLabel}</option>
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </NativeSelect>
    </div>
);

export const EventFilters = () => {
    const { query, searchText, options, setSearchText, applyFilters, resetFilters } = usePageContext();
    const [draft, setDraft] = useState<EventFilterValues>(query);

    // The date range counts as one filter however many of its two ends are set.
    const activeCount = [query.status, query.format, query.dateFrom || query.dateTo].filter((value) => value !== '').length;
    const setField = <K extends keyof EventFilterValues>(name: K, value: EventFilterValues[K]) =>
        setDraft((current) => ({ ...current, [name]: value }));

    return (
        <section className="flex items-center gap-2" data-test-id="events_filters">
            <div className="min-w-0 flex-1">
                <Label htmlFor="search" className="sr-only">
                    Pencarian
                </Label>
                <Input
                    id="search"
                    type="search"
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    placeholder="Cari judul kegiatan"
                    className="bg-card h-10"
                    data-test-id="events_input_search"
                />
            </div>
            <FilterDialog
                activeCount={activeCount}
                onOpen={() => setDraft(query)}
                onApply={() => applyFilters(draft)}
                onReset={resetFilters}
                description="Pilih filter kegiatan, lalu tekan Terapkan."
                data-test-id="events_filter"
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
                    id="format"
                    label="Jenis"
                    allLabel="Semua jenis"
                    value={draft.format}
                    options={options?.formats ?? []}
                    onChange={(value) => setField('format', value)}
                />
                <div className="grid min-w-0 gap-1.5">
                    <Label htmlFor="dateFrom" className="text-xs font-normal">
                        Dari tanggal
                    </Label>
                    <DatePickerField
                        id="dateFrom"
                        value={draft.dateFrom}
                        onChange={(value) => setField('dateFrom', value)}
                        placeholder="Pilih tanggal"
                        data-test-id="events_date_from"
                    />
                </div>
                <div className="grid min-w-0 gap-1.5">
                    <Label htmlFor="dateTo" className="text-xs font-normal">
                        Sampai tanggal
                    </Label>
                    <DatePickerField
                        id="dateTo"
                        value={draft.dateTo}
                        onChange={(value) => setField('dateTo', value)}
                        placeholder="Pilih tanggal"
                        data-test-id="events_date_to"
                    />
                </div>
            </FilterDialog>
        </section>
    );
};
