# Design: SukaKerja — Fitur Lanjutan

## Ringkasan

Dokumen ini menjabarkan arsitektur teknis untuk implementasi fitur-fitur lanjutan SukaKerja. Seluruh desain mengikuti pola yang sudah ada: Server Actions untuk mutasi, `createAdminClient()` (service_role) untuk semua operasi tulis, fungsi otorisasi eksplisit di awal setiap action, dan soft delete untuk semua penghapusan data.

---

## 1. Arsitektur Perubahan

### 1.1 Database Schema

#### Kolom Baru pada Tabel yang Sudah Ada

**`profiles`** — `foto_url text` sudah ada sejak migration `0001_profiles.sql`. Tidak perlu migration baru untuk kolom ini.

**`divisions`** — tidak perlu kolom baru; kolom `status` (aktif/nonaktif) sudah ada.

**`tasks`** — perlu dua kolom baru:
- `recurring_template_id uuid references public.recurring_task_templates(id) on delete set null`
- `is_recurring boolean not null default false`

**`activity_log`** — perlu satu kolom baru untuk menyimpan detail perubahan (old/new nilai):
- `detail jsonb` — opsional, diisi hanya untuk aksi yang membutuhkan konteks tambahan (mis. ubah judul task)

#### Tabel Baru

**`targets`**
```sql
create table public.targets (
  id uuid primary key default gen_random_uuid(),
  division_id uuid not null references public.divisions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  periode_mulai date not null,
  periode_selesai date not null,
  jumlah_target integer not null check (jumlah_target > 0),
  keterangan text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint periode_valid check (periode_selesai > periode_mulai)
);
```

**`recurring_task_templates`**
```sql
create type public.pola_ulang as enum (
  'daily_workday',
  'daily',
  'weekly',
  'monthly'
);

create table public.recurring_task_templates (
  id uuid primary key default gen_random_uuid(),
  division_id uuid not null references public.divisions(id) on delete cascade,
  board_id uuid not null references public.boards(id) on delete restrict,
  judul text not null check (char_length(judul) <= 255),
  deskripsi text,
  prioritas text not null default 'sedang'
    check (prioritas in ('rendah', 'sedang', 'tinggi', 'mendesak')),
  assignee_ids uuid[] not null default '{}',
  pola pola_ulang not null,
  day_of_week integer check (day_of_week between 0 and 6),
  day_of_month integer check (day_of_month between 1 and 31),
  due_offset_hari integer not null default 0,
  tanggal_mulai date not null,
  tanggal_selesai date,
  is_active boolean not null default true,
  last_generated_date date,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
```

#### Migration Files

| File | Isi |
|------|-----|
| `0009_activity_log_detail.sql` | Tambah kolom `detail jsonb` pada `activity_log` |
| `0010_targets.sql` | Buat tabel `targets` + indeks + RLS policy |
| `0011_recurring_tasks.sql` | Buat enum `pola_ulang`, tabel `recurring_task_templates` + indeks + RLS |
| `0012_tasks_recurring_fields.sql` | Tambah `recurring_template_id` dan `is_recurring` pada `tasks` |

**Catatan RLS:** Pola yang sama dengan tabel lain — policy SELECT untuk anggota divisi menggunakan `is_division_member()`, tidak ada policy INSERT/UPDATE/DELETE (semua lewat service_role).

---

### 1.2 File Structure

#### Migration Files (baru)
```
supabase/migrations/
  0009_activity_log_detail.sql
  0010_targets.sql
  0011_recurring_tasks.sql
  0012_tasks_recurring_fields.sql
```

#### Halaman & Actions Baru
```
src/app/
  profil/
    page.tsx                          -- Halaman profil user (Server Component shell)
    actions.ts                        -- updateProfil, uploadFoto

  admin/
    karyawan/
      [id]/
        page.tsx                      -- Detail karyawan + ringkasan beban kerja
    data-terhapus/
      page.tsx                        -- Recycle bin (Server Component)
      actions.ts                      -- ambilTaskTerhapus, restoreTask, hapusPermanenTask
    log-sistem/
      page.tsx                        -- Log sistem dengan filter & paginasi

  divisi/[id]/
    target/
      page.tsx                        -- Target & realisasi
      actions.ts                      -- buatTarget, ubahTarget, hapusTarget, ambilTarget, ambilRealisasi
    tugas-rutin/
      page.tsx                        -- Manajemen template tugas rutin
      actions.ts                      -- CRUD template recurring

src/lib/
  cron/
    buat-tugas-rutin.ts               -- Logic pembuatan task otomatis dari template

src/app/api/
  cron/
    buat-tugas-rutin/
      route.ts                        -- API Route endpoint untuk cron job eksternal
```

