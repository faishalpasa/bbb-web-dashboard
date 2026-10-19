# Event registration form contract (target)

Tanggal: 19 Oktober 2026. Status: **tahap 2–5 terimplementasi dan teruji lokal (konfigurasi API, builder dashboard, submit member/publik/admin, detail peserta dan warna tombol); belum di-deploy**. Tahap 6 (cutover dan verifikasi deploy) masih target. Keputusan produk utama sudah disetujui pemilik. Bagian "Perlu dipastikan" bukan keputusan yang sudah disetujui.

Salinan dokumen ini harus identik di bbb-api, web-app, dan web-dashboard. Tambahan admin EventDetail.registrationForm sudah berlaku di kode lokal tahap 2. Endpoint/payload submit, prefill, publik dan detail jawaban di bawah aktif di kode lokal; belum di-deploy. Setelah cutover, dokumen ini menggantikan ketentuan pendaftaran kegiatan yang bertentangan, bukan aturan auth/onboarding/profil.

## Keputusan produk

- Create/edit event memiliki section Registration Form.
- Urutan custom field dapat diganti lewat drag-and-drop pada pegangan khusus, keyboard, atau tombol naik/turun. Nama/Email tetap di awal. ID field/opsi, nilai, dan required tidak berubah saat dipindahkan; pengurutan ikut terkunci setelah pendaftaran pertama.
- Nama dan Email selalu wajib, urutan pertama dan kedua; bukan custom field, tidak bisa dihapus, diganti tipe, atau dibuat opsional. Email divalidasi server.
- Member dashboard: Nama dan Email otomatis terisi dari identitas member, read-only. Identitas tetap ditentukan token/memberId yang diotorisasi, bukan input browser. Tidak mengubah profil.
- Custom field boleh kosong (tidak ada pertanyaan tambahan). Jenis: Input, Textarea, Select, Radio; masing-masing dapat wajib atau opsional.
- Form publik berubah menjadi Nama + Email + custom, dengan persetujuan tetap dipertahankan. WhatsApp, wilayah, dan tahun lahir tidak lagi menjadi field tetap/wajib untuk daftar kegiatan. Onboarding/profil member tidak berubah.
- Admin tambah peserta juga harus melengkapi custom field wajib; tidak ada bypass source=admin.
- Struktur form terkunci setelah pendaftaran pertama yang berhasil, termasuk bila kemudian semua peserta membatalkan. Detail kegiatan tetap mengikuti aturan edit existing.
- Daftar peserta memiliki CTA Detail: modal desktop / bottom sheet mobile, read-only, menampilkan identitas dan jawaban sesuai snapshot pendaftaran.
- Duplikasi menyalin definisi form ke draf baru dengan ID field/opsi baru, tanpa peserta/jawaban/lock sumber.
- Duplikat Kegiatan memakai warning; Batalkan Kegiatan memakai danger. Konfirmasi pembatalan dan permission existing tetap berlaku.
- Export custom answers dan edit jawaban setelah submit di luar scope awal.

### Batas yang disetujui pemilik pada tahap 2

- Maksimal 30 custom field per event; label field maksimal 255 karakter.
- Input maksimal 255 karakter; Textarea maksimal 5.000 karakter.
- Select/Radio maksimal 50 pilihan per field, label pilihan maksimal 255 karakter.
- Batas definisi ditegakkan pada tahap 2; batas jawaban akan ditegakkan validator submit tahap 4. Label di-trim dan tidak boleh kosong.

## Bentuk definisi dan isian

Nama/Email adalah field sistem terpisah, tidak dimasukkan ke fields/answers. ID adalah UUID string. Semua datetime ISO 8601 UTC. Array fields/options menentukan urutan tampilan.

