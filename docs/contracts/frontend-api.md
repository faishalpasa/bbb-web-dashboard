# Frontend API contract v1

Status: **dummy-data draft**. Contract ini menjadi boundary antara web app (repo `bbb-web-app`) dan Laravel API (repo `bbb-api`). Kedua repo menyimpan salinan yang sama; ubah keduanya bersamaan. Nama field dan perilaku yang tertulis di sini berasal dari keputusan produk yang sudah dikonfirmasi; nilai enum yang belum final dikirim sebagai pasangan `value` dan label Indonesia agar frontend tidak menebak aturan bisnis.

## Transport

- Web app adalah SPA statis; seluruh data berasal dari API lewat HTTP. Tidak ada props dari server.
- Base URL API adalah `VITE_API_BASE_URL` (lokal: `http://localhost:8000/api`, production: `https://api.<domain>/api`).
- Healthcheck: `GET /` dan `GET /api/health` (tanpa autentikasi) membalas `{ "data": { "status": "ok", ... } }`.
- Autentikasi memakai Laravel Sanctum SPA (cookie). Sebelum request mutasi (`POST/PUT/PATCH/DELETE`), frontend memanggil `GET {VITE_API_ORIGIN}/sanctum/csrf-cookie`, lalu mengirim header `X-XSRF-TOKEN` dari cookie `XSRF-TOKEN` dengan `withCredentials`. Respons `419` berarti cookie CSRF kedaluwarsa; frontend mengambil cookie baru dan mengulang sekali.
- Web app dan API harus satu domain induk (lokal: `localhost:5173` dan `localhost:8000`). API mengizinkan origin web app lewat CORS dengan credentials.
- Respons sukses JSON memakai envelope `{ "data": ... }`.
- Error validasi memakai status `422` dengan `{ "message", "errors": { "field": ["..."] } }`. Penolakan bisnis (kuota penuh, sudah terdaftar) memakai `422` dengan `message` Indonesia. Data tidak ada: `404 { "message": "Data tidak ditemukan." }`. Link satu kali pakai (verifikasi email dan atur ulang password) yang tidak bisa dipakai dibalas `422 { "message", "code" }` dengan `code` salah satu dari `token_expired`, `token_used`, atau `token_invalid`, sehingga frontend memilih halaman error tanpa mencocokkan teks pesan. Belum masuk: `401`.
- Semua identifier domain dikirim sebagai string dan semua datetime sebagai ISO 8601 UTC.
- Axios services dan mock MSW memakai type yang sama dari `src/types/<domain>.d.ts`. Service mengembalikan `{ data, status: true }` dan melempar `{ data, status: false }` saat gagal.

## Auth/session

Login membuat sesi cookie. Setelah autentikasi berhasil, frontend berpindah halaman dengan router client-side. `GET /api/auth/session` membalas `401` bila belum masuk.

| Method | URL | Result |
| --- | --- | --- |
| `POST` | `/api/login` | `LoginInput` -> `AuthSession` |
| `GET` | `/api/auth/session` | `AuthSession` |
| `POST` | `/api/register` | `RegisterInput` (`email`, `password`) -> `RegisterResult` (`email`, `resendAvailableAt`) |
| `POST` | `/api/register/resend-verification` | `ResendVerificationInput` (`email`) -> `ResendVerificationResult` (`resendAvailableAt`) |

| `POST` | `/api/register/verify` | `{ token }` -> `OnboardingProfileData` |
| `GET` | `/api/onboarding/profile` | `OnboardingProfileData` |
| `POST` | `/api/onboarding/profile` | `MemberProfileInput` -> `MemberProfile` |

