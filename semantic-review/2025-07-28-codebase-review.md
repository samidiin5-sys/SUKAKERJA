# SukaKerja — Comprehensive Codebase Review

SukaKerja adalah aplikasi manajemen tugas internal berbasis Next.js 16 + Supabase dengan konsep seperti Trello/ClickUp. Fitur inti sudah cukup lengkap: kanban board per divisi dengan drag-and-drop, recurring tasks via cron, overtime management, task pool, system log, dan recycle bin. Authorisasi konsisten menggunakan server actions dengan guard functions. Watch for: **N+1 query serius di `ubahUrutanTask`**, **security gap di `ambilTaskBebasLangsung`** (auto-join divisi tanpa izin owner), **banyak penggunaan `any` di dashboard actions**, dan **cron endpoint tanpa proteksi timing-safe comparison**.

---

## Fitur yang Sudah Ada

| Area | Halaman / Route | Status |
|------|----------------|--------|
| Auth | `/login`, `/ganti-password`, lockout 5 percobaan | ✅ Lengkap |
| Dashboard Staff | `/dashboard` — statistik personal, tugas prioritas, deadline, divisi | ✅ |
| Dashboard Admin | `/dashboard` — statistik org, tren task, distribusi status | ✅ |
| Kanban Board | `/divisi/[id]` — drag-and-drop antar kolom, filter, cover image | ✅ |
| Detail Task | Panel slide-over: deskripsi, checklist, lampiran, komentar, pengumpulan, riwayat | ✅ |
| Recurring Tasks | `/divisi/[id]/tugas-rutin` + cron endpoint | ✅ |
| Kalender Divisi | `/divisi/[id]/kalender` | ✅ |
| Target & Realisasi | `/divisi/[id]/target` | ✅ |
| Anggota Divisi | `/divisi/[id]/anggota` | ✅ |
| Tugas Saya | `/tugas-saya` (list + kalender view) | ✅ |
| Tugas Tersedia (Pool) | `/tugas-tersedia` — ambil langsung atau via proposal | ✅ |
| Lembur | `/lembur` (staff) + `/admin/lembur` (review) | ✅ |
| Notifikasi | `/notifikasi` — in-app bell, mark read | ✅ |
| Profil | `/profil` — update nama, upload avatar | ✅ |
| Kelola Karyawan | `/admin/karyawan` — CRUD, reset password, suspend | ✅ |
| Kelola Divisi | `/admin/divisi` | ✅ |
| Log Sistem | `/admin/log-sistem` — filter, export CSV | ✅ |
| Recycle Bin | `/admin/data-terhapus` — restore / hapus permanen, retensi 90 hari | ✅ |
| Tugas Bebas Admin | `/admin/tugas-tersedia` — buat pool task, review proposal | ✅ |
| Panduan | `/panduan` | Ada (isi tidak diperiksa) |

---

## High-level View

Semua mutasi berjalan sebagai Next.js Server Actions, bukan API routes tradisional. Setiap action memanggil guard function (`pastikanAnggotaDivisi`, `pastikanOwner`, `pastikanSuperAdmin`) di baris pertama sebelum menyentuh database — ini pola yang konsisten dan benar. Guard function di `otorisasi.ts` menggunakan `createClient()` (user JWT) untuk memverifikasi sesi dan `createAdminClient()` (service role) untuk query data, memisahkan trust boundary dengan baik.

Fungsi `ubahUrutanTask` mengeluarkan satu `UPDATE` per task dalam loop `Promise.all`, kemudian ditambah satu `SELECT` untuk activity log. Untuk board dengan banyak task ini menjadi N+1 yang signifikan, dan dipanggil setiap kali drag-and-drop selesai — termasuk untuk re-sort di kolom asal setelah pindah antar kolom.

`ambilPapanDivisi` melakukan `createSignedUrl` secara paralel untuk setiap gambar cover — ini bisa menjadi puluhan panggilan ke Supabase Storage per request load board. Signed URL ini juga di-embed langsung ke HTML dan akan expired setelah 1 jam, menyebabkan broken image.

Fitur "Tugas Bebas" (pool task) memiliki dua jalur pengambilan: via proposal (perlu persetujuan owner) dan `ambilTaskBebasLangsung` yang langsung assign tanpa persetujuan. Jalur langsung ini juga auto-join staff ke divisi tanpa konfirmasi owner, yang bertentangan dengan model akses berbasis owner.

Cron endpoint (`/api/cron/buat-tugas-rutin`) menggunakan string comparison biasa untuk memvalidasi `CRON_SECRET`, bukan timing-safe comparison. Ini tidak kritis karena cron bukan operasi destruktif, tapi merupakan gap keamanan yang layak diperbaiki.

