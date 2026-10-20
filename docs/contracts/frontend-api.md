# Frontend API contract v1

Perubahan kegiatan (19 Oktober 2026): [Registration Form](event-registration-form.md). Backend konfigurasi admin tahap 2 tersedia lokal (belum deploy); form member/publik, custom answers dan detail jawaban masih target tahap 4/5. Bagian pendaftaran existing di bawah tetap berlaku untuk event tanpa custom field; writer lama menolak event dengan custom field melalui pengaman 422 registration_form_required sampai flow submit baru siap.

Status: **di MySQL (langkah 21)**. Contract ini menjadi boundary antara web app (repo `bbb-web-app`) dan Laravel API (repo `bbb-api`). Kedua repo menyimpan salinan yang sama; ubah keduanya bersamaan. Nama field dan perilaku yang tertulis di sini berasal dari keputusan produk yang sudah dikonfirmasi; nilai enum yang belum final dikirim sebagai pasangan `value` dan label Indonesia agar frontend tidak menebak aturan bisnis.

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

Link di email membuka `/onboarding/profile?token=...`. Saat halaman terbuka dan ada `token`, frontend memanggil `POST /api/register/verify`; server memverifikasi email, membuat sesi, lalu membalas data form + JWT sub UUID user. Token acak disimpan sebagai hash SHA-256 di `user_tokens`, berlaku **24 jam**, dan sekali pakai secara transaksional. Frontend langsung menghapus `token` dari URL setelah dibaca. Tanpa `token`, halaman memakai `GET /api/onboarding/profile` dengan sesi yang sudah ada. Token salah, tepat/sesudah batas kedaluwarsa, atau sudah dipakai dibalas `422` dengan code token_invalid/token_expired/token_used. Tidak ada token ajaib yang diterima. Profil/nomor member kini persisten (langkah 6); verifikasi sendiri belum membuat member.

Pendaftaran email membuat user belum terverifikasi, password hash, dan queued email setelah transaksi commit. Jeda kirim ulang **60 detik** (keputusan pemilik 16 Oktober 2026), ditegakkan server berdasarkan token terakhir per user/jenis; percobaan terlalu cepat tidak menggeser waktu kirim sebenarnya. `resendAvailableAt` selalu 60 detik sejak request untuk bentuk respons yang sama pada email dikenal/tidak dikenal/terverifikasi/ter-throttle; request terlalu cepat tetap 200 tanpa mengirim email baru. Kirim ulang yang benar-benar diterbitkan membatalkan link sebelumnya yang sejenis (token_used), bukan token jenis lain. Email existing pada register dibalas `422 errors.email`, password kurang dari 8 karakter `422 errors.password`. Resend tidak membuat user baru dan tidak mengirim ke alamat terverifikasi/tidak dikenal. Identitas email dinormalisasi lowercase.

`POST /api/auth/logout` mengakhiri sesi dan membalas `204` tanpa body.

### Token Bearer

| Method | URL | Payload/result |
| --- | --- | --- |
| `POST` | `/api/auth/refresh` | Header `Authorization: Bearer` (boleh sudah kedaluwarsa, sampai 14 hari sejak diterbitkan) -> sesi yang sama dengan `GET /api/auth/session` (member atau admin sesuai token) + `token` baru; token lama dicabut |
| `POST` | `/api/auth/google/exchange` | `{ code }` -> `AuthSession` + `token`; code sekali pakai dan berlaku 60 detik, salah dibalas `422 { code: "token_invalid" }` |

`AuthToken`: `{ accessToken: string, tokenType: "Bearer", expiresAt: string }` (ISO 8601 UTC). Isi JWT: `sub`, `typ` (`member` atau `admin`), `sid` (tetap sepanjang refresh), `jti` (unik per token), `ver` (epoch sesi user saat token diterbitkan; ganti atau reset password menaikkan epoch sehingga token member yang lebih lama dijawab `401`, kecuali sesi yang mengganti password; refresh dari token yang sudah tidak berlaku juga `401`), `oiat` (waktu token pertama sesi diterbitkan; refresh boleh sampai 14 hari sesudahnya), `iat`, `nbf`, `exp`. Rute admin menolak token `member` dan sebaliknya. `POST /api/auth/logout` dan `POST /api/admin/logout` dengan token mencabut `jti` dan membalas `204`; token yang sudah dicabut dijawab `401`. Request tanpa token ke rute publik (event publik, wilayah) tidak pernah dijawab `401`, bahkan bila header berisi token basi: token yang tidak valid diperlakukan sebagai anonim.