Link di email membuka `/onboarding/profile?token=...`. Saat halaman terbuka dan ada `token`, frontend memanggil `POST /api/register/verify`; server memverifikasi email, membuat sesi, lalu membalas data form. Token bersifat acak, disimpan sebagai hash, berlaku terbatas, dan sekali pakai. Frontend langsung menghapus `token` dari URL setelah dibaca. Tanpa `token`, halaman memakai `GET /api/onboarding/profile` dengan sesi yang sudah ada. Token tidak valid, kedaluwarsa, atau sudah dipakai dibalas `422` dengan pesan Indonesia. Setelah `POST /api/onboarding/profile` berhasil (membuat member dan nomor `BFF-xxxxx`), frontend pindah ke `/onboarding/success`. Mock: token `expired` dan `used` menghasilkan error; token lain dianggap valid.

Pendaftaran email membuat akun yang belum terverifikasi dan mengirim link verifikasi. Server menentukan `resendAvailableAt` (mock: 45 detik); UI hanya menampilkan hitung mundurnya. Email yang sudah terdaftar dibalas `422` pada field `email`, password kurang dari 8 karakter dibalas `422` pada field `password`.

`POST /api/auth/logout` mengakhiri sesi dan membalas `204` tanpa body.

`GET /api/auth/session` membalas salah satu dari: member lengkap (`member.status` `active`), akun migrasi (`member.status` `migrated` dan `requiresProfileCompletion: true`), pendaftar yang belum mengisi data diri (`member: null` dan `requiresProfileCompletion: true`), member terbatas (`exit_requested` atau `unsubscribed`), atau `401` bila belum masuk. Web app memakai respons ini untuk guard rute: tanpa sesi ke `/login`; `member: null` ke `/onboarding/profile`; akun migrasi ke `/onboarding/complete-profile`; member terbatas ke `/status`; selain itu area member terbuka. Layar masuk dan daftar mengarahkan orang yang sudah masuk ke tujuan yang sama. Respons `401` pada endpoint `/api/member/*` saat web app terbuka berarti sesi habis, dan web app kembali ke `/login`.

`AuthSession` memuat user, ringkasan member bila ada, serta flag `requiresProfileCompletion` untuk akun migrasi.

## Daftar dan masuk dengan Google

Alur Google adalah redirect halaman penuh lewat API, bukan XHR. Rute-nya ada di grup web API (bukan `/api`) karena callback datang dari Google tanpa Origin/Referer web app dan harus memakai cookie sesi.

| Method | URL | Keterangan |
| --- | --- | --- |
| `GET` | `{VITE_API_ORIGIN}/auth/google/redirect?intent=register\|login` | Menyimpan `intent` di sesi lalu mengarahkan ke Google (fase dummy: langsung ke callback). |
| `GET` | `{VITE_API_ORIGIN}/auth/google/callback` | Menukar kode Google, membuat sesi, lalu mengarahkan ke web app. |

Tujuan setelah callback: `intent=register` ke `/onboarding/profile` (nama dan email dari Google, email sudah terverifikasi; halaman memakai `GET /api/onboarding/profile`), `intent=login` ke `/home`. Bila Google dibatalkan, email Google belum terverifikasi, atau terjadi kegagalan, API mengarahkan kembali ke `/register` atau `/login` (sesuai `intent`) dengan `?error=<code>`: `google_cancelled`, `google_email_unverified`, atau `google_failed`. Frontend memetakan code ke pesan Indonesia dan tidak pernah menampilkan teks dari URL.

Dummy: `?dummyError=cancelled|unverified|failed` pada `/auth/google/redirect` mensimulasikan kegagalan. Mode mock MSW tidak mencakup alur ini (butuh API sungguhan).

## Lupa dan atur ulang password

| Method | URL | Payload/result |
| --- | --- | --- |
| `POST` | `/api/password/forgot` | `{ email }` -> `{ resendAvailableAt }` |
| `POST` | `/api/password/verify-token` | `{ token }` -> `{ email, requiresProfileCompletion }` |
| `POST` | `/api/password/reset` | `{ token, password }` -> `AuthSession` |

