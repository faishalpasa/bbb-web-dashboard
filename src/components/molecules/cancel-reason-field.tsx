import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export const CANCEL_REASON_MAX_LENGTH = 500;

interface CancelReasonFieldProps {
    value: string;
    onChange: (value: string) => void;
    disabled: boolean;
    'data-test-id': string;
}

// Optional note the admin gives when cancelling an event; it is shown in the cancellation email to the participants.
export const CancelReasonField = ({ value, onChange, disabled, 'data-test-id': testId }: CancelReasonFieldProps) => (
    <div className="grid gap-1.5 px-4 sm:px-0">
        <Label htmlFor={`${testId}_input`}>Alasan pembatalan (opsional)</Label>
        <Textarea
            id={`${testId}_input`}
            value={value}
            maxLength={CANCEL_REASON_MAX_LENGTH}
            rows={3}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Misalnya: pembicara berhalangan hadir"
            data-test-id={`${testId}_input`}
        />
        <p className="text-muted-foreground text-xs">Ditampilkan di email pembatalan yang dikirim ke semua pendaftar.</p>
    </div>
);