#### Modifikasi File yang Sudah Ada

| File | Perubahan |
|------|-----------|
| `src/lib/aktivitas.ts` | Tambah jenis aktivitas baru: `user_reactivated`, `profile_updated`, `division_deactivated`, `division_reactivated`, `task_restored`, `task_permanently_deleted`, `task_auto_created`, `task_judul_diubah`, `target_dibuat`, `target_diubah`, `template_dibuat`, `template_diubah`, `template_dihapus`. Tambah parameter opsional `detail?: Record<string, unknown>` pada `catatAktivitas()`. |
| `src/lib/notifikasi.ts` | Tambah jenis notifikasi: `user_reactivated`, `mention` |
| `src/app/admin/karyawan/actions.ts` | `aktifkanKembaliKaryawan()` sudah ada — tambah pengiriman notifikasi ke user yang diaktifkan |
| `src/app/admin/karyawan/daftar-karyawan.tsx` | Tambah tombol "Aktifkan" pada baris karyawan nonaktif |
| `src/app/admin/divisi/actions.ts` | Tambah `nonaktifkanDivisi()` dan `aktifkanKembaliDivisi()` |
| `src/app/admin/divisi/daftar-divisi.tsx` | Tambah tombol nonaktifkan/aktifkan + dialog konfirmasi ketik-nama |
| `src/app/divisi/[id]/actions.ts` | Tambah `ubahJudulTask()` |
| `src/app/divisi/[id]/detail-task-panel.tsx` | Tambah inline edit judul task |
| `src/app/divisi/[id]/papan-divisi.tsx` | Tambah drag-and-drop reorder boards (horisontal, untuk manajer/super admin) |
| `src/app/divisi/[id]/task-card.tsx` | Tambah tampilan ikon berulang jika `is_recurring = true` |
| `src/app/notifikasi/actions.ts` | Tambah dukungan `mention` dalam parsing dan pengiriman notifikasi |
| `src/app/dashboard/actions.ts` | Tambah `eksporRekapCSV()` |
| `src/app/dashboard/page.tsx` | Tambah tombol "Ekspor CSV" |
| `src/components/app-shell.tsx` | Tambah link ke `/profil` di menu user |

---

## 2. Interface / Type Definitions

```typescript
// === Target & Realisasi ===

export type Target = {
  id: string
  divisionId: string
  userId: string
  namaMember: string
  periodeMulai: string    // ISO date string (YYYY-MM-DD)
  periodeSelesai: string
  jumlahTarget: number
  keterangan: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

export type HasilTarget =
  | { sukses: true; target?: Target }
  | { sukses: false; pesan: string }

export type RealisasiTarget = {
  targetId: string
  userId: string
  namaMember: string
  jumlahTarget: number
  jumlahRealisasi: number
  persentase: number      // (realisasi/target)*100 dibulatkan 1 desimal
  status: 'completed' | 'on_track' | 'at_risk'
  periodeMulai: string
  periodeSelesai: string
}
```

