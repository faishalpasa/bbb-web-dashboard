# Admin event management contract

Pagination dashboard (20 Oktober 2026): GET /events dan /events/{id}/participants memakai query perPage existing (maks. 100), default FE 25 dengan opsi 10/20/25/50/100. Ganti ukuran/filter kembali page=1; search/status tetap. Filter ekspor tetap seluruh hasil, bukan hanya halaman yang terlihat. Footer bersama menampilkan Tampilkan + selector + total di kiri, nomor/ellipsis + panah prev/next di kanan; tanpa tombol first/last. Default API dan envelope existing tetap.

Perubahan Registration Form: [kontrak lintas repo](event-registration-form.md). Tahap 2 backend lokal (belum deploy) menambah `registrationForm: AdminRegistrationForm` pada EventDetail dan input opsional create/edit; duplikat ikut menyalin definisi dengan ID baru. Detail jawaban peserta/payload submit baru masih tahap 4/5. Writer daftar lama menolak custom form (422 registration_form_required); event tanpa custom tetap mengikuti flow existing.

RBAC tahap C–E: otorisasi endpoint admin mengikuti matriks permission di `admin-rbac.md`, menggantikan pembatasan role admin/superadmin yang disebut pada bagian historis dokumen ini. Permission kurang menghasilkan 403 `{ message: "Anda tidak memiliki izin untuk melakukan tindakan ini.", code: "permission_denied" }`. Login/session/refresh/aktivasi undangan sudah mengembalikan role + permissions efektif dan can legacy konservatif. Guard halaman/sidebar/tombol dashboard memakai permission (E); UI/API kelola role masih tahap F. Statistik lintas modul dashboard tetap mengikuti perilaku existing sampai keputusan penyaringan dikonfirmasi.

Status: **di MySQL (langkah 13)**. Diimplementasi di `bbb-api` dan dipakai `web-dashboard`; salinan identik di kedua repo. Auth, envelope, dan error mengikuti `admin-auth.md` dan `frontend-api.md`. Semua endpoint butuh token admin (`401` bila tidak ada atau token member). Kegiatan admin dan kegiatan di sisi member (`/api/member/events`) adalah **satu tabel** `events`: kegiatan `published` langsung terlihat member, draf tidak. Id kegiatan dan peserta adalah UUID (string). Daftar diurutkan `COALESCE(starts_at, created_at)` terbaru dulu, lalu id.

| Method | URL | Result |
| --- | --- | --- |
| `GET` | `/api/admin/events?status&page&perPage` | `{ items: EventListItem[], meta, summary }` |
| `GET` | `/api/admin/events/options` | `{ statuses, formats, timezones }` |
| `POST` | `/api/admin/events/attendance-code` | `{ attendanceCode }` (kode acak 8 karakter) |
| `POST` | `/api/admin/events/banner` | multipart `banner` (JPG/PNG, maks. 5 MB) -> `{ bannerUrl }` (file disimpan permanen di disk `public`, URL `/images/event-banners/...`; kirim URL itu kembali di `bannerUrl` saat menyimpan; URL lain atau file hilang -> `422` pada `bannerUrl`) |
| `POST` | `/api/admin/events` | `EventInput` -> `EventDetail` (`201`) |
| `GET` | `/api/admin/events/{id}` | `EventDetail` (`404` bila tidak ada) |
| `PUT` | `/api/admin/events/{id}` | `EventInput` -> `EventDetail` |
| `POST` | `/api/admin/events/{id}/duplicate` | -> `EventDetail` draf baru (`201`) |
| `POST` | `/api/admin/events/{id}/cancel` | -> `EventDetail`; `422` bila bukan `published` |
| `POST` | `/api/admin/events/{id}/close` | -> `EventDetail`; `422` bila bukan `published` |
| `GET` | `/api/admin/events/{id}/participants?search&page&perPage` | `{ items: EventParticipant[], meta, summary }` |
| `GET` | `/api/admin/events/{id}/participants/export?search` | `text/csv` (`peserta-{slug}.csv`): Nomor, Nama, Email, WhatsApp, Jenis, Didaftarkan, Didaftarkan oleh, Status; semua peserta yang cocok dengan pencarian, tanpa paginasi, tanpa peserta yang membatalkan; dicatat di log audit (Ekspor data); sel yang diawali `= + - @` diberi awalan `'` |
| `POST` | `/api/admin/events/{id}/participants` | `{ memberId }` atau `{ name, email, whatsapp }` -> `EventParticipant` (`201`) |
| `PUT` | `/api/admin/events/{id}/participants/{participantId}/attendance` | `{ present: boolean }` -> `{ participant, summary }` |

## Status dan aturan

`status`: `draft` (Draf), `published` (Dipublikasikan), `completed` (Selesai = sudah ditutup), `cancelled` (Dibatalkan).