Semua state (pendaftaran, status keluar, kegiatan admin, peserta) ada di MySQL. Token membawa `sid` hanya sebagai penanda sesi perangkat (denylist, epoch password); tidak ada state bisnis di sesi server. Undangan admin diterima lewat tautan sekali pakai dari tabel `admin_invitations`.


`GET /api/auth/session` membalas salah satu dari: member lengkap (`member.status` `active`), akun migrasi (`member.status` `migrated` dan `requiresProfileCompletion: true`), pendaftar yang belum mengisi data diri (`member: null` dan `requiresProfileCompletion: true`), member terbatas (`exit_requested` atau `unsubscribed`), atau `401` bila belum masuk. Web app memakai respons ini untuk guard rute: tanpa sesi ke `/login`; `member: null` ke `/onboarding/profile`; akun migrasi ke `/onboarding/complete-profile`; member terbatas ke `/status`; selain itu area member terbuka. Layar masuk dan daftar mengarahkan orang yang sudah masuk ke tujuan yang sama. Respons `401` pada endpoint `/api/member/*` saat web app terbuka berarti sesi habis, dan web app kembali ke `/login`.

`AuthSession` memuat user, ringkasan member bila ada, serta flag `requiresProfileCompletion` untuk akun migrasi.

## Daftar dan masuk dengan Google

Alur Google adalah redirect halaman penuh lewat API, bukan XHR. Rute-nya ada di grup web API (bukan `/api`) karena callback datang dari Google tanpa Origin/Referer web app. Setelah callback, API mengarahkan ke `/auth/google/callback?code=` di web app (code sekali pakai, berlaku 60 detik); web app membacanya sekali, langsung menghapusnya dari URL, lalu menukarnya lewat `POST /api/auth/google/exchange` dan berpindah sesuai sesi (`/home`, `/onboarding/profile`, atau `/status`).

| Method | URL | Keterangan |
| --- | --- | --- |
| `GET` | `{VITE_API_ORIGIN}/auth/google/redirect?intent=register\|login` | Menyimpan `intent` di sesi lalu mengarahkan ke Google (tanpa `GOOGLE_CLIENT_ID`, hanya di local/testing: Google palsu yang langsung ke callback). |
| `GET` | `{VITE_API_ORIGIN}/auth/google/callback` | Menukar kode Google, membuat sesi, lalu mengarahkan ke web app. |

Tujuan setelah callback: `intent=register` ke `/onboarding/profile` (nama dan email dari Google, email sudah terverifikasi; halaman memakai `GET /api/onboarding/profile`), `intent=login` ke `/home`. Bila Google dibatalkan, email Google belum terverifikasi, atau terjadi kegagalan, API mengarahkan kembali ke `/register` atau `/login` (sesuai `intent`) dengan `?error=<code>`: `google_cancelled`, `google_email_unverified`, atau `google_failed`. Frontend memetakan code ke pesan Indonesia dan tidak pernah menampilkan teks dari URL.

Google palsu (hanya local/testing, saat `GOOGLE_CLIENT_ID` kosong): `?dummyError=cancelled|unverified|failed` pada `/auth/google/redirect` mensimulasikan kegagalan dan `?dummyEmail=` masuk sebagai akun Google lain (bawaan `google.dev@bbb.test`). Di production tanpa kredensial Google, redirect dan callback selalu kembali ke `/login` atau `/register` dengan `?error=google_failed`. Mode mock MSW tidak mencakup alur ini (butuh API sungguhan).

