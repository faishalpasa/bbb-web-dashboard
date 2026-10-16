import { Check, X } from 'lucide-react';

import { useAppContext } from '@/app-context';
import { AlertMessage } from '@/components/molecules/alert-message';
import { StatusBadge } from '@/components/molecules/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { PARTICIPANT_STATUS_TONES } from '@/constants/event';
import type { EventParticipant } from '@/types/event';
import { formatRegisteredAt } from '@/utils/date';
import { formatWhatsapp } from '@/utils/string';

import { usePageContext } from '../_context';

const registeredLabel = (participant: EventParticipant): string =>
    participant.source === 'admin' ? 'Oleh admin' : formatRegisteredAt(participant.registeredAt);

interface AttendanceActionProps {
    participant: EventParticipant;
}

const AttendanceAction = ({ participant }: AttendanceActionProps) => {
    const { session } = useAppContext();
    const { event, pendingParticipantIds, toggleAttendance } = usePageContext();
    const isPending = pendingParticipantIds.includes(participant.id);
    const canMark = (session?.can.manageEvents ?? false) && (event?.actions.canMarkAttendance ?? false);

    if (!canMark) return null;

    if (participant.status.value === 'present') {
        return (
            <Button
                variant="outline"
                size="icon"
                className="bg-card size-9"
                disabled={isPending}
                onClick={() => void toggleAttendance(participant.id, false)}
                aria-label={`Batalkan tanda hadir ${participant.name}`}
                data-test-id={`event_detail_button_unmark_${participant.id}`}
            >
                <X />
            </Button>
        );
    }

    return (
        <Button
            size="sm"
            disabled={isPending}
            onClick={() => void toggleAttendance(participant.id, true)}
            data-test-id={`event_detail_button_mark_present_${participant.id}`}
        >
            <Check />
            Hadir
        </Button>
    );
};

export const ParticipantTable = () => {
    const { participants, participantsFailure, isLoadingParticipants, page, searchText, setSearchText, goToPage, reload } = usePageContext();
    const items = participants?.items ?? [];
    const meta = participants?.meta;
    const rangeStart = meta && meta.total > 0 ? (meta.currentPage - 1) * meta.perPage + 1 : 0;
    const rangeEnd = meta ? Math.min(meta.total, meta.currentPage * meta.perPage) : 0;

    return (
        <section
            className="border-border bg-card overflow-hidden rounded-lg border"
            data-test-id="event_detail_participants"
            aria-busy={isLoadingParticipants}
        >
            <div className="grid gap-1.5 p-4">
                <Label htmlFor="participantSearch" className="text-xs font-normal">
                    Cari peserta
                </Label>
                <Input
                    id="participantSearch"
                    type="search"
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    placeholder="Nama atau nomor member"
                    className="bg-card h-10 max-w-sm"
                    data-test-id="event_detail_input_search"
                />
            </div>

            {participantsFailure ? (
                <div className="space-y-3 p-4">
                    <AlertMessage data-test-id="event_detail_alert_participants_error">{participantsFailure.message}</AlertMessage>
                    <Button variant="outline" onClick={reload} data-test-id="event_detail_button_participants_retry">
                        Coba lagi
                    </Button>
                </div>
            ) : (
                <>
                    <div className="hidden md:block">
                        <table className="w-full text-sm">
                            <thead className="bg-secondary/60 text-left">
                                <tr>
                                    <th className="py-3 pr-3 pl-4 font-semibold">Nomor</th>
                                    <th className="px-3 py-3 font-semibold">Nama</th>
                                    <th className="px-3 py-3 font-semibold">No. WhatsApp</th>
                                    <th className="px-3 py-3 font-semibold">Didaftarkan</th>
                                    <th className="px-3 py-3 font-semibold">Status</th>
                                    <th className="py-3 pr-4 pl-3 text-right font-semibold">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoadingParticipants && items.length === 0
                                    ? Array.from({ length: 6 }, (_, index) => (
                                          <tr key={index} className="border-border border-t">
                                              <td colSpan={6} className="px-4 py-3">
                                                  <Skeleton className="h-5 w-full" />
                                              </td>
                                          </tr>
                                      ))
                                    : items.map((participant) => (
                                          <tr
                                              key={participant.id}
                                              className="border-border border-t"
                                              data-test-id={`event_detail_row_${participant.id}`}
                                          >
                                              <td className="py-3 pr-3 pl-4 font-mono text-xs">{participant.memberNumber ?? 'Non-member'}</td>
                                              <td className="px-3 py-3 font-medium">{participant.name}</td>
                                              <td className="px-3 py-3 font-mono text-xs">{formatWhatsapp(participant.whatsapp)}</td>
                                              <td className="px-3 py-3">{registeredLabel(participant)}</td>
                                              <td className="px-3 py-3">
                                                  <StatusBadge
                                                      tone={PARTICIPANT_STATUS_TONES[participant.status.value]}
                                                      label={participant.status.label}
                                                      data-test-id={`event_detail_badge_status_${participant.id}`}
                                                  />
                                              </td>
                                              <td className="py-2 pr-4 pl-3 text-right">
                                                  <AttendanceAction participant={participant} />
                                              </td>
                                          </tr>
                                      ))}
                            </tbody>
                        </table>
                    </div>

                    <ul className="md:hidden" data-test-id="event_detail_cards">
                        {items.map((participant) => (
                            <li
                                key={participant.id}
                                className="border-border space-y-2 border-t p-4"
                                data-test-id={`event_detail_card_${participant.id}`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <p className="font-semibold">{participant.name}</p>
                                    <StatusBadge
                                        tone={PARTICIPANT_STATUS_TONES[participant.status.value]}
                                        label={participant.status.label}
                                        data-test-id={`event_detail_card_badge_status_${participant.id}`}
                                    />
                                </div>
                                <p className="font-mono text-xs">
                                    {participant.memberNumber ?? 'Non-member'} · {formatWhatsapp(participant.whatsapp)}
                                </p>
                                <p className="text-muted-foreground text-xs">Didaftarkan: {registeredLabel(participant)}</p>
                                <AttendanceAction participant={participant} />
                            </li>
                        ))}
                    </ul>

                    {!isLoadingParticipants && items.length === 0 && (
                        <p
                            className="text-muted-foreground border-border border-t px-4 py-8 text-center text-sm"
                            data-test-id="event_detail_participants_empty"
                        >
                            Belum ada peserta yang cocok.
                        </p>
                    )}

                    <footer className="border-border flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm">
                        <p data-test-id="event_detail_text_range">
                            {meta && meta.total > 0 ? `Menampilkan ${rangeStart} sampai ${rangeEnd} dari ${meta.total} peserta` : 'Tidak ada peserta'}
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={isLoadingParticipants || page <= 1}
                                onClick={() => goToPage(page - 1)}
                                data-test-id="event_detail_button_previous"
                            >
                                Sebelumnya
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={isLoadingParticipants || !meta || page >= meta.lastPage}
                                onClick={() => goToPage(page + 1)}
                                data-test-id="event_detail_button_next"
                            >
                                Berikutnya
                            </Button>
                        </div>
                    </footer>
                </>
            )}
        </section>
    );
};
