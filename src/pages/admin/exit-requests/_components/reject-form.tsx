import { FeedbackToast } from '@/components/molecules/feedback-toast';
import { LoaderCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { usePageContext } from '../_context';

interface RejectFormProps {
    'data-test-id': string;
}

// The form itself; the page shows it as a side panel on large screens and inside a dialog on small ones.
export const RejectForm = ({ 'data-test-id': testId }: RejectFormProps) => {
    const { reason, reasonError, rejectError, isRejecting, setReason, closeReject, submitReject } = usePageContext();

    return (
        <form
            className="space-y-4"
            noValidate
            onSubmit={(event) => {
                event.preventDefault();
                void submitReject();
            }}
            data-test-id={testId}
        >
            <div className="grid gap-2">
                <Label htmlFor="rejectReason">Alasan penolakan (wajib)</Label>
                <Textarea
                    id="rejectReason"
                    value={reason}
                    maxLength={1000}
                    aria-required="true"
                    aria-invalid={Boolean(reasonError)}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Contoh: Mohon konfirmasi dulu lewat WhatsApp sebelum kami memproses permintaan ini."
                    className="min-h-28"
                    data-test-id={`${testId}_input_reason`}
                />
                {reasonError && (
                    <p className="text-sm text-red-600" data-test-id={`${testId}_error_reason`}>
                        {reasonError}
                    </p>
                )}
            </div>

            <p className="bg-secondary/70 rounded-md p-3 text-sm">
                Alasan ini dikirim ke member lewat email dan tampil di Beranda mereka. Gunakan bahasa yang sopan dan jangan menyebut data pribadi
                orang lain.
            </p>

            {rejectError && <FeedbackToast data-test-id={`${testId}_error`}>{rejectError}</FeedbackToast>}

            <div className="flex justify-end gap-2">
                <Button
                    type="button"
                    variant="outline"
                    className="bg-card"
                    disabled={isRejecting}
                    onClick={closeReject}
                    data-test-id={`${testId}_button_cancel`}
                >
                    Batal
                </Button>
                <Button type="submit" disabled={isRejecting} data-test-id={`${testId}_button_submit`}>
                    {isRejecting && <LoaderCircle className="animate-spin" />}
                    Kirim Penolakan
                </Button>
            </div>
        </form>
    );
};