```typescript
// === Recurring Tasks ===

export type PolaUlang = 'daily_workday' | 'daily' | 'weekly' | 'monthly'

export type RecurringTemplate = {
  id: string
  divisionId: string
  boardId: string
  boardNama: string
  judul: string
  deskripsi: string | null
  prioritas: string
  assigneeIds: string[]
  assigneeNama: string[]
  pola: PolaUlang
  dayOfWeek: number | null    // 0=Minggu, 1=Senin, ..., 6=Sabtu
  dayOfMonth: number | null   // 1–31
  dueOffsetHari: number
  tanggalMulai: string        // ISO date
  tanggalSelesai: string | null
  isActive: boolean
  lastGeneratedDate: string | null
  createdAt: string
}

export type HasilRecurring =
  | { sukses: true; template?: RecurringTemplate }
  | { sukses: false; pesan: string }

// === Data Terhapus (Recycle Bin) ===

export type TaskTerhapus = {
  id: string
  judul: string
  divisionId: string
  divisionNama: string
  boardId: string
  boardNama: string
  deletedAt: string
  deletedBy: string | null
  deletedByNama: string | null
  sisaHari: number            // 90 - selisih hari sejak deletedAt
}

export type HasilRestore =
  | { sukses: true }
  | { sukses: false; pesan: string }

// === Log Sistem ===

export type LogEntry = {
  id: string
  actorId: string | null
  actorNama: string
  jenisAktivitas: string
  objekTipe: string
  objekId: string | null
  objekNama: string
  divisionId: string | null
  divisionNama: string | null
  detail: Record<string, unknown> | null
  createdAt: string
}

export type FilterLog = {
  actorId?: string
  jenisAktivitas?: string
  divisionId?: string
  dari?: string    // ISO date string
  sampai?: string  // ISO date string
  halaman: number  // 1-indexed, 50 per halaman
}
```

---

## 3. Component Architecture

### 3.1 Halaman Profil (`/profil`)

**`page.tsx`** — Server Component. Mengambil data profil via `ambilSesiPengguna()` dan meneruskan ke `FormProfil`.

**`FormProfil`** — Client Component (`'use client'`).
- Props: `profilAwal: { nama: string; fotoUrl: string | null }`
- State: `nama` (string), `preview` (string | null), `sedangMenyimpan` (boolean), `pesan` (string | null)
- Memanggil Server Action `updateProfil(nama)` untuk update nama.
- Memanggil Server Action `uploadFoto(formData)` untuk upload foto. Validasi ukuran dan tipe dilakukan di client (early return) lalu divalidasi ulang di server.
- Setelah upload berhasil, update `preview` state secara optimistis dengan `URL.createObjectURL()` agar tampil langsung tanpa reload (FR-USER-006 REQ-011).
- `router.refresh()` dipanggil setelah sukses agar sidebar/navbar ikut update.

**`actions.ts`**:
```typescript
// updateProfil: pastikanAnggotaDivisi tidak diperlukan, cukup ambilSesiPengguna
// uploadFoto: validasi server (ukuran ≤ 2MB, tipe JPG/PNG), upload ke bucket 'avatars'
//   dengan path: `${userId}/${crypto.randomUUID()}.jpg`, update profiles.foto_url
```

### 3.2 Halaman Detail Karyawan (`/admin/karyawan/[id]`)

**`page.tsx`** — Server Component. Dipanggil hanya oleh Manajer Divisi atau Super Admin.
- Ambil data profil + ringkasan beban kerja dari `ambilDetailKaryawan(id)`.
- Render `RingkasanBebanKerja` (Client Component untuk filter tanggal) dan `DaftarDivisiAnggota` (Server Component statis).

**`RingkasanBebanKerja`** — Client Component.
- Props: `userId: string`
- State: `dari` (string), `sampai` (string), `data: RingkasanBeban | null`
- Memanggil Server Action `ambilRingkasanBebanKerja(userId, dari, sampai)` via `useTransition` saat filter berubah.

### 3.3 Halaman Data Terhapus (`/admin/data-terhapus`)

**`page.tsx`** — Server Component. Hanya Super Admin. Render `DaftarTaskTerhapus`.

**`DaftarTaskTerhapus`** — Client Component.
- Props: `tasksAwal: TaskTerhapus[]`
- State: `tasks` (TaskTerhapus[]), `sedangProses` (Set\<string\> untuk track per-task loading)
- Memanggil `restoreTask(taskId)` dan `hapusPermanenTask(taskId)` (dengan dialog konfirmasi).
- `router.refresh()` setelah setiap aksi.

### 3.4 Halaman Log Sistem (`/admin/log-sistem`)

**`page.tsx`** — Server Component shell yang membaca searchParams untuk filter awal, render `FilterLog` + `TabelLog`.

