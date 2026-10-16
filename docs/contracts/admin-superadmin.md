# Admin superadmin contract

Status: **di MySQL (langkah 17)** untuk artboard 12a-12c dan 13a-13c: pengaturan, kelola admin, undangan admin, dan log. Diimplementasi di `bbb-api` dan dipakai `web-dashboard`; salinan identik di kedua repo. Auth, envelope, dan error mengikuti `admin-auth.md` dan `frontend-api.md`. Akun admin, undangan, audit log, dan pengaturan memakai MySQL (langkah 10, 12, 17); pengaturan tersimpan di `app_settings`.

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

Batas menit 0-10080, bulan 1-24. `registrationCloseMinutes` dipakai `registration.closesAt` kegiatan (admin, member, halaman publik) dan `cancellationCloseMinutes` batas batal member; `engagedWindowMonths` dibaca dashboard; `adminWhatsapp` jadi tombol WhatsApp admin; `whatsappGroupUrl` dan `rulesSummary`/`rulesVersion` tampil di layar member. Kolom opsional yang dikosongkan (atau hanya spasi) disimpan sebagai `null`; `rulesSummary` di-trim. Belum pernah diubah admin: bawaan 60/60/6, kolom opsional `null`, `rulesSummary` kosong, `rulesVersion` 1, `updatedBy` = `"Sistem"`. `updatedBy`/`updatedAt` = perubahan terakhir pada salah satu kolom di atas. `rulesVersion` naik 1 hanya bila `rulesSummary` benar-benar berubah. Tiap kolom yang berubah dicatat sebagai satu baris log ("Ubah pengaturan").

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
- Email undangan **belum dikirim** (provider email belum ada), jadi respons pembuatan memuat `invitationPath` (`/invitation?token=...`) agar link bisa dibuka manual; hapus bagian ini saat email nyata aktif. Email admin dicek unik tanpa memperhatikan huruf besar/kecil dan disimpan huruf kecil; nama tanpa spasi tepi. Akun admin tidak pernah dihapus, hanya dinonaktifkan: nonaktif berlaku di request berikutnya admin itu. Hanya admin `active` yang bisa dinonaktifkan, hanya `inactive` yang bisa diaktifkan kembali (admin `invited` belum bisa keduanya).

## Undangan

- Link di email membuka `/invitation?token=...` di dashboard; halaman membaca token sekali, menghapusnya dari URL, dan menyimpannya hanya di memori.
- Token yang tidak bisa dipakai dibalas `422 { message, code, adminWhatsappUrl }` dengan `code` `token_expired`, `token_used`, atau `token_invalid`; `adminWhatsappUrl` (`https://wa.me/...` atau `null`) berasal dari Pengaturan.
- Token berupa 64 karakter acak; hanya hash SHA-256 yang disimpan. Berlaku 7 hari (tepat pada waktu kedaluwarsa sudah mati) dan sekali pakai; memakai satu link mengakhiri semua link lain untuk admin yang sama. Urutan penolakan: tidak dikenal atau admin tidak ada `token_invalid`, sudah dipakai `token_used`, admin tidak lagi berstatus diundang `token_invalid`, lewat waktu `token_expired`. Link dibuka tanpa sesi apa pun; penerima tidak perlu sesi pengundang. Token ajaib `expired`/`used` dari fase dummy sudah tidak ada: tokennya sembarang string tidak dikenal menjadi `token_invalid`.
- Password minimal 8 karakter. Setelah aktif, admin masuk dengan email dan password (desain 13b menyebut juga Google; belum dibuat karena login admin hanya email + password).

## Log

```ts
interface AuditLogEntry {
    id: string;
    at: string; // ISO 8601 UTC
    actor: string; // nama admin
    type: { value: 'export' | 'settings' | 'admins' | 'members'; label: string }; // Ekspor data, Ubah pengaturan, Kelola admin, Kelola member
    detail: string; // kalimat Indonesia siap tampil
}
```

Terbaru di atas (waktu tercatat, lalu urutan pencatatan di detik yang sama), hanya baca (tidak ada endpoint tulis; `POST`/`PUT`/`PATCH`/`DELETE` dijawab `405`). Query: `type` (salah satu dari `types`; nilai tak dikenal memberi daftar kosong), `page`, `perPage` (default 20, minimal 1, maks. 100). `types` selalu berisi empat tipe dalam urutan tetap, meski belum ada entri. Yang dicatat: ekspor member (dengan filter dan jumlah baris), perubahan pengaturan (satu entri per kolom yang berubah, tidak ada entri bila tidak ada perubahan), pembuatan/penonaktifan/pengaktifan admin, serta penonaktifan dan pengaktifan kembali member. Entri ditulis dalam transaksi yang sama dengan aksinya (aksi yang ditolak atau gagal tidak meninggalkan entri). `actor` adalah nama admin saat aksi terjadi dan tidak berubah bila admin diganti namanya atau dihapus.

## Terbuka

- Layar lupa password admin tidak ada di desain; kalimat "Pakai Lupa password di halaman masuk" pada 13c tidak ditampilkan.
- Ekspor peserta kegiatan belum ada di dashboard, jadi belum masuk log.
- Daftar admin tidak punya aksi kirim ulang undangan; admin berstatus "Diundang" yang undangannya hilang perlu dibuat ulang setelah fitur itu diputuskan.
