# Admin event management contract (DRAFT)

Status: **dummy-data draft** untuk artboard 10a-10c. Diimplementasi di `bbb-api` dan dipakai `web-dashboard`; salinan identik di kedua repo. Auth, envelope, dan error mengikuti `admin-auth.md` dan `frontend-api.md`. Semua endpoint butuh sesi admin (`401` bila tidak ada). Data kegiatan admin fase dummy terpisah dari kegiatan di sisi member (`/api/member/events`) dan tersimpan per sesi browser.

| Method | URL | Result |
| --- | --- | --- |
| `GET` | `/api/admin/events?status&page&perPage` | `{ items: EventListItem[], meta, summary }` |
| `GET` | `/api/admin/events/options` | `{ statuses, formats, timezones }` |
| `POST` | `/api/admin/events/attendance-code` | `{ attendanceCode }` (kode acak 8 karakter) |
| `POST` | `/api/admin/events/banner` | multipart `banner` (JPG/PNG, maks. 5 MB) -> `{ bannerUrl }` (fase dummy: data URL) |
| `POST` | `/api/admin/events` | `EventInput` -> `EventDetail` (`201`) |
| `GET` | `/api/admin/events/{id}` | `EventDetail` (`404` bila tidak ada) |
| `PUT` | `/api/admin/events/{id}` | `EventInput` -> `EventDetail` |
| `POST` | `/api/admin/events/{id}/duplicate` | -> `EventDetail` draf baru (`201`) |
| `POST` | `/api/admin/events/{id}/cancel` | -> `EventDetail`; `422` bila bukan `published` |
| `POST` | `/api/admin/events/{id}/close` | -> `EventDetail`; `422` bila bukan `published` |
| `GET` | `/api/admin/events/{id}/participants?search&page&perPage` | `{ items: EventParticipant[], meta, summary }` |
| `POST` | `/api/admin/events/{id}/participants` | `{ memberId }` atau `{ name, email, whatsapp }` -> `EventParticipant` (`201`) |
| `PUT` | `/api/admin/events/{id}/participants/{participantId}/attendance` | `{ present: boolean }` -> `{ participant, summary }` |

## Status dan aturan

`status`: `draft` (Draf), `published` (Dipublikasikan), `completed` (Selesai = sudah ditutup), `cancelled` (Dibatalkan).

- Draf boleh tidak lengkap (hanya judul, format, zona waktu, dan flag kuota/non-member wajib).
- Menerbitkan (`publish: true`) dan mengedit kegiatan yang sudah dipublikasikan memakai aturan penuh: `startsAt` dan `endsAt` wajib dan `endsAt` setelah `startsAt`; `startsAt` harus di masa depan saat draf diterbitkan; offline butuh `venueName` dan `address`; online butuh `mapUrl` (link meeting); kuota aktif butuh `capacity`, dan `capacity` tidak boleh di bawah jumlah terdaftar.
- Kegiatan `completed` dan `cancelled` tidak bisa diedit (`422`).
- `close`: peserta yang belum ditandai hadir menjadi `absent`. Tombol X pada peserta (`present: false`) mengembalikan ke `registered`, atau ke `absent` bila kegiatan sudah ditutup; tanda bisa dikoreksi setelah ditutup.
- Pendaftaran member ditutup 60 menit sebelum mulai (`registration.closesAt`, akan dibaca dari Pengaturan). Admin masih bisa menambah peserta sampai akhir hari mulai di zona waktu acara (`registration.adminAddUntil`); kuota penuh dan kegiatan non-member tertutup menolak dengan `422`.
- `slug` (link `/e/{slug}`) dibuat dari judul bila kosong dan harus unik; `attendanceCode` dibuat acak bila kosong, disimpan huruf besar.
- Waktu dikirim dan diterima sebagai ISO 8601 UTC; `timezone` (`WIB|WITA|WIT`) dipakai untuk menampilkan dan mengisi jam.

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
    allowsNonMember: boolean;
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

- Aturan kapan boleh menutup acara (sebelum acara mulai) belum diputuskan; dummy mengizinkan setiap kegiatan `published`.
- Email pembatalan ke pendaftar dan konfirmasi non-member tidak dikirim di fase dummy.
- Halaman publik `/e/{slug}` ada di `web-app` dan belum dibuat.