```ts
type RegistrationFieldType = 'input' | 'textarea' | 'select' | 'radio';
interface RegistrationOption { id: string; label: string }
interface RegistrationField {
    id: string;
    type: RegistrationFieldType;
    label: string;
    required: boolean;
    options: RegistrationOption[]; // [] untuk input/textarea
}
interface RegistrationFormDefinition {
    version: number; // integer positif, mulai 1; naik bila struktur berubah
    fields: RegistrationField[];
}
interface AdminRegistrationForm extends RegistrationFormDefinition {
    lockedAt: string | null; // historis, tidak dihitung dari jumlah peserta aktif
}
interface RegistrationAnswerInput {
    fieldId: string;
    value: string | null; // teks untuk input/textarea; option UUID untuk select/radio
}
interface RegistrationSubmissionInput {
    formVersion: number;
    answers: RegistrationAnswerInput[]; // [] valid bila tanpa custom field
}
interface RegistrationIdentity { name: string; email: string }
interface RegistrationFormData {
    registrationForm: RegistrationFormDefinition;
    identity: RegistrationIdentity; // read-only, khusus endpoint terautentikasi
}
interface RegistrationAnswerSnapshot {
    fieldId: string;
    type: RegistrationFieldType;
    label: string;
    required: boolean;
    options: RegistrationOption[];
    value: string | null;
    displayValue: string | null; // label pilihan saat submit, atau teks
}
interface RegistrationResponse {
    id: string;
    formVersion: number;
    name: string;
    email: string;
    submittedAt: string;
    answers: RegistrationAnswerSnapshot[];
}
```

Input definisi memakai RegistrationFormDefinition. Editor membuat UUID untuk field/opsi baru dan mempertahankan ID saat edit; server memastikan ID tidak milik event/field lain. Update mengirim versi yang dibaca, server yang menaikkan version; create memakai version=1. Client tidak boleh menetapkan versi berikutnya sendiri.

Jawaban optional yang kosong dinormalisasi null; field optional boleh tidak ada di request, lalu dimasukkan sebagai null ke snapshot. Tidak boleh ada fieldId ganda/tidak dikenal/milik event lain. Select/Radio single-choice, bukan multi-select, value harus ID opsi dari field tersebut; array/nested object ditolak. Snapshot disusun dari definisi server, bukan label/type/options/displayValue yang dikirim browser.

## Endpoint target

Tahap 2 mengimplementasikan POST/GET/PUT event admin dan duplicate dengan konfigurasi form; tahap 4–5 menambah prefill, submit dan detail peserta. Tidak ada route baru atau grant permission baru pada tahap 2.

Semua respons sukses JSON tetap { data: ... }. Endpoint mutasi existing mempertahankan bentuk hasil/status existing kecuali tambahan EventDetail.registrationForm yang disebut eksplisit.

| Method / URL | Input / hasil data | Otorisasi |
| --- | --- | --- |
| POST /api/admin/events | EventInput + registrationForm -> EventDetail + registrationForm: AdminRegistrationForm (201) | event-view + event-create; event-publish bila terbit |
| PUT /api/admin/events/{id} | EventInput + registrationForm -> EventDetail + registrationForm: AdminRegistrationForm | event-view + event-update; publish mengikuti existing |
| GET /api/admin/events/{id} | EventDetail + registrationForm: AdminRegistrationForm | event-view |
| POST /api/admin/events/{id}/duplicate | EventDetail + registrationForm: AdminRegistrationForm draf baru (201) | event-view + event-duplicate + event-create |
| GET /api/member/events/{eventId}/registration-form | RegistrationFormData, identitas pemilik JWT | token member lengkap/active; visibility event existing |
| POST /api/member/events/{eventId}/registrations | RegistrationSubmissionInput -> EventRegistration existing | token member lengkap/active; eligibility existing |
| GET /api/public/events/{slug} | PublicEventDetail existing + registrationForm: RegistrationFormDefinition | publik; visibility existing |
| POST /api/public/events/{slug}/registrations | RegistrationSubmissionInput + name + email + consentVersion -> { email } (201) | publik; cutoff/kuota/throttle existing |
| GET /api/admin/events/{id}/registration-form?memberId={uuid} | RegistrationFormData untuk member yang akan ditambahkan | event-view + event-participant-view + event-participant-create |
| POST /api/admin/events/{id}/participants | RegistrationSubmissionInput + memberId ATAU RegistrationSubmissionInput + name + email -> EventParticipant existing (201) | event-view + event-participant-view + event-participant-create |
| GET /api/admin/events/{id}/participants/{participantId} | { participant: EventParticipant, registrationResponse: RegistrationResponse \| null } | event-view + event-participant-view |

