import { ConfirmationDialog } from '@/components/molecules/confirmation-dialog';
import { PERMISSIONS as P } from '@/constants/permission';
import { usePermissions } from '@/hooks/usePermissions';

import { usePageContext } from '../_context';

export const StatusDialogs = () => {
    const { can } = usePermissions();
    const { member, statusDialog, statusError, isChangingStatus, closeStatusDialog, confirmStatusChange } = usePageContext();

    if (!member) return null;

    const isDeactivate = statusDialog === 'deactivate';

    return (
        <ConfirmationDialog
            open={statusDialog !== null && can(isDeactivate ? P.MEMBER_DEACTIVATE : P.MEMBER_ACTIVATE)}
            onClose={closeStatusDialog}
            onConfirm={() => void confirmStatusChange()}
            title={isDeactivate ? 'Nonaktifkan member?' : 'Aktifkan kembali member?'}
            description={isDeactivate ? 'Tindakan ini berlaku segera.' : 'Member bisa kembali memakai dashboard dan mendaftar kegiatan.'}
            confirmLabel={isDeactivate ? 'Nonaktifkan' : 'Aktifkan'}
            cancelLabel="Batal"
            isSubmitting={isChangingStatus}
            error={statusError}
            isDestructive={isDeactivate}
            data-test-id={isDeactivate ? 'member_detail_dialog_deactivate' : 'member_detail_dialog_activate'}
        >
            <div className="space-y-3 px-4 text-sm sm:px-0">
                <p className="bg-secondary/70 rounded-md px-3 py-2">
                    <span className="font-semibold">{member.name}</span> <span className="font-mono">{member.memberNumber}</span>
                </p>
                {isDeactivate && (
                    <ul className="list-disc space-y-1 pl-5">
                        <li>Member tidak bisa lagi memakai dashboard dan kegiatan.</li>
                        <li>Pendaftaran kegiatan mendatang dibatalkan.</li>
                        <li>Data tetap tersimpan, dan akun bisa diaktifkan kembali oleh admin.</li>
                    </ul>
                )}
            </div>
        </ConfirmationDialog>
    );
};
