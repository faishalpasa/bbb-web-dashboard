import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

import { FormField } from '@/components/molecules/form-field';
import { PhoneCountrySheet } from '@/components/molecules/phone-country-sheet';
import { Input } from '@/components/ui/input';
import { countryNameOf, dialCodeOf, flagOf, hasInternationalPrefix, matchDialPrefix } from '@/utils/whatsapp';

interface WhatsappFieldProps {
    country: string;
    value: string;
    error?: string;
    onChange: (country: string, value: string) => void;
    'data-test-id': string;
}

/** The country code first (flag and +62 by default, opens a list of countries), then the number. */
export const WhatsappField = ({ country, value, error, onChange, 'data-test-id': testId }: WhatsappFieldProps) => {
    const [isSheetOpen, setSheetOpen] = useState(false);

    const handleValueChange = (next: string) => {
        // A number pasted or typed with its own code (+49 177…, 0049 177…) picks the matching country by itself, once
        // enough digits are there to tell the code from the number; until then the text stays as typed.
        if (hasInternationalPrefix(next)) {
            const match = matchDialPrefix(next.replace(/\D/g, '').replace(/^00/, ''));

            if (match && match.rest !== '') {
                onChange(match.iso, match.rest);

                return;
            }
        }

        onChange(country, next);
    };

    return (
        <>
            <FormField
                id="whatsapp"
                label="Nomor WhatsApp"
                hint="Ketuk kode negara untuk nomor luar negeri. Nomor Indonesia boleh diawali 0, disimpan sebagai 628xx."
                error={error}
                data-test-id={`${testId}_whatsapp`}
            >
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setSheetOpen(true)}
                        aria-haspopup="dialog"
                        aria-label={`Kode negara: ${countryNameOf(country)} +${dialCodeOf(country)}. Ketuk untuk mengubah.`}
                        className="border-input bg-card focus-visible:ring-ring flex h-11 shrink-0 items-center gap-1.5 rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden"
                        data-test-id={`${testId}_button_country`}
                    >
                        <span className="text-xl leading-none" aria-hidden="true">
                            {flagOf(country)}
                        </span>
                        <span className="font-mono">+{dialCodeOf(country)}</span>
                        <ChevronDown className="text-muted-foreground size-4" aria-hidden="true" />
                    </button>
                    <Input
                        id="whatsapp"
                        type="tel"
                        inputMode="tel"
                        autoComplete="off"
                        value={value}
                        onChange={(event) => handleValueChange(event.target.value)}
                        placeholder="8123456789"
                        className="bg-card h-11 min-w-0 flex-1 font-mono"
                        aria-invalid={!!error}
                        aria-describedby={error ? 'whatsapp-hint whatsapp-error' : 'whatsapp-hint'}
                        aria-required
                        data-test-id={`${testId}_input_whatsapp`}
                    />
                </div>
            </FormField>
            <PhoneCountrySheet
                open={isSheetOpen}
                onOpenChange={setSheetOpen}
                value={country}
                onSelect={(iso) => onChange(iso, value)}
                data-test-id={`${testId}_country_sheet`}
            />
        </>
    );
};
