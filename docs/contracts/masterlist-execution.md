# Eksekusi masterlist — tahap 5, tooling sekali pakai

20 Oktober 2026. Implementasi CLI, bukan endpoint/CTA import dashboard. Preview tetap mengikuti [masterlist-preview.md](masterlist-preview.md), can_import tetap false. Tidak mengubah envelope/shape API existing. Import sungguhan hanya setelah owner memilih target, file/hash, preview final dan menyetujui backup atau waiver eksplisit serta eksekusi.

## Otorisasi dan target

Command memerlukan UUID admin active dengan assigned role **name=superadmin + is_system=true**, serta member-view, member-create dan member-import-preview. Role/grant dibaca ulang setiap eksekusi/batch. Tidak ada permission/grant/endpoint publik baru. Preview harus milik admin yang sama. Environment dan database harus cocok persis dengan koneksi MySQL aktif; nama database bukan instruksi untuk mengalihkan koneksi.

## Preview tersegel

POST preview baru tetap parser policy v3, dengan metadata integrity internal: SHA-256 tiap batch privat, katalog (ID/code/label), extension dan HMAC APP_KEY atas manifest. GET menghilangkan metadata integrity sehingga shape FE tetap. Source SHA-256, owner, expiry tepat 24 jam, versi, ringkasan, urutan/nomor baris, katalog, batch dan marker persetujuan diverifikasi sebelum write. Preview v1/v2/v3 lama yang belum tersegel hanya dapat direview, tidak dieksekusi; jalankan preview baru. APP_KEY berubah -> perlu preview baru.

Pola WA kandidat diselaraskan dengan CHECK domain: `^628[0-9]{8,12}$`. Di luar batas -> null untuk dilengkapi Ibu, bukan menyebabkan batch gagal. Kebijakan v3 lain tetap: future fallback tetap, teks minat utama, null unknown, consent null, konflik skip. Raw dan preview lama tidak ditimpa.

## CLI

```bash
php artisan members:import-masterlist PREVIEW_UUID \
  --actor=ADMIN_UUID --file-hash=SOURCE_SHA256 \
  --database=ACTUAL_DATABASE --target-env=ACTUAL_APP_ENV
```

Default **preflight read-only**: summary, preview/hash, target, run_id bila ada, ledger_migration_required, sequence_healthy, writes_performed=false. Preflight tidak membuat ledger/user/member/nomor/audit/token/email. Schema belum ada tidak menghalangi pembacaan preflight.

Tambahan untuk write hanya sesudah persetujuan owner:
`--execute --backup=/ABS_PRIVATE_PATH/baseline.sql --accept-warnings --batches=1`.
Owner juga menyetujui jalur tanpa backup untuk hosting dev: ganti `--backup=...` dengan **kedua flag** `--without-backup --accept-data-loss`. Tidak ada default bypass: tanpa backup/waiver ditolak, waiver tanpa pengakuan risiko ditolak, --backup bersamaan waiver ditolak, dan --accept-data-loss tanpa --without-backup ditolak. Tetap memerlukan --execute + --accept-warnings; tanpa --execute hanya preflight tanpa write. APP_ENV hosting boleh production walaupun dipakai sebagai dev; target tetap dicek persis, bukan diubah agar melewati guard.
Setiap batch memproses maksimum 250 pending, default 1 batch, batas 1–40 batch per command. Tidak ada daemon/queue/cron import. Untuk Hostinger mulai 1 batch, ulangi command yang sama sampai pending=0. Tidak membutuhkan proc_open atau Node di runtime importer.

Output write: run_id, status running/completed, total, imported, skipped, pending, updated_existing=0, reconciliation_mismatches, emails_sent=0, **backup_mode=file|waived** (metadata CLI, bukan API/FE). Total=imported+skipped+pending. Tidak memuat nama/email/WA/raw. Error nonzero, pesan sanitasi tanpa SQL/exception source. Konflik baru menambah skip, tidak dianggap updated_existing.

## Backup dan sequence

Write menolak backup tidak ada/kosong, symlink, di folder public aplikasi, permission group/other terbuka, bukan SQL, atau tanpa database target dan CREATE TABLE users/members/sequences/pivot/dua tabel ledger. Buat full dump `--databases` **sesudah migration ledger**, sebelum write pertama, mode 0600/0400 di luar Git/served directories. Ledger menyimpan SHA-256 backup baseline; retry harus memakai byte backup yang sama. Pemeriksaan ini hanya evidence gate, **bukan bukti dump lengkap/restorable, konsisten terhadap seluruh data, atau benar-benar diverifikasi restore**. Operator wajib memverifikasi backup/restore terpisah dan menjaga retensinya; source/backup tidak boleh publik.