Akun: callback mencari `social_accounts` (provider `google`, id Google); bila belum ada, mencari `users.email` (huruf kecil) dan menautkan akun Google ke user itu (email dianggap terverifikasi karena Google sudah memverifikasinya; password tetap berfungsi); bila tidak ada, membuat user baru tanpa password dan tanpa baris member (lanjut ke `/onboarding/profile`; `signup_method` member nanti `google`). Member `migrated` yang masuk lewat Google mengisi `first_login_at` seperti login password. Email Google yang belum terverifikasi ditolak (`google_email_unverified`); akun Google lain yang memakai email yang sudah tertaut ke Google berbeda ditolak (`google_failed`). `intent=login` untuk email yang belum dikenal diperlakukan seperti `register` (membuat user dan lanjut ke onboarding). Code satu kali di cache (`jwt.google_code_seconds`, 60 detik) berisi id user; `POST /api/auth/google/exchange` menukarnya menjadi `AuthSession` + `token`, sama seperti login password.

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

`MigratedProfileData` memuat `memberNumber` (nomor lama yang tetap, atau `null` bila belum ada), `isEmailVerified`, `draft` (data yang sudah diketahui; field yang masih kosong bernilai `null` atau string kosong), `hasAcceptedConsent`, pilihan preferensi, dan versi persetujuan/peraturan. Server yang menentukan isian apa yang perlu dilengkapi: frontend hanya menampilkan tahun lahir bila `draft.birthYear` bernilai `null` dan hanya menampilkan persetujuan bila `hasAcceptedConsent` bernilai `false`. Validasi sama dengan `POST /api/onboarding/profile`. Tahun lahir yang sudah diketahui dipertahankan server (field tersembunyi bukan kesempatan menggantinya). Nomor lama, joinedAt, signupMethod, dan histori consent lengkap dipertahankan. Nomor yang belum ada baru dialokasikan saat completion berhasil. Bila bukti consent belum lengkap, kedua versi wajib sama dengan versi admin saat submit; bila sudah lengkap, versi/tanggal historis tidak ditimpa walaupun form mengirim versi terbaru.

## Beranda member

| Method | URL | Payload/result |
| --- | --- | --- |
| `GET` | `/api/member/home` | `MemberHome` |
| `POST` | `/api/member/whatsapp-joined` | -> `{ joinedAt }` |

`MemberHome` memuat `memberNumber`, `name`, `status`, `joinedAt` untuk kartu anggota (dari data member yang masuk); `whatsappCard` (`isVisible` bernilai true bila kartu WhatsApp diaktifkan di pengaturan aplikasi **dan** Ibu belum pernah membuka tautan grup; `groupUrl` dari pengaturan `whatsapp_group_url`, `null` sampai tautan grup diset); serta `upcomingEvents` (maksimal 6 `EventSummary` terdekat). Tombol gabung membuka `groupUrl` di tab baru lalu memanggil `whatsapp-joined`; bila `groupUrl` `null`, tombol nonaktif. `POST /api/member/whatsapp-joined` menyimpan waktu pertama Ibu membuka tautan (`wa_joined_at`) dan idempoten: panggilan berikutnya mengembalikan waktu pertama itu, sehingga kartu tidak tampil lagi pada kunjungan berikutnya di perangkat mana pun. Menutup kartu hanya disimpan di localStorage (`bbb-bff-whatsapp-card-dismissed`). Label format kegiatan dikirim apa adanya ("Offline" atau "Online").

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
| `GET` | `/api/regions/villages?districtCode=...` | `VillageOption[]` |

`VillageOption` berbentuk `{ code, value, label, postalCode }`; `label` hanya nama wilayah dan frontend menampilkannya sebagai `Nama Kelurahan - Kodepos`. Field wajib profil: nama, tahun lahir, WhatsApp ternormalisasi `628...`, preferensi partisipasi, provinsi, kabupaten/kota, kecamatan, kelurahan, kode pos, dan versi persetujuan/peraturan. Payload memakai `villageCode`; respons `MemberProfile` memuat `village: VillageOption | null`, sedangkan draft migrasi memuat `villageCode` string (kosong untuk data lama). Opsi preferensi berasal dari server; mock tidak menetapkan enum bisnis baru.

Keputusan versi untuk implementasi persisten langkah 6 (16 Oktober 2026): `consentVersion` dan `rulesVersion` mengikuti `app_settings.rules_version` dari admin. Tipe payload tetap **string**, berisi angka versi seperti `"1"`/`"2"`, bukan tanggal; respons pengaturan admin tetap `rulesVersion: number`. FE membaca versi dari server dan mengirim kembali tanpa menetapkan angka/tanggal sendiri. Fixture tanggal lama masih ada sampai flow terkait dimigrasi; histori persetujuan lama tidak ditulis ulang sebagai persetujuan baru secara otomatis.