**`FilterLog`** — Client Component. Mengubah URL searchParams via `router.push()` untuk navigasi filter (pattern URL-driven state).

**`TabelLog`** — Server Component (di-render ulang saat searchParams berubah). Query dijalankan di server dengan `ambilLogSistem(filter)`. Render tabel + paginasi + tombol "Ekspor CSV".

Tombol Ekspor CSV memanggil Client Component handler yang submit form ke Server Action `eksporLogCSV(filter)`. Server Action mengembalikan response `application/octet-stream` menggunakan teknik Next.js `redirect` ke data URL tidak berlaku — lihat Bagian 6 untuk mekanisme ekspor CSV yang benar.

### 3.5 Halaman Target & Realisasi (`/divisi/[id]/target`)

**`page.tsx`** — Server Component. Mengambil daftar target + realisasi, render dua bagian: form penetapan (Manajer/Super Admin) dan tabel progress (semua anggota, dengan data terfilter per role).

**`FormTarget`** — Client Component.
- Props: `divisionId: string; anggota: AnggotaDivisi[]; targetEdit?: Target`
- State: `userId`, `periodeMulai`, `periodeSelesai`, `jumlahTarget`, `keterangan`, form validation errors
- Memanggil `buatTarget()` atau `ubahTarget()`.

**`TabelRealisasi`** — Server Component (di-refresh oleh router.refresh setelah mutasi).
- Props: `realisasi: RealisasiTarget[]; roleSistem: RoleSistem; currentUserId: string`
- Manajer/Super Admin: tampilkan semua anggota. Staff/Viewer: filter hanya data diri sendiri.
- Progress bar di-render sebagai HTML `<div>` dengan `style={{ width: '${persentase}%' }}`.
- Warna: `bg-green-500` (completed), `bg-yellow-400` (at_risk), `bg-blue-500` (on_track).

### 3.6 Halaman Tugas Rutin (`/divisi/[id]/tugas-rutin`)

**`page.tsx`** — Server Component. Render `DaftarTemplate` + tombol buat baru.

**`DaftarTemplate`** — Client Component.
- Props: `templates: RecurringTemplate[]; divisionId: string; boards: BoardRingkas[]; anggota: AnggotaDivisi[]`
- State: `formTerbuka` (boolean), `templateEdit` (RecurringTemplate | null), `riwayatTemplate` (string | null)
- Render setiap template sebagai kartu dengan toggle aktif/nonaktif, edit, hapus, dan "Lihat Riwayat".

**`FormTemplate`** — Client Component (dalam modal/drawer).
- State: semua field template
- Field `pola` menentukan field tambahan yang tampil: `day_of_week` (weekly), `day_of_month` (monthly), tidak ada tambahan (daily/daily_workday).
- Memanggil `buatTemplate()` atau `ubahTemplate()`.

**`RiwayatTemplate`** — Client Component (modal/drawer).
- Props: `templateId: string; judul: string`
- State: `tasks: TaskDariTemplate[]; sedangMuat: boolean`
- Memanggil `ambilRiwayatTemplate(templateId)` via `useEffect` saat dibuka.

### 3.7 Modifikasi: Board Drag-and-Drop Reorder

Di `papan-divisi.tsx`, tambahkan `DndContext` kedua (atau manfaatkan yang ada) untuk drag horisontal antar board.

- Handle drag hanya ditampilkan jika `bolehReorderBoard` (prop baru, true untuk Manajer/Super Admin).
- Gunakan `SortableContext` dengan `horizontalListSortingStrategy` membungkus daftar board.
- `handleBoardDragEnd` memanggil Server Action baru `ubahUrutanBoard(divisionId, urutan[])`.
- Optimistic update: `setBoards(arrayMove(boards, oldIndex, newIndex))`, rollback jika server error.

### 3.8 Modifikasi: Inline Edit Judul Task

Di `detail-task-panel.tsx`:
- Judul task dirender sebagai `<button onClick={() => setEditJudul(true)}>` yang berubah menjadi `<input>` saat diklik.
- State: `editJudul` (boolean), `judulSementara` (string)
- Simpan saat `onBlur` atau `onKeyDown` Enter, batalkan saat Escape.
- Memanggil `ubahJudulTask(divisionId, taskId, judulBaru)`.

