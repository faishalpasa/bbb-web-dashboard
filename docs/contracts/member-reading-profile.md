# Profil tambahan dan minat bacaan member

Tanggal: 20 Oktober 2026. Track masterlist tahap 3. Kontrak shared identik di API, web-app, dan dashboard; tambahan aditif, envelope/status/error existing tetap.

## Keputusan pemilik

Semua tambahan opsional di onboarding baru/migrasi, edit profil member dan tambah/edit member admin. Tidak mewajibkan onboarding ulang member active. Gunakan pola card/form existing dan checkbox multi-select. Instagram/Goodreads maksimal 255 karakter, website HTTP/HTTPS maksimal 2.048, buku/penulis dan teks Lainnya maksimal 5.000. Lainnya wajib diisi ketika pilihan Lainnya disubmit.

## Bentuk data

```ts
interface ReadingInterestOption { id: string; code: string; label: string }
interface ReadingProfileOptions {
    readingInterests: ReadingInterestOption[]; // urut position katalog
    literacyParticipationInterests: { value: string; label: string }[]; // yes/no/maybe
    preferredContactChannels: { value: string; label: string }[]; // email/whatsapp
}
interface ReadingProfile {
    instagramAccount: string | null;
    websiteUrl: string | null;
    goodreadsAccount: string | null;
    favoriteBooksAuthors: string | null;
    literacyParticipationInterest: { value: string; label: string } | null;
    preferredContactChannel: { value: string; label: string } | null;
    readingInterestOther: string | null;
    readingInterests: ReadingInterestOption[];
}
interface ReadingProfileInput {
    instagramAccount?: string | null;
    websiteUrl?: string | null;
    goodreadsAccount?: string | null;
    favoriteBooksAuthors?: string | null;
    literacyParticipationInterest?: 'yes' | 'no' | 'maybe' | null;
    preferredContactChannel?: 'email' | 'whatsapp' | null;
    readingInterestOther?: string | null;
    readingInterestIds?: string[]; // UUID unik dari katalog; [] mengosongkan pilihan
}
```

- MemberProfile dan MemberDetail admin menambahkan field ReadingProfile.
- Draft migrated-profile menambahkan field ReadingProfile juga (nama baru, enum pasangan value/label; field draft lama tetap).
- OnboardingProfileData, MigratedProfileData, MemberProfileData dan GET /api/admin/members/options menambahkan readingProfileOptions.
- Input POST onboarding/profile, POST onboarding/migrated-profile, PUT member/profile, POST/PUT admin/members menerima ReadingProfileInput.
- Tidak ada route baru, perubahan AuthSession, kolom list/CSV, grant atau UI kelola katalog. Katalog hanya melalui migration.

## Simpan, validasi dan kompatibilitas

Key yang tidak dikirim mempertahankan nilai/pivot existing. null/string kosong atau hanya spasi mengosongkan scalar ke null; readingInterestIds harus array list, tidak boleh null, UUID valid/unik/known. Urutan pilihan dari server, bukan urutan array submit. Trim teks, tidak menebak handle dari URL atau menambahkan scheme. Website hanya HTTP/HTTPS valid; akun sosial plain text, bukan HTML/link otomatis. Buku/penulis dan Lainnya plain text, render escaped.

Jika readingInterestIds atau readingInterestOther dikirim dan pilihan efektif mencakup code other, teks efektif harus terisi. Pada partial update, teks/ID yang omitted memakai nilai existing. Payload lama yang mengirim keduanya tidak ada tetap boleh menyimpan tanpa memalsukan/memaksa jawaban historis. Scalar dan pivot disimpan dalam transaksi action existing yang sama; rollback bersama nomor/user/profil. FE mengirim null pada teks Lainnya ketika pilihan Lainnya dilepas.

422 {message, errors} mengikuti nama camelCase; error ID per index readingInterestIds.0, dst. UI merangkum error array pada field minat, mempertahankan draft dan tidak mengulang POST otomatis. Tidak menyentuh partisipasi online/offline, consent historis, status, identitas, kelurahan atau preferensi komunikasi sebagai bukti email verified/marketing consent.

Izin/status existing tetap: member hanya profil sendiri dari JWT; restricted/migrated mengikuti gate existing; admin butuh member-view + member-create/member-update, read detail/options memakai member-view. Member tambahan tidak bocor ke list event/peserta/publik/session.

## Cutover

Schema tahap 2 harus applied sebelum API baru karena presenter/options membaca tabel katalog. Rollout API terlebih dahulu lalu kedua FE; payload FE lama tetap sah dan tidak menghapus tambahan. Tidak menjalankan import atau seeder fixture. Backup dan periksa migration pending sebelum migrate; jangan migrate:fresh di development/Hostinger. Deploy/publikasi memerlukan instruksi terpisah.
