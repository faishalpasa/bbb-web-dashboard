# BBB BFF admin implementation checklist

## Cleanup tooling masterlist (20 Oktober 2026)

- [x] Atas konfirmasi pemilik bahwa import selesai: hapus CTA Preview Masterlist, route/page/context, service/type/constant dan permission khusus import. Tambah/edit/filter/ekspor Member, RBAC lain dan pagination tetap; 55 tes + typecheck/lint/format/build lulus. Kontrak arsip retirement identik lintas repo. Tidak browser smoke karena server lokal sudah dimatikan sesuai instruksi; belum commit/push/deploy. Ledger/audit/data member/profil dipertahankan; migration permission API baru diperlukan pada deploy.

## Perbaikan responsif Member (20 Oktober 2026)

- [x] Filter mobile satu kolom tanpa implicit track/overlap, aksi header dapat turun baris, dan pilihan preferensi pada komponen tambah/edit dapat wrap di dalam kartu. Checklist React menjaga perubahan CSS saja tanpa state, dependency, permission atau kontrak baru. 61 tes dashboard (termasuk 3 regression utility layout), typecheck/lint/format/build dan diff check lulus. Browser lokal dengan sesi admin/API nyata: daftar pada 360/390/768/1360 px, provinsi berlabel panjang pada 390 px, form tambah pada 360/390/1360 px; tidak ada overflow halaman dan pilihan tetap di dalam kartu. Tidak submit/ekspor/mengubah data, belum uji Safari/perangkat fisik atau deploy; edit memakai komponen yang sama, bukan klaim flow edit diuji penuh.

## Track masterlist: profil dan minat bacaan (20 Oktober 2026)

- [x] Kebijakan preview v3: warning berprovenance disetujui tampil Diterima dengan catatan (bukan Valid), summary/pesan profil manual tetap dry-run dan konflik tetap skip. Snapshot lama tetap berlabel Perlu review. 7 tes preview + typecheck/lint/format/build; browser data sintetis 58 accepted notes + 2 skip dan detail profil kosong. Kontrak identik tiga repo; bukan bukti import/hosted deployment. Panduan React menjaga label turunan tanpa state/request baru.

- [x] Tahap 3 lokal: field tambahan opsional, katalog API multi-select + Other kondisional, prefill/edit/render plain text, error/disabled state pada form existing. Kontrak shared `member-reading-profile.md` dan salinan frontend-api identik di tiga repo; admin-members identik API/dashboard. API full Pest 680 / 5.098 + Pint, typecheck/lint/format/build kedua FE dan 10 tes reading-profile per FE lulus. Browser web-app 390px (edit/onboarding/migrasi) + dashboard 1360px (detail/tambah/edit) memakai MySQL nyata; data QA dibersihkan. Tanpa import/commit/push/deploy. Bukti/batas dan penerapan migration lokal di `../bbb-api/docs/plans/member-masterlist-import.md`.
- [x] Tahap 4 lokal: preview dashboard owner-only, permission khusus, upload/mapping/summary/paging/detail raw/provenance, modal desktop/bottom sheet mobile dan reload; tanpa import aktif. Full API 694 Pest / 5.239 + Pint, dashboard 57 tes dan typecheck/lint/format/build lulus. CSV sintetis 60 baris diuji browser; workbook asli hanya dry-run privat. Batas dan temuan di `../bbb-api/docs/plans/masterlist-preview-verification.md`.
- [x] Tahap 5a backend: writer melalui CLI sekali pakai, bukan CTA/HTTP import dashboard. Preview envelope/can_import=false tetap, integrity tersegel internal tidak diekspos. Kontrak execution + claim migrated lewat reset link disepakati, frontend-api identik tiga repo. API 747 Pest / 5.681 + Pint, dua FE typecheck/build dan 7 tes preview dashboard lulus. Runbook di `../bbb-api/docs/deployment-masterlist-import.md`.
- [x] Tahap 5b lokal: backup penuh sebelum/sesudah ledger lolos restore disposable dan hash; 3.712 member imported + 2 skip, 0 pending/mismatch, 24.716 assignment minat cocok, data existing tetap dan retry completed no-op. Browser daftar Member menunjukkan 3.724 data, 149 halaman ukuran 25, halaman 2 menampilkan 26–50. Full API 747 Pest / 5.681 + Pint lulus ulang. Bukti/batas di plan API; tidak ada tombol import baru di FE.
- [ ] Sisa 5b/5c: claim email/browser dengan identitas QA yang disetujui, rilis + preview/actor/backup/import Hostinger dan rekonsiliasi, baru cleanup permanen setelah kedua target disetujui. Commit/push tiga repo sudah disetujui owner; DB hosting belum disentuh, tooling dipertahankan. Panduan langkah per langkah: `../bbb-api/docs/deployment-masterlist-hostinger.md`.

