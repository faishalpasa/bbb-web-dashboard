import { Link } from '@tanstack/react-router';

import { StatusBadge } from '@/components/molecules/status-badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EVENT_NO_SCHEDULE_LABEL, EVENT_STATUS_TONES } from '@/constants/event';
import { ROUTES } from '@/constants/route';
import type { EventListItem } from '@/types/event';
import { formatEventDateTime } from '@/utils/date';

import { usePageContext } from '../_context';

const scheduleOf = (event: EventListItem): string => (event.startsAt ? formatEventDateTime(event.startsAt, event.timezone) : EVENT_NO_SCHEDULE_LABEL);
const quotaOf = (event: EventListItem): string => `${event.registered}/${event.capacity ?? '-'}`;
const attendedOf = (event: EventListItem): string => (event.attended === null ? '-' : String(event.attended));
const canEdit = (event: EventListItem): boolean => event.status.value === 'draft' || event.status.value === 'published';

export const EventTable = () => {
    const { list, isLoading, query, goToPage } = usePageContext();
    const items = list?.items ?? [];
    const meta = list?.meta;

    return (
        <div aria-busy={isLoading} data-test-id="events_table_root">
            <div className="hidden md:block">
                <table className="w-full text-sm">
                    <thead className="bg-secondary/60 text-left">
                        <tr>
                            <th className="py-3 pr-3 pl-4 font-semibold">Judul</th>
                            <th className="px-3 py-3 font-semibold">Waktu</th>
                            <th className="px-3 py-3 font-semibold">Jenis</th>
                            <th className="px-3 py-3 text-right font-semibold">Terdaftar</th>
                            <th className="px-3 py-3 text-right font-semibold">Hadir</th>
                            <th className="px-3 py-3 font-semibold">Status</th>
                            <th className="py-3 pr-4 pl-3" />
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading && items.length === 0
                            ? Array.from({ length: 6 }, (_, index) => (
                                  <tr key={index} className="border-border border-t">
                                      <td colSpan={7} className="px-4 py-3">
                                          <Skeleton className="h-5 w-full" />
                                      </td>
                                  </tr>
                              ))
                            : items.map((event) => (
                                  <tr key={event.id} className="border-border border-t" data-test-id={`events_row_${event.id}`}>
                                      <td className="py-3 pr-3 pl-4 font-medium">{event.title}</td>
                                      <td className={event.startsAt ? 'px-3 py-3' : 'text-muted-foreground px-3 py-3'}>{scheduleOf(event)}</td>
                                      <td className="px-3 py-3">
                                          <div className="flex flex-wrap gap-1">
                                              <StatusBadge
                                                  tone={event.format.value === 'online' ? 'neutral' : 'success'}
                                                  label={event.format.label}
                                                  data-test-id={`events_badge_format_${event.id}`}
                                              />
                                              <StatusBadge
                                                  tone={event.allowsNonMember ? 'sage' : 'neutral'}
                                                  label={event.allowsNonMember ? 'External' : 'Internal'}
                                                  data-test-id={`events_badge_audience_${event.id}`}
                                              />
                                          </div>
                                      </td>
                                      <td className="px-3 py-3 text-right font-mono text-xs">{quotaOf(event)}</td>
                                      <td className="px-3 py-3 text-right font-mono text-xs">{attendedOf(event)}</td>
                                      <td className="px-3 py-3">
                                          <StatusBadge
                                              tone={EVENT_STATUS_TONES[event.status.value]}
                                              label={event.status.label}
                                              data-test-id={`events_badge_status_${event.id}`}
                                          />
                                      </td>
                                      <td className="space-x-3 py-3 pr-4 pl-3 text-right whitespace-nowrap">
                                          <Link
                                              to={ROUTES.eventDetail}
                                              params={{ eventId: event.id }}
                                              className="font-semibold underline underline-offset-4"
                                              data-test-id={`events_link_participants_${event.id}`}
                                          >
                                              Peserta
                                          </Link>
                                          {canEdit(event) && (
                                              <Link
                                                  to={ROUTES.eventEdit}
                                                  params={{ eventId: event.id }}
                                                  className="font-semibold underline underline-offset-4"
                                                  data-test-id={`events_link_edit_${event.id}`}
                                              >
                                                  Edit
                                              </Link>
                                          )}
                                      </td>
                                  </tr>
                              ))}
                    </tbody>
                </table>
            </div>

            <ul className="md:hidden" data-test-id="events_cards">
                {isLoading && items.length === 0
                    ? Array.from({ length: 4 }, (_, index) => (
                          <li key={index} className="border-border border-t p-4">
                              <Skeleton className="h-16 w-full" />
                          </li>
                      ))
                    : items.map((event) => (
                          <li key={event.id} className="border-border space-y-2 border-t p-4" data-test-id={`events_card_${event.id}`}>
                              <div className="flex items-start justify-between gap-3">
                                  <Link
                                      to={ROUTES.eventDetail}
                                      params={{ eventId: event.id }}
                                      className="font-semibold underline underline-offset-4"
                                      data-test-id={`events_card_link_detail_${event.id}`}
                                  >
                                      {event.title}
                                  </Link>
                                  <StatusBadge
                                      tone={EVENT_STATUS_TONES[event.status.value]}
                                      label={event.status.label}
                                      data-test-id={`events_card_badge_status_${event.id}`}
                                  />
                              </div>
                              <p className={event.startsAt ? 'text-sm' : 'text-muted-foreground text-sm'}>{scheduleOf(event)}</p>
                              <p className="text-muted-foreground text-xs">
                                  {event.format.label} · {event.allowsNonMember ? 'External' : 'Internal'} · Terdaftar {quotaOf(event)} · Hadir{' '}
                                  {attendedOf(event)}
                              </p>
                              {canEdit(event) && (
                                  <Link
                                      to={ROUTES.eventEdit}
                                      params={{ eventId: event.id }}
                                      className="text-sm font-semibold underline underline-offset-4"
                                      data-test-id={`events_card_link_edit_${event.id}`}
                                  >
                                      Edit
                                  </Link>
                              )}
                          </li>
                      ))}
            </ul>

            {!isLoading && items.length === 0 && (
                <p className="text-muted-foreground border-border border-t px-4 py-8 text-center text-sm" data-test-id="events_text_empty">
                    Belum ada kegiatan di tab ini.
                </p>
            )}

            <footer className="border-border flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm">
                <p data-test-id="events_text_range">{meta ? `Menampilkan ${items.length} dari ${meta.total} kegiatan` : ' '}</p>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={isLoading || query.page <= 1}
                        onClick={() => goToPage(query.page - 1)}
                        data-test-id="events_button_previous"
                    >
                        Sebelumnya
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={isLoading || !meta || query.page >= meta.lastPage}
                        onClick={() => goToPage(query.page + 1)}
                        data-test-id="events_button_next"
                    >
                        Berikutnya
                    </Button>
                </div>
            </footer>
        </div>
    );
};
