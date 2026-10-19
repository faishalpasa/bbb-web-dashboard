# Admin member management contract (DRAFT)

RBAC tahap C: otorisasi endpoint admin yang sudah ada mengikuti matriks permission di `admin-rbac.md`, menggantikan pembatasan role admin/superadmin yang disebut pada bagian historis dokumen ini. Permission kurang menghasilkan 403 `{ message: "Anda tidak memiliki izin untuk melakukan tindakan ini.", code: "permission_denied" }`. Session `role`/`permissions` baru dan UI pengelolaan role masih tahap D–F. Statistik lintas modul dashboard masih mengikuti perilaku existing sampai keputusan penyaringan dikonfirmasi.

Status: **di MySQL** untuk artboard 9a-9e. Diimplementasi di `bbb-api` dan dipakai `web-dashboard`; salinan identik di kedua repo. Auth, envelope, dan error mengikuti `admin-auth.md` dan `frontend-api.md`. Semua endpoint butuh token admin (`401` tanpa token atau dengan token member; semua admin, bukan hanya superadmin). Data member memakai MySQL sejak langkah 11; `id` adalah UUID string. Hanya audit log ekspor yang masih dummy per sesi (langkah 12).

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
| `POST` | `/api/admin/members/{id}/reset-password` | -> `{ email }`; mengantrekan email berisi link atur ulang password (pengiriman nyata menunggu provider email) dan mematikan link reset lama yang belum dipakai; `422` bila member belum melengkapi data |
| `PUT` | `/api/admin/members/{id}/note` | `{ note }` -> `{ note }` (maks. 2000 karakter) |

Daftar wilayah memakai endpoint `/api/regions/*` yang sama dengan member.

## List

Query: `search` (nama, email, nomor anggota, atau nomor WhatsApp; `%` dan `_` dicari apa adanya; pencarian tanpa huruf dianggap nomor telepon: yang diawali `0` atau `62` dicocokkan sebagai awal nomor `628...`, selain itu sebagai potongan nomor), `status` (status admin turunan; status tak dikenal tidak memfilter), `provinceCode`, `preference` (`online|offline|both|unset`), `attendance` (`attended|never`), `page` (minimal 1), `perPage` (default 20, minimal 1, maks. 100). Urutan: member yang paling baru bergabung (`joinedAt`) di atas. `summary.activeTotal` menghitung status admin `active` (bukan `email_bounced`), `summary.total` semua member.

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

Email, nomor anggota, status, dan persetujuan yang tercatat tidak berubah lewat edit (field itu diabaikan bila dikirim); status diubah lewat endpoint deactivate/activate. Edit berlaku untuk member berstatus apa pun, tidak melengkapi data member yang masih `awaiting_data`, dan ikut memperbarui nama akun. Nomor anggota (`BFF-xxxxx`) dibuat server saat disimpan (urutan transaksional), status awal `active`, `signupMethod` `admin`. Email dicek unik tanpa memperhatikan huruf besar/kecil dan disimpan huruf kecil (`422 "Email sudah terdaftar."`); WhatsApp dinormalisasi ke `628...` (`08...` diterima) dan unik termasuk member yang sudah dihapus. Akun dibuat tanpa password: dengan `sendInvitation` email belum terverifikasi dan sebuah link atur password diantrekan (pengiriman nyata menunggu provider), tanpa itu email dianggap terverifikasi oleh admin. `consentAcknowledged: true` mencatat persetujuan dengan versi aturan terkini dan waktu sekarang; selain itu `consent` tetap `null`.

Penonaktifan mengubah status tersimpan menjadi `unsubscribed` (tampil `inactive`), membatalkan pendaftaran `registered` pada kegiatan yang belum berakhir (riwayat hadir tidak berubah, kursi kembali), dan dicatat ke audit log tipe `members`. Pengaktifan kembali (`inactive` -> `active`) tidak memulihkan pendaftaran. Permintaan keluar yang masih menunggu tidak diputuskan oleh penonaktifan; keputusannya tetap lewat layar Permintaan Keluar.

## Terbuka

- Status admin diturunkan dari status tersimpan: `unsubscribed` -> `inactive`, `migrated` -> `awaiting_data`, `exit_requested` tetap, dan `email_bounced` hanya untuk member `active` yang alamat emailnya bermasalah (belum ada yang mengisi penanda itu selain seed/admin). `statistics.absent` kini jumlah pendaftaran berstatus `absent` (sebelumnya selisih ikut dan hadir), `history` memuat pendaftaran yang tidak dibatalkan dari yang terbaru, maksimal 50. `signupMethod` bernilai `legacy` (label "Data lama") untuk member impor yang belum punya metode daftar; nilai itu di luar union tiga nilai di atas dan hanya labelnya yang dipakai dashboard.
- Ekspor CSV memakai filter yang sama, tanpa paginasi, dan menambahkan `'` di depan sel yang diawali `=`, `+`, `-`, `@` supaya tidak dijalankan sebagai rumus di spreadsheet.
- Kegiatan, peserta, permintaan keluar, dan dashboard membaca member yang sama dari MySQL (langkah 13-18).
- Preferensi kegiatan dibuat opsional di form tambah/edit karena daftar menampilkan "Belum diisi".
