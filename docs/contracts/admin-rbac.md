# Admin RBAC contract

Status: **A–B dan D–E terimplementasi; C operasional terverifikasi dengan keputusan agregat dashboard pending; F masih target**. Keputusan pemilik 19 Oktober 2026: satu akun admin satu role; role dan assignment permission dikelola lewat dashboard; katalog permission hanya ditambah lewat migration database. Salinan harus identik di API dan dashboard.

Schema/backfill B tersedia; endpoint operasional memeriksa permission per aksi + dependency view. Lookup peserta minimal dan badge berbasis exit-request-view aktif. Tahap D mengembalikan role/permissions efektif dan can konservatif pada semua pembentuk session. Permission/role management endpoint dan assignment UI masih target F; guard FE per aksi, landing 403/no-access dan revalidasi session tersedia di E. dashboard-view melindungi endpoint dashboard, penyaringan per bagian menunggu keputusan. Ketentuan permission/error di sini mengesampingkan pembatasan role lama pada kontrak admin lain.

## Model dan sumber kebenaran

- `permissions`: UUID `id`, `name` unik (maks. 100 karakter). Nama stabil, lowercase kebab-case. Tidak ada endpoint create/update/delete permission.
- `roles`: UUID `id`, `name` unik dan stabil (maks. 100 karakter, lowercase kebab-case), `label` (maks. 100 karakter), `is_system`, timestamps UTC.
- `role_permissions`: FK `role_id` dan `permission_id`, composite primary key. Relasi permission RESTRICT; pivot milik role dihapus bersama role yang boleh dihapus.
- `admins.role_id`: FK ke roles, RESTRICT; tepat satu role termasuk akun invited/inactive. Nullable hanya selama backfill. Tidak ada permission langsung per admin.
- Migration mengisi katalog dan grant awal; migration berikutnya satu-satunya jalur menambah permission. Seeder tidak membuat/mengganti katalog atau menimpa role custom.
- Default deny; API memuat role dan permission dari DB per request (cache hanya dalam request). JWT tidak menjadi sumber permission. Status admin active tetap wajib.
- Member dan tamu publik tetap di luar RBAC dashboard.

## Katalog dan pemetaan endpoint

Semua route di bawah berawalan `/api/admin`. Aksi memerlukan view modul terkait juga. Dependency diperiksa pada save role dan saat otorisasi; tidak otomatis memperluas grant.

| Permission | Endpoint/operasi |
| --- | --- |
| dashboard-view | GET /dashboard |
| member-view | GET /members, /members/{id}, /members/options |
| member-create | POST /members |
| member-update | PUT /members/{id} |
| member-export | GET /members/export |
| member-activate | POST /members/{id}/activate |
| member-deactivate | POST /members/{id}/deactivate |
| member-reset-password | POST /members/{id}/reset-password |
| member-note-update | PUT /members/{id}/note |
| event-view | GET /events, /events/{id}, /events/options |
| event-create | POST /events (draft) |
| event-update | PUT /events/{id} |
| event-publish | Tambahan untuk POST publish=true atau transisi draft menjadi published pada PUT |
| event-duplicate | POST /events/{id}/duplicate; juga membutuhkan event-create |
| event-cancel | POST /events/{id}/cancel |
| event-close | POST /events/{id}/close |
| event-participant-view | GET /events/{id}/participants; juga membutuhkan event-view |
| event-participant-create | POST /events/{id}/participants |
| event-participant-export | GET /events/{id}/participants/export |
| event-participant-attendance-update | PUT /events/{id}/participants/{id}/attendance |
| exit-request-view | GET /exit-requests |
| exit-request-approve | POST /exit-requests/{id}/approve |
| exit-request-reject | POST /exit-requests/{id}/reject |
| setting-view | GET /settings |
| setting-update | PUT /settings |
| admin-view | GET /admins |
| admin-invite | POST /admins |
| admin-activate | POST /admins/{id}/activate |
| admin-deactivate | POST /admins/{id}/deactivate |
| admin-role-update | PUT /admins/{id}/role |
| role-view | GET /roles, /roles/{id}, /permissions |
| role-create | POST /roles |
| role-update | PUT /roles/{id} |
| role-delete | DELETE /roles/{id} |
| audit-log-view | GET /audit-logs |

