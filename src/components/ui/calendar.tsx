import { id } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import * as React from 'react';
import { DayPicker } from 'react-day-picker';

import { cn } from '@/lib/utils';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

// shadcn calendar on react-day-picker, with the Indonesian locale and this project's colour tokens.
const Calendar = ({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) => (
    <DayPicker
        locale={id}
        showOutsideDays={showOutsideDays}
        className={cn('p-3', className)}
        classNames={{
            months: 'relative flex flex-col gap-4',
            month: 'flex flex-col gap-3',
            month_caption: 'flex h-9 items-center justify-center',
            caption_label: 'text-sm font-semibold',
            nav: 'absolute inset-x-0 top-0 flex h-9 items-center justify-between',
            button_previous: 'text-muted-foreground hover:bg-muted inline-flex size-8 items-center justify-center rounded-md',
            button_next: 'text-muted-foreground hover:bg-muted inline-flex size-8 items-center justify-center rounded-md',
            month_grid: 'w-full border-collapse',
            weekdays: 'flex',
            weekday: 'text-muted-foreground w-9 text-center text-xs font-normal',
            week: 'mt-1 flex w-full',
            day: 'size-9 p-0 text-center text-sm',
            day_button:
                'hover:bg-muted focus-visible:ring-ring inline-flex size-9 items-center justify-center rounded-md font-normal focus-visible:ring-2 focus-visible:outline-hidden',
            selected: '[&>button]:bg-primary [&>button]:text-primary-foreground [&>button:hover]:bg-primary',
            today: '[&>button]:border-primary [&>button]:border',
            outside: 'text-muted-foreground opacity-50',
            disabled: 'text-muted-foreground opacity-40',
            hidden: 'invisible',
            ...classNames,
        }}
        components={{
            Chevron: ({ orientation }) => (orientation === 'left' ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />),
        }}
        {...props}
    />
);
Calendar.displayName = 'Calendar';

export { Calendar };
