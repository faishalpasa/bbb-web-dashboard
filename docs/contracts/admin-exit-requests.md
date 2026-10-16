# Admin exit request review contract

Status: **di MySQL (langkah 16)**. Diimplementasi di `bbb-api` dan dipakai `web-dashboard`; salinan identik di kedua repo. Auth, envelope, dan error mengikuti `admin-auth.md` dan `frontend-api.md`. Semua endpoint butuh token admin (`401` bila tidak ada atau token member). Daftar membaca tabel `exit_requests` yang sama dengan alur pengajuan member (`/api/member/exit-request`); id adalah UUID. Permintaan yang dibatalkan member sendiri tidak pernah tampil, juga di `status=all`.

| Method | URL | Result |
| --- | --- | --- |
| `GET` | `/api/admin/exit-requests?status` | `{ items: ExitRequest[], summary }`; `status` = `pending` (default), `approved`, `rejected`, atau `all` |
| `POST` | `/api/admin/exit-requests/{id}/approve` | -> `ExitRequest`; `422` bila sudah diputuskan atau sudah dibatalkan member |
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

- Daftar diurutkan dari pengajuan tertua (`submitted_at`, lalu id); `status` tak dikenal dianggap `pending`. `reason` = label alasan pilihan member, diikuti ` — {cerita member}` bila ia menulis cerita (hanya cerita bila tanpa alasan terpilih). `waiting.days` dihitung sampai sekarang untuk yang menunggu, sampai `decidedAt` untuk yang sudah diputuskan. `waiting.isOverdue` bernilai true bila menunggu lebih dari `overdueAfterDays` (3) hari.
- Setuju: status member menjadi `unsubscribed` (tampil `inactive` di layar admin), pendaftaran kegiatan yang belum berakhir dibatalkan (biasanya sudah 0 karena pengajuan sudah membatalkannya), `decided_by`/`decided_at` terisi, dan satu baris audit log tipe `members` ditulis dalam transaksi yang sama.
- Tolak: alasan wajib. Alasan dikirim ke member lewat email dan tampil di Beranda member (email belum dikirim; tampil di Beranda member belum dibuat). Member yang menunggu keputusan kembali `active` (member yang sudah dinonaktifkan manual tidak diubah) dan satu baris audit log ditulis.
- `upcomingRegistrations` = pendaftaran `registered` pada kegiatan `published` yang belum berakhir.
- Jumlah permintaan menunggu juga dipakai sebagai `badges.pendingExitRequests` pada `GET /api/admin/session` dan angka di dashboard.

## Terbuka

- Konfirmasi sebelum "Setujui" tidak ada di artboard; dashboard menambahkan dialog konfirmasi karena aksinya menonaktifkan member.
- Riwayat keputusan (status selain `pending`) belum punya layar di desain; API menyediakannya lewat `status=all`.
