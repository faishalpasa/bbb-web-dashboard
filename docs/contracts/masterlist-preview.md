# Preview masterlist — tahap 4

Status: preview dry-run; eksekusi tahap 5 adalah CLI terpisah di [masterlist-execution.md](masterlist-execution.md). Keputusan owner 20 Oktober 2026. Salinan identik API, dashboard dan member web-app; tidak menambah endpoint member/public.

## Scope dan otorisasi

Tooling migrasi **sekali pakai**; setelah import tahap 5 dan rekonsiliasi disetujui, cabut UI/API/parser/scheduler serta permission dan hapus staging secara permanen. Jangan membangun CRUD import sebagai fitur produk. Belum ada route confirm/import nyata.

- POST `/api/admin/member-import-previews`: multipart `file`, optional `mapping[field]` = nama header persis; string kosong/null berarti tidak dipetakan. Optional `perPage`: 10/20/25/50/100, default API 50. Hasil 201 `{ data: MasterlistPreview }`.
- GET `/api/admin/member-import-previews/{previewId}?page=1&perPage=25`: 200 envelope sama; `perPage` 10/20/25/50/100, default 50, maksimum 1.000 halaman pada ukuran 10. UUID bukan kredensial. Pergantian ukuran dari FE kembali ke halaman 1; halaman 100 baris boleh melintasi batch staging 250 tanpa menghilangkan baris.
- Keduanya membutuhkan admin active + **member-import-preview + member-view**, sebelum validasi/file dibaca. Permission baru hanya via migration `2026_10_20_000004`, grant awal hanya system superadmin, tidak ke admin/custom role. Pengelolaan role tetap subset/dependency sesuai admin-rbac.
- GET hanya milik admin pengunggah; owner lain, UUID unknown, expired atau halaman di luar hasil = 404 `{message:"Data tidak ditemukan."}`. Token invalid/member = 401; permission dicabut langsung 403 `permission_denied`.
- POST throttle 3 per menit mengikuti limiter authenticated Laravel. Tidak ada raw download/public URL. Respons preview `Cache-Control: no-store, private`.
- Error input 422 `{message, errors}` dengan key file/mapping/mapping.{field}/page. Parser error disanitasi, tidak menampilkan path, formula, atau PII di log.

## File, staging dan retensi

CSV UTF-8 delimiter koma atau XLSX tepat satu worksheet. Maksimum 10 MiB (10.240 KiB), 10.000 baris data selain header/baris kosong, 20.000 baris fisik, 64 kolom, header unik nonkosong maks. 255 karakter. XLSX dibatasi 512 entry ZIP / 64 MiB expanded; 640.000 sel formula. Sel teks maks. 32 KiB, total decoded values 32 MiB. Arsip traversal/macro/DTD worksheet ditolak. Tidak mengeksekusi macro, formula atau external links; CSV bukan executable.

Raw dan JSON batch tersimpan pada disk lokal **masterlist**, root `storage/app/private/masterlist-previews`, file 0600/directory 0700, bukan public/local served disk dan tidak punya signed URL. Nama direktori UUID dari server, bukan nama file pengguna. Manifest dipublikasikan setelah semua batch lengkap; parse gagal menghapus seluruh direktori percobaan itu. Parser streaming dan normalisasi/staging/collision-check batch 250. Duplicate map lintas batch menandai **semua** baris konflik.

Retensi tepat 24 jam sejak preview selesai. GET expired selalu 404 walaupun cron belum membersihkan file. Command `php artisan members:prune-import-previews` dijadwalkan tiap menit tanpa overlap, menghapus raw + hasil expired dan direktori partial berumur 24 jam hanya dalam namespace UUID milik disk ini. Hostinger perlu cron `schedule:run` (cron worker langsung saja tidak menjalankan prune). Waktu penghapusan fisik bergantung cron; expiry akses tidak bergantung cron. Backup file staging/PII tidak boleh ikut Git atau public storage.

## Mapping dan kebijakan kandidat

