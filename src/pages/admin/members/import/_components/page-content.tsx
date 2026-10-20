import { Link } from '@tanstack/react-router';

import { AlertMessage } from '@/components/molecules/alert-message';
import { FormField } from '@/components/molecules/form-field';
import { TablePagination } from '@/components/molecules/table-pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { MASTERLIST_FIELDS, masterlistStatusLabel } from '@/constants/masterlist';
import { PERMISSIONS as P } from '@/constants/permission';
import { ROUTES } from '@/constants/route';
import { usePermissions } from '@/hooks/usePermissions';

import { usePageContext } from '../_context';
import { RowDetail } from './row-detail';

export const PageContent = () => {
    const {
        preview,
        file,
        columns,
        mapping,
        busy,
        perPage,
        changePerPage,
        failure,
        fileError,
        selectFile,
        setMapping,
        submit,
        goToPage,
        setDetail,
        retry,
    } = usePageContext();
    const { can } = usePermissions();
    if (!can(P.MEMBER_IMPORT_PREVIEW))
        return <AlertMessage data-test-id="masterlist_alert_denied">Anda tidak memiliki izin preview masterlist.</AlertMessage>;

    return (
        <div className="min-w-0 space-y-5" aria-busy={busy}>
            <header className="space-y-2">
                <Link to={ROUTES.members} className="inline-flex min-h-11 items-center text-sm underline" data-test-id="masterlist_link_members">
                    Kembali ke Member
                </Link>
                <h1 className="text-2xl font-semibold">Preview Masterlist</h1>
                <p className="text-muted-foreground text-sm">
                    Dry-run saja. Tidak membuat member, mengubah akun, mengambil nomor BFF, atau mengirim email.
                </p>
            </header>
            <section className="bg-card space-y-4 rounded-lg border p-4 md:p-6" aria-label="Unggah masterlist">
                <FormField
                    id="masterlist-file"
                    label="File masterlist"
                    hint="CSV UTF-8 / XLSX satu worksheet, maksimal 10 MB dan 10.000 baris data. File dan preview privat dihapus setelah 24 jam."
                    error={fileError}
                    data-test-id="masterlist_field_file"
                >
                    <Input
                        type="file"
                        id="masterlist-file"
                        accept=".csv,.xlsx"
                        aria-required="true"
                        aria-describedby="masterlist-file-hint masterlist-file-error"
                        disabled={busy}
                        className="h-auto min-h-11 max-w-full py-2"
                        onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
                        data-test-id="masterlist_input_file"
                    />
                </FormField>
                {columns.length > 0 && file && (
                    <details data-test-id="masterlist_details_mapping">
                        <summary className="min-h-11 cursor-pointer py-3 text-sm font-medium" data-test-id="masterlist_button_mapping">
                            Pemetaan kolom (opsional)
                        </summary>
                        <div className="grid gap-4 md:grid-cols-2">
                            {MASTERLIST_FIELDS.map(({ value, label }) => (
                                <FormField
                                    key={value}
                                    id={`mapping-${value}`}
                                    label={label}
                                    isOptional={!['email', 'name'].includes(value)}
                                    data-test-id={`masterlist_field_mapping_${value}`}
                                >
                                    <NativeSelect
                                        id={`mapping-${value}`}
                                        value={mapping[value] ?? ''}
                                        disabled={busy}
                                        aria-required={['email', 'name'].includes(value)}
                                        onChange={(event) => setMapping(value, event.target.value)}
                                        data-test-id={`masterlist_select_mapping_${value}`}
                                    >
                                        <option value="">Tidak dipetakan</option>
                                        {columns.map((column) => (
                                            <option key={column} value={column}>
                                                {column}
                                            </option>
                                        ))}
                                    </NativeSelect>
                                </FormField>
                            ))}
                        </div>
                        <p className="text-muted-foreground mt-3 text-xs">
                            Perubahan mapping berlaku setelah menjalankan preview ulang, bukan pada hasil di bawah.
                        </p>
                    </details>
                )}
                <Button
                    type="button"
                    className="min-h-11"
                    disabled={busy || !file}
                    onClick={() => void submit()}
                    data-test-id="masterlist_button_preview"
                >
                    {busy ? 'Memproses…' : 'Jalankan Preview'}
                </Button>
            </section>
            {failure && <AlertMessage data-test-id="masterlist_alert_error">{failure}</AlertMessage>}
            {failure && !file && (
                <Button variant="outline" disabled={busy} onClick={retry} data-test-id="masterlist_button_retry">
                    Coba muat ulang
                </Button>
            )}
            {busy && (
                <p role="status" className="text-sm" data-test-id="masterlist_text_loading">
                    Sedang membaca preview. Jangan tutup halaman.
                </p>
            )}
            {preview && (
                <>
                    <section
                        className="bg-card space-y-4 rounded-lg border p-4 md:p-6"
                        aria-label="Ringkasan preview"
                        data-test-id="masterlist_card_summary"
                    >
                        <h2 className="text-lg font-semibold break-words">{preview.filename}</h2>
                        <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
                            {(
                                [
                                    ['total_rows', 'Total'],
                                    ['valid_rows', 'Valid'],
                                    ['warning_rows', preview.parser_version === 'masterlist-preview-v3' ? 'Diterima dengan catatan' : 'Perlu review'],
                                    ['invalid_rows', 'Tidak valid / skip'],
                                ] as const
                            ).map(([key, label]) => (
                                <div key={key}>
                                    <dt className="text-muted-foreground text-xs">{label}</dt>
                                    <dd className="font-mono text-xl" data-test-id={`masterlist_text_${key}`}>
                                        {preview.summary[key].toLocaleString('id-ID')}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                        <p className="text-muted-foreground text-xs break-all">SHA-256: {preview.file_hash}</p>
                        <p className="text-muted-foreground text-xs">
                            Berlaku sampai {new Date(preview.expires_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB. Konflik database
                            adalah snapshot saat preview, wajib diperiksa ulang sebelum import.
                        </p>
                        <p className="bg-secondary rounded-md p-3 text-sm" data-test-id="masterlist_text_dry_run">
                            {preview.parser_version === 'masterlist-preview-v3'
                                ? 'Import belum tersedia. Catatan profil diterima sesuai persetujuan: data tidak valid dikosongkan agar dilengkapi Ibu. Baris konflik tetap di-skip; belum ada member yang dibuat.'
                                : 'Import belum tersedia. Semua peringatan perlu direview sebelum persetujuan tahap import nyata.'}
                        </p>
                    </section>
                    <section className="bg-card min-w-0 rounded-lg border" aria-label="Baris preview">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm" data-test-id="masterlist_table_rows">
                                <caption className="sr-only">Kandidat data dan masalah per baris; belum diimpor</caption>
                                <thead className="bg-secondary">
                                    <tr>
                                        {['Baris', 'Nama / Email', 'WhatsApp', 'Status', 'Detail'].map((label) => (
                                            <th scope="col" key={label} className="p-3 font-medium">
                                                {label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {preview.rows.map((row) => (
                                        <tr key={row.row_number} className="border-t" data-test-id={`masterlist_row_${row.row_number}`}>
                                            <td className="p-3 font-mono">{row.row_number}</td>
                                            <td className="max-w-xs p-3 break-words">
                                                <p>{row.values.name}</p>
                                                <p className="text-muted-foreground text-xs">{row.values.email}</p>
                                            </td>
                                            <td className="p-3 font-mono">{row.values.phone_wa ?? 'Belum tersedia'}</td>
                                            <td className="p-3">
                                                <span className={row.status === 'invalid' ? 'text-destructive font-medium' : 'font-medium'}>
                                                    {masterlistStatusLabel(row)}
                                                </span>
                                                <p className="text-muted-foreground text-xs">{row.issues.length} catatan</p>
                                            </td>
                                            <td className="p-3">
                                                <Button
                                                    variant="outline"
                                                    className="min-h-11"
                                                    disabled={busy}
                                                    onClick={() => setDetail(row)}
                                                    data-test-id={`masterlist_button_detail_${row.row_number}`}
                                                >
                                                    Detail
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <footer className="flex flex-wrap items-center justify-between gap-3 border-t p-3">
                            <span className="sr-only">
                                Halaman {preview.meta.currentPage} dari {preview.meta.lastPage}
                            </span>
                            <TablePagination
                                total={preview.meta.total}
                                perPage={perPage}
                                onPerPageChange={changePerPage}
                                currentPage={preview.meta.currentPage}
                                lastPage={preview.meta.lastPage}
                                isLoading={busy}
                                onPageChange={(page) => void goToPage(page)}
                                aria-label="Halaman preview"
                                data-test-id="masterlist_pagination"
                            />
                        </footer>
                    </section>
                </>
            )}
            <RowDetail />
        </div>
    );
};