`forgot` selalu sukses dengan respons yang sama untuk email terdaftar maupun tidak (tidak membocorkan email); kirim ulang memakai endpoint yang sama dan UI menampilkan hitung mundur dari `resendAvailableAt`. Link di email membuka `/reset-password?token=...`; halaman memanggil `verify-token`, lalu menghapus `token` dari URL dan menyimpannya hanya di memori. `reset` mengganti password dan membuat sesi (Ibu langsung masuk). Bila `requiresProfileCompletion` bernilai `true` (akun migrasi), frontend lanjut ke `/onboarding/complete-profile`, selain itu ke beranda. Token tidak valid, kedaluwarsa, atau sudah dipakai dibalas `422` dengan pesan Indonesia; password kurang dari 8 karakter dibalas `422` pada field `password`. Mock/dummy: token `expired` dan `used` menghasilkan error, token `migrated` menandai akun migrasi, token lain dianggap valid.

## Lengkapi data akun migrasi

| Method | URL | Payload/result |
| --- | --- | --- |
| `GET` | `/api/onboarding/migrated-profile` | `MigratedProfileData` |
| `POST` | `/api/onboarding/migrated-profile` | `MemberProfileInput` -> `MemberProfile` |

`MigratedProfileData` memuat `memberNumber` (nomor lama yang tetap), `isEmailVerified`, `draft` (data yang sudah diketahui; field yang masih kosong bernilai `null` atau string kosong), `hasAcceptedConsent`, pilihan preferensi, dan versi persetujuan/peraturan. Server yang menentukan isian apa yang perlu dilengkapi: frontend hanya menampilkan tahun lahir bila `draft.birthYear` bernilai `null` dan hanya menampilkan persetujuan bila `hasAcceptedConsent` bernilai `false`. Validasi sama dengan `POST /api/onboarding/profile`.

## Beranda member

| Method | URL | Payload/result |
| --- | --- | --- |
| `GET` | `/api/member/home` | `MemberHome` |
| `POST` | `/api/member/whatsapp-joined` | -> `{ joinedAt }` |

`MemberHome` memuat `memberNumber`, `name`, `status`, `joinedAt` untuk kartu anggota; `whatsappCard` (`isVisible` dari pengaturan aplikasi dan status gabung, `groupUrl` bernilai `null` sampai tautan grup diset); serta `upcomingEvents` (maksimal 6 `EventSummary` terdekat). Tombol gabung membuka `groupUrl` di tab baru lalu memanggil `whatsapp-joined`; bila `groupUrl` `null`, tombol nonaktif. Menutup kartu hanya disimpan di localStorage (`bbb-bff-whatsapp-card-dismissed`). Label format kegiatan dikirim apa adanya ("Offline" atau "Online").

## Profil member

| Method | URL | Payload/result |
| --- | --- | --- |
| `GET` | `/api/member/profile/data` | `MemberProfileData` |
| `PUT` | `/api/member/profile` | `MemberProfileInput` -> `MemberProfile` |
| `POST` | `/api/member/profile/photo` | multipart `photo` (JPG/PNG persegi, maksimal 5 MB) -> `{ profilePhotoUrl }` |
| `PUT` | `/api/member/password` | `{ currentPassword, password }` -> `{ message }` |
| `GET` | `/api/member/community-rules` | `CommunityRules` |
| `GET` | `/api/regions/provinces` | `RegionOption[]` |
| `GET` | `/api/regions/regencies?provinceCode=...` | `RegionOption[]` |
| `GET` | `/api/regions/districts?regencyCode=...` | `RegionOption[]` |

Field wajib profil: nama, tahun lahir, WhatsApp ternormalisasi `628...`, preferensi partisipasi, provinsi, kabupaten/kota, kecamatan, kode pos, dan versi persetujuan/peraturan. Opsi preferensi berasal dari server; mock tidak menetapkan enum bisnis baru.

`MemberProfileData` juga memuat `statistics: { joinedEvents, attendedEvents }`. Angka dihitung API dari pendaftaran dummy per sesi (status registered/present/absent untuk ikut, present untuk hadir). Nama, nomor anggota, avatar, dan label status di layar profil berasal dari `profile`.