Participant mutations require event-view + event-participant-view + permission aksinya. Edit event yang sudah published membutuhkan event-update; event-publish hanya untuk transisi terbit. Banner upload dan random attendance code memerlukan event-view serta salah satu event-create/event-update. Upload bukan izin publish.

Lookup role untuk undangan/assignment memakai GET /admins/role-options (admin-view + salah satu admin-invite/admin-role-update). Mengembalikan hanya role yang boleh diberikan aktor, tanpa membership atau permission role lain.

Menambah peserta member lewat picker tidak boleh diam-diam memberi member-view kepada operator kegiatan. Sebelum tahap C selesai, sediakan lookup minimal khusus GET /events/{id}/member-options?search=... dengan event-view + event-participant-view + event-participant-create: hasil maksimal 20 item { id, name, memberNumber }, query minimal 2 karakter, tanpa email/WhatsApp/profil lengkap. Server tetap memvalidasi eligibility saat POST peserta.

## Session dan kompatibilitas

Tambahan AdminSession yang sudah diimplementasikan di login, GET session, refresh admin, dan accept invitation:

```ts
interface RoleSummary { id: string; name: string; label: string }
interface RbacSessionFields {
    role: RoleSummary;
    permissions: string[]; // nama efektif yang dikenali resolver + dependency lengkap, unik, urut alfabet
}
```

`user.role` menjadi string nama role, termasuk custom. Field `can` dan envelope lama dipertahankan selama rollout; enam flag lama dihitung dari kumpulan permission lengkap untuk modulnya, bukan hanya view (menghindari FE lama menampilkan semua aksi kepada role view-only). FE baru tidak memakai flag itu untuk otorisasi. Deployment FE baru harus mendahului pemberian role custom yang parsial. Badge pendingExitRequests = 0 tanpa exit-request-view.

Permission hilang/unknown ditolak; daftar permission kosong bukan wildcard. Status/token invalid tetap 401; permission kurang 403 `{ message: "Anda tidak memiliki izin untuk melakukan tindakan ini.", code: "permission_denied" }`. 422 `{ message, errors }` untuk input/dependency/aturan bisnis; record tidak dikenal 404 `{ message: "Data tidak ditemukan." }`. Form Request tidak mengubah penolakan permission menjadi 422.

## API pengelolaan role dan assignment

| Method/path | Input dan hasil data |
| --- | --- |
| GET /permissions | { items: PermissionOption[] } |
| GET /roles | { items: RoleListItem[] }; urut name, tanpa pagination tahap awal |
| GET /roles/{id} | RoleDetail |
| POST /roles | RoleInput -> RoleDetail (201) |
| PUT /roles/{id} | RoleInput -> RoleDetail (name immutable, input hanya label + permissionIds) |
| DELETE /roles/{id} | 204 tanpa body |
| GET /admins/role-options | { items: RoleSummary[] } |
| PUT /admins/{id}/role | { roleId: string } -> AdminAccount dengan tambahan roleInfo: RoleSummary |

```ts
interface PermissionOption {
    id: string;
    name: string;
    label: string; // dari katalog kode, bukan kolom editable
    group: string; // dari katalog kode
    requires: string[]; // nama permission dependency
    isAssignable: boolean;
}
interface RoleInput { name: string; label: string; permissionIds: string[] }
interface RoleListItem extends RoleSummary { isSystem: boolean; adminCount: number }
interface RoleDetail extends RoleListItem { permissions: PermissionOption[] }
```

POST invite admin menambah field wajib roleId setelah FE siap; selama kompatibilitas, missing roleId memakai role admin bawaan dan tetap melalui pemeriksaan assignable. Accept invitation memakai role yang tersimpan pada akun saat diterima, tanpa menerima role dari payload penerima. AdminAccount.role { value, label } tetap ada; value menjadi nama role string, tambahan roleInfo memberi UUID assignment.

