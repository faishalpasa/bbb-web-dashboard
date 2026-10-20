import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/molecules/dialog';
import { Button } from '@/components/ui/button';
import { MASTERLIST_FIELDS } from '@/constants/masterlist';

import { usePageContext } from '../_context';

const LABELS = Object.fromEntries(MASTERLIST_FIELDS.map((field) => [field.value, field.label]));
const display = (value: unknown): string =>
    value === null || value === undefined || value === ''
        ? 'Tidak tersedia'
        : Array.isArray(value)
          ? value.join(', ') || 'Tidak dipilih'
          : String(value);

export const RowDetail = () => {
    const { detail, setDetail } = usePageContext();
    return (
        <Dialog
            open={detail !== null}
            onOpenChange={(open) => {
                if (!open) setDetail(null);
            }}
        >
            <DialogContent className="md:max-h-[90dvh] md:overflow-y-auto" data-test-id="masterlist_dialog_detail">
                <DialogHeader>
                    <DialogTitle>Detail baris {detail?.row_number}</DialogTitle>
                    <DialogDescription>Kandidat belum disimpan sebagai member. Raw dan provenance disediakan untuk review.</DialogDescription>
                </DialogHeader>
                <div className="min-h-0 overflow-y-auto px-4 pb-6 md:px-0 md:pb-0">
                    {detail && (
                        <div className="space-y-5">
                            <section aria-label="Catatan review">
                                <h3 className="font-semibold">Catatan</h3>
                                <ul className="mt-2 space-y-2 text-sm">
                                    {detail.issues.map((issue, index) => (
                                        <li
                                            key={`${issue.code}-${index}`}
                                            className={issue.severity === 'error' ? 'text-destructive' : ''}
                                            data-test-id={`masterlist_issue_${index}`}
                                        >
                                            <span className="font-medium">{LABELS[issue.field] ?? 'Baris'}: </span>
                                            {issue.message}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                            <section aria-label="Kandidat">
                                <h3 className="font-semibold">Kandidat</h3>
                                <dl>
                                    {Object.entries(detail.values).map(([key, value]) => (
                                        <div key={key} className="border-b py-2">
                                            <dt className="text-muted-foreground text-xs">{LABELS[key] ?? key}</dt>
                                            <dd className="text-sm break-words whitespace-pre-wrap">{display(value)}</dd>
                                        </div>
                                    ))}
                                </dl>
                            </section>
                            <details data-test-id="masterlist_details_raw">
                                <summary className="min-h-11 cursor-pointer py-3 font-semibold" data-test-id="masterlist_button_raw">
                                    Data sumber dan provenance
                                </summary>
                                <dl>
                                    {Object.entries(detail.raw).map(([key, value]) => (
                                        <div key={key} className="border-b py-2">
                                            <dt className="text-muted-foreground text-xs break-words">{key}</dt>
                                            <dd className="text-sm break-words whitespace-pre-wrap">{display(value)}</dd>
                                        </div>
                                    ))}
                                </dl>
                                <dl className="mt-4">
                                    {Object.entries(detail.provenance).map(([key, value]) => (
                                        <div key={key} className="border-b py-2">
                                            <dt className="text-muted-foreground text-xs break-words">{LABELS[key] ?? key}</dt>
                                            <dd className="text-sm break-words">{display(value)}</dd>
                                        </div>
                                    ))}
                                </dl>
                            </details>
                        </div>
                    )}
                    <Button variant="outline" className="mt-4 min-h-11 w-full" onClick={() => setDetail(null)} data-test-id="masterlist_button_close">
                        Tutup
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
