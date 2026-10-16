# Admin exit request review contract (DRAFT)

Status: **dummy-data draft** untuk artboard 11. Diimplementasi di `bbb-api` dan dipakai `web-dashboard`; salinan identik di kedua repo. Auth, envelope, dan error mengikuti `admin-auth.md` dan `frontend-api.md`. Semua endpoint butuh sesi admin (`401` bila tidak ada). Keputusan fase dummy tersimpan per sesi browser dan terpisah dari alur pengajuan member (`/api/member/exit-request`).

| Method | URL | Result |
| --- | --- | --- |
| `GET` | `/api/admin/exit-requests?status` | `{ items: ExitRequest[], summary }`; `status` = `pending` (default), `approved`, `rejected`, atau `all` |
| `POST` | `/api/admin/exit-requests/{id}/approve` | -> `ExitRequest`; `422` bila sudah diputuskan |
| `POST` | `/api/admin/exit-requests/{id}/reject` | `{ reason }` -> `ExitRequest`; `reason` wajib, maks. 1000 karakter |

```ts
interface ExitRequest {
    id: string;
    member: { id: string; name: string; memberNumber: string | null };
    reason: string | null; // alasan dari member; null bila tidak diisi
    submittedAt: string; // ISO 8601 UTC
    attempt: number; // 1 = pengajuan pertama, 2 = pengajuan ulang setelah ditolak, dst.
    upcomingRegistrations: number; // pendaftaran kegiatan mendatang yang akan dibatalkan bila disetujui
    waiting: { days: number; isOverdue: boolean };
    status: { value: 'pending' | 'approved' | 'rejected'; label: string };
    decidedAt: string | null;
    rejectionReason: string | null;
}
// summary: { pendingTotal: number; overdueTotal: number; overdueAfterDays: number }
```

## Aturan

- Daftar diurutkan dari pengajuan tertua. `waiting.isOverdue` bernilai true bila menunggu lebih dari `overdueAfterDays` (3) hari.
- Setuju: status member menjadi `inactive`. Pendaftaran kegiatan mendatang dibatalkan oleh API pada implementasi nyata; fase dummy belum menyimulasikannya.
- Tolak: alasan wajib. Alasan dikirim ke member lewat email dan tampil di Beranda member (email tidak dikirim di fase dummy). Member yang menunggu keputusan kembali `active`.
- Jumlah permintaan menunggu juga dipakai sebagai `badges.pendingExitRequests` pada `GET /api/admin/session` dan angka di dashboard.

## Terbuka

- Konfirmasi sebelum "Setujui" tidak ada di artboard; dashboard menambahkan dialog konfirmasi karena aksinya menonaktifkan member.
- Riwayat keputusan (status selain `pending`) belum punya layar di desain; API menyediakannya lewat `status=all`.
