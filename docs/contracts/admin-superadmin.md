# Admin superadmin contract (DRAFT)

Status: **dummy-data draft** untuk artboard 12a-12c dan 13a-13c: pengaturan, kelola admin, undangan admin, dan log. Diimplementasi di `bbb-api` dan dipakai `web-dashboard`; salinan identik di kedua repo. Auth, envelope, dan error mengikuti `admin-auth.md` dan `frontend-api.md`. Perubahan fase dummy tersimpan per sesi browser.

Semua endpoint di bawah, kecuali undangan, butuh sesi **superadmin**: tanpa sesi `401`, admin biasa `403 { message: "Hanya superadmin yang bisa mengakses halaman ini." }`. Menyembunyikan menu hanya kemudahan; API yang memutuskan.

| Method | URL | Result |
| --- | --- | --- |
| `GET` | `/api/admin/settings` | `AdminSettings` |
| `PUT` | `/api/admin/settings` | `AdminSettingsInput` -> `AdminSettings` |
| `GET` | `/api/admin/admins` | `{ items: AdminAccount[] }` |
| `POST` | `/api/admin/admins` | `{ name, email }` -> `AdminAccount & { invitationPath }` (`201`) |
| `POST` | `/api/admin/admins/{id}/deactivate` | -> `AdminAccount`; `422` bila diri sendiri atau bukan aktif |
| `POST` | `/api/admin/admins/{id}/activate` | -> `AdminAccount`; `422` bila bukan nonaktif |
| `GET` | `/api/admin/audit-logs?type&page&perPage` | `{ items: AuditLogEntry[], meta, types }` |
| `GET` | `/api/admin/invitations/{token}` | `{ name, email, role, invitedBy }` (tanpa sesi) |
| `POST` | `/api/admin/invitations/{token}/accept` | `{ password }` -> `AdminSession` dan sesi admin dimulai (tanpa sesi sebelumnya) |

## Pengaturan

```ts
interface AdminSettings {
    registrationCloseMinutes: number; // member bisa mendaftar sampai N menit sebelum acara
    cancellationCloseMinutes: number; // member bisa membatalkan sampai N menit sebelum acara
    engagedWindowMonths: number; // "Terlibat" = hadir minimal 1 kegiatan dalam N bulan terakhir
    adminWhatsapp: string | null; // 628...
    whatsappGroupUrl: string | null; // harus diawali https://chat.whatsapp.com/
    shareRecommendationUrl: string | null; // harus diawali https://
    rulesSummary: string;
    rulesVersion: number; // naik 1 setiap ringkasan aturan berubah
    updatedBy: string;
    updatedAt: string;
}
type AdminSettingsInput = Omit<AdminSettings, 'rulesVersion' | 'updatedBy' | 'updatedAt'>;
```

Batas menit 0-10080, bulan 1-24. `registrationCloseMinutes` langsung dipakai `registration.closesAt` di kegiatan dan `engagedWindowMonths` di dashboard. Tiap kolom yang berubah dicatat sebagai satu baris log ("Ubah pengaturan").

## Kelola admin

```ts
interface AdminAccount {
    id: string;
    name: string;
    email: string;
    role: { value: 'superadmin' | 'admin'; label: string };
    status: { value: 'active' | 'inactive' | 'invited'; label: string };
    isCurrentUser: boolean;
    actions: { canDeactivate: boolean; canActivate: boolean };
}
```

- Undangan selalu membuat peran `admin`. Email harus unik di antara admin (`422` "Email sudah terdaftar sebagai admin."). Undangan berlaku 7 hari dan sekali pakai.
- Admin yang keluar dinonaktifkan, bukan dihapus. Superadmin tidak bisa menonaktifkan dirinya sendiri. Admin nonaktif tidak bisa masuk (`422` pada `email`) dan sesinya berhenti.
- **Fase dummy saja:** email undangan tidak dikirim; respons pembuatan memuat `invitationPath` (`/invitation?token=...`) agar link bisa dibuka manual.

## Undangan

- Link di email membuka `/invitation?token=...` di dashboard; halaman membaca token sekali, menghapusnya dari URL, dan menyimpannya hanya di memori.
- Token yang tidak bisa dipakai dibalas `422 { message, code, adminWhatsappUrl }` dengan `code` `token_expired`, `token_used`, atau `token_invalid`; `adminWhatsappUrl` (`https://wa.me/...` atau `null`) berasal dari Pengaturan.
- Fase dummy: token `expired` dan `used` selalu gagal, untuk menjangkau layar link kedaluwarsa.
- Password minimal 8 karakter. Setelah aktif, admin masuk dengan email dan password (desain 13b menyebut juga Google; belum dibuat karena login admin hanya email + password).

## Log

```ts
interface AuditLogEntry {
    id: string;
    at: string; // ISO 8601 UTC
    actor: string; // nama admin
    type: { value: 'export' | 'settings' | 'admins'; label: string }; // Ekspor data, Ubah pengaturan, Kelola admin
    detail: string; // kalimat Indonesia siap tampil
}
```

Terbaru di atas, hanya baca. Yang dicatat saat ini: ekspor member (dengan filter dan jumlah baris), perubahan pengaturan, serta pembuatan, penonaktifan, dan pengaktifan admin.

## Terbuka

- Layar lupa password admin tidak ada di desain; kalimat "Pakai Lupa password di halaman masuk" pada 13c tidak ditampilkan.
- Ekspor peserta kegiatan belum ada di dashboard, jadi belum masuk log.
- Daftar admin tidak punya aksi kirim ulang undangan; admin berstatus "Diundang" yang undangannya hilang perlu dibuat ulang setelah fitur itu diputuskan.
