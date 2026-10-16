# Prompt for the next session

Copy the block below into a new session opened at `/Users/pasa/Projects/BBB/web-dashboard`.

```text
Bro, lanjut proyek BBB BFF (Buibu Baca Buku Best Friends & Family), target launch 30 Oktober 2026. Ngobrol casual kayak peer programmer.

Repo dipisah tiga:
- Admin FE: /Users/pasa/Projects/BBB/web-dashboard
  origin git@github.com:faishalpasa/bbb-web-dashboard.git
- Member/public FE: /Users/pasa/Projects/BBB/web-app
  origin git@github.com:faishalpasa/bbb-web-app.git
- Laravel API: /Users/pasa/Projects/BBB/bbb-api
  origin git@github.com:faishalpasa/bbb-api.git
Kerja di development, bukan main.

Wajib baca AGENTS.md, semua .claude/rules/, TASKS.md, docs/contracts/ dan docs/screens/README.md sebelum mengubah repo. Kalau menyentuh API/web-app, baca aturan masing-masing juga. Cek branch/status dan preserve perubahan lain.

STATUS:
web-dashboard baru scaffold, belum implementasi admin artboard, login, guard, sidebar, capability atau data bisnis. Ada Vite + React19 + TypeScript strict + TanStack Router code-based + Tailwind4, komponen shadcn-style yang disalin dari web-app, Axios/CSRF, MSW dev-only (baru health), logo/favicon, font DM Sans/IBM Plex Mono, fallback 404/error. Jangan bangun ulang scaffold.
Struktur: src/app-context.tsx, router.tsx, constants/route.ts, pages/admin/dashboard/{index.tsx,_context.tsx,_components/page-content.tsx}, components/{layout,molecules,ui}, services, types, utils, hooks, mocks. .claude, .agent, .agents sudah tersedia.
Git admin sudah init development + origin terhubung. Gw sudah mengizinkan commit/push awal scaffold pada 16 Oktober 2026 dan kerja berikutnya tetap di development. Cek git status/log/remote untuk kondisi publikasi terkini. Izin ini bukan izin otomatis commit/push perubahan berikutnya; jangan commit/push/amend/rebase/deploy tanpa gw minta, dan jangan tambah atribusi AI.
Member FE sudah selesai auth/onboarding, beranda, kegiatan/pendaftaran/absensi, profil/ubah data/password/aturan komunitas dan pengajuan keluar/status/batal. Commit published terakhir FE 3371913, API e813fc2 di development. Public /e/{slug} BELUM dibuat, tetap scope web-app.

TUGAS BERIKUTNYA:
Mulai section 1 TASKS.md admin: inspect desain admin, petakan lalu sepakati kontrak admin auth/session/capabilities dan dashboard dummy. Jangan tebak endpoint, fields, credential admin atau anggap sesi member sebagai admin. Ajukan keputusan yang belum jelas ke gw dulu. Setelah jelas, kerjakan login/guards + shell/sidebar/dashboard sesuai artboard. Lanjut member management, event/participants/attendance, review keluar, settings/admin/invitations/audit, masterlist sesuai TASKS.

DESAIN:
https://claude.ai/artifact/QdvUF3DEjsZwf2MRsxW16r?sk=Ffdz_XMVQEk5gcSdeMEmRQ#page-dcb81aee8d83
Buka via Chrome yang sudah login; Play -> Prototypes -> artboard admin 8–13. Target desktop 1360px. Kalau tidak bisa akses/missing, minta export ke docs/screens/. Jangan karang layout.

KONVENSI:
- Page named export Page<Nama>, index tipis; _context pegang state/effects/services; _components untuk UI halaman.
- App-context hanya global; halaman tidak import Axios. Service verb get/post/put/delete, return {data,status:true}, throw ServiceError.
- UI Indonesia, member disebut Ibu, semua field wajib diberi * lewat FormField/RequiredMark; elemen interaktif data-test-id modul_elemen_aksi.
- Pakai ulang form/dialog/primitives; destructive action perlu confirmation. API pemegang otoritas bisnis/authorization; capability UI bukan authorization.
- Kontrak docs/contracts/frontend-api.md sekarang identik di KETIGA repo. Kalau ubah kontrak, update semua salinan dan kabari gw. Admin kontrak BELUM didefinisikan.
- API masih DUMMY: tanpa migrasi, tanpa MySQL/database. File session/cache, Faker kegiatan. Jangan keluar fase dummy sebelum gw bilang.

LOKAL/VERIFIKASI:
- Node 22.23.3 (.nvmrc): nvm use, npm ci, npm run dev di dashboard, localhost:5174 strictPort.
- Member Vite localhost:5173 sengaja dimatikan; jangan nyalakan kecuali perlu/diinstruksikan. Dashboard ditinggal nyala, cek port dulu supaya tidak bikin proses dobel.
- API localhost:8000, PHP /opt/homebrew/opt/php@8.4/bin/php. Gunakan localhost, bukan 127.0.0.1.
- API CORS/Sanctum untuk port admin belum dikonfigurasi. Saat integrasi pertahankan KEDUA origins 5173 dan 5174, jangan ganti FRONTEND_URL member sembarangan (email/Google redirect member masih bergantung padanya). Cookie API dibagi browser localhost: putuskan perilaku sesi member/admin dulu.
- Login member dummy buibu@gmail.com / buibu123 BUKAN credential admin yang sudah disepakati.
- Scaffold sudah lolos typecheck/lint/format:check/build pakai Node22; browser startup + fallback404 dan kembali ke root dicek 1360px. Ini bukan bukti admin design/auth/API berfungsi. MSW/CSRF runtime admin belum dites karena belum ada integrasi.
- Setiap selesai bagian: npm run typecheck && npm run lint && npm run format:check && npm run build. Jika ubah API, vendor/bin/pest && vendor/bin/pint --test (PHP8.4). Browser test terhadap API sungguhan di1360px termasuk loading/error/401/403. Update TASKS hanya yang acceptance lulus; laporkan batas verifikasi.
```
