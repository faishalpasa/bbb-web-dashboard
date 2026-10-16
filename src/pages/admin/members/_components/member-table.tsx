import { Link } from '@tanstack/react-router';

import { StatusBadge } from '@/components/molecules/status-badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MEMBER_STATUS_TONES } from '@/constants/member';
import { ROUTES } from '@/constants/route';
import { formatTableDate } from '@/utils/date';
import { formatNumber } from '@/utils/number';
import { abbreviateRegency, formatWhatsapp } from '@/utils/string';

import { usePageContext } from '../_context';

const HEADERS = ['Nomor', 'Nama', 'No. WhatsApp', 'Domisili', 'Preferensi', 'Status'];

export const MemberTable = () => {
    const { list, isLoading, rangeStart, rangeEnd, query, goToPage } = usePageContext();
    const items = list?.items ?? [];
    const meta = list?.meta;

    return (
        <section className="border-border bg-card overflow-hidden rounded-lg border" data-test-id="members_table_root" aria-busy={isLoading}>
            <div className="hidden md:block">
                <table className="w-full text-sm">
                    <thead className="bg-secondary/60 text-left">
                        <tr>
                            {HEADERS.map((header) => (
                                <th key={header} className="px-3 py-3 font-semibold first:pl-4">
                                    {header}
                                </th>
                            ))}
                            <th className="px-3 py-3 text-right font-semibold">Ikut / Hadir</th>
                            <th className="py-3 pr-4 pl-3 font-semibold">Bergabung</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading && items.length === 0
                            ? Array.from({ length: 8 }, (_, index) => (
                                  <tr key={index} className="border-border border-t">
                                      <td colSpan={8} className="px-4 py-3">
                                          <Skeleton className="h-5 w-full" />
                                      </td>
                                  </tr>
                              ))
                            : items.map((member) => (
                                  <tr key={member.id} className="border-border border-t" data-test-id={`members_row_${member.id}`}>
                                      <td className="py-3 pr-3 pl-4 font-mono text-xs">{member.memberNumber ?? '-'}</td>
                                      <td className="px-3 py-3 font-medium">
                                          <Link
                                              to={ROUTES.memberDetail}
                                              params={{ memberId: member.id }}
                                              className="underline underline-offset-4"
                                              data-test-id={`members_link_detail_${member.id}`}
                                          >
                                              {member.name}
                                          </Link>
                                      </td>
                                      <td className="px-3 py-3 font-mono text-xs">{formatWhatsapp(member.whatsapp)}</td>
                                      <td className="px-3 py-3">
                                          {[member.regency && abbreviateRegency(member.regency), member.province].filter(Boolean).join(', ')}
                                      </td>
                                      <td className="px-3 py-3">
                                          {member.preference ? member.preference.label : <span className="text-[#8a6d1f]">Belum diisi</span>}
                                      </td>
                                      <td className="px-3 py-3">
                                          <StatusBadge
                                              tone={MEMBER_STATUS_TONES[member.status.value]}
                                              label={member.status.label}
                                              data-test-id={`members_badge_status_${member.id}`}
                                          />
                                      </td>
                                      <td className="px-3 py-3 text-right font-mono text-xs">
                                          {member.joinedEvents} / {member.attendedEvents}
                                      </td>
                                      <td className="py-3 pr-4 pl-3">{formatTableDate(member.joinedAt)}</td>
                                  </tr>
                              ))}
                    </tbody>
                </table>
            </div>

            <ul className="md:hidden" data-test-id="members_cards">
                {isLoading && items.length === 0
                    ? Array.from({ length: 4 }, (_, index) => (
                          <li key={index} className="border-border border-t p-4 first:border-t-0">
                              <Skeleton className="h-16 w-full" />
                          </li>
                      ))
                    : items.map((member) => (
                          <li
                              key={member.id}
                              className="border-border space-y-2 border-t p-4 first:border-t-0"
                              data-test-id={`members_card_${member.id}`}
                          >
                              <div className="flex items-start justify-between gap-3">
                                  <Link
                                      to={ROUTES.memberDetail}
                                      params={{ memberId: member.id }}
                                      className="font-semibold underline underline-offset-4"
                                      data-test-id={`members_card_link_detail_${member.id}`}
                                  >
                                      {member.name}
                                  </Link>
                                  <StatusBadge
                                      tone={MEMBER_STATUS_TONES[member.status.value]}
                                      label={member.status.label}
                                      data-test-id={`members_card_badge_status_${member.id}`}
                                  />
                              </div>
                              <p className="font-mono text-xs">
                                  {member.memberNumber ?? '-'} · {formatWhatsapp(member.whatsapp)}
                              </p>
                              <p className="text-sm">
                                  {[member.regency && abbreviateRegency(member.regency), member.province].filter(Boolean).join(', ')}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                  {member.preference ? member.preference.label : 'Preferensi belum diisi'} · Ikut {member.joinedEvents}, hadir{' '}
                                  {member.attendedEvents} · Bergabung {formatTableDate(member.joinedAt)}
                              </p>
                          </li>
                      ))}
            </ul>

            {!isLoading && items.length === 0 && (
                <p className="text-muted-foreground border-border border-t px-4 py-8 text-center text-sm" data-test-id="members_text_empty">
                    Tidak ada member yang cocok dengan filter ini.
                </p>
            )}

            <footer className="border-border flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm">
                <p data-test-id="members_text_range">
                    {meta && meta.total > 0
                        ? `Menampilkan ${formatNumber(rangeStart)} sampai ${formatNumber(rangeEnd)} dari ${formatNumber(meta.total)} data`
                        : 'Tidak ada data'}
                </p>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={isLoading || query.page <= 1}
                        onClick={() => goToPage(query.page - 1)}
                        data-test-id="members_button_previous"
                    >
                        Sebelumnya
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={isLoading || !meta || query.page >= meta.lastPage}
                        onClick={() => goToPage(query.page + 1)}
                        data-test-id="members_button_next"
                    >
                        Berikutnya
                    </Button>
                </div>
            </footer>
        </section>
    );
};
