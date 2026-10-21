import { Link } from '@tanstack/react-router';
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, Pencil } from 'lucide-react';

import { StatusBadge } from '@/components/molecules/status-badge';
import { TablePagination } from '@/components/molecules/table-pagination';
import { WhatsappButton } from '@/components/molecules/whatsapp-button';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MEMBER_STATUS_TONES } from '@/constants/member';
import { PERMISSIONS as P } from '@/constants/permission';
import { ROUTES } from '@/constants/route';
import { usePermissions } from '@/hooks/usePermissions';
import type { MemberListItem, MemberSortBy, MemberSortDirection } from '@/types/member';
import { formatTableDate } from '@/utils/date';
import { formatNumber } from '@/utils/number';
import { abbreviateRegency, formatWhatsapp, memberGreetingMessage, whatsappChatUrl } from '@/utils/string';

import { usePageContext } from '../_context';

const HEADERS = ['Nomor', 'Nama', 'No. WhatsApp', 'Domisili', 'Preferensi', 'Status'];

interface MemberItemProps {
    member: MemberListItem;
}

interface MemberActionsProps extends MemberItemProps {
    canEdit: boolean;
}

interface SortableHeaderProps {
    label: string;
    sortBy: MemberSortBy;
    activeSortBy: MemberSortBy;
    direction: MemberSortDirection;
    onSort: (sortBy: MemberSortBy) => void;
}

const MemberActions = ({ member, canEdit }: MemberActionsProps) => (
    <div className="flex items-center justify-end gap-2">
        {member.whatsapp && (
            <WhatsappButton
                href={whatsappChatUrl(member.whatsapp, memberGreetingMessage(member.name))}
                label={`Hubungi ${member.name} lewat WhatsApp`}
                data-test-id={`members_link_whatsapp_${member.id}`}
            />
        )}
        <Button asChild variant="outline" size="icon" className="bg-card size-9">
            <Link
                to={ROUTES.memberDetail}
                params={{ memberId: member.id }}
                aria-label={`Lihat detail ${member.name}`}
                title="Lihat detail"
                data-test-id={`members_link_detail_${member.id}`}
            >
                <Eye />
            </Link>
        </Button>
        {canEdit && (
            <Button asChild variant="outline" size="icon" className="bg-card size-11 md:size-9">
                <Link
                    to={ROUTES.memberEdit}
                    params={{ memberId: member.id }}
                    aria-label={`Edit member ${member.name}`}
                    title="Edit member"
                    data-test-id={`members_link_edit_${member.id}`}
                >
                    <Pencil aria-hidden="true" />
                </Link>
            </Button>
        )}
    </div>
);

