import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/molecules/dialog';
import { FormField } from '@/components/molecules/form-field';
import { RegistrationAnswerFields } from '@/components/molecules/registration-answer-fields';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useRegistrationAnswers } from '@/hooks/useRegistrationAnswers';
import { getParticipantRegistrationForm } from '@/services/event';
import type { RegistrationFormData } from '@/types/registration-form';
import { errorMessage } from '@/utils/error';
import { useRef, useState } from 'react';
import { usePageContext } from '../_context';

const ParticipantForm = () => {
    const { event, addTab, setAddTab, memberSearch, setMemberSearch, memberResults, isSearchingMembers, isAdding, submitParticipant, guestErrors } =
        usePageContext();
    const [memberId, setMemberId] = useState<string | null>(null);
    const [data, setData] = useState<RegistrationFormData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [consent, setConsent] = useState(false);
    const latest = useRef(0);
    const definition = addTab === 'member' ? data?.registrationForm : event?.registrationForm;
    const answers = useRegistrationAnswers(definition);
    if (!event) return null;
    const pickMember = async (id: string) => {
        const request = ++latest.current;
        setMemberId(id);
        setData(null);
        answers.reset();
        setLoading(true);
        setError(null);
        try {
            const response = await getParticipantRegistrationForm(event.id, id);
            if (latest.current === request) setData(response.data);
        } catch (err) {
            if (latest.current === request) setError(errorMessage(err));
        } finally {
            if (latest.current === request) setLoading(false);
        }
    };
    const changeTab = (tab: 'member' | 'guest') => {
        latest.current++;
        setLoading(false);
        setMemberId(null);
        setData(null);
        setError(null);
        answers.reset();
        setConsent(false);
        setAddTab(tab);
    };
    return (
        <form
            className="space-y-4 px-4 pb-4 sm:px-0"
            noValidate
            onSubmit={async (e) => {
                e.preventDefault();
                if (isAdding || loading) return;
                const submission = answers.build();
                if (!submission) return;
                if (addTab === 'member' && (!memberId || !data)) return;
                if (addTab === 'guest' && (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || !consent)) {
                    setError('Isi Nama, Email yang valid, dan konfirmasi persetujuan peserta.');
                    return;
                }
                setError(null);
                const input =
                    addTab === 'member' && memberId
                        ? { ...submission, memberId }
                        : { ...submission, name: name.trim(), email: email.trim(), consentAcknowledged: consent };
                const failure = await submitParticipant(input);
                if (failure) {
                    answers.applyErrors(failure, submission);
                    setError(errorMessage(failure));
                }
            }}
            data-test-id="event_participant_registration_form"
        >
            {event.allowsNonMember && (
                <div className="flex gap-2">
                    {(['member', 'guest'] as const).map((tab) => (
                        <Button
                            key={tab}
                            type="button"
                            variant={addTab === tab ? 'default' : 'outline'}
                            disabled={isAdding}
                            onClick={() => changeTab(tab)}
                            data-test-id={`participant_tab_${tab}`}
                        >
                            {tab === 'member' ? 'Member' : 'Non-member'}
                        </Button>
                    ))}
                </div>
            )}
            {error && (
                <p role="alert" className="text-destructive text-sm">
                    {error}
                </p>
            )}
            {addTab === 'member' && (
                <>
                    <FormField id="memberSearch" label="Cari member" isOptional data-test-id="participant_search">
                        <Input
                            className="bg-card"
                            id="memberSearch"
                            value={memberSearch}
                            disabled={isAdding}
                            onChange={(e) => setMemberSearch(e.target.value)}
                            placeholder="Nama atau nomor member, minimal 2 karakter"
                            data-test-id="event_detail_dialog_input_member_search"
                        />
                    </FormField>
                    {isSearchingMembers && <p role="status">Mencari member…</p>}
                    <ul className="space-y-2">
                        {memberResults.map((member) => (
                            <li key={member.id} className="flex items-center justify-between gap-2 rounded border p-2">
                                <span className="text-sm">
                                    {member.name} · {member.memberNumber ?? '-'}
                                </span>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={isAdding || loading}
                                    onClick={() => void pickMember(member.id)}
                                    data-test-id={`participant_pick_${member.id}`}
                                >
                                    Pilih
                                </Button>
                            </li>
                        ))}
                    </ul>
                    {loading && <p role="status">Memuat formulir…</p>}
                    {data && (
                        <>
                            <FormField id="participant-member-name" label="Nama" data-test-id="participant_member_name">
                                <Input
                                    className="bg-card"
                                    id="participant-member-name"
                                    readOnly
                                    value={data.identity.name}
                                    data-test-id="participant_member_name_input"
                                />
                            </FormField>
                            <FormField id="participant-member-email" label="Email" data-test-id="participant_member_email">
                                <Input
                                    className="bg-card"
                                    id="participant-member-email"
                                    type="email"
                                    readOnly
                                    value={data.identity.email}
                                    data-test-id="participant_member_email_input"
                                />
                            </FormField>
                        </>
                    )}
                    {memberId && !data && !loading && (
                        <Button type="button" onClick={() => void pickMember(memberId)} data-test-id="participant_retry_identity">
                            Coba lagi
                        </Button>
                    )}
                </>
            )}
            {addTab === 'guest' && (
                <>
                    <FormField id="guestName" label="Nama" error={guestErrors.name} data-test-id="participant_guest_name">
                        <Input
                            className="bg-card"
                            id="guestName"
                            value={name}
                            maxLength={255}
                            disabled={isAdding}
                            aria-required
                            onChange={(e) => setName(e.target.value)}
                            data-test-id="event_detail_dialog_input_guest_name"
                        />
                    </FormField>
                    <FormField id="guestEmail" label="Email" error={guestErrors.email} data-test-id="participant_guest_email">
                        <Input
                            className="bg-card"
                            id="guestEmail"
                            type="email"
                            value={email}
                            maxLength={255}
                            disabled={isAdding}
                            aria-required
                            onChange={(e) => setEmail(e.target.value)}
                            data-test-id="event_detail_dialog_input_guest_email"
                        />
                    </FormField>
                </>
            )}
            {definition && (
                <RegistrationAnswerFields
                    definition={definition}
                    values={answers.values}
                    errors={answers.errors}
                    onChange={answers.setValue}
                    disabled={isAdding || answers.blocked || loading}
                />
            )}
            {addTab === 'guest' && (
                <label className="flex min-h-11 items-start gap-3 text-sm">
                    <Checkbox
                        checked={consent}
                        disabled={isAdding || answers.blocked}
                        onCheckedChange={(value) => setConsent(value === true)}
                        aria-required
                        data-test-id="participant_consent_acknowledged"
                    />
                    Saya sudah mendapat persetujuan peserta untuk mendaftarkan dan menggunakan datanya untuk kegiatan ini. *
                </label>
            )}
            {answers.blocked && (
                <Button type="button" disabled={isAdding} onClick={() => window.location.reload()} data-test-id="participant_reload_form">
                    Muat ulang halaman (isian belum tersimpan akan dibuang)
                </Button>
            )}
            <Button
                type="submit"
                className="min-h-11 w-full"
                disabled={isAdding || loading || answers.blocked || !definition || (addTab === 'member' && !data)}
                data-test-id="participant_submit"
            >
                {isAdding ? 'Menambahkan…' : 'Tambah peserta'}
            </Button>
        </form>
    );
};
export const AddParticipantDialog = () => {
    const { isAddDialogOpen, isAdding, closeAddDialog } = usePageContext();
    return (
        <Dialog
            open={isAddDialogOpen}
            onOpenChange={(open) => {
                if (!open && !isAdding) closeAddDialog();
            }}
        >
            <DialogContent className="md:max-h-[90dvh] md:overflow-y-auto" data-test-id="event_detail_dialog_add_participant">
                <DialogHeader>
                    <DialogTitle>Tambah peserta</DialogTitle>
                    <DialogDescription>Lengkapi formulir pendaftaran peserta. Identitas member mengikuti data server.</DialogDescription>
                </DialogHeader>
                {/* On mobile the sheet itself must not scroll: vaul draws a tall ::after below it that would extend the scroll area. */}
                <div className="min-h-0 overflow-y-auto">{isAddDialogOpen && <ParticipantForm />}</div>
            </DialogContent>
        </Dialog>
    );
};