## Pagination dashboard (20 Oktober 2026)

- [x] Semua tabel/list memakai shared footer shadcn-style: Tampilkan + ukuran 10/20/25/50/100 (default FE 25) + total kiri; prev + nomor/ellipsis + next kanan, tanpa first/last. Ukuran/filter reset halaman 1, loading/batas disabled, nomor mobile diringkas. Member/kegiatan/peserta/log memakai perPage API; admin/role/exit/history client-side atas data utuh. Tujuh tes pagination + typecheck/lint/format/build, browser Kegiatan ukuran 10 -> page 2 (2 dari 12) -> ukuran 25 reset page 1, layout mobile 390px tanpa overflow. Bukan klaim semua ukuran/halaman seluruh modul sudah diuji browser.

## Track baru: Registration Form kegiatan (19 Oktober 2026)

- [x] Tahap 1 — keputusan utama dan kontrak target didokumentasikan; kontrak shared di `docs/contracts/event-registration-form.md`, plan enam tahap di `../bbb-api/docs/plans/event-registration-form.md`. Salinan kontrak diverifikasi identik di tiga repo. Ini acceptance dokumentasi saja, bukan klaim fitur sudah aktif.
- [x] Tahap 2 (backend lokal) — migration/model/factory, default/backfill, create/edit/duplicate konfigurasi, versi/lock, batas field yang disetujui dan guard sementara writer lama. Full Pest 574 / 4.400 assertions + Pint; dua FE typecheck/lint/format/build dan 16 tes RBAC dashboard lulus. MySQL lokal sudah dimigrasikan, hash baris domain lama tetap; bukan bukti deploy Hostinger/MariaDB atau UI form baru. Rincian di `../bbb-api/docs/plans/event-registration-form.md`.
- [x] Tahap 3 (dashboard lokal) — builder empat tipe, drag-and-drop + keyboard/tombol urutan, required/opsi/preview, validasi, version conflict/reload dan locked state. 12 tes builder + 16 RBAC serta typecheck/lint/format/build lulus; browser create/edit/simpan/reload/duplikasi dan MySQL terverifikasi. Layout mobile diperiksa; gesture sentuh perangkat asli belum diuji. Tidak ada deployment.
- [ ] Tahap 4–6 — pendaftaran member/publik/admin, detail jawaban modal/bottom sheet + warna warning/danger, verifikasi dan panduan cutover. Jangan mulai tahap lain tanpa instruksi pemilik.

Catatan: handoff historis di bawah tidak menggantikan keputusan baru. Backend konfigurasi dan builder tersedia lokal; submit jawaban baru belum diimplementasikan. Jangan deploy custom form sebelum tahap 4 siap. Data historis dipertahankan, tanpa jawaban palsu.

Launch target: 30 October 2026. Admin-only app; member/public work remains in web-app. Check items only after verification.

## Handoff (16 October 2026)

RBAC dashboard (19 Oktober 2026): kontrak `docs/contracts/admin-rbac.md`, rencana `../bbb-api/docs/plans/admin-rbac.md`. A–B dan D–E selesai; C operasional terverifikasi, keputusan penyaringan statistik pending. Guard halaman/sidebar/aksi, landing 403/no-access dan revalidasi session memakai permissions. Label Admin di bawah logo dihapus desktop/mobile sesuai owner. API 493 Pest + Pint; 9 tes RBAC FE + typecheck/lint/format/build lulus; smoke lokal view-only, empty, URL 403 dan revoke peserta. F belum berjalan: pengelolaan role memakai tree switch parent/child sesuai arahan owner, tanpa permission creation UI. Katalog permission hanya lewat migration API. Deploy dev: `../bbb-api/docs/deployment-rbac-dev.md`.

- Local path: `/Users/pasa/Projects/BBB/web-dashboard`; origin: `git@github.com:faishalpasa/bbb-web-dashboard.git`; working branch: `development`.
- Git initialized on `development`, origin connected. User authorized the initial scaffold commit/push on 16 October 2026. Check `git status` and `git log` for current publication state; continue working on `development`.
- Continue with section 1 only. Read `AGENTS.md`, all `.claude/rules/`, `docs/contracts/`, and `docs/HANDOFF.md` before changing code.
- Member app (`../web-app`) is complete through membership exit part B; its latest published commit is `3371913`. API (`../bbb-api`) latest published commit is `e813fc2`; both development.
- Public event `/e/{slug}` is not implemented and belongs to web-app, not dashboard.
- Local dashboard server was left running on 5174; member Vite 5173 was stopped at the user's request. Recheck processes before starting servers.

