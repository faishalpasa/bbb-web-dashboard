import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/molecules/dialog';
import { FormField } from '@/components/molecules/form-field';
import { RequiredNote } from '@/components/molecules/required-mark';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { formatWhatsapp } from '@/utils/string';

import { type AddParticipantTab, usePageContext } from '../_context';

const TABS: { value: AddParticipantTab; label: string }[] = [
    { value: 'member', label: 'Member' },
    { value: 'guest', label: 'Non-member' },
];

export const AddParticipantDialog = () => {
    const {
        event,
        isAddDialogOpen,
        addTab,
        memberSearch,
        memberResults,
        isSearchingMembers,
        guestFields,
        guestErrors,
        addError,
        isAdding,
        closeAddDialog,
        setAddTab,
        setMemberSearch,
        setGuestField,
        addMember,
        addGuest,
    } = usePageContext();

    const allowsGuests = event?.allowsNonMember ?? false;
    const tabs = allowsGuests ? TABS : TABS.filter((tab) => tab.value === 'member');

    return (
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => !open && !isAdding && closeAddDialog()}>
            <DialogContent data-test-id="event_detail_dialog_add_participant">
                <DialogHeader>
                    <DialogTitle>Tambah peserta</DialogTitle>
                    <DialogDescription>Peserta yang ditambahkan admin tercatat sebagai &quot;Oleh admin&quot;.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 px-4 pb-4 sm:px-0 sm:pb-0">
                    {tabs.length > 1 && (
                        <div className="flex gap-1" role="tablist" aria-label="Jenis peserta">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.value}
                                    type="button"
                                    role="tab"
                                    aria-selected={addTab === tab.value}
                                    onClick={() => setAddTab(tab.value)}
                                    className={cn(
                                        'focus-visible:ring-ring min-h-9 rounded-md px-3 text-sm font-medium focus-visible:ring-2 focus-visible:outline-none',
                                        addTab === tab.value ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary',
                                    )}
                                    data-test-id={`event_detail_dialog_tab_${tab.value}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {addError && (
                        <p role="alert" className="text-destructive text-sm" data-test-id="event_detail_dialog_add_error">
                            {addError}
                        </p>
                    )}

                    {addTab === 'member' ? (
                        <div className="space-y-3">
                            <div className="grid gap-1.5">
                                <Label htmlFor="memberSearch">Cari member</Label>
                                <Input
                                    id="memberSearch"
                                    type="search"
                                    value={memberSearch}
                                    autoComplete="off"
                                    onChange={(event) => setMemberSearch(event.target.value)}
                                    placeholder="Nama, email, atau nomor member"
                                    className="bg-card h-11"
                                    data-test-id="event_detail_dialog_input_member_search"
                                />
                            </div>
                            <ul className="space-y-1" data-test-id="event_detail_dialog_member_results">
                                {memberResults.map((member) => (
                                    <li key={member.id} className="border-border flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                                        <div className="min-w-0 text-sm">
                                            <p className="truncate font-medium">{member.name}</p>
                                            <p className="text-muted-foreground font-mono text-xs">
                                                {member.memberNumber ?? '-'} · {formatWhatsapp(member.whatsapp)}
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            disabled={isAdding || member.status.value !== 'active'}
                                            onClick={() => void addMember(member.id)}
                                            data-test-id={`event_detail_dialog_button_add_member_${member.id}`}
                                        >
                                            {member.status.value === 'active' ? 'Tambah' : member.status.label}
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                            {memberSearch.trim() && !isSearchingMembers && memberResults.length === 0 && (
                                <p className="text-muted-foreground text-sm" data-test-id="event_detail_dialog_member_empty">
                                    Member tidak ditemukan.
                                </p>
                            )}
                        </div>
                    ) : (
                        <form
                            className="space-y-4"
                            noValidate
                            onSubmit={(submitEvent) => {
                                submitEvent.preventDefault();
                                void addGuest();
                            }}
                            data-test-id="event_detail_dialog_guest_form"
                        >
                            <RequiredNote />
                            <FormField id="guestName" label="Nama" error={guestErrors.name} data-test-id="event_detail_dialog_guest_name">
                                <Input
                                    id="guestName"
                                    value={guestFields.name}
                                    aria-required="true"
                                    onChange={(event) => setGuestField('name', event.target.value)}
                                    className="bg-card h-11"
                                    data-test-id="event_detail_dialog_input_guest_name"
                                />
                            </FormField>
                            <FormField id="guestEmail" label="Email" error={guestErrors.email} data-test-id="event_detail_dialog_guest_email">
                                <Input
                                    id="guestEmail"
                                    type="email"
                                    value={guestFields.email}
                                    aria-required="true"
                                    onChange={(event) => setGuestField('email', event.target.value)}
                                    className="bg-card h-11"
                                    data-test-id="event_detail_dialog_input_guest_email"
                                />
                            </FormField>
                            <FormField
                                id="guestWhatsapp"
                                label="Nomor WhatsApp"
                                error={guestErrors.whatsapp}
                                data-test-id="event_detail_dialog_guest_whatsapp"
                            >
                                <Input
                                    id="guestWhatsapp"
                                    type="tel"
                                    value={guestFields.whatsapp}
                                    aria-required="true"
                                    onChange={(event) => setGuestField('whatsapp', event.target.value)}
                                    placeholder="0812 3456 7890"
                                    className="bg-card h-11 font-mono"
                                    data-test-id="event_detail_dialog_input_guest_whatsapp"
                                />
                            </FormField>
                            <Button
                                type="submit"
                                className="h-11 w-full font-semibold"
                                disabled={isAdding}
                                data-test-id="event_detail_dialog_button_add_guest"
                            >
                                {isAdding ? 'Menambahkan…' : 'Tambah peserta'}
                            </Button>
                        </form>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
