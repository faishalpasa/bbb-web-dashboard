# Admin member management contract (DRAFT)

Status: **dummy-data draft** untuk artboard 9a-9e. Diimplementasi di `bbb-api` dan dipakai `web-dashboard`; salinan identik di kedua repo. Auth, envelope, dan error mengikuti `admin-auth.md` dan `frontend-api.md`. Semua endpoint butuh sesi admin (`401` bila tidak ada). Perubahan fase dummy (tambah, edit, status, catatan) disimpan per sesi browser.

| Method | URL | Result |
| --- | --- | --- |
| `GET` | `/api/admin/members` | `{ items: MemberListItem[], meta, summary }` |
| `GET` | `/api/admin/members/options` | `MemberOptions` |
| `GET` | `/api/admin/members/export` | `text/csv` (filter sama dengan list, tanpa paginasi) |
| `POST` | `/api/admin/members` | `MemberCreateInput` -> `MemberDetail` (`201`) |
| `GET` | `/api/admin/members/{id}` | `MemberDetail` (`404` bila tidak ada) |
| `PUT` | `/api/admin/members/{id}` | `MemberEditInput` -> `MemberDetail` |
| `POST` | `/api/admin/members/{id}/deactivate` | -> `MemberDetail`; `422` bila sudah nonaktif |
| `POST` | `/api/admin/members/{id}/activate` | -> `MemberDetail`; `422` bila bukan nonaktif |
| `POST` | `/api/admin/members/{id}/reset-password` | -> `{ email }` (fase dummy: email tidak dikirim); `422` bila member belum melengkapi data |
| `PUT` | `/api/admin/members/{id}/note` | `{ note }` -> `{ note }` (maks. 2000 karakter) |

Daftar wilayah memakai endpoint `/api/regions/*` yang sama dengan member.

## List

Query: `search` (nama, email, nomor anggota, atau nomor WhatsApp), `status`, `provinceCode`, `preference` (`online|offline|both|unset`), `attendance` (`attended|never`), `page`, `perPage` (default 20, maks. 100). Urutan: member yang baru ditambahkan di atas, lalu urutan dasar.

```ts
interface MemberListItem {
    id: string;
    memberNumber: string | null; // null sebelum data dilengkapi
    name: string;
    whatsapp: string; // 628...
    regency: string | null;
    province: string | null;
    preference: { value: string; label: string } | null; // null = "Belum diisi"
    status: { value: MemberAdminStatus; label: string };
    joinedEvents: number;
    attendedEvents: number;
    joinedAt: string;
}
type MemberAdminStatus = 'active' | 'exit_requested' | 'email_bounced' | 'awaiting_data' | 'inactive';
// summary: { activeTotal: number; total: number } -> "1.248 member aktif dari 1.311 data"
```

`MemberOptions`: `statuses`, `preferences` (termasuk `unset`), `attendance`, `provinces` (`RegionOption[]`), `birthYearMin`, `birthYearMax` (usia minimal 17 tahun).

## Detail

```ts
interface MemberDetail {
    id: string;
    memberNumber: string | null;
    status: { value: MemberAdminStatus; label: string };
    name: string;
    birthYear: number;
    email: string;
    isEmailVerified: boolean;
    whatsapp: string;
    province: RegionOption | null;
    regency: RegionOption | null;
    district: (RegionOption & { postalCode: string | null }) | null;
    postalCode: string;
    preference: { value: string; label: string } | null;
    whatsappGroupJoinedAt: string | null;
    signupMethod: { value: 'google' | 'email' | 'admin'; label: string };
    joinedAt: string;
    consent: { rulesVersion: string; acceptedAt: string } | null;
    statistics: { joined: number; attended: number; absent: number };
    history: { eventId: string; title: string; startsAt: string; status: { value: 'registered' | 'present' | 'absent'; label: string } }[];
    note: string;
    actions: { canEdit: boolean; canResetPassword: boolean; canDeactivate: boolean; canActivate: boolean };
}
```

## Input

```ts
interface MemberEditInput {
    name: string; // wajib
    birthYear: number; // wajib, usia minimal 17 tahun
    whatsapp: string; // wajib, 628 + 8-12 digit
    participationPreference: string | null; // opsional: online | offline | both
    provinceCode: string; // wajib
    regencyCode: string; // wajib, sesuai provinsi
    districtCode: string; // wajib, sesuai kabupaten/kota
    postalCode: string; // wajib, 5 digit
}
interface MemberCreateInput extends MemberEditInput {
    email: string; // wajib, unik (422 "Email sudah terdaftar.")
    sendInvitation: boolean; // kirim email undangan agar member membuat password sendiri
    consentAcknowledged: boolean; // admin menyatakan member sudah menyetujui aturan
}
```

Email, nomor anggota, dan status tidak berubah lewat edit; status diubah lewat endpoint deactivate/activate. Nomor anggota (`BFF-xxxxx`) dibuat server saat disimpan, status awal `active`.

## Terbuka

- Status admin (`awaiting_data`, `email_bounced`) belum dipetakan ke status member di `frontend-api.md` (`migrated`, `exit_requested`, `unsubscribed`).
- Preferensi kegiatan dibuat opsional di form tambah/edit karena daftar menampilkan "Belum diisi".
- Dampak nonaktif ke pendaftaran kegiatan mendatang (dialog 9d) belum disimulasikan di dummy.
