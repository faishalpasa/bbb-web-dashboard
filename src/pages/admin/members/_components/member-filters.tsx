import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import type { SelectOption } from '@/types/api';

import { usePageContext } from '../_context';

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

export const MemberFilters = () => {
    const { query, searchText, options, setSearchText, setFilter } = usePageContext();

    return (
        <section
            className="border-border bg-card grid grid-cols-1 gap-4 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))]"
            data-test-id="members_filters"
        >
            <div className="grid min-w-0 gap-1.5 sm:col-span-2 lg:col-span-1">
                <Label htmlFor="search" className="text-xs font-normal">
                    Pencarian
                </Label>
                <Input
                    id="search"
                    type="search"
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    placeholder="Nama, email, no. WhatsApp, atau nomor member"
                    className="bg-card h-10"
                    data-test-id="members_input_search"
                />
            </div>
            <FilterSelect
                id="status"
                label="Status"
                allLabel="Semua status"
                value={query.status}
                options={options?.statuses ?? []}
                onChange={(value) => setFilter('status', value)}
            />
            <FilterSelect
                id="province"
                label="Provinsi"
                allLabel="Semua provinsi"
                value={query.provinceCode}
                options={(options?.provinces ?? []).map((province) => ({ value: province.code, label: province.label }))}
                onChange={(value) => setFilter('provinceCode', value)}
            />
            <FilterSelect
                id="preference"
                label="Preferensi"
                allLabel="Semua preferensi"
                value={query.preference}
                options={options?.preferences ?? []}
                onChange={(value) => setFilter('preference', value)}
            />
            <FilterSelect
                id="attendance"
                label="Kehadiran"
                allLabel="Semua"
                value={query.attendance}
                options={options?.attendance ?? []}
                onChange={(value) => setFilter('attendance', value)}
            />
        </section>
    );
};