Onboarding email/migrasi memerlukan JWT member hidup dan User terverifikasi (401 tanpa identitas, 403 email belum terverifikasi/peran/status/flow salah). Semua field divalidasi ulang server: usia minimal 17 menurut tahun kalender, WhatsApp unik termasuk member soft-deleted (08/format pemisah dinormalisasi ke 628), preferensi online/offline/both, relasi wilayah Kemendagri 2/4/6/10 digit, kode pos 5 angka. Kode pos kelurahan adalah saran, bukan pembatas alamat Ibu, sehingga tetap dapat diedit. Endpoint wilayah membaca tabel DB, diurutkan menurut kode; induk tak dikenal memberi daftar kosong. `consentVersion`/`rulesVersion` wajib string versi admin terkini bagi consent baru; basi/missing mendapat 422 errors per field. Simpan profil + user.name + nomor BFF-xxxxx atomik memakai lock user dan sequence. Retry valid pada profil yang sudah active mengembalikan profil tersimpan tanpa mengedit/mengalokasikan nomor kedua. JWT/sid lama tetap valid, auth/session berikutnya melihat member DB lengkap.

`MemberProfileData` juga memuat `statistics: { joinedEvents, attendedEvents }`. Untuk identitas DB, angka dihitung dari event_registrations milik member (status registered/present/absent untuk ikut, present untuk hadir). Nama, nomor anggota, avatar, dan label status di layar profil berasal dari `profile`.

Edit data diri memakai form yang sama dengan onboarding, dengan email read-only. `PUT /api/member/profile` menyimpan perubahan ke database untuk member yang masuk (kepemilikan dari token, bukan dari payload) dan mengembalikan `MemberProfile` tersimpan. Validasi sama dengan onboarding (usia minimal 17 tahun, WhatsApp dinormalisasi ke `628...` dan unik termasuk member terhapus, preferensi online/offline/both, hierarki wilayah Kemendagri, kode pos 5 angka); WhatsApp milik Ibu sendiri boleh dikirim ulang. `consentVersion`/`rulesVersion` wajib ada di payload tetapi tidak dibandingkan dengan versi admin terkini dan tidak pernah menimpa persetujuan yang tercatat; nomor anggota, status, email, `joinedAt`, dan histori persetujuan tidak bisa diubah lewat edit biasa (field itu diabaikan bila dikirim). Hanya member `active` yang bisa menyimpan (member terbatas `403` `membership_restricted`, akun yang belum melengkapi data `403`). Foto opsional dipotong persegi dari tengah oleh frontend sebelum dikirim. `POST /api/member/profile/photo` memvalidasi JPG/PNG persegi maksimal 5 MB di server, menyimpannya di disk publik pada folder milik member (`profile-photos/{memberId}/{uuid}.{jpg|png}`), lalu mengembalikan `profilePhotoUrl` berupa URL absolut `/images/profile-photos/...` (bukan data URL); `MemberProfile.profilePhotoUrl` memakai URL yang sama. File lama dihapus hanya setelah file baru tersimpan di database dan hanya bila berada di folder member itu sendiri; kegagalan simpan menghapus file baru dan mempertahankan foto lama (`500 { message }` bila penyimpanan gagal). Server perlu `php artisan storage:link` agar URL terbuka.

Ubah password: password lama wajib sesuai; password baru minimal 8 karakter dan berbeda dari password lama. Error field memakai `currentPassword` dan `password`; respons sukses tetap `{ message }` tanpa token baru. Untuk member di database, hash password diganti dan epoch sesi user naik: **sesi perangkat yang mengganti password tetap hidup** (token dan refresh-nya tetap berlaku), sedangkan token semua perangkat lain, termasuk refresh-nya, menjadi `401`; perangkat yang masuk setelahnya memakai epoch baru. Lupa password lewat tautan (`POST /api/password/reset`) mengakhiri **semua** sesi lama; hanya sesi baru dari reset yang hidup. Email pemberitahuan "password berubah" diantrekan setelah transaksi selesai (tanpa tautan atau rahasia; pengiriman nyata menunggu provider email).