Dashboard Admin (`ambilDetailDashboardAdmin`) melakukan lebih dari 8 query database secara serial/paralel lalu memproses ribuan task di memori untuk menghitung distribusi status dan tren. Di organisasi dengan ratusan task ini akan menjadi lambat.

---

<details>
<summary>Issues (12)</summary>

1. **N+1 di `ubahUrutanTask`** — Satu UPDATE per task dalam loop + 1 SELECT untuk log. Ganti dengan `upsert` batch atau stored procedure. Dipanggil setiap drag end, termasuk setelah pindah antar kolom.

2. **`ambilTaskBebasLangsung` auto-join divisi tanpa izin owner** — Staff bisa bergabung ke divisi mana pun hanya dengan mengambil pool task. Harus diblokir atau dijadikan proposal-only agar owner tetap mengontrol keanggotaan divisinya.

3. **Signed URL expired setelah 1 jam menyebabkan broken image** — Cover image di kanban board menggunakan signed URL dengan expiry 3600s yang di-embed ke HTML. Setelah satu jam gambar akan broken sampai halaman di-refresh. Pertimbangkan public bucket untuk cover image, atau generate URL di sisi klien saat dibutuhkan.

4. **Cron secret validation tidak timing-safe** — `secret !== process.env.CRON_SECRET` rentan timing attack. Ganti dengan `crypto.timingSafeEqual()`.

5. **Penggunaan `any` masif di dashboard actions** — `ambilDetailDashboardStaff` dan `ambilDetailDashboardAdmin` menggunakan `any` hampir di seluruh badan fungsi. Kehilangan type safety sepenuhnya di fungsi yang paling kompleks.

6. **`tinjauProposal` menggunakan `jenis: 'lembur_disetujui'/'lembur_ditolak'` untuk notifikasi proposal tugas** — Ini salah jenis notifikasi; seharusnya `task_ditugaskan` atau jenis baru khusus proposal. Akan membingungkan pengguna yang menerima notif bertuliskan "Lembur disetujui" padahal yang disetujui adalah proposal tugas.

7. **`hapusPermanenTask` tidak menghapus checklist items, komentar, dan assignees** — Hanya lampiran yang dibersihkan sebelum hard delete. Relasi lain mengandalkan cascade di database; jika cascade tidak dikonfigurasi, data orphan akan tersisa.

8. **`ambilDaftarKaryawan` memanggil `listUsers({ perPage: 200 })`** — Hard cap 200 user. Organisasi yang melebihi ini akan kehilangan data email karyawan di halaman admin tanpa peringatan.

9. **N+1 signed URL di `ambilPapanDivisi`** — `Promise.all` atas `createSignedUrl` untuk setiap cover image. Untuk board dengan 50 task bergambar ini menghasilkan 50 panggilan ke Supabase Storage dalam satu request. Pertimbangkan lazy load di client atau public URL.

10. **`ubahTask` tidak mencatat aktivitas** — Perubahan deskripsi, prioritas, dan due date tidak masuk ke `activity_log`, sementara perubahan judul saja (`ubahJudulTask`) dicatat. Inkonsistensi ini membuat riwayat task tidak lengkap.

11. **`kirimPengumpulan` mengembalikan pesan error teknis ke client** — `'Tabel belum tersedia. Jalankan migration 0013 terlebih dahulu.'` adalah pesan debug yang tidak seharusnya dilihat pengguna produksi.

12. **`ambilStatistikDivisi` memanggil `ambilAnggotaDivisi` yang memanggil `pastikanAnggotaDivisi` lagi** — `ambilStatistikDivisi` sudah memanggil `pastikanAnggotaDivisi` sendiri, lalu memanggil `ambilAnggotaDivisi` yang akan memanggil `pastikanAnggotaDivisi` sekali lagi. Dua round-trip auth dan dua query ke `division_members` untuk satu page load.

</details>

---

<details>
<summary>Details</summary>

### N+1 di ubahUrutanTask dan implikasinya pada drag-and-drop

```typescript
const hasilUpdate = await Promise.all(
  urutan.map((item) => admin.from('tasks').update({ urutan: item.urutan }).eq('id', item.taskId))
)
```

Setiap item di array `urutan` menjadi satu round-trip database terpisah. Ini bukan hanya saat task dipindah antar kolom — `handleDragEnd` juga memanggil `ubahUrutanTask` untuk re-sort kolom asal setelah pindah, sehingga satu drag yang pindah antar kolom bisa menghasilkan 3 panggilan server action berurutan (`pindahkanTask` + `ubahUrutanTask` untuk tujuan + `ubahUrutanTask` untuk asal) dan total N UPDATE queries. Solusi paling praktis adalah stored procedure atau RPC Supabase yang menerima array urutan dan melakukan bulk update dalam satu transaksi.

Lebih jauh, sebelum setiap ubah urutan, `ubahUrutanTask` melakukan validasi `bolehPindahTask` per task dalam loop:

```typescript
for (const item of urutan) {
  const boleh = await bolehPindahTask(divisionId, item.taskId)
  if (!boleh) { ... }
}
```

`bolehPindahTask` sendiri melakukan dua query (`tasks` + `task_assignees`). Untuk board dengan 10 task, validasi ini saja menghasilkan 20 query sebelum UPDATE-nya. Ini bisa diperbaiki dengan satu query bulk yang mengambil semua `created_by` dan assignee dari task yang terlibat sekaligus.

### Auto-join divisi di `ambilTaskBebasLangsung`

```typescript
if (!sudahAnggota) {
  await admin.from('division_members').insert({
    division_id: divisionId, user_id: sesi.id, role: 'staff',
  })
}
```

Staff yang mengambil pool task via jalur langsung otomatis jadi anggota divisi. Owner tidak mendapat notifikasi dan tidak bisa mencegah ini. Ini bertentangan langsung dengan `tambahAnggota` yang memerlukan `pastikanOwner`. Konsekuensinya adalah staff bisa mengakses semua task dan statistik divisi setelah mengambil satu pool task.

Jalur proposal (`tinjauProposal`) juga melakukan hal yang sama saat disetujui, tapi di sana owner sudah secara eksplisit menyetujui — itu konsisten. Jalur langsung yang bermasalah.

### Signed URL cover image yang akan kadaluarsa

Signed URL untuk cover image di-generate server-side saat `ambilPapanDivisi` dipanggil, disematkan ke `TaskRingkas`, dikirim ke client, dan di-render langsung sebagai `src` di `TaskCard`. Karena Next.js SSR, URL ini sudah "dimulai hitungannya" sejak server merender halaman. Jika pengguna membiarkan halaman terbuka lebih dari 1 jam — sangat umum untuk tab kanban board — semua cover image akan broken.

Solusi yang paling bersih: jadikan `task-attachments` bucket sebagai public untuk cover image, atau gunakan URL preview yang di-generate client-side saat komponen di-mount.

### Jenis notifikasi yang salah di alur proposal tugas

Di `tinjauProposal`:
```typescript
jenis: 'lembur_disetujui',
pesan: `Pengajuan kamu untuk tugas "${p.tasks.judul}" disetujui! ...`
```

`JenisNotifikasi` yang didefinisikan di `notifikasi.ts` tidak memiliki jenis untuk proposal tugas, jadi developer meminjam `lembur_disetujui` / `lembur_ditolak`. Ini akan muncul di UI notifikasi dengan ikon/warna lembur padahal konteksnya tugas. Perlu ditambahkan `task_proposal_disetujui` dan `task_proposal_ditolak` ke enum.

### Dashboard admin: komputasi berat di memori

`ambilDetailDashboardAdmin` mengambil semua task aktif dari semua divisi dalam satu query, lalu mengelompokkan mereka ke bucket `todo/dikerjakan/review/selesai` berdasarkan nama board:

```typescript
const namaBoard = (board?.name ?? '').toLowerCase()
if (namaBoard.includes('to do') || namaBoard.includes('rencana') || namaBoard.includes('backlog')) {
  todoCount++
} else if (namaBoard.includes('review') || ...) {
  reviewCount++
} else {
  dikerjakanCount++
}
```

Logika ini sepenuhnya bergantung pada konvensi penamaan board. Board bernama "Pekerjaan Saya" akan masuk ke `dikerjakan`, bukan karena memang dikerjakan. Ini brittle dan tidak ada cara admin mengkonfigurasinya tanpa mengubah kode.

Tren task 7 hari terakhir juga dihitung sepenuhnya di JavaScript dengan `.filter()` pada array semua task, bukan query SQL dengan `GROUP BY date`. Untuk organisasi besar ini tidak efisien.

### `simpanAlasanTerlambat` tidak memvalidasi kepemilikan task

```typescript
export async function simpanAlasanTerlambat(divisionId, taskId, alasan) {
  const sesi = await pastikanAnggotaDivisi(divisionId)
  // ...
  await admin.from('tasks').update({ alasan_terlambat: alasan }).eq('id', taskId)
}
```

Tidak ada pengecekan bahwa `taskId` benar-benar berada di dalam `divisionId`. Anggota divisi A bisa mengirimkan alasan ke task di divisi B jika mereka tahu task ID-nya, asalkan mereka juga anggota divisi A.

Pola yang sama berlaku di beberapa action lain seperti `toggleChecklistItem` dan `hapusChecklistItem` — mereka hanya memverifikasi keanggotaan divisi, tidak bahwa item yang dimutasi benar-benar milik task di divisi tersebut.

### `ubahTask` tidak mencatat aktivitas