Pengecualian yang disetujui owner: mode waived tidak membaca/membuat file SQL dan tidak berpura-pura punya backup. Ledger existing backup_hash menyimpan marker literal **NO_BACKUP_OWNER_APPROVED**, bukan SHA palsu; hasil CLI backup_mode=waived dan setiap audit batch menyebut waiver owner tanpa PII. Tidak perlu migration baru. Run yang sudah dimulai **tidak bisa berganti mode** file -> waived atau waived -> file, termasuk saat completed/reupload. Retry mode file tetap memerlukan baseline identik; retry waived tetap memerlukan kedua flag risiko di setiap command. Backup tetap dianjurkan; waiver berarti tidak ada restore/undo otomatis untuk batch yang sudah committed. Rollback batch gagal bukan pengganti pemulihan data committed.

Sequence member_number harus >= nomor terbesar existing (termasuk soft delete). Tidak otomatis mengubah atau memutar mundur counter. Jika tidak sehat, berhenti untuk review/perbaikan terpisah. Alokasi selalu AllocateMemberNumber/lockForUpdate dalam transaksi yang sama dengan member.

## Ledger dan transaksi

Migration 2026_10_20_000005 menambah dua tabel internal, bukan profil baru:

- member_import_runs: UUID, fingerprint unique, SHA file/plan dan backup_hash (SHA backup atau marker waiver di atas), preview UUID, actor FK, parser version, total, running/completed, completed_at, timestamps.
- member_import_rows: PK(run_id,row_number), candidate SHA, pending/imported/skipped, reason_codes JSON, user/member FK + nomor baru bila imported, processed_at; index status/baris. Tidak menyimpan nama/email/WA/raw/teks profil.

Fingerprint terdiri dari source hash + mapping canonical + parser policy + katalog, sehingga reupload bytes sama tidak membuat run baru. Candidate plan hash tidak bergantung collision summary yang berubah karena akun hasil batch sendiri. Semua baris direncanakan di ledger awal; invalid disimpan skipped, accepted pending. Skip awal tidak dibuka kembali otomatis walaupun konflik kemudian hilang.

Batch mengambil lock run, membaca pending berurutan, melakukan locking read semua users email dan members WhatsApp termasuk soft delete. Konflik muncul setelah preview => skip + reason. User/member/genre/pointer ledger/sequence/audit committed bersama; constraint race atau failure rollback **seluruh batch gagal**, batch yang sudah committed tetap utuh. Retry tidak mengalokasikan ulang/member merge. Dua proses bersamaan diserialisasi run lock/unique fingerprint; file berbeda yang bentrok tetap dilindungi unique domain + retry batch.

Audit tipe members per batch pending: actor existing + run UUID + jumlah dibuat/skip, tanpa PII peserta/file payload. Semua user baru password/email_verified_at/first_login_at null; member migrated, signup_method/wilayah/preferensi/consent null, joined_at kandidat UTC, minat dikenal sesuai preview. Tidak memakai Action admin create yang mengirim undangan. Tidak ada mass email, token, password default atau auto-verify saat import.

## Claim akun disetujui owner

Khusus user **password null + email_verified_at null + member non-soft-deleted berstatus migrated**, konsumsi link reset_password valid sekali pakai menandai email_verified_at pada transaksi yang sama dengan password/session epoch/used_at. Ini bukti kepemilikan email saat claim, bukan verifikasi pada saat import. Inspect, request forgot, password invalid, token invalid/expired/replay tidak memverifikasi. Reset user active/tanpa member/sudah punya password/deleted tidak diperluas menjadi verifikasi email. Consent tetap null dan profil migrated sampai Ibu mengisi field wajib + persetujuan pribadi. JWT/response shape dan expiry/cooldown tetap existing.

## Retry, rekonsiliasi, cleanup

Jika proses terputus, ulangi command sama dengan mode backup yang sama (baseline file identik atau kedua flag waiver). Jangan hapus member/ledger/counter. Jika preview expired, upload bytes/mapping sama -> review preview baru -> pakai UUID baru; fingerprint, kandidat/katalog, aktor dan pilihan backup wajib tetap identik. Run sama diteruskan, baris imported tidak diadopsi sebagai akun existing/ditulis ulang; konflik baru pada pending tetap skip. Candidate drift/mapping/catalog berubah atau owner tidak aktif memblokir resume; butuh keputusan/review terpisah, bukan bypass.

result merekonsiliasi total ledger dan keberadaan/pasangan user-member/nomor terhadap data saat ini. Verifikasi profil/status/genre/consent sesudah write dijelaskan runbook; perubahan sah oleh Ibu setelah claim bukan otomatis kerusakan. Tidak ada auto-delete/undo committed batch. Rollback migration menolak ledger berisi run; restore penuh dapat menghapus perubahan sah sesudah backup dan wajib maintenance + persetujuan/review.

Setelah real import + rekonsiliasi disetujui, cabut tooling/permission/preview/staging melalui cleanup terpisah yang direview. Pertahankan ledger sampai rekonsiliasi/audit minimum final aman. Jangan drop schema profil/member/katalog. Belum ada cleanup atau deployment yang diklaim selesai.
