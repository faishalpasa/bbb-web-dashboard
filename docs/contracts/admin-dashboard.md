# Admin dashboard contract

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
        engaged: { total: number; minAttendance: number; windowMonths: number };
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
    participationPreferences: { value: 'online' | 'offline' | 'both' | 'unset'; label: string; percent: number }[];
    provinces: { name: string; percent: number }[]; // 5 teratas dari member aktif
    latestAttendance: {
        eventId: string;
        eventTitle: string;
        startsAt: string;
        registered: number;
        attended: number;
        absent: number;
        percent: number;
        averagePercent: number; // rata-rata beberapa kegiatan terakhir
        averageEventCount: number;
    } | null;
}
```

Cara menghitung (semua dari tabel, jumlah query tetap):

- `members.total` = semua member; `newThisMonth` = `joined_at` sejak awal bulan kalender di Jakarta (WIB).
- `engaged.total` = member **aktif** yang hadir (`present`) minimal 1 kegiatan yang mulai dalam `windowMonths` bulan terakhir (sampai sekarang); `windowMonths` dari Pengaturan.
- `exitRequests` dan `actions.exitRequestsPending` = permintaan keluar `pending` (lihat `admin-exit-requests.md`).
- `upcomingEvents` = kegiatan `published` yang belum mulai, urut `startsAt`; `registered` = pendaftaran bukan `cancelled` (member + tamu); `full` = berkuota dan `registered >= quota`. Daftar di bawah `upcomingEvents` hanya 3 teratas.
- `draftEvents` = status `draft`; `unclosedPastEvents` = `published` dengan `endsAt` sudah lewat; `incompleteMembers` = member `migrated` (menunggu data) yang dibuat lebih dari 7 hari lalu.
- `participationPreferences` dan `provinces` = porsi dari member **aktif**; persen preferensi dibulatkan dengan metode sisa terbesar agar jumlahnya 100 (semua 0 bila belum ada member aktif); provinsi: 5 teratas (jumlah member, lalu nama), member tanpa provinsi tidak masuk daftar tetapi ikut penyebut.
- `latestAttendance` = kegiatan `completed` dengan `startsAt` terbaru; `registered` bukan `cancelled`, `attended` = `present`, `absent` = sisanya; `averagePercent` = total hadir / total terdaftar dari maksimal 6 kegiatan selesai terakhir (`averageEventCount` = jumlahnya).

Catatan: baris "Perlu Tindakan" dengan `count` 0 tidak ditampilkan. `latestAttendance` bernilai `null` bila belum ada kegiatan yang selesai.
