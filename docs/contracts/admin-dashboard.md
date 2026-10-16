# Admin dashboard contract (DRAFT)

Status: **dummy-data draft** untuk artboard 8. Diimplementasi di `bbb-api` dan dipakai `web-dashboard`; salinan identik di kedua repo. Auth, envelope, dan error mengikuti `admin-auth.md` dan `frontend-api.md`.

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

Angka kegiatan (mendatang, draf, belum ditutup, kehadiran terakhir) berasal dari data kegiatan di `admin-events.md`.

Catatan: baris "Perlu Tindakan" dengan `count` 0 tidak ditampilkan. `latestAttendance` bernilai `null` bila belum ada kegiatan yang selesai.
