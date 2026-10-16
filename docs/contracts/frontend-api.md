# Frontend API contract v1

Status: **dummy-data draft**. Contract ini menjadi boundary antara web app (repo `bbb-web-app`) dan Laravel API (repo `bbb-api`). Kedua repo menyimpan salinan yang sama; ubah keduanya bersamaan. Nama field dan perilaku yang tertulis di sini berasal dari keputusan produk yang sudah dikonfirmasi; nilai enum yang belum final dikirim sebagai pasangan `value` dan label Indonesia agar frontend tidak menebak aturan bisnis.

## Transport

- Web app adalah SPA statis; seluruh data berasal dari API lewat HTTP. Tidak ada props dari server.
- Base URL API adalah `VITE_API_BASE_URL` (lokal: `http://localhost:8000/api`, production: `https://api.<domain>/api`).
- Healthcheck: `GET /` dan `GET /api/health` (tanpa autentikasi) membalas `{ "data": { "status": "ok", ... } }`.
- Autentikasi memakai JWT. Endpoint yang membuat sesi (login member/admin, `register/verify`, penerimaan undangan admin, Google exchange, refresh) menambahkan `token: { accessToken, tokenType: "Bearer", expiresAt }` ke data yang sudah dibalas (`AuthSession`, data form onboarding, atau sesi admin); frontend menyimpannya dan mengirim `Authorization: Bearer {accessToken}` di setiap request. Tidak ada cookie auth, handshake CSRF, atau `/sanctum/csrf-cookie` (`docs/plans/bearer-auth.md`): API tidak membaca atau mengeset cookie untuk `/api/*`. Access token member berlaku 60 menit, admin 30 menit. `401` pada request yang membawa token berarti token kedaluwarsa atau dicabut: frontend memanggil `POST /api/auth/refresh` sekali, lalu mengulang request; bila refresh gagal, token dihapus dan frontend kembali ke layar masuk. Token tidak boleh muncul di URL atau log.
- Web app dan API tidak perlu satu domain induk. API hanya mengizinkan origin web app dan dashboard lewat CORS (`CORS_ALLOWED_ORIGINS`), tanpa credentials. Satu-satunya cookie ada di redirect Google (grup web API, di host API) dan tidak pernah dibaca `/api/*`.
- Respons sukses JSON memakai envelope `{ "data": ... }`.
- Error validasi memakai status `422` dengan `{ "message", "errors": { "field": ["..."] } }`. Penolakan bisnis (kuota penuh, sudah terdaftar) memakai `422` dengan `message` Indonesia. Data tidak ada: `404 { "message": "Data tidak ditemukan." }`. Link satu kali pakai (verifikasi email dan atur ulang password) yang tidak bisa dipakai dibalas `422 { "message", "code" }` dengan `code` salah satu dari `token_expired`, `token_used`, atau `token_invalid`, sehingga frontend memilih halaman error tanpa mencocokkan teks pesan. Belum masuk: `401`.
- Semua identifier domain dikirim sebagai string dan semua datetime sebagai ISO 8601 UTC.
- Axios services dan mock MSW memakai type yang sama dari `src/types/<domain>.d.ts`. Service mengembalikan `{ data, status: true }` dan melempar `{ data, status: false }` saat gagal.

## Auth/session

Login membuat sesi dan mengembalikan token (lihat Token Bearer di bawah). Setelah autentikasi berhasil, frontend menyimpan token dan berpindah halaman dengan router client-side. `GET /api/auth/session` membalas `401` bila belum masuk.

| Method | URL | Result |
| --- | --- | --- |
| `POST` | `/api/login` | `LoginInput` -> `AuthSession` |
| `GET` | `/api/auth/session` | `AuthSession` |
| `POST` | `/api/register` | `RegisterInput` (`email`, `password`) -> `RegisterResult` (`email`, `resendAvailableAt`) |
| `POST` | `/api/register/resend-verification` | `ResendVerificationInput` (`email`) -> `ResendVerificationResult` (`resendAvailableAt`) |

| `POST` | `/api/register/verify` | `{ token }` -> `OnboardingProfileData` |
| `GET` | `/api/onboarding/profile` | `OnboardingProfileData` |
| `POST` | `/api/onboarding/profile` | `MemberProfileInput` -> `MemberProfile` |