const SortableHeader = ({ label, sortBy, activeSortBy, direction, onSort }: SortableHeaderProps) => {
    const isActive = sortBy === activeSortBy;
    const Icon = isActive ? (direction === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
    const nextDirection = isActive && direction === 'asc' ? 'menurun' : 'menaik';

    return (
        <button
            type="button"
            className="hover:text-foreground inline-flex items-center gap-1 rounded-sm text-left font-semibold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden"
            onClick={() => onSort(sortBy)}
            aria-label={`Urutkan ${label} secara ${nextDirection}`}
            data-test-id={`members_button_sort_${sortBy}`}
        >
            {label}
            <Icon className="size-3.5" aria-hidden="true" />
        </button>
    );
};

// Regency on the first line and province under it, so a long province name never stretches the column.
const Domicile = ({ member }: MemberItemProps) => (
    <>
        <span className="block">{member.regency ? abbreviateRegency(member.regency) : '-'}</span>
        {member.province && <span className="text-muted-foreground block text-xs">{member.province}</span>}
    </>
);

export const MemberTable = () => {
    const { canAll } = usePermissions();
    const canEdit = canAll([P.MEMBER_VIEW, P.MEMBER_UPDATE]);
    const { list, isLoading, rangeStart, rangeEnd, query, goToPage, setPerPage, setSort } = usePageContext();
    const items = list?.items ?? [];
    const meta = list?.meta;

    return (
        <section className="border-border bg-card overflow-hidden rounded-lg border" data-test-id="members_table_root" aria-busy={isLoading}>
            <div className="hidden md:block">
                <table className="w-full text-sm">
                    <thead className="bg-secondary/60 text-left">
                        <tr>
                            <th
                                className="px-3 py-3 whitespace-nowrap first:pl-4"
                                aria-sort={query.sortBy === 'memberNumber' ? (query.sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                            >
                                <SortableHeader
                                    label="Nomor"
                                    sortBy="memberNumber"
                                    activeSortBy={query.sortBy}
                                    direction={query.sortDirection}
                                    onSort={setSort}
                                />
                            </th>
                            <th
                                className="px-3 py-3 whitespace-nowrap"
                                aria-sort={query.sortBy === 'name' ? (query.sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                            >
                                <SortableHeader
                                    label="Nama"
                                    sortBy="name"
                                    activeSortBy={query.sortBy}
                                    direction={query.sortDirection}
                                    onSort={setSort}
                                />
                            </th>
                            {HEADERS.slice(2).map((header) => (
                                <th key={header} className="px-3 py-3 font-semibold whitespace-nowrap">
                                    {header}
                                </th>
                            ))}
                            <th className="px-3 py-3 text-right font-semibold whitespace-nowrap">Ikut / Hadir</th>
                            <th
                                className="px-3 py-3 whitespace-nowrap"
                                aria-sort={query.sortBy === 'joinedAt' ? (query.sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                            >
                                <SortableHeader
                                    label="Bergabung"
                                    sortBy="joinedAt"
                                    activeSortBy={query.sortBy}
                                    direction={query.sortDirection}
                                    onSort={setSort}
                                />
                            </th>
                            <th className="py-3 pr-4 pl-3 text-right font-semibold">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading && items.length === 0
                            ? Array.from({ length: 8 }, (_, index) => (
                                  <tr key={index} className="border-border border-t">
                                      <td colSpan={9} className="px-4 py-3">
                                          <Skeleton className="h-5 w-full" />
                                      </td>
                                  </tr>
                              ))
                            : items.map((member) => (
                                  <tr key={member.id} className="border-border border-t" data-test-id={`members_row_${member.id}`}>
                                      <td className="py-3 pr-3 pl-4 font-mono text-xs whitespace-nowrap">{member.memberNumber ?? '-'}</td>
                                      <td className="px-3 py-3 font-medium">{member.name}</td>
                                      <td className="px-3 py-3 font-mono text-xs whitespace-nowrap">{formatWhatsapp(member.whatsapp)}</td>
                                      <td className="px-3 py-3">
                                          <Domicile member={member} />
                                      </td>
                                      <td className="px-3 py-3 whitespace-nowrap">
                                          {member.preference ? member.preference.label : <span className="text-[#8a6d1f]">Belum diisi</span>}
                                      </td>
                                      <td className="px-3 py-3">
                                          <StatusBadge
                                              tone={MEMBER_STATUS_TONES[member.status.value]}
                                              label={member.status.label}
                                              data-test-id={`members_badge_status_${member.id}`}
                                          />
                                      </td>
                                      <td className="px-3 py-3 text-right font-mono text-xs whitespace-nowrap">
                                          {member.joinedEvents} / {member.attendedEvents}
                                      </td>
                                      <td className="px-3 py-3 whitespace-nowrap">{formatTableDate(member.joinedAt)}</td>
                                      <td className="py-2 pr-4 pl-3">
                                          <MemberActions member={member} canEdit={canEdit} />
                                      </td>
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
                                  <p className="font-semibold">{member.name}</p>
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
                                  <Domicile member={member} />
                              </p>
                              <p className="text-muted-foreground text-xs">
                                  {member.preference ? member.preference.label : 'Preferensi belum diisi'} · Ikut {member.joinedEvents}, hadir{' '}
                                  {member.attendedEvents} · Bergabung {formatTableDate(member.joinedAt)}
                              </p>
                              <MemberActions member={member} canEdit={canEdit} />
                          </li>
                      ))}
            </ul>

            {!isLoading && items.length === 0 && (
                <p className="text-muted-foreground border-border border-t px-4 py-8 text-center text-sm" data-test-id="members_text_empty">
                    Tidak ada member yang cocok dengan filter ini.
                </p>
            )}

            <footer className="border-border flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm">
                <p className="sr-only" data-test-id="members_text_range">
                    {meta && meta.total > 0
                        ? `Menampilkan ${formatNumber(rangeStart)} sampai ${formatNumber(rangeEnd)} dari ${formatNumber(meta.total)} data`
                        : 'Tidak ada data'}
                </p>
                <TablePagination
                    total={meta?.total ?? 0}
                    perPage={query.perPage ?? 25}
                    onPerPageChange={setPerPage}
                    currentPage={meta?.currentPage ?? query.page}
                    lastPage={meta?.lastPage ?? 1}
                    isLoading={isLoading || !meta}
                    onPageChange={goToPage}
                    data-test-id="members_pagination"
                />
            </footer>
        </section>
    );
};