### 3.9 Modifikasi: Mention @nama dalam Komentar

Di `komentar-section.tsx`:
- Ganti `<textarea>` biasa dengan komponen `KomentarEditor` (Client Component).
- State: `teks` (string), `mencariMention` (boolean), `queryMention` (string), `suggestions: AnggotaDivisi[]`, `indexSuggestion` (number)
- Deteksi pola `@[query]` menggunakan regex pada setiap keystroke.
- Fetch `ambilAnggotaDivisi(divisionId)` sekali saat komponen mount, filter di client.
- Dropdown maksimal 5 saran, keyboard-navigable (ArrowUp/Down/Enter/Escape).
- Submit komentar memanggil `tambahKomentar()` yang sudah ada — teks `@nama` disimpan as-is.
- Render komentar menggunakan fungsi `renderIsiKomentar(isi)` yang memparse `@nama` dan wrap dengan `<span className="text-blue-600 font-bold">`.

---

## 4. Authorization Matrix

Tabel berikut merangkum izin untuk setiap fitur baru. Fungsi otorisasi yang digunakan konsisten dengan pola di `src/lib/auth/otorisasi.ts`.

| Aksi | Staff/Viewer | Manajer Divisi | Super Admin | Fungsi Otorisasi |
|------|-------------|----------------|-------------|-----------------|
| Update profil sendiri | ✓ | ✓ | ✓ | `ambilSesiPengguna()` + cek `sesi.id === targetId` |
| Upload foto profil | ✓ | ✓ | ✓ | `ambilSesiPengguna()` |
| Lihat detail karyawan | ✗ | ✓ | ✓ | `pastikanSuperAdmin()` atau cek roleDivisi |
| Aktifkan kembali karyawan | ✗ | ✗ | ✓ | `pastikanSuperAdmin()` |
| Nonaktifkan divisi | ✗ | ✗ | ✓ | `pastikanSuperAdmin()` |
| Aktifkan kembali divisi | ✗ | ✗ | ✓ | `pastikanSuperAdmin()` |
| Buat/ubah target | ✗ | ✓ | ✓ | `pastikanManajerDivisi(divisionId)` |
| Lihat target & realisasi (semua anggota) | ✗ | ✓ | ✓ | `pastikanManajerDivisi(divisionId)` |
| Lihat target & realisasi (diri sendiri) | ✓ | ✓ | ✓ | `pastikanAnggotaDivisi(divisionId)` |
| Buat/ubah/hapus template tugas rutin | ✗ | ✓ | ✓ | `pastikanManajerDivisi(divisionId)` |
| Lihat daftar template | ✓ | ✓ | ✓ | `pastikanAnggotaDivisi(divisionId)` |
| Lihat data terhapus (recycle bin) | ✗ | ✗ | ✓ | `pastikanSuperAdmin()` |
| Restore task | ✗ | ✗ | ✓ | `pastikanSuperAdmin()` |
| Hapus permanen task | ✗ | ✗ | ✓ | `pastikanSuperAdmin()` |
| Reorder board via DnD | ✗ | ✓ | ✓ | `pastikanManajerDivisi(divisionId)` |
| Ubah judul task | ✓* | ✓ | ✓ | `pastikanAnggotaDivisi()` + cek assignee/creator |
| Ekspor CSV dashboard | ✗ | ✓ | ✓ | `pastikanManajerDivisi()` atau `pastikanSuperAdmin()` |
| Ekspor CSV log sistem | ✗ | ✗ | ✓ | `pastikanSuperAdmin()` |
| Lihat log sistem | ✗ | ✗ | ✓ | `pastikanSuperAdmin()` |
| Mention @nama di komentar | ✓ | ✓ | ✓ | `pastikanAnggotaDivisi(divisionId)` |

*Staff hanya bisa ubah judul task yang mereka buat atau di-assign ke mereka.

### Logika Ubah Judul Task (FR-TASK-003)