- Draf boleh tidak lengkap (hanya judul, format, zona waktu, dan flag kuota/non-member wajib).
- Menerbitkan (`publish: true`) dan mengedit kegiatan yang sudah dipublikasikan memakai aturan penuh: `startsAt` dan `endsAt` wajib dan `endsAt` setelah `startsAt`; `startsAt` harus di masa depan saat draf diterbitkan; offline butuh `venueName` dan `address`; online butuh `mapUrl` (link meeting); kuota aktif butuh `capacity`, dan `capacity` tidak boleh di bawah jumlah terdaftar.
- Kegiatan `completed` dan `cancelled` tidak bisa diedit (`422`).
- `close`: peserta yang belum ditandai hadir menjadi `absent`. Tombol X pada peserta (`present: false`) mengembalikan ke `registered`, atau ke `absent` bila kegiatan sudah ditutup; tanda bisa dikoreksi setelah ditutup.
- Pendaftaran member ditutup 60 menit sebelum mulai (`registration.closesAt`, dibaca dari `app_settings.registration_close_minutes`, bawaan 60). Admin masih bisa menambah peserta sampai akhir hari mulai di zona waktu acara (`registration.adminAddUntil`); kuota penuh dan kegiatan non-member tertutup menolak dengan `422`.
- `registered` menghitung semua pendaftaran yang bukan `cancelled`, member dan tamu (kuota juga). `attended` = jumlah `present`, `null` sampai ditutup. Peserta dan kehadiran dibaca/ditulis di `event_registrations`; daftar peserta berurutan `registered_at, id`, pencarian nama/nomor member/nama tamu. `cancel` tidak mengubah pendaftaran. Mengubah kapasitas di bawah jumlah terdaftar ditolak.
- Banner lama dihapus dari disk bila tidak ada kegiatan lain (termasuk salinan/terhapus) yang masih memakainya; `duplicate` memakai file yang sama.
- `slug` (link `/e/{slug}`) dibuat dari judul bila kosong dan harus unik; `attendanceCode` dibuat acak bila kosong, disimpan huruf besar.
- Waktu dikirim dan diterima sebagai ISO 8601 UTC; `timezone` (`WIB|WITA|WIT`) dipakai untuk menampilkan dan mengisi jam.
- Aksi admin yang berhasil—membuat, mengubah/menerbitkan, menggandakan, membatalkan, menutup, menambah peserta, dan mengubah tanda kehadiran—dicatat sebagai log audit tipe `events` ("Kelola kegiatan") dalam transaksi yang sama. Aksi yang ditolak atau gagal tidak meninggalkan log. Ekspor peserta tetap dicatat sebagai tipe `export`.

## Bentuk data

```ts
interface EventListItem {
    id: string;
    title: string;
    startsAt: string | null;
    endsAt: string | null;
    timezone: 'WIB' | 'WITA' | 'WIT';
    format: { value: 'online' | 'offline'; label: string };
    status: { value: 'draft' | 'published' | 'completed' | 'cancelled'; label: string };
    registered: number;
    capacity: number | null; // null = tanpa kuota
    attended: number | null; // null sampai kegiatan ditutup
    allowsNonMember: boolean; // tipe kegiatan: true = terbuka untuk external
}
// list summary: { upcomingTotal: number; total: number }

interface EventDetail extends EventListItem {
    slug: string;
    description: string;
    venueName: string | null;
    address: string | null;
    mapUrl: string | null; // link Maps (offline) atau link meeting (online)
    bannerUrl: string | null;
    usesQuota: boolean;
    attendanceCode: string;
    publicPath: string; // "/e/{slug}"
    present: number;
    registration: { closesAt: string | null; adminAddUntil: string | null };
    actions: { canEdit; canPublish; canCancel; canClose; canAddParticipants; canMarkAttendance: boolean };
}

interface EventInput {
    title: string; slug: string | null; description: string | null; bannerUrl: string | null;
    timezone: string; startsAt: string | null; endsAt: string | null; format: 'online' | 'offline';
    venueName: string | null; address: string | null; mapUrl: string | null;
    usesQuota: boolean; capacity: number | null; allowsNonMember: boolean;
    attendanceCode: string | null; publish: boolean;
}

interface EventParticipant {
    id: string; memberId: string | null; memberNumber: string | null; // null = non-member
    name: string; whatsapp: string; registeredAt: string;
    source: 'self' | 'admin';
    status: { value: 'registered' | 'present' | 'absent'; label: string };
}
// participants summary: { registered: number; attended: number; capacity: number | null }
```

## Terbuka

- Aturan kapan boleh menutup acara (sebelum acara mulai) belum diputuskan; API mengizinkan setiap kegiatan `published`.
- Email pembatalan ke pendaftar dan konfirmasi non-member belum dikirim (menunggu penyedia email).
- Halaman publik `/e/{slug}` ada (langkah 19, `frontend-api.md`): kegiatan `published` dengan `allowsNonMember: true` tampil, dan tamu yang mendaftar muncul di daftar peserta.
