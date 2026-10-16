# Admin auth contract (DRAFT, awaiting approval)

Status: **dummy-data draft**, diimplementasi di `bbb-api` (`/api/admin/*`, terpisah dari endpoint member) dan dipakai `web-dashboard`. Salinan identik ada di kedua repo; ubah bersamaan.

Keputusan produk yang sudah ada:

- Login admin memakai **email + password** saja (tanpa Google). Desain: adaptasi artboard 1a, bukan artboard khusus.
- Akun admin dibuat lewat undangan (artboard 13a-13c); setelah aktif, admin masuk dengan email dan password yang dibuat saat aktivasi.
- Sesi member bukan bukti akses admin.

Transport, CSRF, envelope `{ data }` dan format error mengikuti `frontend-api.md`.

## Endpoint

| Method | URL | Payload/result |
| --- | --- | --- |
| `POST` | `/api/admin/login` | `AdminLoginInput` -> `AdminSession` |
| `GET` | `/api/admin/session` | `AdminSession` (`401` bila belum masuk sebagai admin) |
| `POST` | `/api/admin/logout` | `204` tanpa body |

- Kredensial salah: `422 { message, errors: { email: ["Email atau password salah."] } }`. Pesan sama untuk email tidak terdaftar dan password salah.
- Akun member biasa (bukan admin) yang mencoba masuk diperlakukan sama seperti kredensial salah; tidak ada pesan yang membocorkan bahwa email itu milik member.
- Admin yang dinonaktifkan atau undangannya belum diaktifkan: `422` pada field `email` dengan `message` Indonesia.
- `GET /api/admin/session` tanpa sesi admin: `401`. Sesi member pada cookie yang sama tetap `401` di endpoint admin.
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

- Cookie sesi berbagi host `localhost` (cookie tidak membedakan port), jadi admin dan member memakai satu cookie sesi Laravel. Fase dummy memisahkannya lewat key sesi: login admin hanya menulis key admin, sesi member tidak pernah dianggap admin, dan logout admin hanya menghapus key admin. Logout member (`invalidate`) tetap mengakhiri seluruh sesi, termasuk admin. Pemisahan cookie per guard dibahas saat fase database.
- Tujuan redirect setelah login: `/` (Dashboard). Redirect ke halaman asal sebelum 401 belum diputuskan.
- Credential dummy (hanya fase dummy, `App\Support\Dummy\DummyAdmins`): `superadmin@bbb.test` / `superadmin123` dan `admin@bbb.test` / `admin123`.
- Remember me, lupa password admin, dan rate limit login belum ada desainnya; tidak dibuat.