Nama/label di-trim, role name dinormalisasi lowercase; permissionIds wajib array UUID unik yang semuanya dikenal, [] diperbolehkan. Tidak ada implicit wildcard. Kesalahan memakai errors.name, errors.label, errors.permissionIds, errors.roleId sesuai input. Update/delete role dan assignment diaudit dalam transaksi yang sama (type admins), mencatat role serta selisih nama permission/assignment tanpa token/password.

## Proteksi akses

- Role sistem superadmin tidak bisa diedit/dihapus. Role admin bawaan juga tidak dihapus/rename; permission-nya boleh diubah dengan aturan subset. Role custom yang dipakai akun active/inactive/invited tidak bisa dihapus (422).
- Hanya superadmin dapat assign role superadmin. Role custom tidak boleh mengambil nama role sistem.
- Pengelola tidak boleh memberi permission di luar miliknya. Saat edit role, periksa gabungan permission lama dan baru terhadap permission aktor; role di luar cakupannya read-only. Saat assignment, target role DAN role lama akun harus dalam cakupan aktor; non-superadmin tidak boleh mengubah akun superadmin.
- Tidak boleh mengganti role sendiri atau menonaktifkan diri sendiri. Tidak boleh mengubah permission role sendiri melalui dashboard/API. Gunakan superadmin lain untuk perubahan itu.
- Kunci dan periksa ulang aktor, target admin, role, dan pivot di transaksi perubahan; paralel assignment/deactivate/edit-role tidak boleh melewati pemeriksaan last active superadmin. Urutan lock konsisten dan audit rollback bersama mutasi.
- Sistem harus mempertahankan minimal satu superadmin active. Command bootstrap/factory/seeder ikut diperiksa agar tetap cocok dengan role_id.

## Dashboard FE

Constant PERMISSIONS berisi nama permission persis dari katalog migration. Helper can/canAll/canAny serta route guard memakai session.permissions. Tidak ada role-name comparison untuk visibilitas.

Sidebar/list/detail memakai view; create/edit route memakai view + aksi. Tombol memakai permission + actions capability state bisnis dari API; tombol tidak sah disembunyikan. Request data participant tidak dijalankan tanpa participant-view walaupun detail event terbuka.

Route terlarang menampilkan 403. Login memilih halaman pertama yang diizinkan; akun tanpa view mendapatkan halaman "Akun belum memiliki akses" dengan logout, tanpa redirect loop. Session direvalidasi pada navigasi bila cache >60 detik, saat focus kembali, setelah assignment sendiri dari server diketahui, serta saat 403 permission_denied. Request bersama dideduplikasi; kegagalan jaringan bukan logout, 403 tidak memicu refresh token atau mengulang mutasi.

Halaman Role (tahap F): list `/roles`, buat `/roles/new` dan detail/edit `/roles/$roleId` sebagai halaman terpisah; tree permission per modul berupa checkbox bertingkat (modul → View → aksi turunan, parent indeterminate bila sebagian aktif), badge sistem, konfirmasi hapus. Keputusan pemilik 19 Oktober 2026: parent Member ON/OFF mengaktifkan/menonaktifkan seluruh child yang assignable; tampilkan penanda sebagian aktif bila hanya sebagian child ON. Toggle aksi ON menyalakan dependency view; view OFF mematikan seluruh aksi turunannya. Permission yang tidak assignable tetap disabled dan tidak boleh ikut dinyalakan parent; jelaskan read-only. Label child ramah dibaca (Member View, Member Create, Member Update, dst.), value tetap nama katalog migration. Member Delete hanya contoh bentuk tree, bukan penambahan permission baru (katalog saat ini memakai Activate/Deactivate). Halaman Admin: pilih role saat undang, tampilkan role label dan dialog ubah role. Tidak ada tombol membuat permission.

## Keputusan terbuka sebelum otorisasi dashboard tahap C

dashboard-view sekarang membuka statistik lintas modul dan admin bawaan memiliki akses ini. Pilih antara mempertahankan hak agregat itu atau membatasi setiap bagian menurut view modul. Rekomendasi: nullable bagian yang tidak diizinkan (bukan angka nol palsu), sinkronkan AdminDashboard di API/dashboard, dan tentukan grant view yang diperlukan untuk admin bawaan. Tahap A tidak mengklaim keputusan ini sudah disetujui; implementasi C untuk dashboard menunggu keputusan.

