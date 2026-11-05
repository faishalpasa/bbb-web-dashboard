import { CalendarDays, X } from 'lucide-react';
import { useState } from 'react';

import { dateToValue, valueToDate } from '@/components/molecules/date-time-field';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const DATE_LABEL = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

interface DatePickerFieldProps {
    id: string;
    /** "YYYY-MM-DD", or empty when no day is chosen. */
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    'data-test-id': string;
}

/** A calendar button for one day, with a clear button once a day is chosen. */
export const DatePickerField = ({ id, value, onChange, placeholder, 'data-test-id': testId }: DatePickerFieldProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const selected = valueToDate(value);

    return (
        <div className="relative">
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id={id}
                        type="button"
                        variant="outline"
                        className={`bg-card h-10 w-full min-w-0 justify-start gap-2 px-3 text-left font-normal ${selected ? 'pr-9' : ''}`}
                        data-test-id={`${testId}_button`}
                    >
                        <CalendarDays className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
                        <span className={selected ? 'truncate' : 'text-muted-foreground truncate'}>
                            {selected ? DATE_LABEL.format(selected) : placeholder}
                        </span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent>
                    <Calendar
                        mode="single"
                        selected={selected}
                        defaultMonth={selected}
                        onSelect={(date) => {
                            onChange(date ? dateToValue(date) : '');
                            setIsOpen(false);
                        }}
                    />
                </PopoverContent>
            </Popover>
            {selected && (
                <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-sm focus-visible:ring-2 focus-visible:outline-hidden"
                    aria-label="Hapus tanggal"
                    onClick={() => onChange('')}
                    data-test-id={`${testId}_clear`}
                >
                    <X className="size-4" aria-hidden="true" />
                </button>
            )}
        </div>
    );
};
