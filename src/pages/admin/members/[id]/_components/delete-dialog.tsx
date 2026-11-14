import { useState } from 'react';

import { ConfirmationDialog } from '@/components/molecules/confirmation-dialog';
import { FormField } from '@/components/molecules/form-field';
import { Input } from '@/components/ui/input';
import { PERMISSIONS as P } from '@/constants/permission';
import { usePermissions } from '@/hooks/usePermissions';

import { usePageContext } from '../_context';

// Spaces at the edges and doubled spaces in the middle do not count, but letters must match exactly.
const normalize = (text: string): string => text.trim().replace(/\s+/g, ' ');

// The deletion cannot be undone, so the admin has to type the member's own name: a stray click is not enough.
export const DeleteDialog = () => {
    const { can } = usePermissions();
    const { member, isDeleteOpen, deleteError, isDeleting, closeDelete, confirmDelete } = usePageContext();
    const [typed, setTyped] = useState('');

    if (!member) return null;

    const isNameTyped = normalize(typed) === normalize(member.name);

    const close = () => {
        setTyped('');
        closeDelete();
    };

    return (
        <ConfirmationDialog
            open={isDeleteOpen && can(P.MEMBER_DELETE) && member.actions.canDelete}
            onClose={close}
            onConfirm={() => void confirmDelete()}
            title="Hapus member permanen?"
            description={`Anda akan menghapus member ${member.name}${member.memberNumber ? ` (${member.memberNumber})` : ''} secara permanen. Data yang sudah dihapus tidak bisa dikembalikan.`}
            confirmLabel="Hapus Permanen"
            cancelLabel="Batal"
            isSubmitting={isDeleting}
            isConfirmDisabled={!isNameTyped}
            error={deleteError}
            isDestructive
            data-test-id="member_detail_dialog_delete"
        >
            <div className="space-y-3 px-4 text-sm sm:px-0">
                <ul className="list-disc space-y-1 pl-5">
                    <li>Akun, profil, dan catatan member dihapus.</li>
                    <li>
                        {member.statistics.joined} riwayat kegiatan ({member.statistics.attended} hadir) ikut terhapus, termasuk jawaban dan berkas
                        pendaftarannya.
                    </li>
                    <li>
                        Riwayat permintaan keluar yang sudah diputuskan tetap tersimpan sebagai catatan (nama, nomor anggota, tanggal, dan admin yang
                        memutuskan).
                    </li>
                    <li>Member yang sedang masuk langsung keluar dari aplikasi.</li>
                    <li>Email dan nomor WhatsApp member bisa dipakai orang lain setelah ini.</li>
                </ul>
                <FormField
                    id="memberDeleteConfirm"
                    label={`Silakan input "${member.name}" untuk konfirmasi penghapusan`}
                    isOptional
                    data-test-id="member_detail_delete_confirm"
                >
                    <Input
                        id="memberDeleteConfirm"
                        value={typed}
                        onChange={(event) => setTyped(event.target.value)}
                        disabled={isDeleting}
                        autoComplete="off"
                        placeholder={member.name}
                        className="bg-card h-11"
                        data-test-id="member_detail_delete_input_confirm"
                    />
                </FormField>
                {typed.trim() !== '' && !isNameTyped && (
                    <p className="text-muted-foreground" data-test-id="member_detail_delete_text_mismatch">
                        Nama belum sama dengan nama member.
                    </p>
                )}
            </div>
        </ConfirmationDialog>
    );
};