`CommunityRules` berbentuk `{ version, updatedByLabel, sections: [{ title, body }], whatsappGroupUrl }`. Body adalah plain text dengan baris baru (bukan HTML); frontend tidak merender HTML dari server. Sumbernya pengaturan admin: `version` adalah `rules_version` sebagai string angka ("1", "2"); bila `rules_summary` terisi, `sections` berisi **satu** section `{ title: "Aturan komunitas", body: <ringkasan apa adanya> }`, dan selama kosong tetap placeholder artboard 6m sampai copy final tersedia; `updatedByLabel` "Diperbarui oleh {nama admin}" bila admin pengubah ringkasan diketahui, selain itu "Diperbarui oleh admin". `whatsappGroupUrl` dari pengaturan yang sama dengan Beranda; kosong berarti tombol nonaktif. Kontak admin dan URL dokumen eksternal belum ditentukan.


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

Endpoint keluar/status memerlukan sesi member lengkap (`401` untuk tamu atau token admin; akun yang masih onboarding tidak boleh mengajukan, `403`). Untuk member di database permintaan disimpan permanen (`exit_requests`): `POST` hanya untuk member `active` dan dalam satu transaksi membuat permintaan `pending`, mengubah status member menjadi `exit_requested`, dan membatalkan pendaftaran `registered` pada kegiatan yang belum berakhir (`endsAt` di masa depan; riwayat hadir/tidak hadir tidak berubah, kursi kembali). Status selain `active` ditolak (`403 membership_restricted` oleh middleware, `422` bila lolos karena balapan). Hanya satu permintaan `pending` per member. `attempt` internal = jumlah permintaan yang sudah **ditolak** + 1; permintaan yang dibatalkan Ibu sendiri tidak dihitung. `explanation` maksimal 2000 karakter (`422` pada field `explanation`). `DELETE` hanya bila status member `exit_requested` (`canCancel`), menandai permintaan `cancelled` dan mengaktifkan member kembali; bila status diubah admin tanpa baris permintaan, status tetap yang menentukan. `exitRequest` pada `MembershipStatusData` hanya berisi permintaan yang sedang `pending` (`null` untuk member aktif atau `unsubscribed`). `adminWhatsappUrl` dari pengaturan `admin_whatsapp` (`https://wa.me/{nomor}`), lalu `BBB_ADMIN_WHATSAPP_URL`, selain itu `null` (kontak admin nonaktif). Review admin dan email pemberitahuan belum berjalan.


## Kegiatan

| Method | URL | Payload/result |
| --- | --- | --- |
| `GET` | `/api/member/events?scope=upcoming|registered|history&page=...` | `PaginatedCollection<EventSummary>` |
| `GET` | `/api/member/events/{eventId}` | `EventDetail` |

Tab daftar kegiatan: `upcoming` (kegiatan yang belum selesai), `registered` (kegiatan yang belum selesai dan diikuti member, berstatus `registered` atau `present`), dan `history` (kegiatan yang sudah selesai atau dibatalkan, termasuk status kehadiran member). Daftar dipaginasi 10 per halaman (`meta.lastPage`); web app menampilkan tombol "Muat lebih banyak". Badge status ("Terdaftar", "Hadir", "Kuota penuh") diturunkan dari `registration.status`, `lifecycle`, dan `remainingCapacity`. `EventDetail` memuat `registrationClosesAt`; aturan "ditutup N menit sebelum kegiatan" dihitung dari selisihnya dengan `startsAt`, bukan angka tetap di UI. Setelah mendaftar, membatalkan, atau mengirim kode, web app memuat ulang detail dari server (server yang menentukan `canRegister`, `canCancel`, dan kuota).

Quota bersifat opsional. Saat `capacity` bernilai `null`, UI tidak menampilkan kapasitas atau sisa kursi. Server mengirim `canRegister`, `canCancel`, dan alasan Indonesia sebagai keputusan otoritatif.