- Endpoint prefill admin hanya untuk member eligible yang dipilih dalam konteks kegiatan. Tidak mengubah endpoint member-options (tetap id/name/memberNumber), tidak memberi member-view, tidak membocorkan profil/region/WhatsApp umum.
- Nama/email pada submit member (termasuk admin memilih member) tidak diterima sebagai override; server menggunakan identitas DB dalam transaksi. Bila profil berubah sejak prefill, snapshot memakai identitas saat submit.
- Endpoint publik tetap anonim: tidak memuat identitas member dari token, tidak mengubah tamu menjadi member berdasarkan email. Autofill terkunci berlaku di alur dashboard member. Link meeting tetap tidak boleh masuk respons publik.
- Detail peserta memeriksa relasi participantId dengan eventId; mismatch, unknown, malformed atau registrasi cancelled -> 404 `{ message: "Data tidak ditemukan." }`, tanpa membocorkan jawaban kegiatan lain. Respons tidak memuat bukti consent (consent_evidence berisi adminId) dan tidak ada di list peserta. Tidak mengirim semua jawaban pada list peserta. Riwayat cancelled tetap mengikuti aturan list existing, bukan akses baru yang ditebak.
- Belum ada endpoint PUT/PATCH jawaban, endpoint export jawaban, atau permission baru. Kode middleware harus menambahkan pemetaan eksplisit route baru; unknown route tetap default deny.
- Detail identitas/form tidak boleh dijadikan jalur menambah peserta ke kegiatan yang tidak eligible. Eligibility diperiksa ulang saat POST; GET tidak memesan kursi.

Contoh submit member (ID ilustratif, bukan fixture credential):

```json
{
  "formVersion": 1,
  "answers": [
    { "fieldId": "7fb6c24a-6c27-4ac2-ae3b-c6738a50e6d2", "value": "Saya ingin berdiskusi tentang buku anak." },
    { "fieldId": "33fe63a4-3ca4-43c6-b68e-e0d5144fb3c9", "value": "3f0eaa90-c708-413c-869b-05180e7f0418" }
  ]
}
```

## Validasi, lock, dan error

- Definisi: tipe dikenal, label terisi, ID unik, required boolean, Input/Textarea tanpa options, Select/Radio punya pilihan nonkosong dengan label dan ID unik. Field sistem tidak dapat dibuat ulang sebagai field sistem custom; label custom bukan key identitas.
- Nama/email mengikuti batas existing (255 karakter), trim, email lowercase dan validasi email server. Custom text adalah plain text; render escaped, tidak menerima HTML/script sebagai markup.
- Definisi berubah sejak editor/form dibuka: 422 dengan code registration_form_changed dan errors.registrationForm.version (edit event) atau errors.formVersion (submit peserta). FE meminta muat ulang; tidak mengulang POST otomatis.
- Perubahan struktur setelah lockedAt terisi: 422 code registration_form_locked dan errors.registrationForm. Mengirim definisi yang identik diperbolehkan untuk menyimpan detail kegiatan; field, label, tipe, required, options, dan urutan semuanya bagian struktur.
- Omit registrationForm pada PUT event mempertahankan definisi existing, tidak menghapus custom field. Create tanpa registrationForm selama rollout menyiapkan default version=1, fields=[]; FE baru selalu mengirim definisi.
- Validasi input: 422 { message, errors }. Key mengikuti payload: name, email, consentVersion, formVersion, answers, answers.0.fieldId, answers.0.value, registrationForm.fields.0.label, dst. UI memetakan index error ke fieldId yang disubmit.
- Field wajib ditolak bila tidak diisi; optional kosong null. Pesan Indonesia, member disebut Ibu.
- Kuota penuh/cutoff/duplicate/status tetap aturan dan code existing, bukan diganti error form. Semua pengecekan final, jawaban, pendaftaran, dan first lock tersimpan atomik; kegagalan tidak mengambil kursi, membuat guest yatim, atau mengunci form.
- 401/403 existing tidak diubah; permission denial 403 code permission_denied. 404 tetap { message: "Data tidak ditemukan." }.
- Recheck definisi versi terbaru di bawah lock event. Race edit form vs pendaftaran pertama harus menghasilkan satu urutan sah: edit menang -> submit versi lama ditolak; submit menang -> edit struktur ditolak.
- Pendaftaran yang sudah aktif tetap duplicate, bukan update jawaban diam-diam.

