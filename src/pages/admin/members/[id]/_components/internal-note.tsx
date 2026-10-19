import { AlertMessage } from '@/components/molecules/alert-message';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PERMISSIONS as P } from '@/constants/permission';
import { usePermissions } from '@/hooks/usePermissions';

import { usePageContext } from '../_context';

export const InternalNote = () => {
    const { can } = usePermissions();
    const { note, noteMessage, isSavingNote, setNote, saveNote } = usePageContext();

    return (
        <section className="border-border bg-card space-y-3 rounded-lg border p-5" data-test-id="member_detail_note">
            <Label htmlFor="note" className="text-base font-semibold">
                Catatan internal
            </Label>
            <Textarea
                id="note"
                value={note}
                maxLength={2000}
                readOnly={!can(P.MEMBER_NOTE_UPDATE)}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Catatan admin. Tidak terlihat oleh member."
                className="min-h-28"
                data-test-id="member_detail_input_note"
            />
            {noteMessage && (
                <AlertMessage tone={noteMessage.tone} data-test-id="member_detail_alert_note">
                    {noteMessage.text}
                </AlertMessage>
            )}
            {can(P.MEMBER_NOTE_UPDATE) && (
                <Button variant="outline" disabled={isSavingNote} onClick={() => void saveNote()} data-test-id="member_detail_button_save_note">
                    {isSavingNote ? 'Menyimpan…' : 'Simpan Catatan'}
                </Button>
            )}
        </section>
    );
};
