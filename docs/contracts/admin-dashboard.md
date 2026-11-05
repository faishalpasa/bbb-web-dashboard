# Admin dashboard contract

RBAC tahap C–E: otorisasi endpoint admin mengikuti matriks permission di `admin-rbac.md`, menggantikan pembatasan role admin/superadmin yang disebut pada bagian historis dokumen ini. Permission kurang menghasilkan 403 `{ message: "Anda tidak memiliki izin untuk melakukan tindakan ini.", code: "permission_denied" }`. Login/session/refresh/aktivasi undangan sudah mengembalikan role + permissions efektif dan can legacy konservatif. Guard halaman/sidebar/tombol dashboard memakai permission (E); UI/API kelola role masih tahap F. Statistik lintas modul dashboard tetap mengikuti perilaku existing sampai keputusan penyaringan dikonfirmasi.

Status: **di MySQL (langkah 18)** untuk artboard 8. Diimplementasi di `bbb-api` dan dipakai `web-dashboard`; salinan identik di kedua repo. Auth, envelope, dan error mengikuti `admin-auth.md` dan `frontend-api.md`.

| Method | URL | Result |
| --- | --- | --- |
| `GET` | `/api/admin/dashboard` | `AdminDashboard`; `401` tanpa sesi admin |

Server mengirim angka dan label bisnis; frontend merangkai kalimat Indonesia dari angka (mis. "36 member baru bulan ini") dan memformat tanggal ke WIB.

```ts
interface AdminDashboard {
    asOf: string; // ISO 8601 UTC, ditampilkan sebagai "Data per ..."
    stats: {
        members: { total: number; newThisMonth: number };
        activeMembers: { total: number };
        exitRequests: { pending: number; overdue: number; overdueAfterDays: number };
        upcomingEvents: { total: number; full: number };
    };
    actions: {
        exitRequestsPending: { count: number; overdue: number; overdueAfterDays: number };
        draftEvents: { count: number };
        incompleteMembers: { count: number; afterDays: number };
        unclosedPastEvents: { count: number };
    };
    upcomingEvents: { id: string; title: string; startsAt: string; registered: number; quota: number | null }[]; // quota null = tanpa kuota
    memberGrowth: { month: string; newMembers: number }[]; // 6 bulan kalender WIB, termasuk bulan berjalan
    memberStatuses: { status: 'active' | 'migrated' | 'exit_requested' | 'unsubscribed'; label: string; count: number }[];
    eventPerformance: {
        eventId: string;
        eventTitle: string;
        startsAt: string;
        registered: number;
        attended: number;
        percent: number;
    }[]; // maksimal 6 kegiatan completed terbaru, termasuk yang belum punya pendaftar
}
```

Cara menghitung (semua dari tabel, jumlah query tetap):

- `members.total` = semua member; `newThisMonth` = `joined_at` sejak awal bulan kalender di Jakarta (WIB).
- `activeMembers.total` = member berstatus `active` saat respons dibuat; bukan ukuran kehadiran dan bukan riwayat status.
- `exitRequests` dan `actions.exitRequestsPending` = permintaan keluar `pending` (lihat `admin-exit-requests.md`).
- `upcomingEvents` = kegiatan `published` yang belum mulai, urut `startsAt`; `registered` = pendaftaran bukan `cancelled` (member + tamu); `full` = berkuota dan `registered >= quota`. Daftar di bawah `upcomingEvents` hanya 3 teratas.
- `draftEvents` = status `draft`; `unclosedPastEvents` = `published` dengan `endsAt` sudah lewat; `incompleteMembers` = member `migrated` (menunggu data) yang dibuat lebih dari 7 hari lalu.
- `memberGrowth` = jumlah member dengan `joined_at` pada masing-masing dari 6 bulan kalender WIB terakhir, termasuk bulan berjalan; bulan kosong tetap dikirim 0. Ini **member baru**, bukan rekonstruksi status aktif historis. Member yang dihapus lunak tidak dihitung.
- `memberStatuses` = jumlah member saat ini untuk keempat status, urutan active/migrated/exit_requested/unsubscribed; jumlahnya sama dengan `stats.members.total`. `activeMembers.total` sama dengan count active di sini.
- `eventPerformance` = maksimal 6 kegiatan berstatus `completed` terbaru menurut `starts_at` lalu id, terbaru dahulu. `registered` adalah pendaftaran selain `cancelled` (member + tamu), `attended` adalah `present`, dan `percent` = hadir/terdaftar dibulatkan (0 bila belum ada pendaftar). Kegiatan belum ditutup tidak masuk.

Catatan: baris "Perlu Tindakan" dengan `count` 0 tidak ditampilkan. `eventPerformance` adalah array kosong bila belum ada kegiatan yang selesai. Field lama `engaged`, `participationPreferences`, `provinces`, dan `latestAttendance` dihapus dari respons dashboard.