## Data lama dan kompatibilitas

- Tidak membuat response palsu untuk peserta lama. Detail mengembalikan registrationResponse=null dan UI "Belum ada data formulir". Tidak mengisi snapshot dari profil terkini seolah-olah jawaban historis.
- Existing event tanpa konfigurasi mendapatkan default Nama+Email, version=1, fields=[].
- Existing event yang pernah punya registration (termasuk cancelled) harus terkunci sejak backfill; jangan memakai hitungan peserta aktif. Tanpa histori sama sekali tetap editable.
- event_guests.whatsapp perlu nullable untuk tamu baru; region/birth_year sudah nullable. Data lama tidak dihapus/dikosongkan, unique email per event serta CHECK owner XOR tetap.
- EventParticipant.whatsapp tetap string: data yang tidak tersedia dikirim sebagai ''. Tombol Chat disembunyikan seperti perilaku FE existing. Custom field berlabel WhatsApp tidak otomatis dipetakan ke kolom telepon/CTA.
- CSV existing tetap kolom lama; data WhatsApp/region kosong tidak boleh menyebabkan error. Tidak menambahkan kolom jawaban tanpa perubahan scope.
- Menghapus field tetap publik berarti syarat usia minimum berdasarkan birthYear tidak lagi dapat diverifikasi dalam flow ini. Onboarding dan profil tetap punya syarat usia existing; jangan membuat tanggal lahir/pernyataan usia baru tanpa keputusan pemilik.
- Nama/email/form snapshot tidak dikirim ke endpoint publik, metadata/JSON-LD, log console, atau audit yang tidak memerlukannya. Email konfirmasi tetap ke identitas hasil submit; mail dibuat/diantrekan setelah commit dengan aturan link existing.
- Tahap 2 hanya menambah konfigurasi pada detail event admin. Member/public belum menerima definisi dan belum punya endpoint prefill/detail jawaban. Jangan memanggil route yang belum diimplementasikan.
- Pengaman sementara tahap 2: ketiga writer daftar lama (member, guest publik, admin member/guest) menolak event dengan custom field memakai 422 code registration_form_required dan errors.answers; tidak membuat guest/registrasi/jawaban atau mengunci form pada penolakan. Event tanpa custom field tetap memakai alur lama dan mencatat first lock setelah sukses. Guard ini diganti validasi + snapshot saat tahap 4, bukan dilepas tanpa pengganti. Jangan aktifkan custom form di lingkungan bersama sebelum UI submit siap.
- API-first deployment saja tidak cukup: payload member lama kosong dan publik lama berbeda. Rilis final perlu cutover terkoordinasi API + kedua FE dengan pendaftaran dihentikan sementara sampai semuanya siap; jangan menjalankan client lama yang melewati form wajib. Prosedur/maintenance dan cache client lama diuji tahap 6.

## Perlu dipastikan sebelum implementasi jalur terkait

1. Disetujui owner 19 Oktober 2026: daftar ulang setelah cancelled memakai registration UUID existing dan wajib submit form lagi. Snapshot diganti hanya setelah sukses; saat batal/gagal snapshot lama tetap. Bukan histori semua attempt.
2. Disetujui owner 19 Oktober 2026: admin menambahkan guest wajib mengirim consentAcknowledged=true melalui checkbox “Saya sudah mendapat persetujuan peserta untuk mendaftarkan dan menggunakan datanya untuk kegiatan ini.” Ini konfirmasi admin, bukan consent langsung guest. Snapshot response menyimpan consent_evidence JSON nullable: method=admin_acknowledgement, adminId dari token, acknowledgedAt UTC; tanpa consent_version guest palsu. Publik menyimpan method=self, version dan acceptedAt. Data lama/member tidak diberi bukti consent baru. Migration tambahan 000005, tidak mengedit histori migration 000004.
3. Batas operasional sudah disetujui pada tahap 2: 30 field, label/Input 255, Textarea 5.000, 50 opsi/field dengan label 255 karakter. Bukan pertanyaan terbuka lagi; implementasi UI/submit wajib mengikuti batas ini.
4. Form lock permanen + data lama: setelah backfill, event existing yang pernah punya peserta tidak bisa ditambah custom field. Ini konsekuensi keputusan first registration lock, bukan fitur unlock admin.