Field yang dikenali:
`email, name, joined_at, birth_year, phone_wa, domicile, instagram_account, website_url, goodreads_account, literacy_participation_interest, favorite_books_authors, reading_interests, reading_interest_other, preferred_contact_channel`.
Email + Nama wajib dipetakan. Tidak menerima mapping consent/nomor/status/verified. Header workbook asli sudah dikenali; custom mapping harus header yang ada dan tidak dipakai dua field.

- Email trim/lowercase dan valid maks. 255; Nama trim wajib maks. 255. Email/WA konflik dalam file atau DB => invalid/skip, tidak memilih pemenang, merge atau overwrite. Pemeriksaan DB mencakup semua users (termasuk tanpa member) serta member soft-deleted. Ini snapshot, bukan reservasi identity.
- WA hanya normalisasi whitespace/()+-, 08 -> 628; kandidat valid `628` + 8–12 digit, persis CHECK database, selainnya null + review. Error/cache formula hilang ditandai, raw/cache dan provenance dipertahankan; tidak menghitung ulang. Cache valid tetap warning karena belum diverifikasi.
- Tahun lahir hanya tahun pasti 1900–2009 sesuai acuan 2026/minimal 17; rentang/invalid null + review. Tidak memperkirakan usia.
- Tanggal Indonesia d/m/Y atau d-m-Y, jam opsional H:i[:s], ISO tanpa zona; interpretasi WIB. Pengecualian disetujui: string slash bagian pertama 1–12/bagian kedua 13–31 dibaca M/D/YYYY (jam satu/dua digit). Ambigu tetap D/M, bukan inferensi antarbaris; M-D tidak ditambahkan. M/D valid nonfuture memiliki provenance.joined_at_format=approved_mdy. Typed/serial Excel 1900/1904 dibaca sebagai wall-clock date -> WIB -> UTC. **Kebijakan v3 disetujui:** tanggal kosong memakai 20 Oktober 2026 00:00 WIB (`2026-10-19T17:00:00Z`), provenance approved_fallback + joined_at_fallback. Tanggal future yang valid diparse memakai fallback tetap yang sama, provenance approved_future_fallback + warning future_joined_at_fallback; raw histori tetap dan bukan tanggal bergabung terverifikasi. Tanggal malformed/tidak terbaca tetap error invalid_joined_at, bukan diputar hari/bulan atau diberi histori buatan.
- Opsional mengikuti batas profil: akun 255, URL HTTP/HTTPS 2048, buku/penulis dan Other 5000. Nilai terlalu panjang dikosongkan (null) + warning text_too_long, raw utuh tanpa pemotongan. URL/enum tidak dikenal null + catatan untuk dilengkapi Ibu, tanpa scheme/default buatan. WA invalid/formula error dan tahun lahir rentang/invalid tetap null. Identitas wajib nama/email invalid dan konflik unique tetap error/skip, bukan lolos karena kebijakan profil.
- Jawaban teks Minat menjadi sumber utama sesuai persetujuan v3, label/code katalog dengan pemisah koma/semicolon/newline. Pilihan dikenal dipertahankan; unknown tidak dipilih otomatis dan raw tetap. Flags hanya audit/provenance interest_flag_candidates; invalid/conflict tetap warning dengan keputusan teks-primary eksplisit. provenance.reading_interests_policy=approved_text_primary. Other tanpa teks valid tidak dipilih (teks null) agar dilengkapi Ibu sendiri, warning other_missing; tidak membuat kategori/jawaban buatan.
- Domisili disimpan raw; tidak menebak hierarki wilayah, kelurahan atau kode pos. Preferensi online/offline tidak diambil dari minat literasi. Kandidat migrated; consent/rules_version null. Email verified/password/nomor BFF belum dibuat. Semua row saat ini warning minimal profile_incomplete karena sumber masterlist belum membuktikan profil/consent lengkap.
- Tidak ada users/members/pivot/sequence/token/email/audit ber-PII yang ditulis. Nomor BFF dialokasikan hanya tahap 5 setelah file/hash/environment/preview disetujui dan constraint diperiksa ulang.

## Respons

Nama snake_case historis preview dipertahankan dari mock v1; tambahan berikut eksplisit dan tidak mengubah kontrak endpoint existing lain.