```typescript
// Di ubahJudulTask():
const sesi = await pastikanAnggotaDivisi(divisionId)

const bolehUbah =
  sesi.roleSistem === 'super_admin' ||
  sesi.roleDivisi === 'manajer_divisi' ||
  task.created_by === sesi.id ||
  task.task_assignees.some(a => a.user_id === sesi.id)

if (!bolehUbah) {
  return { sukses: false, pesan: 'Anda tidak memiliki izin mengubah judul task ini' }
}
```

### Business Rules yang Diimplementasikan via Kode

**BR-019** (minimal 1 Super Admin aktif): Cek di `nonaktifkanKaryawan()` sudah ada. Tidak berlaku untuk reaktivasi.

**BR-022** (minimal 1 Manajer per divisi aktif): Cek di `nonaktifkanDivisi()` — jika divisi masih memiliki member aktif, tampilkan warning tapi tidak blokir (karena divisi akan disembunyikan, bukan member-nya dihapus).

**BR-028** (task dihitung sekali per target): Query realisasi menggunakan `count(distinct tasks.id)` untuk menghindari duplikasi.

**BR-031** (no duplicate recurring task per tanggal): Cek di `buat-tugas-rutin.ts` sebelum insert — query `tasks WHERE recurring_template_id = $1 AND DATE(created_at) = $2`.

**BR-032** (no overlap target): Cek di `buatTarget()` dan `ubahTarget()` — query `targets WHERE user_id = $1 AND division_id = $2 AND NOT (periode_selesai < $newMulai OR periode_mulai > $newSelesai) AND id != $excludeId`.

---

## 5. Cron Job Design

### Mekanisme

Gunakan Next.js API Route yang dipanggil oleh layanan cron eksternal (misalnya cron-job.org atau Vercel Cron Jobs). Tidak menggunakan Supabase Edge Function agar logika tetap dalam satu codebase TypeScript.

**Endpoint:** `GET /api/cron/buat-tugas-rutin`

**Autentikasi:** Header `x-cron-secret: <nilai dari env CRON_SECRET>`. Request tanpa header yang benar mendapat response `401 Unauthorized`.

### File: `src/app/api/cron/buat-tugas-rutin/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { jalankanBuatTugasRutin } from '@/lib/cron/buat-tugas-rutin'

