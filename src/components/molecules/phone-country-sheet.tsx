import { Check, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/molecules/dialog';
import { cn } from '@/lib/utils';
import { flagOf, phoneCountryOptions } from '@/utils/whatsapp';

interface PhoneCountrySheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    value: string;
    onSelect: (iso: string) => void;
    'data-test-id': string;
}

const plain = (text: string): string => text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** The countries and their dialling codes in a bottom sheet on a phone and a dialog on a desktop, with a search box. */
export const PhoneCountrySheet = ({ open, onOpenChange, value, onSelect, 'data-test-id': testId }: PhoneCountrySheetProps) => {
    const [query, setQuery] = useState('');
    const options = useMemo(() => phoneCountryOptions(), []);
    const term = plain(query.trim());
    const digits = term.replace(/\D/g, '');
    const visible =
        term === '' ? options : options.filter((option) => plain(option.name).includes(term) || (digits !== '' && option.dial.startsWith(digits)));

    const handleOpenChange = (next: boolean) => {
        if (!next) setQuery('');

        onOpenChange(next);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange} fullHeight>
            <DialogContent className="flex max-h-[85vh] flex-col" data-test-id={testId}>
                <DialogHeader>
                    <DialogTitle>Pilih kode negara</DialogTitle>
                    <DialogDescription className="sr-only">Cari negara atau kode nomornya, lalu pilih satu.</DialogDescription>
                </DialogHeader>
                <div className="px-4 pb-2">
                    <label className="border-input bg-card focus-within:ring-ring flex h-11 items-center gap-2 rounded-md border px-3 focus-within:ring-2">
                        <Search className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
                        <input
                            type="search"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Cari negara atau kode"
                            aria-label="Cari negara atau kode"
                            className="placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent text-base outline-hidden md:text-sm"
                            data-test-id={`${testId}_input_search`}
                        />
                    </label>
                </div>
                <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-4" data-test-id={`${testId}_list`}>
                    {visible.length === 0 && <li className="text-muted-foreground px-3 py-8 text-center text-sm">Negara tidak ditemukan.</li>}
                    {visible.map((option) => (
                        <li key={option.iso}>
                            <button
                                type="button"
                                onClick={() => {
                                    onSelect(option.iso);
                                    handleOpenChange(false);
                                }}
                                aria-pressed={option.iso === value}
                                className={cn(
                                    'hover:bg-secondary focus-visible:ring-ring flex min-h-12 w-full items-center gap-3 rounded-md px-3 text-left text-sm focus-visible:ring-2 focus-visible:outline-hidden',
                                    option.iso === value && 'bg-secondary font-semibold',
                                )}
                                data-test-id={`${testId}_option_${option.iso.toLowerCase()}`}
                            >
                                <span className="text-xl leading-none" aria-hidden="true">
                                    {flagOf(option.iso)}
                                </span>
                                <span className="min-w-0 flex-1 truncate">{option.name}</span>
                                <span className="text-muted-foreground font-mono text-xs">+{option.dial}</span>
                                <Check className={cn('size-4 shrink-0', option.iso === value ? 'opacity-100' : 'opacity-0')} aria-hidden="true" />
                            </button>
                        </li>
                    ))}
                </ul>
            </DialogContent>
        </Dialog>
    );
};