```ts
interface MasterlistPreview {
  import_id: string;
  filename: string; // basename, escaped plain text
  file_hash: string; // SHA-256 exact uploaded bytes
  detected_columns: string[];
  suggested_mapping: Partial<Record<MasterlistField, string>>;
  summary: { total_rows: number; valid_rows: number; warning_rows: number; invalid_rows: number };
  rows: MasterlistPreviewRow[]; // current page only, source physical row numbers
  meta: { currentPage: number; lastPage: number; perPage: number; total: number };
  created_at: string; expires_at: string; // ISO 8601 UTC
  can_import: false;
  parser_version: 'masterlist-preview-v1' | 'masterlist-preview-v2' | 'masterlist-preview-v3'; // POST uses v3, retained versions immutable
  fallback_joined_at: '2026-10-19T17:00:00Z';
}
interface MasterlistPreviewRow {
  row_number: number;
  status: 'valid' | 'warning' | 'invalid';
  values: Record<string, string | number | string[] | null>;
  raw: Record<string, string | number | boolean | null>; // cached/typed source values, never evaluated formulas
  provenance: Record<string, string | string[]>; // source/formula_cache/approved_fallback; joined_at_format=approved_mdy; interest_flag_candidates
  issues: {field: MasterlistField | 'row'; severity: 'warning' | 'error'; code: string; message: string}[];
}
```

Summary buckets mutually exclusive: error => invalid, otherwise any warning => warning, otherwise valid. Total = valid + warning + invalid = meta.total. GET pages share immutable summary/hash/expiry; repeating POST produces new UUID but identical normalization for identical bytes/mapping/catalog/DB snapshot. No member-number reservations.

Parser v2 recorded the approved unambiguous M/D policy and serial wall-clock correction. Existing snapshots are never reinterpreted by GET; upload/process again for the current parser policy before approving any import. No response fields/envelope or other endpoint shapes change.

Parser v3 supersedes candidate policy for new POST only: future fallback, deferred invalid optional profiles and text-primary interests. Every new row has provenance.review_policy=approved_deferred_profile_v1. Warning status/bucket stays warning, shown as **Diterima dengan catatan**, never Valid; this is acceptance of the deferred-profile policy, not import execution or verified data. Old v1/v2 snapshots keep Perlu review and are never reclassified by GET. Invalid conflicts/identity remain skip even with this policy marker. Raw/issues are retained. Migrated onboarding requires missing mandatory fields and personal consent before active; optional extras stay optional, no invented answers. can_import remains false.

## Dashboard

Entry from Member only with dedicated permission; route /members/import requires both grants. Existing form/card/table patterns approved. File selection, optional header mapping after first recognized preview, process/retry, summary/hash/expiry, row issues with raw/provenance detail. Shared shadcn-style table footer: kiri Tampilkan + jumlah baris (default FE 25) + total; kanan nomor/ellipsis dan panah prev/next saja, tanpa first/last. Modal desktop / bottom sheet mobile. No active import/confirm CTA. Preview UUID in query permits owner reload; no token/PII in URL/localStorage. Mapping changes require rerun, results do not mutate. UI/API permission gating independent; HTML/source text always escaped. No request with unauthorized session.

## Verification / next boundary

Synthetic fixtures only in automated tests. Actual workbook remains private and unchanged. Local runtime tests do not prove Hostinger limits, PHP extensions, permissions, cron deletion or hosted deployment. OpenSpout v4.32 requires PHP 8.3/8.4/8.5 plus DOM, fileinfo, filter, libxml, XMLReader and ZIP; use existing PHP 8.4 and composer check-platform-reqs on host.

Preview is for review only. Stage 5 still requires exact file/hash, target environment, accepted/skipped row decisions, and owner approval with either a backup or the explicit --without-backup --accept-data-loss waiver described in masterlist-execution.md. No mass email.

New previews contain sealed internal integrity metadata for the CLI writer; it is never returned by POST/GET. Historical unsealed snapshots remain reviewable but cannot be executed. See masterlist-execution.md for the one-off command, backup/ledger/permissions and approval boundary; can_import stays false because there is no HTTP confirm endpoint.
