import { FormField } from '@/components/molecules/form-field';
import { Input } from '@/components/ui/input';
import { durationTextError, splitDurationText } from '@/utils/date';
import { NUMBER_INPUT_PROPS } from '@/utils/number-input';

interface DurationFieldProps {
    id: string;
    label: string;
    hint?: string;
    error?: string;
    /** "jam:menit" text from the form state; ":" or '' while both boxes are empty. */
    value: string;
    onChange: (value: string) => void;
}

const digits = (value: string): string => value.replace(/\D/g, '').slice(0, 3);

// Admins type hours and minutes; the page saves them as one minute count.
export const DurationField = ({ id, label, hint, error, value, onChange }: DurationFieldProps) => {
    const { hours, minutes } = splitDurationText(value);
    // Range mistakes show while typing; an empty field is only reported on submit.
    const message = error ?? durationTextError(value);
    const isMinuteInvalid = Number(minutes || 0) > 59;

    return (
        <FormField id={id} label={label} hint={hint} error={message} data-test-id={`settings_${id}`}>
            <div className="flex items-center gap-2">
                <Input
                    id={id}
                    {...NUMBER_INPUT_PROPS}
                    min={0}
                    value={hours}
                    aria-required="true"
                    aria-label={`${label}, jam`}
                    aria-invalid={Boolean(message) && !isMinuteInvalid}
                    onChange={(event) => onChange(`${digits(event.target.value)}:${minutes}`)}
                    className="bg-card h-11 w-20 font-mono"
                    data-test-id={`settings_input_${id}_hours`}
                />
                <span className="text-muted-foreground text-sm">jam</span>
                <Input
                    id={`${id}Minutes`}
                    {...NUMBER_INPUT_PROPS}
                    min={0}
                    max={59}
                    value={minutes}
                    aria-required="true"
                    aria-label={`${label}, menit`}
                    aria-invalid={isMinuteInvalid}
                    onChange={(event) => onChange(`${hours}:${digits(event.target.value).slice(0, 2)}`)}
                    className="bg-card h-11 w-20 font-mono"
                    data-test-id={`settings_input_${id}_minutes`}
                />
                <span className="text-muted-foreground text-sm">menit</span>
            </div>
        </FormField>
    );
};