Edit data diri memakai form yang sama dengan onboarding, dengan email read-only. Versi persetujuan/peraturan yang sudah diterima ikut payload; edit tidak meminta persetujuan baru. Profil get tetap statis selama fase dummy: simpan hanya menggemakan isian tervalidasi, dan reload mengembalikan fixture. Foto opsional dipotong persegi dari tengah oleh frontend sebelum dikirim; fase dummy memvalidasi file dan mengembalikan data URL tanpa menyimpan upload. Penyimpanan foto permanen menyusul.

Ubah password: password lama wajib sesuai; password baru minimal 8 karakter dan berbeda dari password lama. Error field memakai `currentPassword` dan `password`. Fase dummy hanya mengonfirmasi hasil, credential login tetap `buibu123`; sesi perangkat lain dan email pemberitahuan belum berubah/dikirim. Endpoint nyata nanti mempertahankan sesi perangkat sekarang dan mengakhiri sesi perangkat lain.

`CommunityRules` berbentuk `{ version, updatedByLabel, sections: [{ title, body }], whatsappGroupUrl }`. Body adalah plain text dengan baris baru (bukan HTML); frontend tidak merender HTML dari server. Isi dummy persis placeholder artboard 6m sampai admin/user memberikan copy final. `whatsappGroupUrl` dari konfigurasi yang sama dengan Beranda; kosong berarti tombol nonaktif. Kontak admin dan URL dokumen eksternal belum ditentukan.


## Permintaan keluar dan status keanggotaan

| Method | URL | Payload/result |
| --- | --- | --- |
| `GET` | `/api/member/exit-request/options` | `{ reasons: SelectOption[] }` |
| `POST` | `/api/member/exit-request` | `{ reason?: string | null, explanation?: string | null }` -> `MembershipStatusData` |
| `DELETE` | `/api/member/exit-request` | -> `MembershipStatusData` |
| `GET` | `/api/member/membership-status` | `MembershipStatusData` |

`MembershipStatusData`: `{ session: AuthSession, exitRequest: { id, reason: SelectOption | null, explanation: string | null, submittedAt } | null, canCancel: boolean, adminWhatsappUrl: string | null }`. Frontend memperbarui app-context dari `session` sebelum navigasi, sehingga guard memakai status terbaru. Halaman `/membership/exit-request` menampilkan form 7b; `/status` memilih 7d atau 7g dari status member yang dikirim API.

Alasan dan cerita tambahan **opsional**, sesuai artboard. Pilihan dari API: `moved` (Pindah domisili), `limited_time` (Kurang waktu), `not_suitable` (Kegiatan kurang sesuai), `other` (Lainnya). Frontend tidak menetapkan pilihan sendiri. Konfirmasi pengajuan memakai dialog bersama sebelum POST.

Pengajuan mengubah status menjadi `exit_requested` dan membatalkan pendaftaran kegiatan mendatang/berlangsung yang masih `registered`, tanpa mengubah riwayat kehadiran. Selama menunggu, endpoint member lain menolak dengan `403 { message, code: "membership_restricted" }`; hanya status dan pembatalan yang tersedia, bersama endpoint session/logout di luar grup member. Frontend mengarahkan respons tersebut ke `/status`. Pembatalan hanya jika `canCancel` dari API bernilai true (status masih `exit_requested`), lalu kembali aktif. Pembatalan permintaan tidak memulihkan pendaftaran kegiatan yang sudah dibatalkan. Status `unsubscribed` tidak bisa dibatalkan dari member.

Endpoint keluar/status memerlukan sesi dummy member lengkap (401 untuk tamu); akun yang masih onboarding tidak boleh mengajukan. Fase dummy memakai file session untuk menyimpan status, alasan, waktu pengajuan, dan pembatalan kegiatan. Tidak ada database, review admin, atau email yang dijalankan. `BBB_ADMIN_WHATSAPP_URL` kosong berarti kontak admin nonaktif. Khusus lokal/testing, `BBB_DUMMY_MEMBER_STATUS=active|exit_requested|unsubscribed` memilih skenario saat login sesi baru; nilai default active. Logout menghapus state dummy sesi. Status yang sudah tersimpan tidak ditimpa saat request/re-login di sesi yang sama.


