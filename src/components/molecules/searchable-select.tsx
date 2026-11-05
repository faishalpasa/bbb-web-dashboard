import { Command as CommandPrimitive } from 'cmdk';
import { Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface SearchableSelectProps {
    id: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
    placeholder: string;
    searchPlaceholder: string;
    emptyText: string;
    disabled?: boolean;
    'aria-invalid'?: boolean;
    'aria-describedby'?: string;
    'aria-required'?: boolean | 'true' | 'false';
    'data-test-id': string;
}

/**
 * A select with a search box (the shadcn "combobox": a popover with a command list). It looks like NativeSelect; use it
 * where the list is long enough to need searching, such as the countries.
 */
export const SearchableSelect = ({
    id,
    value,
    options,
    onChange,
    placeholder,
    searchPlaceholder,
    emptyText,
    disabled,
    'data-test-id': testId,
    ...aria
}: SearchableSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const selected = options.find((option) => option.value === value);

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <button
                    id={id}
                    type="button"
                    role="combobox"
                    aria-expanded={isOpen}
                    aria-haspopup="listbox"
                    disabled={disabled}
                    className="border-input bg-card ring-offset-background focus-visible:ring-ring disabled:bg-muted disabled:text-muted-foreground relative flex h-11 w-full items-center rounded-md border px-3 pr-10 text-left text-base focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:cursor-not-allowed md:text-sm"
                    data-test-id={testId}
                    {...aria}
                >
                    <span className={cn('truncate', !selected && 'text-muted-foreground')}>{selected?.label ?? placeholder}</span>
                    <ChevronDown
                        className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
                        aria-hidden="true"
                    />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-(--radix-popover-trigger-width) p-0" data-test-id={`${testId}_popup`}>
                <CommandPrimitive>
                    <CommandPrimitive.Input
                        placeholder={searchPlaceholder}
                        className="border-border h-11 w-full border-b bg-transparent px-3 text-base outline-hidden md:text-sm"
                        data-test-id={`${testId}_search`}
                    />
                    <CommandPrimitive.List className="max-h-60 overflow-y-auto p-1">
                        <CommandPrimitive.Empty className="text-muted-foreground px-3 py-6 text-center text-sm">{emptyText}</CommandPrimitive.Empty>
                        {options.map((option) => (
                            <CommandPrimitive.Item
                                key={option.value}
                                value={option.label}
                                onSelect={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className="data-[selected=true]:bg-secondary flex min-h-11 cursor-pointer items-center gap-2 rounded-sm px-3 text-sm"
                                data-test-id={`${testId}_option_${option.value}`}
                            >
                                <Check className={cn('size-4 shrink-0', option.value === value ? 'opacity-100' : 'opacity-0')} aria-hidden="true" />
                                {option.label}
                            </CommandPrimitive.Item>
                        ))}
                    </CommandPrimitive.List>
                </CommandPrimitive>
            </PopoverContent>
        </Popover>
    );
};
