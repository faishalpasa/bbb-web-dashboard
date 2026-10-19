# Admin auth contract (DRAFT, awaiting approval)

RBAC tahap C–E: otorisasi endpoint admin mengikuti matriks permission di `admin-rbac.md`, menggantikan pembatasan role admin/superadmin yang disebut pada bagian historis dokumen ini. Permission kurang menghasilkan 403 `{ message: "Anda tidak memiliki izin untuk melakukan tindakan ini.", code: "permission_denied" }`. Login/session/refresh/aktivasi undangan sudah mengembalikan role + permissions efektif dan can legacy konservatif. Guard halaman/sidebar/tombol dashboard memakai permission (E); UI/API kelola role masih tahap F. Statistik lintas modul dashboard tetap mengikuti perilaku existing sampai keputusan penyaringan dikonfirmasi.

Status: **di MySQL**, diimplementasi di `bbb-api` (`/api/admin/*`, terpisah dari endpoint member) dan dipakai `web-dashboard`. Salinan identik ada di kedua repo; ubah bersamaan. Semua endpoint admin (login, sesi, undangan, dashboard, member, kegiatan, permintaan keluar, pengaturan, log) memakai MySQL.

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
type AdminRole = string; // nama role stabil, termasuk role custom
interface RoleSummary { id: string; name: string; label: string }

interface AdminLoginInput {
    email: string;
    password: string;
}

interface AdminSession {
    user: { id: string; name: string; email: string; role: AdminRole };
    role: RoleSummary;
    permissions: string[]; // dikenal resolver, dependency lengkap, unik dan urut alfabet
    can: {
        manageMembers: boolean; // seluruh permission member-*
        manageEvents: boolean; // seluruh permission event-* termasuk event-participant-*
        reviewExitRequests: boolean; // seluruh permission exit-request-*
        manageAdmins: boolean; // seluruh permission admin-*
        manageSettings: boolean; // seluruh permission setting-*
        viewAuditLog: boolean; // audit-log-view
    };
    badges: { pendingExitRequests: number }; // 0 tanpa exit-request-view
}
```

Session role dan permission dibaca dari assigned role DB pada setiap request, bukan enum legacy atau claim JWT. Bentuk sama di login, GET session, refresh admin dan accept invitation; endpoint penerbit token menambah token seperti sebelumnya. Akun active dengan permission kosong tetap dapat login/logout/session/refresh, tetapi endpoint operasional menolak 403. Permission yang tidak dikenal resolver atau dependency-nya belum terpenuhi tidak dikirim agar guard FE dan API konsisten. Label role dari server; tidak wajib berasal dari dua nama bawaan.

can dipertahankan untuk dashboard lama dan tidak memberi akses dari view saja. Misalnya role dengan member-view + member-create tetap mendapat manageMembers=false sampai seluruh izin member-* tersedia. Dashboard baru memakai permissions per aksi pada tahap E. Jangan memberi role custom parsial pada dashboard produksi lama sebelum tahap E.

## Pertanyaan terbuka

- Admin dan member memakai token terpisah (`typ` `admin` dan `member`); rute admin menolak token member dan sebaliknya. Klaim `sub` token admin adalah UUID admin. API **memuat admin beserta assigned role/grant dari database pada setiap request**: admin nonaktif/terhapus langsung `401` (termasuk refresh), perubahan role/permission berlaku dengan JWT hidup. Tidak ada state bisnis dummy. Logout admin hanya mencabut token admin.
- Tujuan redirect setelah login: `/` (Dashboard). Redirect ke halaman asal sebelum 401 belum diputuskan.
- Akun pengembangan (seeder `AdminSeeder`, hanya environment `local`/`testing`, bukan credential production): `superadmin@bbb.test` / `superadmin123`, `admin@bbb.test` / `admin123`, `wahyuni.sari@bbb.org` / `admin123`, dan `tuti.handayani@bbb.org` (nonaktif). Admin lain dibuat lewat undangan (`admin-superadmin.md`). Email dicocokkan tanpa memperhatikan huruf besar/kecil dan spasi di tepi.
- `badges.pendingExitRequests` menghitung `exit_requests.pending` hanya jika aktor memiliki exit-request-view; selain itu `0`, termasuk enum legacy superadmin yang grant-nya sudah dicabut.
- Remember me, lupa password admin, dan rate limit login belum ada desainnya; tidak dibuat.