export async function GET(request: Request) {
  const secret = request.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const hasil = await jalankanBuatTugasRutin()
  return NextResponse.json(hasil)
}
```

### File: `src/lib/cron/buat-tugas-rutin.ts`

Logika utama:

```typescript
export async function jalankanBuatTugasRutin() {
  const admin = createAdminClient()
  const hariIni = new Date()  // UTC, konversi ke WIB untuk cek hari kerja
  const hariIniWIB = new Date(hariIni.getTime() + 7 * 60 * 60 * 1000)
  const tanggalHariIni = hariIniWIB.toISOString().slice(0, 10)  // YYYY-MM-DD
  const hariMinggu = hariIniWIB.getDay()  // 0=Minggu, 6=Sabtu

  // 1. Ambil semua template aktif yang belum melewati tanggal_selesai
  const { data: templates } = await admin
    .from('recurring_task_templates')
    .select('*')
    .eq('is_active', true)
    .is('deleted_at', null)
    .lte('tanggal_mulai', tanggalHariIni)
    .or(`tanggal_selesai.is.null,tanggal_selesai.gte.${tanggalHariIni}`)

  const hasil = { dibuat: 0, dilewati: 0, error: 0 }

  for (const template of templates ?? []) {
    // 2. Cek apakah hari ini jadwalnya
    if (!hariIniJadwalTemplate(template, hariMinggu, tanggalHariIni)) {
      hasil.dilewati++
      continue
    }

    // 3. Cek duplikasi — BR-031
    const { count } = await admin
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('recurring_template_id', template.id)
      .gte('created_at', tanggalHariIni + 'T00:00:00+07:00')
      .lt('created_at', tanggalHariIni + 'T23:59:59+07:00')

    if ((count ?? 0) > 0) {
      hasil.dilewati++
      continue
    }

    // 4. Buat task
    // ... insert ke tasks, insert ke task_assignees, catat aktivitas
    // update last_generated_date pada template
  }

  return hasil
}
```

**Fungsi `hariIniJadwalTemplate()`:**
- `daily_workday`: return `hariMinggu >= 1 && hariMinggu <= 5`
- `daily`: return `true`
- `weekly`: return `hariMinggu === template.day_of_week`
- `monthly`: return `parseInt(tanggalHariIni.slice(8)) === template.day_of_month`

### Konfigurasi Jadwal

Tambah ke `vercel.json` (jika deploy di Vercel):
```json
{
  "crons": [
    {
      "path": "/api/cron/buat-tugas-rutin",
      "schedule": "0 0 * * *"
    }
  ]
}
```
Vercel Cron berjalan dalam UTC. Pukul 07:00 WIB = `0 0 * * *` UTC.

Tambah environment variable `CRON_SECRET` di `.env.local` dan Vercel dashboard.

---

## 6. CSV Export Logic

### Pendekatan

Server Actions tidak bisa mengembalikan binary response langsung. Solusinya: Server Action mengembalikan string CSV, lalu Client Component membuat Blob dan memicu download via `URL.createObjectURL()`.

### Pattern Implementasi

```typescript
// Server Action (actions.ts)
export async function eksporRekapCSV(
  divisionId: string,
  dari: string,
  sampai: string
): Promise<{ sukses: true; csv: string } | { sukses: false; pesan: string }> {
  const sesi = await pastikanManajerDivisi(divisionId)
  // ... query data ...

  // UTF-8 BOM agar Excel tidak rusak encoding Indonesia
  const BOM = '\uFEFF'
  const header = 'Nama,Total Tugas,Selesai,Terlambat,Tingkat Tepat Waktu\r\n'
  const baris = data.map(row =>
    [
      `"${row.nama.replace(/"/g, '""')}"`,
      row.totalTugas,
      row.selesai,
      row.terlambat,
      `"${row.tingkatTepatWaktu.toFixed(1)}%"`,
    ].join(',')
  ).join('\r\n')

  return { sukses: true, csv: BOM + header + baris }
}
```

```typescript
// Client Component handler
async function tanganiEkspor() {
  setSedangEkspor(true)
  const hasil = await eksporRekapCSV(divisionId, dari, sampai)
  setSedangEkspor(false)

  if (!hasil.sukses) {
    setPesan(hasil.pesan)
    return
  }

  const blob = new Blob([hasil.csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const tanggal = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `rekap-tugas-${tanggal}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
```

### Format CSV

**Rekap Tugas Dashboard (`FR-DASH-005`)**

Nama file: `rekap-tugas-[YYYY-MM-DD].csv`

| Kolom | Sumber |
|-------|--------|
| Nama | `profiles.nama` |
| Total Tugas | count `task_assignees` dalam rentang filter |
| Selesai | count tasks dengan `completed_at IS NOT NULL` dalam rentang |
| Terlambat | count tasks dengan `due_date < completed_at OR (due_date < NOW() AND completed_at IS NULL)` |
| Tingkat Tepat Waktu | `(selesai_tepat_waktu / total_selesai) * 100` |

**Log Sistem (`FR-ACTIVITY-003`)**

Nama file: `log-sistem-[YYYY-MM-DD].csv`

| Kolom | Sumber |
|-------|--------|
| Timestamp | `activity_log.created_at` (format: `YYYY-MM-DD HH:mm:ss`) |
| User | `activity_log.actor_nama` |
| Aksi | `activity_log.jenis_aktivitas` |
| Tipe Entitas | `activity_log.objek_tipe` |
| ID Entitas | `activity_log.objek_id` |
| Divisi | nama divisi (joined dari `divisions`) |
| Detail | `JSON.stringify(activity_log.detail)` atau kosong |

Nilai yang mengandung koma atau tanda kutip di-escape dengan cara membungkus dalam `"..."` dan menggandakan tanda kutip internal (`""`).

---

## 7. Catatan Implementasi Tambahan

### 7.1 Nonaktifkan & Aktifkan Divisi

**`nonaktifkanDivisi(divisionId: string, konfirmasiNama: string)`**
1. `pastikanSuperAdmin()`
2. Ambil nama divisi dari DB, cek `konfirmasiNama === divisi.nama` (case-sensitive, BR sesuai REQ-020)
3. Cek apakah ada task aktif (`deleted_at IS NULL AND completed_at IS NULL`) — jika ya, sertakan jumlah dalam response sebagai warning tapi tidak blokir
4. Update `divisions.status = 'nonaktif'`
5. Catat aktivitas `division_deactivated`

**Dialog konfirmasi di client**: tombol "Nonaktifkan" di-disable selama `inputNama !== divisi.nama` (menggunakan `value === nama` pada onChange `<input>`).

### 7.2 Restore Task (Recycle Bin)

**`restoreTask(taskId: string)`**
1. `pastikanSuperAdmin()`
2. Ambil task termasuk `board_id` dan `deleted_at`
3. Verifikasi board asal masih ada (`deleted_at IS NULL`). Jika tidak, cari board pertama yang tersedia di divisi yang sama (order by `urutan ASC`). Jika tidak ada board sama sekali, return error.
4. Set `tasks.deleted_at = NULL` dan `board_id` (board fallback jika perlu)
5. Catat aktivitas `task_restored`

**`hapusPermanenTask(taskId: string)`**
1. `pastikanSuperAdmin()`
2. Hapus storage files dari bucket `task-attachments` untuk semua lampiran task tersebut
3. Hard delete task (cascade akan menghapus `task_assignees`, `checklist_items`, `task_attachments`, `comments`, `task_labels`)
4. Catat aktivitas `task_permanently_deleted`

### 7.3 Perhitungan Status Target

```typescript
function hitungStatusTarget(
  realisasi: number,
  target: number,
  periodeMulai: string,
  periodeSelesai: string
): 'completed' | 'on_track' | 'at_risk' {
  const persentaseRealisasi = realisasi / target

  if (persentaseRealisasi >= 1) return 'completed'

  const totalMilidetik = new Date(periodeSelesai).getTime() - new Date(periodeMulai).getTime()
  const terlewati = Date.now() - new Date(periodeMulai).getTime()
  const persentaseWaktu = totalMilidetik > 0 ? terlewati / totalMilidetik : 0

  // at_risk: progress < 50% padahal waktu sudah > 75%
  if (persentaseWaktu > 0.75 && persentaseRealisasi < 0.5) return 'at_risk'

  return 'on_track'
}
```

### 7.4 Tambahan Jenis Aktivitas & Notifikasi

Perluasan `JenisAktivitas` di `src/lib/aktivitas.ts`:
```typescript
| 'user_reactivated'
| 'profile_updated'
| 'division_deactivated'
| 'division_reactivated'
| 'task_restored'
| 'task_permanently_deleted'
| 'task_auto_created'
| 'task_judul_diubah'
| 'target_dibuat'
| 'target_diubah'
| 'target_dihapus'
| 'template_dibuat'
| 'template_diubah'
| 'template_dihapus'
| 'board_diurutkan'
```

Perluasan `JenisNotifikasi` di `src/lib/notifikasi.ts`:
```typescript
| 'user_reactivated'   // kirim ke user yang diaktifkan
| 'mention'           // kirim ke user yang di-@mention dalam komentar
```

### 7.5 Task Card — Ikon Berulang (FR-RECUR-003)

`TaskRingkas` perlu field baru: `isRecurring: boolean`. Query di `ambilPapanDivisi()` ditambah `is_recurring` dari tabel `tasks`.

Di `task-card.tsx`, tambah ikon kecil di area meta-data task:
```tsx
{task.isRecurring && (
  <span title="Tugas Rutin" className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
    ↻ Rutin
  </span>
)}
```

Di `detail-task-panel.tsx`, tambah info template sumber jika `is_recurring`:
```tsx
{detail.isRecurring && detail.templatePola && (
  <p className="text-sm text-muted">
    Tugas Rutin — {LABEL_POLA[detail.templatePola]}
  </p>
)}
```

---

## 8. Environment Variables Baru

| Variabel | Deskripsi |
|----------|-----------|
| `CRON_SECRET` | Secret untuk autentikasi endpoint cron job |

Tambahkan ke `.env.local.example`:
```
CRON_SECRET=your-secret-here
```