Langkah 7: sesi DB membaca events/event_registrations MySQL dengan UUID string; enum format online/offline, timezone IANA dan datetime UTC. Draft, soft-deleted, waktu tidak lengkap, dan id tak dikenal menghasilkan 404 Indonesia yang sama. Lifecycle completed juga berlaku bila endsAt telah lewat, walau admin belum menutup acara; absensi punya jendela terpisah sampai admin close. Mendatang/terdaftar diurutkan startsAt lalu id menaik, riwayat menurun; paginasi 10. Lokasi offline memisahkan Maps/alamat dan online memakai meetingUrl (tidak ada attendanceCode di payload member). Daftar/detail hanya memuat registrasi pemilik JWT, bukan memberId dari input. UpcomingEvents di Home memakai UUID DB agar tautannya berfungsi.

## Pendaftaran kegiatan

| Method | URL | Payload/result |
| --- | --- | --- |
| `POST` | `/api/member/events/{eventId}/registrations` | `EventRegistration` |
| `DELETE` | `/api/member/registrations/{registrationId}` | `EventRegistration` |

Frontend tidak menghitung cutoff atau kapasitas sendiri. Register/cancel DB transaksional memakai urutan lock user -> member -> event -> registration, recheck status dan kapasitas. Cutoff daftar dan batal masing-masing dari app_settings.registration_close_minutes dan cancellation_close_minutes; tepat pada cutoff (now >= cutoff) sudah ditolak 422. cancellationCutoffAt pada hasil mutasi memakai cutoff batal, bukan daftar. Detail hanya menyediakan registrationClosesAt, jadi FE tidak menebak angka cutoff batal dari field itu.

Kuota menghitung semua registrasi member/tamu DB yang tidak cancelled; batal mengembalikan kursi, quota null tidak membatasi. Duplicate register masih 422 dengan pesan sudah terdaftar; setelah cancelled, daftar ulang memakai UUID/baris unik yang sama dengan registeredAt baru. Registrasi orang lain/tak dikenal tidak bisa dibatalkan (404); hadir/selesai/batal/cutoff ditolak sesuai capability. Bridge exit sementara membatalkan registrasi DB mendatang/berlangsung yang masih registered, tidak mengembalikan kursi saat exit dibatalkan, tidak mengubah present/history; exit request disimpan di `exit_requests`. Admin dan halaman publik menulis ke acara DB yang sama.

## Absensi

| Method | URL | Payload/result |
| --- | --- | --- |
| `GET` | `/api/member/events/{eventId}/attendance` | `AttendanceState` |
| `POST` | `/api/member/events/{eventId}/attendance` | `{ code: string }` -> `AttendanceSubmissionResult` |

State memuat waktu buka/tutup, `attendedAt` (waktu kehadiran tercatat, `null` sebelum hadir), jumlah percobaan tersisa, status pendaftaran, dan capability submit. Jendela adalah tepat 30 menit sebelum mulai (inklusif) sampai admin menutup/membatalkan kegiatan, bukan endsAt terjadwal. closesAt null selama belum ditutup, lalu closed_at/cancelled_at UTC bila ada. Sudah hadir selalu completed dan waktu bukti tidak ditimpa oleh retry, termasuk setelah close. Kode dinormalisasi huruf besar dan whitespace dihapus seperti FE. Hanya registrasi sendiri registered/present yang memiliki endpoint attendance; cancelled/absent/milik orang lain/unknown -> 404.

Maksimal 5 kode salah per member per jendela 600 detik sejak percobaan salah pertama; budget lintas kegiatan/JWT, tidak reset saat login atau kode sukses pada acara lain. RateLimiter memakai cache database di runtime; row lock user menserialisasi submit paralel. Percobaan di luar jendela/validasi gagal/tidak memiliki registrasi tidak memakan budget. Setelah lima salah, canSubmit false/rate_limited sampai tepat retryAt; hit berikutnya tidak menggeser timer. Hasil submission tetap 200 dengan accepted false/state/message, bukan mengubah kontrak menjadi 429. Kode salah menurunkan attemptsRemaining; kode benar mencatat present/attendedAt atomik. Submit ulang yang sudah completed mengembalikan accepted false dengan state bukti lama. Backend tetap otoritatif.

Kode dan jendela absensi selalu per acara dari DB.

## Data dan akun pengembangan