Link di email membuka `/onboarding/profile?token=...`. Saat halaman terbuka dan ada `token`, frontend memanggil `POST /api/register/verify`; server memverifikasi email, membuat sesi, lalu membalas data form + JWT sub UUID user. Token acak disimpan sebagai hash SHA-256 di `user_tokens`, berlaku **24 jam**, dan sekali pakai secara transaksional. Frontend langsung menghapus `token` dari URL setelah dibaca. Tanpa `token`, halaman memakai `GET /api/onboarding/profile` dengan sesi yang sudah ada. Token salah, tepat/sesudah batas kedaluwarsa, atau sudah dipakai dibalas `422` dengan code token_invalid/token_expired/token_used. Tidak ada token ajaib yang diterima. Persistensi profil/nomor member adalah langkah 6, bukan bagian verifikasi langkah 5.

Pendaftaran email membuat user belum terverifikasi, password hash, dan queued email setelah transaksi commit. Jeda kirim ulang **60 detik** (keputusan pemilik 16 Oktober 2026), ditegakkan server berdasarkan token terakhir per user/jenis; percobaan terlalu cepat tidak menggeser waktu kirim sebenarnya. `resendAvailableAt` selalu 60 detik sejak request untuk bentuk respons yang sama pada email dikenal/tidak dikenal/terverifikasi/ter-throttle; request terlalu cepat tetap 200 tanpa mengirim email baru. Kirim ulang yang benar-benar diterbitkan membatalkan link sebelumnya yang sejenis (token_used), bukan token jenis lain. Email existing pada register dibalas `422 errors.email`, password kurang dari 8 karakter `422 errors.password`. Resend tidak membuat user baru dan tidak mengirim ke alamat terverifikasi/tidak dikenal. Identitas email dinormalisasi lowercase.

`POST /api/auth/logout` mengakhiri sesi dan membalas `204` tanpa body.

### Token Bearer

| Method | URL | Payload/result |
| --- | --- | --- |
| `POST` | `/api/auth/refresh` | Header `Authorization: Bearer` (boleh sudah kedaluwarsa, sampai 14 hari sejak diterbitkan) -> sesi yang sama dengan `GET /api/auth/session` (member atau admin sesuai token) + `token` baru; token lama dicabut |
| `POST` | `/api/auth/google/exchange` | `{ code }` -> `AuthSession` + `token`; code sekali pakai dan berlaku 60 detik, salah dibalas `422 { code: "token_invalid" }` |

`AuthToken`: `{ accessToken: string, tokenType: "Bearer", expiresAt: string }` (ISO 8601 UTC). Isi JWT: `sub`, `typ` (`member` atau `admin`), `sid` (tetap sepanjang refresh), `jti` (unik per token), `oiat` (waktu token pertama sesi diterbitkan; refresh boleh sampai 14 hari sesudahnya), `iat`, `nbf`, `exp`. Rute admin menolak token `member` dan sebaliknya. `POST /api/auth/logout` dan `POST /api/admin/logout` dengan token mencabut `jti` dan membalas `204`; token yang sudah dicabut dijawab `401`. Request tanpa token ke rute publik (event publik, wilayah) tidak pernah dijawab `401`, bahkan bila header berisi token basi: token yang tidak valid diperlakukan sebagai anonim.

Fase dummy: state per sesi (pendaftaran, status keluar, event admin) dikunci oleh klaim `sid` (session store server, tanpa cookie), sehingga reload dan refresh token tetap melihat state yang sama sampai sesi dummy dibersihkan (120 menit tanpa aktivitas). Undangan admin dummy hanya bisa diterima dari sesi yang mengundang (akunnya ada di state sesi itu), sama seperti jalur cookie.


`GET /api/auth/session` membalas salah satu dari: member lengkap (`member.status` `active`), akun migrasi (`member.status` `migrated` dan `requiresProfileCompletion: true`), pendaftar yang belum mengisi data diri (`member: null` dan `requiresProfileCompletion: true`), member terbatas (`exit_requested` atau `unsubscribed`), atau `401` bila belum masuk. Web app memakai respons ini untuk guard rute: tanpa sesi ke `/login`; `member: null` ke `/onboarding/profile`; akun migrasi ke `/onboarding/complete-profile`; member terbatas ke `/status`; selain itu area member terbuka. Layar masuk dan daftar mengarahkan orang yang sudah masuk ke tujuan yang sama. Respons `401` pada endpoint `/api/member/*` saat web app terbuka berarti sesi habis, dan web app kembali ke `/login`.

`AuthSession` memuat user, ringkasan member bila ada, serta flag `requiresProfileCompletion` untuk akun migrasi.

## Daftar dan masuk dengan Google