## Kegiatan

| Method | URL | Payload/result |
| --- | --- | --- |
| `GET` | `/api/member/events?scope=upcoming|registered|history&page=...` | `PaginatedCollection<EventSummary>` |
| `GET` | `/api/member/events/{eventId}` | `EventDetail` |

Tab daftar kegiatan: `upcoming` (kegiatan yang belum selesai), `registered` (kegiatan yang belum selesai dan diikuti member, berstatus `registered` atau `present`), dan `history` (kegiatan yang sudah selesai atau dibatalkan, termasuk status kehadiran member). Daftar dipaginasi 10 per halaman (`meta.lastPage`); web app menampilkan tombol "Muat lebih banyak". Badge status ("Terdaftar", "Hadir", "Kuota penuh") diturunkan dari `registration.status`, `lifecycle`, dan `remainingCapacity`. `EventDetail` memuat `registrationClosesAt`; aturan "ditutup N menit sebelum kegiatan" dihitung dari selisihnya dengan `startsAt`, bukan angka tetap di UI. Setelah mendaftar, membatalkan, atau mengirim kode, web app memuat ulang detail dari server (server yang menentukan `canRegister`, `canCancel`, dan kuota).

Quota bersifat opsional. Saat `capacity` bernilai `null`, UI tidak menampilkan kapasitas atau sisa kursi. Server mengirim `canRegister`, `canCancel`, dan alasan Indonesia sebagai keputusan otoritatif.

## Pendaftaran kegiatan

| Method | URL | Payload/result |
| --- | --- | --- |
| `POST` | `/api/member/events/{eventId}/registrations` | `EventRegistration` |
| `DELETE` | `/api/member/registrations/{registrationId}` | `EventRegistration` |

Frontend tidak menghitung cutoff atau kapasitas sendiri. Mock boleh mensimulasikan hasil, tetapi backend nantinya tetap memvalidasi transaksi.

## Absensi

| Method | URL | Payload/result |
| --- | --- | --- |
| `GET` | `/api/member/events/{eventId}/attendance` | `AttendanceState` |
| `POST` | `/api/member/events/{eventId}/attendance` | `{ code: string }` -> `AttendanceSubmissionResult` |

State memuat waktu buka/tutup, `attendedAt` (waktu kehadiran tercatat, `null` sebelum hadir), jumlah percobaan tersisa, status pendaftaran, dan capability submit. Jendela default adalah 30 menit sebelum kegiatan sampai kegiatan ditutup, dengan maksimal 5 kode salah per 10 menit. Backend tetap menjadi sumber keputusan waktu dan rate limit.

Dummy: status pendaftaran dan absensi disimpan per sesi (cookie), jadi daftar, batal, dan hadir terlihat setelah reload; kode absensi yang benar adalah `BFF-2410` dan jendela waktu absensi diabaikan.

## Fase data dummy

Saat ini API Laravel membalas data dummy tanpa database: isi profil tetap fixture statis, sedangkan daftar kegiatan dibuat oleh Faker dengan seed tetap (paginasi 10 per halaman). Pendaftaran/absensi dan status permintaan keluar disimpan per file session agar transisi dan guard dapat diuji setelah reload; simpan profil, foto, dan password hanya mengembalikan hasil tanpa persistence permanen. Tiga kegiatan skenario tetap: `event-001` (terbuka), `event-002` (sudah terdaftar, kode absensi `BFF-2410`), `event-003` (selesai).

Kredensial login dummy: `buibu@gmail.com` / `buibu123`. Nilai ini hanya fixture development dan bukan credential production.

## Mock MSW (opsional, dev saja)

Dengan `VITE_API_MOCKING_ENABLED=true` pada dev server (`npm run dev`), MSW mencegat request `*/api/*` dan menjawab dari `src/mocks/`. Build production (`npm run build`) selalu mengabaikan flag ini sehingga fixture dan credential mock tidak pernah ikut ter-deploy. Utamakan API lokal yang sebenarnya dan jaga mock tetap selaras dengan contract ini.