Seluruh endpoint memakai MySQL; tidak ada lagi state dummy per sesi atau kelas dummy di API.

Akun development dari seeder (hanya `local`/`testing`): member `buibu@gmail.com` / `buibu123`, admin `superadmin@bbb.test` / `superadmin123` dan `admin@bbb.test` / `admin123`. Nilai ini hanya fixture dan bukan credential production.

## Halaman publik kegiatan

Status: **di MySQL (langkah 19)**; dibaca dari `events`, `event_guests`, `event_registrations`. Halaman `/e/{slug}` terbuka tanpa login dan tidak pernah mengarah ke `/login`.

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

`PublicRegistrationResult`: `{ email: string }`. Server menyimpan tamu (`event_guests`, email huruf kecil, unik per kegiatan) dan satu pendaftaran `registered` (`source=self`) dalam satu transaksi, lalu seharusnya mengirim email konfirmasi (belum terkirim sampai langkah email/Resend). Web app menampilkan `email` tebal di layar berhasil.

Penolakan bisnis memakai `422 { message, code, errors? }` dengan `code` yang bisa dibedakan: `event_full` (kuota penuh), `registration_closed` (pendaftaran ditutup), dan `email_already_registered` (dengan `errors.email` berisi "Email ini sudah dipakai mendaftar kegiatan ini."). Setelah `event_full` atau `registration_closed`, web app memuat ulang detail kegiatan dan menampilkan keadaan yang sesuai. Validasi field memakai `422 { errors }` biasa. Endpoint di-throttle per IP dan per email; kelebihan dibalas `429`.

Admin dialog "Tambah peserta" hanya mengumpulkan nama, email, dan WhatsApp; provinsi, kabupaten/kota, dan tahun lahir wajib hanya untuk pendaftaran lewat halaman publik, sehingga peserta yang ditambah admin boleh tidak memilikinya (nullable di sisi API).

Aturan server: kegiatan diambil dengan `slug` dari tabel `events` (draf, kegiatan khusus member, dan yang sudah dihapus = 404). `lifecycle`: `cancelled`/`completed` mengikuti status; kegiatan `published` yang belum mulai = `upcoming`, sedang berlangsung = `ongoing`, sudah lewat tapi belum ditutup admin = `completed`. `registeredCount` dan kuota menghitung member dan tamu yang bukan `cancelled`. Penutupan, kuota, dan email ganda diperiksa di bawah kunci baris kegiatan (dua pendaftar serentak tidak bisa sama-sama mengambil kursi terakhir atau memakai email yang sama). `consentVersion` = nomor versi aturan di Pengaturan (`rules_version`, sama dengan yang disetujui member), disimpan di tamu. Wilayah divalidasi ke tabel `provinces`/`regencies`. `adminWhatsappUrl` dari Pengaturan (`adminWhatsapp`), lalu `BBB_ADMIN_WHATSAPP_URL`. Tamu tampil di daftar peserta admin (`source: self`). Throttle: 20 permintaan per menit per IP; throttle per email belum ada.

Metadata per slug disajikan oleh Vercel Function pada setiap request langsung ke `/e/{slug}` (bukan hanya berdasarkan user-agent crawler). Fungsi mengambil `GET /api/public/events/{slug}` lalu menyuntikkan title, description, canonical, Open Graph, Twitter Card, dan Event JSON-LD ke HTML shell yang sama sebelum SPA berjalan. Event yang tidak terlihat oleh endpoint publik menghasilkan HTTP `404` dengan `noindex`; kegagalan upstream menghasilkan `5xx` dengan `noindex`. Browser tetap menjalankan SPA yang sama dan navigasi client-side memperbarui judul dokumen. Fungsi boleh memakai cache CDN singkat; data bisnis dan form tetap dimuat langsung dari API oleh SPA.

## Mock MSW (opsional, dev saja)

Dengan `VITE_API_MOCKING_ENABLED=true` pada dev server (`npm run dev`), MSW mencegat request `*/api/*` dan menjawab dari `src/mocks/`. Build production (`npm run build`) selalu mengabaikan flag ini sehingga fixture dan credential mock tidak pernah ikut ter-deploy. Utamakan API lokal yang sebenarnya dan jaga mock tetap selaras dengan contract ini.