Alur Google adalah redirect halaman penuh lewat API, bukan XHR. Rute-nya ada di grup web API (bukan `/api`) karena callback datang dari Google tanpa Origin/Referer web app. Setelah callback, API mengarahkan ke `/auth/google/callback?code=` di web app (code sekali pakai, berlaku 60 detik); web app membacanya sekali, langsung menghapusnya dari URL, lalu menukarnya lewat `POST /api/auth/google/exchange` dan berpindah sesuai sesi (`/home`, `/onboarding/profile`, atau `/status`).

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

`forgot` selalu 200 dengan respons yang sama untuk email terdaftar maupun tidak; kirim ulang memakai endpoint yang sama, cooldown **60 detik** dan resendAvailableAt mengikuti aturan di atas. Email hanya diantrekan untuk user yang ada, termasuk akun migrated tanpa password. Link `/reset-password?token=...` memakai token hash persisten yang berlaku **60 menit** dan hanya untuk reset_password. `verify-token` membaca tanpa mengonsumsi; halaman menghapus token dari URL dan menyimpannya hanya di memori. `reset` mengganti password hash dan menandai used_at secara atomik, lalu menerbitkan AuthSession + JWT sub UUID (Ibu langsung masuk). Member migrated tetap migrated, nomor tetap, requiresProfileCompletion true; user tanpa profil juga true dan guard FE memilih onboarding yang sesuai. Tidak ada token ajaib. Salah/expired (termasuk tepat batas)/used memakai 422 + code; password pendek tetap 422 errors.password tanpa mengonsumsi token. Langkah ini tidak mengubah kebijakan pencabutan JWT perangkat lain atau menandai email belum verifikasi menjadi terverifikasi.

Email langkah 5 berupa queued transactional mail; link hanya di email/antrean, tidak dikembalikan dalam JSON. Provider/deliverability nyata menunggu konfigurasi Resend; Mail::fake/array dan antrean lokal bukan bukti email diterima. Hindari mailer log saat menguji link nyata karena body email memuat token rahasia.

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

Dummy: status pendaftaran dan absensi disimpan per sesi token (klaim `sid`), jadi daftar, batal, dan hadir terlihat setelah reload; kode absensi yang benar adalah `BFF-2410` dan jendela waktu absensi diabaikan.

## Fase data dummy

Migrasi database berjalan satu flow per langkah. Login/session/logout/refresh dan registrasi email/verifikasi/lupa-reset password kini memakai users/members/user_tokens MySQL (langkah 4–5). Profil, kegiatan, pendaftaran/absensi dan exit request masih dummy/sid sampai langkahnya diganti; PUT member/password masih dummy, berbeda dari password/reset yang sudah persisten. Pengisian profil belum membuat member DB sampai langkah 6. Token sid tetap untuk bridge sementara, bukan sumber identitas login UUID. Tiga kegiatan skenario tetap: event-001 (terbuka), event-002 (terdaftar, kode BFF-2410), event-003 (selesai).

Kredensial login dummy: `buibu@gmail.com` / `buibu123`. Nilai ini hanya fixture development dan bukan credential production.

## Halaman publik kegiatan (usulan, belum diimplementasi API)

Status: **disepakati**; API dummy sudah menjawab endpoint ini (`PublicEventController`), persistensi sungguhan menyusul. Halaman `/e/{slug}` terbuka tanpa login dan tidak pernah mengarah ke `/login`.

| Method | URL | Payload/result |
| --- | --- | --- |
| `GET` | `/api/public/events/{slug}` | `PublicEventDetail` |
| `POST` | `/api/public/events/{slug}/registrations` | `PublicRegistrationInput` -> `PublicRegistrationResult` (`201`) |

Keduanya tanpa autentikasi dan tanpa token. Wilayah memakai endpoint terbuka `GET /api/regions/provinces` dan `GET /api/regions/regencies?provinceCode=`.

`PublicEventDetail`:

```ts
{
    slug: string;
    title: string;
    description: string;            // teks biasa, baris baru ditampilkan apa adanya
    bannerUrl: string | null;
    startsAt: string;               // ISO 8601 UTC
    endsAt: string;
    timezone: string;               // zona waktu acara (Asia/Jakarta, Asia/Makassar, Asia/Jayapura)
    lifecycle: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
    format: { value: 'online' | 'offline'; label: string };
    venueName: string | null;
    address: string | null;
    mapUrl: string | null;          // hanya link Maps untuk offline; null untuk online
    usesQuota: boolean;
    capacity: number | null;        // null bila usesQuota false
    registeredCount: number | null; // null bila usesQuota false; UI tidak menampilkan info kuota
    registrationStatus: 'open' | 'full' | 'closed';
    registrationClosesAt: string;   // startsAt dikurangi registrationCloseMinutes
    registrationCloseMinutes: number; // dari Pengaturan (registrationCloseMinutes), bukan angka tetap di UI
    consentVersion: string;         // versi Kebijakan Data Pribadi yang dikirim kembali saat mendaftar
    adminWhatsappUrl: string | null; // kontak admin untuk keadaan kuota penuh/ditutup; null = tombol nonaktif
}
```

- `404 { message }` untuk slug yang tidak ada, kegiatan `draft`, dan kegiatan internal (`allowsNonMember: false`). API tidak membedakan ketiganya. Kegiatan `completed` atau `cancelled` dibalas `200` dengan `lifecycle` yang sesuai agar web app menampilkan layar khusus.
- Respons tidak memuat data admin (kode kehadiran, daftar peserta, id internal). **Link meeting kegiatan online tidak pernah dikirim ke endpoint ini**; peserta hanya menerimanya lewat email konfirmasi.
- `registrationStatus`: `full` bila `usesQuota` dan kuota terisi, `closed` bila sudah melewati `registrationClosesAt` atau `lifecycle` bukan `upcoming`. Server yang memutuskan; web app tidak menghitung kuota atau cutoff sendiri.

`PublicRegistrationInput` (semua wajib, nama field camelCase):

```ts
{
    name: string;
    email: string;
    whatsapp: string;       // dinormalisasi 628... oleh web app, divalidasi ulang server
    provinceCode: string;
    regencyCode: string;
    birthYear: number;      // usia minimal 17 tahun
    consentVersion: string; // nilai dari PublicEventDetail.consentVersion
}
```

`PublicRegistrationResult`: `{ email: string }`. Server membuat pendaftaran non-member dan mengirim email konfirmasi (di fase dummy tidak terkirim). Web app menampilkan `email` tebal di layar berhasil.

Penolakan bisnis memakai `422 { message, code, errors? }` dengan `code` yang bisa dibedakan: `event_full` (kuota penuh), `registration_closed` (pendaftaran ditutup), dan `email_already_registered` (dengan `errors.email` berisi "Email ini sudah dipakai mendaftar kegiatan ini."). Setelah `event_full` atau `registration_closed`, web app memuat ulang detail kegiatan dan menampilkan keadaan yang sesuai. Validasi field memakai `422 { errors }` biasa. Endpoint di-throttle per IP dan per email; kelebihan dibalas `429`.

Admin dialog "Tambah peserta" hanya mengumpulkan nama, email, dan WhatsApp; provinsi, kabupaten/kota, dan tahun lahir wajib hanya untuk pendaftaran lewat halaman publik, sehingga peserta yang ditambah admin boleh tidak memilikinya (nullable di sisi API).

Fase dummy: kegiatan diambil dari daftar kegiatan admin (slug mis. `diskusi-buku-bulanan` terbuka, `kopdar-bbb-bff` kuota penuh, `diskusi-buku-september` selesai, `webinar-parenting` dibatalkan, `kelas-menulis-online` online, `webinar-literasi-digital` tanpa kuota). Pendaftaran tamu disimpan di cache per kegiatan (tamu tidak punya token), ikut terhitung di kuota, dan tampil di daftar peserta admin; email konfirmasi tidak terkirim. `adminWhatsappUrl` dari Pengaturan (`adminWhatsapp`), lalu `BBB_ADMIN_WHATSAPP_URL`.

Open Graph per slug (judul dan banner) tidak bisa disajikan SPA statis. Keputusan: fungsi edge/serverless di host menjawab request crawler ke `/e/{slug}` dengan HTML berisi meta OG dari `GET /api/public/events/{slug}`, sedangkan browser biasa tetap menerima SPA. Host belum dipilih; pekerjaan ini dicatat di `TASKS.md`.

## Mock MSW (opsional, dev saja)

Dengan `VITE_API_MOCKING_ENABLED=true` pada dev server (`npm run dev`), MSW mencegat request `*/api/*` dan menjawab dari `src/mocks/`. Build production (`npm run build`) selalu mengabaikan flag ini sehingga fixture dan credential mock tidak pernah ikut ter-deploy. Utamakan API lokal yang sebenarnya dan jaga mock tetap selaras dengan contract ini.
