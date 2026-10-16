# Admin auth contract (DRAFT, awaiting approval)

Status: **draft**, diimplementasi di `bbb-api` (`/api/admin/*`, terpisah dari endpoint member) dan dipakai `web-dashboard`. Salinan identik ada di kedua repo; ubah bersamaan. Akun admin, login, sesi, dan undangan sudah memakai MySQL (langkah 10); endpoint admin lain (dashboard, member, kegiatan, permintaan keluar, pengaturan, log) masih dummy per sesi sampai langkahnya dimigrasi.

Keputusan produk yang sudah ada:

- Login admin memakai **email + password** saja (tanpa Google). Desain: adaptasi artboard 1a, bukan artboard khusus.
- Akun admin dibuat lewat undangan (artboard 13a-13c); setelah aktif, admin masuk dengan email dan password yang dibuat saat aktivasi.
- Sesi member bukan bukti akses admin.

Transport (token Bearer), envelope `{ data }` dan format error mengikuti `frontend-api.md`. Login admin dan penerimaan undangan menambahkan `token` (`typ: admin`, berlaku 30 menit) ke `AdminSession`; dashboard memakai `POST /api/auth/refresh` dan `Authorization: Bearer`.

## Endpoint

| Method | URL | Payload/result |
| --- | --- | --- |
| `POST` | `/api/admin/login` | `AdminLoginInput` -> `AdminSession` |
| `GET` | `/api/admin/session` | `AdminSession` (`401` bila belum masuk sebagai admin) |
| `POST` | `/api/admin/logout` | `204` tanpa body |

- Kredensial salah: `422 { message, errors: { email: ["Email atau password salah."] } }`. Pesan sama untuk email tidak terdaftar dan password salah.
- Akun member biasa (bukan admin) yang mencoba masuk diperlakukan sama seperti kredensial salah; tidak ada pesan yang membocorkan bahwa email itu milik member.
- Admin yang dinonaktifkan: `422` pada field `email` ('Akun admin ini sudah dinonaktifkan. Hubungi superadmin.'), setelah password terbukti benar. Admin yang undangannya belum diaktifkan belum punya password dan mendapat pesan kredensial salah.
- `GET /api/admin/session` tanpa sesi admin: `401`. Token member di endpoint admin juga `401`.
- Hak akses (`403`) dikembalikan API pada tiap endpoint admin; capability di bawah hanya mengatur tampilan.

## Types

```ts
type AdminRole = 'admin' | 'superadmin';

interface AdminLoginInput {
    email: string;
    password: string;
}

interface AdminSession {
    user: { id: string; name: string; email: string; role: AdminRole };
    can: {
        manageMembers: boolean; // semua admin: tambah/edit/nonaktifkan member
        manageEvents: boolean; // semua admin: kelola kegiatan dan peserta
        reviewExitRequests: boolean; // semua admin: setujui atau tolak permintaan keluar
        manageAdmins: boolean; // menu Admin (superadmin)
        manageSettings: boolean; // menu Pengaturan (superadmin)
        viewAuditLog: boolean; // menu Log (superadmin)
    };
    badges: { pendingExitRequests: number }; // angka di menu Permintaan Keluar
}
```

## Pertanyaan terbuka

- Admin dan member memakai token terpisah (`typ` `admin` dan `member`); rute admin menolak token member dan sebaliknya. Klaim `sub` token admin adalah UUID admin. API **memuat admin dari database pada setiap request**: admin yang dinonaktifkan atau dihapus langsung `401` (termasuk `POST /api/auth/refresh`), dan peran dibaca ulang sehingga perubahan peran berlaku seketika; tidak perlu menunggu token habis. State dummy endpoint admin lain masih disimpan di session store server yang dikunci klaim `sid`. Logout admin mencabut token admin saja (token member di `/api/admin/logout` dijawab `401`).
- Tujuan redirect setelah login: `/` (Dashboard). Redirect ke halaman asal sebelum 401 belum diputuskan.
- Akun pengembangan (seeder `AdminSeeder`, hanya environment `local`/`testing`, bukan credential production): `superadmin@bbb.test` / `superadmin123`, `admin@bbb.test` / `admin123`, `wahyuni.sari@bbb.org` / `admin123`, dan `tuti.handayani@bbb.org` (nonaktif). Admin lain dibuat lewat undangan (`admin-superadmin.md`). Email dicocokkan tanpa memperhatikan huruf besar/kecil dan spasi di tepi.
- `badges.pendingExitRequests` masih dihitung dari daftar permintaan keluar dummy (sama dengan layar Permintaan Keluar) sampai review admin dimigrasi (langkah 16).
- Remember me, lupa password admin, dan rate limit login belum ada desainnya; tidak dibuat.
