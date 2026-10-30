import { DatePickerField } from '@/components/molecules/date-picker-field';
import { ListFilterPanel } from '@/components/molecules/list-filter-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { useMediaQuery } from '@/hooks/useMediaQuery';
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
    const { isDesktop } = useMediaQuery(1024);
    const { query, searchText, options, hasActiveFilter, setSearchText, setFilter, clearFilters } = usePageContext();

    return (
        <ListFilterPanel
            title="Filter kegiatan"
            hasActiveFilter={hasActiveFilter}
            data-test-id="events_filters"
            search={
                <div className="grid min-w-0 gap-1.5">
                    <Label htmlFor="search" className="sr-only text-xs font-normal lg:not-sr-only">
                        Pencarian
                    </Label>
                    <Input
                        id="search"
                        type="search"
                        value={searchText}
                        onChange={(event) => setSearchText(event.target.value)}
                        placeholder="Judul kegiatan"
                        className="bg-card h-11 lg:h-10"
                        data-test-id="events_input_search"
                    />
                </div>
            }
        >
            <FilterSelect
                id="status"
                label="Status"
                allLabel="Semua status"
                value={query.status}
                options={options?.statuses ?? []}
                onChange={(value) => setFilter('status', value)}
            />
            <FilterSelect
                id="format"
                label="Jenis"
                allLabel="Semua jenis"
                value={query.format}
                options={options?.formats ?? []}
                onChange={(value) => setFilter('format', value)}
            />
            <div className="grid min-w-0 gap-1.5">
                <Label htmlFor="dateFrom" className="text-xs font-normal">
                    Dari tanggal
                </Label>
                {isDesktop ? (
                    <DatePickerField
                        id="dateFrom"
                        value={query.dateFrom}
                        onChange={(value) => setFilter('dateFrom', value)}
                        placeholder="Pilih tanggal"
                        data-test-id="events_date_from"
                    />
                ) : (
                    <Input
                        id="dateFrom"
                        type="date"
                        value={query.dateFrom}
                        onChange={(event) => setFilter('dateFrom', event.target.value)}
                        className="bg-card h-11 min-w-0"
                        data-test-id="events_date_from_input"
                    />
                )}
            </div>
            <div className="grid min-w-0 gap-1.5">
                <Label htmlFor="dateTo" className="text-xs font-normal">
                    Sampai tanggal
                </Label>
                {isDesktop ? (
                    <DatePickerField
                        id="dateTo"
                        value={query.dateTo}
                        onChange={(value) => setFilter('dateTo', value)}
                        placeholder="Pilih tanggal"
                        data-test-id="events_date_to"
                    />
                ) : (
                    <Input
                        id="dateTo"
                        type="date"
                        value={query.dateTo}
                        onChange={(event) => setFilter('dateTo', event.target.value)}
                        className="bg-card h-11 min-w-0"
                        data-test-id="events_date_to_input"
                    />
                )}
            </div>
            {hasActiveFilter && (
                <div className="sm:col-span-2 lg:col-span-5">
                    <Button type="button" variant="outline" size="sm" onClick={clearFilters} data-test-id="events_button_clear_filters">
                        Hapus semua filter
                    </Button>
                </div>
            )}
        </ListFilterPanel>
    );
};
