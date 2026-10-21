import { ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { NativeSelect } from '@/components/ui/native-select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const DEFAULT_TIME = '09:00';

// 00:00, 00:30 ... 23:30: events start and end on the half hour.
export const TIME_OPTIONS: string[] = Array.from({ length: 48 }, (_, index) => {
    const hours = String(Math.floor(index / 2)).padStart(2, '0');

    return `${hours}:${index % 2 === 0 ? '00' : '30'}`;
});

const DATE_LABEL = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

const pad = (value: number): string => String(value).padStart(2, '0');

// "YYYY-MM-DD" <-> a calendar Date at local midnight (the calendar never needs a time zone: it is only a date).
export const dateToValue = (date: Date): string => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const valueToDate = (value: string): Date | undefined => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

    return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : undefined;
};

// "YYYY-MM-DDTHH:mm" (the wall clock of the event, as the form stores it) -> its date and time parts.
export const splitDateTime = (value: string): { date: string; time: string } => {
    const [date = '', time = ''] = value.split('T');

    return { date, time: time.slice(0, 5) };
};

interface DateTimeFieldProps {
    id: string;
    value: string;
    onChange: (value: string) => void;
    invalid?: boolean;
    'data-test-id': string;
}

/** A date from the calendar and a time in 30-minute steps; reports "YYYY-MM-DDTHH:mm" once both are chosen. */
export const DateTimeField = ({ id, value, onChange, invalid = false, 'data-test-id': testId }: DateTimeFieldProps) => {
    const [parts, setParts] = useState(() => splitDateTime(value));
    const [isOpen, setIsOpen] = useState(false);

    // The form may replace the value (loading an event, resetting): follow it, but keep a half-picked state while empty.
    useEffect(() => {
        if (value !== '') setParts(splitDateTime(value));
    }, [value]);

    const update = (next: { date: string; time: string }) => {
        setParts(next);
        if (next.date !== '' && next.time !== '') onChange(`${next.date}T${next.time}`);
    };

    const selected = valueToDate(parts.date);
    // A time that is not on the grid (saved earlier, e.g. 23:59) stays selectable until someone picks another one.
    const times = parts.time !== '' && !TIME_OPTIONS.includes(parts.time) ? [...TIME_OPTIONS, parts.time].sort() : TIME_OPTIONS;

    return (
        <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-3">
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id={id}
                        type="button"
                        variant="outline"
                        aria-invalid={invalid || undefined}
                        aria-required="true"
                        className="bg-card h-11 w-full min-w-0 justify-between gap-2 px-3 text-left font-normal"
                        data-test-id={`${testId}_button_date`}
                    >
                        <span className={selected ? 'truncate' : 'text-muted-foreground truncate'}>
                            {selected ? DATE_LABEL.format(selected) : 'Pilih tanggal'}
                        </span>
                        <ChevronDown className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent>
                    <Calendar
                        mode="single"
                        selected={selected}
                        defaultMonth={selected}
                        onSelect={(date) => {
                            if (!date) return;
                            update({ date: dateToValue(date), time: parts.time || DEFAULT_TIME });
                            setIsOpen(false);
                        }}
                    />
                </PopoverContent>
            </Popover>
            <NativeSelect
                aria-label="Jam"
                aria-required="true"
                aria-invalid={invalid || undefined}
                value={parts.time}
                onChange={(event) => update({ date: parts.date, time: event.target.value })}
                data-test-id={`${testId}_select_time`}
            >
                <option value="" disabled>
                    Jam
                </option>
                {times.map((time) => (
                    <option key={time} value={time}>
                        {time}
                    </option>
                ))}
            </NativeSelect>
        </div>
    );
};