`ubahJudulTask` mencatat `task_judul_diubah` ke activity log dengan `{ old, new }`. Tapi `ubahTask` — yang mengubah deskripsi, prioritas, dan due date — tidak memanggil `catatAktivitas` sama sekali. Ini inkonsistensi yang membuat riwayat task di `RiwayatSection` tidak akan pernah menunjukkan perubahan-perubahan yang justru paling sering terjadi.

### Pesan error teknis terekspos ke client

```typescript
if (error) return { sukses: false, pesan: 'Tabel belum tersedia. Jalankan migration 0013 terlebih dahulu.' }
```

Ini di `kirimPengumpulan` di `divisi/[id]/actions.ts`. Pesan ini mengindikasikan fitur yang ditambahkan sebelum migration-nya dijalankan. Di production ini akan membingungkan pengguna dan mengekspos detail internal implementasi.

### Test coverage

Ada unit test untuk `lockout.ts`, `temp-password.ts`, dan `password.ts` — ketiganya pure functions yang memang mudah ditest. Tidak ada test untuk:
- Server actions (logika bisnis utama)
- Kalkulasi statistik di `ambilStatistikDivisi` dan `ambilRealisasi`
- Logic cron `hariIniJadwalTemplate`
- Drag-and-drop state management di `PapanDivisi`

`hariIniJadwalTemplate` khususnya rawan bug karena bergantung pada kalkulasi timezone (menggunakan `Date.now() + 7 * 60 * 60 * 1000` untuk WIB) dan logika hari-dalam-minggu, tapi tidak ada test yang memverifikasi skenario edge seperti akhir bulan, transisi daylight saving, atau pola `monthly` di bulan yang tidak memiliki tanggal tertentu (misal tanggal 31 di bulan Februari).

</details>

---

<details>
<summary>File Map</summary>

| File | Perubahan |
|------|-----------|
| `src/app/divisi/[id]/actions.ts` | Semua server actions untuk kanban board: CRUD task, checklist, lampiran, komentar, pengumpulan, riwayat, statistik divisi |
| `src/app/divisi/[id]/papan-divisi.tsx` | Client component kanban board dengan dnd-kit, filter, scroll |
| `src/app/divisi/[id]/detail-task-panel.tsx` | Panel detail task (modal), edit judul inline, alasan terlambat |
| `src/app/divisi/[id]/page.tsx` | Server component halaman divisi, statistik header |
| `src/app/divisi/[id]/tugas-rutin/actions.ts` | CRUD recurring task template |
| `src/app/divisi/[id]/tugas-rutin/page.tsx` | Halaman manajemen template rutin |
| `src/app/divisi/[id]/target/actions.ts` | CRUD target & kalkulasi realisasi |
| `src/app/divisi/[id]/kalender/actions.ts` | (tidak diperiksa langsung) |
| `src/app/dashboard/actions.ts` | Statistik personal (staff) dan organisasi (admin) — termasuk `ambilDetailDashboardAdmin` yang berat |
| `src/app/admin/log-sistem/actions.ts` | Query log sistem dengan filter + export CSV |
| `src/app/admin/data-terhapus/actions.ts` | Restore dan hard delete task |
| `src/app/admin/karyawan/actions.ts` | CRUD karyawan, reset password, suspend/aktivasi |
| `src/app/admin/divisi/actions.ts` | (file sedang terbuka di editor, tidak diperiksa isinya) |
| `src/app/lembur/actions.ts` | Submit lembur, tetapkan lembur oleh owner, review |
| `src/app/tugas-tersedia/actions.ts` | Pool task: ambil langsung, proposal, review proposal |
| `src/app/tugas-saya/actions.ts` | Daftar tugas staff, buat tugas sendiri, kalender |
| `src/app/login/actions.ts` | Login dengan lockout mechanism |
| `src/app/notifikasi/actions.ts` | Ambil, tandai baca, tandai semua baca |
| `src/app/profil/actions.ts` | Update nama, upload foto avatar |
| `src/app/api/cron/buat-tugas-rutin/route.ts` | Cron endpoint untuk generate recurring tasks |
| `src/lib/cron/buat-tugas-rutin.ts` | Logic generasi task harian dari template aktif |
| `src/lib/auth/otorisasi.ts` | Guard functions: `pastikanAnggotaDivisi`, `pastikanOwner`, `pastikanSuperAdmin` |
| `src/lib/auth/lockout.ts` | Pure functions lockout (5 percobaan, 15 menit) |
| `src/lib/aktivitas.ts` | `catatAktivitas` — silent fail by design |
| `src/lib/notifikasi.ts` | `kirimNotifikasi` — silent fail by design |
| `src/lib/supabase/admin.ts` | Admin client (service role) |
| `src/lib/supabase/server.ts` | Server client (user JWT via cookies) |
| `src/lib/shell-data.ts` | Data layout global (nama, role, divisi) |
| `src/components/sidebar.tsx` | Sidebar navigasi dengan role-based menu |

</details>
