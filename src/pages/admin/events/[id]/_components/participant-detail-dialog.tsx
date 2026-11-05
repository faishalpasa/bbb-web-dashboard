import type { ReactNode } from 'react';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/molecules/dialog';
import { FeedbackToast } from '@/components/molecules/feedback-toast';
import { StatusBadge } from '@/components/molecules/status-badge';
import { Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PARTICIPANT_STATUS_TONES } from '@/constants/event';
import { formatRegisteredAt } from '@/utils/date';
import { formatFileSize } from '@/utils/file';

import { usePageContext } from '../_context';
import { useParticipantDetail } from '../_use-participant-detail';

interface DetailRowProps {
    label: string;
    children: ReactNode;
    testId: string;
}

// Answers are plain text: React escapes them, and pre-wrap keeps the line breaks of a textarea answer.
const DetailRow = ({ label, children, testId }: DetailRowProps) => (
    <div className="border-border grid gap-1 border-b py-3 last:border-b-0" data-test-id={testId}>
        <dt className="text-muted-foreground text-xs">{label}</dt>
        <dd className="text-sm break-words whitespace-pre-wrap">{children}</dd>
    </div>
);

export const ParticipantDetailDialog = () => {
    const { event, detailParticipant, closeDetail } = usePageContext();
    const { detail, error, isLoading, retry, downloadFile, downloadError } = useParticipantDetail(event?.id, detailParticipant?.id ?? null);
    const participant = detail?.participant ?? detailParticipant;
    const response = detail?.registrationResponse ?? null;

    return (
        <Dialog
            open={detailParticipant !== null}
            onOpenChange={(open) => {
                if (!open) closeDetail();
            }}
        >
            <DialogContent className="md:max-h-[90dvh] md:overflow-y-auto" data-test-id="event_detail_dialog_participant_detail">
                <DialogHeader>
                    <DialogTitle>Detail peserta</DialogTitle>
                    <DialogDescription>Data pendaftaran sesuai isian saat peserta mendaftar. Hanya dapat dibaca.</DialogDescription>
                </DialogHeader>
                {/* On mobile the sheet itself must not scroll: vaul draws a tall ::after below it that would extend the scroll area. */}
                <div className="min-h-0 overflow-y-auto px-4 pb-4 sm:px-0">
                    {participant && (
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2" data-test-id="event_detail_participant_summary">
                            <p className="font-semibold break-words">{participant.name}</p>
                            <StatusBadge
                                tone={PARTICIPANT_STATUS_TONES[participant.status.value]}
                                label={participant.status.label}
                                data-test-id="event_detail_participant_detail_status"
                            />
                        </div>
                    )}
                    {isLoading && (
                        <div className="space-y-3" role="status" aria-label="Memuat detail peserta" data-test-id="event_detail_participant_loading">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    )}
                    {error && (
                        <div className="space-y-3">
                            <FeedbackToast data-test-id="event_detail_participant_detail_error">{error}</FeedbackToast>
                            <Button variant="outline" className="bg-card" onClick={retry} data-test-id="event_detail_participant_detail_retry">
                                Coba lagi
                            </Button>
                        </div>
                    )}
                    {detail && !response && (
                        <p className="bg-secondary/70 rounded-md p-3 text-sm" data-test-id="event_detail_participant_detail_empty">
                            Belum ada data formulir untuk peserta ini.
                        </p>
                    )}
                    {detail && response && (
                        <dl data-test-id="event_detail_participant_detail_answers">
                            <DetailRow label="Nama" testId="event_detail_participant_detail_name">
                                {response.name}
                            </DetailRow>
                            <DetailRow label="Email" testId="event_detail_participant_detail_email">
                                {response.email}
                            </DetailRow>
                            {response.answers.map((answer) => (
                                <DetailRow
                                    key={answer.fieldId}
                                    label={answer.label}
                                    testId={`event_detail_participant_detail_answer_${answer.fieldId}`}
                                >
                                    {answer.type === 'file' && answer.file ? (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="bg-card h-auto min-h-11 max-w-full justify-start gap-2 py-2 break-all whitespace-normal"
                                            onClick={() => void downloadFile(answer.file!.id, answer.file!.name)}
                                            data-test-id={`event_detail_participant_detail_file_${answer.fieldId}`}
                                        >
                                            <Download className="size-4 shrink-0" aria-hidden="true" />
                                            {answer.file.name} ({formatFileSize(answer.file.size)})
                                        </Button>
                                    ) : (
                                        (answer.displayValue ?? 'Tidak diisi')
                                    )}
                                </DetailRow>
                            ))}
                            {downloadError && (
                                <p role="alert" className="text-destructive py-2 text-sm" data-test-id="event_detail_participant_detail_file_error">
                                    {downloadError}
                                </p>
                            )}
                            <DetailRow label="Dikirim" testId="event_detail_participant_detail_submitted">
                                {formatRegisteredAt(response.submittedAt)}
                            </DetailRow>
                        </dl>
                    )}
                    <Button
                        type="button"
                        variant="outline"
                        className="bg-card mt-4 min-h-11 w-full"
                        onClick={closeDetail}
                        data-test-id="event_detail_participant_detail_close"
                    >
                        Tutup
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