## 0. Scaffold

- [x] Vite + React + strict TypeScript + Tailwind + code-based TanStack Router on localhost:5174.
- [x] Match web-app agent guidance, page/context/components, services/types/utils, primitives, tokens, fonts, logo assets and quality scripts.
- [x] Dev-only MSW skeleton and Axios/CSRF infrastructure; no invented admin auth or endpoints. Runtime transport tests remain for integration.
- [x] Typecheck, lint, format check and build passed with Node 22.23.3; browser startup and fallback-route/back-link smoke tested at 1360px. This does not verify the admin artboards or authenticated API flows.

## 1. Admin foundation (next)

- [ ] Inspect admin artboards in Chrome at 1360px; export only if necessary.
- [ ] Agree admin session/auth/capabilities contract with the API, including 401/403, redirect destination and shared-cookie behavior. (Draft in docs/contracts/admin-auth.md, implemented as dummy `/api/admin/*`; awaiting approval.)
- [x] Allow both 5173 and 5174 origins in API local CORS/Sanctum; do not break member redirects. (`.env.example` updated; FRONTEND_URL unchanged.)
- [x] Login (email + password, adapted from member artboard 1a) and route guard; verified at 1360px against the real dummy API.
- [x] Admin shell/sidebar (left drawer below 1024px) and capability-gated navigation (admin biasa hanya Dashboard dan Kegiatan; Member/Permintaan Keluar/Admin/Pengaturan/Log khusus superadmin).
- [x] Dashboard (artboard 8) with dummy `GET /api/admin/dashboard` (docs/contracts/admin-dashboard.md) and Pest tests; checked at 1360px as superadmin and admin. Loading/error/401 states built; error/401 not yet exercised in a browser.

## 2. Admin flows

- [x] Member list/filter/create/detail/edit, confirmed deactivation (plus dummy export CSV, reset-password acknowledgement, internal note, and reactivation added at the user's request). Checked at 1360px and 375px against the real dummy API (`docs/contracts/admin-members.md`). Not yet covered by Playwright.
- [x] Event list/create/edit, participants, attendance code generation, manual Present/X, close event (plus add participant dialog, dummy banner upload, duplicate, announcement text, cancel at the user's request). Checked at 1360px and 375px against the real dummy API (`docs/contracts/admin-events.md`). Not yet covered by Playwright; the public page `/e/{slug}` still belongs to web-app.
- [x] Exit-request review (approve with confirmation, reject with a required reason; dummy `/api/admin/exit-requests`, docs/contracts/admin-exit-requests.md). Checked at 1360px and 375px against the real dummy API. Not yet covered by Playwright; the member-side exit flow is still session-based and not linked to these dummy requests.
- [x] Superadmin settings, admin management, invitations and audit log (dummy `/api/admin/{settings,admins,invitations,audit-logs}`, docs/contracts/admin-superadmin.md; invitation email is a template, so the dummy response hands back the activation link). Checked at 1360px and 375px against the real dummy API, including the 403 for a plain admin. Not yet covered by Playwright.
- [ ] Masterlist import mock-first: upload, column mapping, preview summary, row issues, confirmation, result and error report (see docs/contracts/masterlist-import.md).
- [ ] Masterlist scenarios: duplicates, invalid regional codes, missing district/postal code, under-age rows. Wait for an anonymized sample before finalizing parser/mapping.

## 3. Verification and delivery

- [ ] Browser flows at 1360px against real dummy API, including loading/error and authorization refusals.
- [ ] Accessibility and Playwright coverage.
- [ ] Hosting/SPA fallback/domain setup.

## Decisions/inputs still needed

- Admin auth/session/capability shapes, dummy admin credentials and redirect destinations; member login does not grant admin access.
- Real production domains/hosting and shared-domain cookie setup; preserve member auth while adding admin.
- Anonymized masterlist sample. Do not import personal member data into external services.
- Live Claude artboard access through signed-in Chrome; ask for exports if unavailable.

Origin connection was explicitly requested. Commit/push/deploy still require a separate explicit request. No backend database/migrations until the user ends the dummy phase.

## Bearer auth migration (`docs/plans/bearer-auth.md` in web-app and bbb-api)

- [x] Phase 3 (web-dashboard): admin Bearer token (`bbb.admin.token`), refresh on 401, no CSRF handshake, logout revokes the token. Checked in the browser at the dev server against the local API: sign-in, reload, expired-token refresh, logout (token revoked), and a POST (add guest participant) with no `/sanctum/csrf-cookie` request.
- [ ] Invitation accept link is still limited by the dummy phase: the invited account only exists in the inviting admin's session.
