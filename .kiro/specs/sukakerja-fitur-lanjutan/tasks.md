# Tasks: SukaKerja — Fitur Lanjutan

> Urutan implementasi dari yang paling fundamental (DB migrations) ke yang paling kompleks.
> Semua Server Actions menggunakan `createAdminClient()` (service_role) dan memanggil fungsi
> otorisasi eksplisit di baris pertama, konsisten dengan pola yang ada di codebase.

---

## Batch 1: Database Migrations (Must Have)

### Task 1: Migration — Activity Log Detail Column
**Requirements:** REQ-075 (ubah judul task — log old/new), REQ-064 to REQ-068 (log sistem)
**Priority:** Must Have
**Files:**
- Create: `supabase/migrations/0009_activity_log_detail.sql`

- [x] Step 1: Buat file migration dengan konten berikut:
  ```sql
  -- 0009_activity_log_detail.sql
  alter table public.activity_log
    add column if not exists detail jsonb;

  comment on column public.activity_log.detail is
    'Konteks tambahan untuk aksi tertentu, misal: { "old": "judul lama", "new": "judul baru" }';
  ```
- [x] Step 2: Verifikasi kolom `detail` belum ada di migration sebelumnya (`0004_activity_log.sql`)
- [x] Step 3: Pastikan `catatAktivitas()` di `src/lib/aktivitas.ts` akan diupdate di Task 15 untuk membaca kolom ini

> **Catatan:** Kolom ini nullable secara default — semua log yang sudah ada tetap valid tanpa perubahan.


---

### Task 2: Migration — Tabel Targets
**Requirements:** REQ-027 to REQ-038
**Priority:** Must Have (prerequisite untuk Task 12)
**Files:**
- Create: `supabase/migrations/0010_targets.sql`

- [x] Step 1: Buat tabel `targets` dengan constraint lengkap:
  ```sql
  -- 0010_targets.sql
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
- [x] Step 2: Tambah indeks untuk query performa:
  ```sql
  create index targets_division_user_idx on public.targets(division_id, user_id);
  create index targets_periode_idx on public.targets(periode_mulai, periode_selesai);
  ```
- [x] Step 3: Tambah RLS policy (SELECT untuk anggota divisi, tanpa INSERT/UPDATE/DELETE karena semua lewat service_role):
  ```sql
  alter table public.targets enable row level security;

  create policy "Anggota divisi dapat melihat target"
    on public.targets for select
    using (is_division_member(auth.uid(), division_id));
  ```
- [x] Step 4: Tambah trigger `updated_at` (ikuti pola dari migration sebelumnya)

> **Catatan BR-032:** Validasi overlap periode dilakukan di aplikasi (Server Action), bukan di DB constraint, karena perlu exclude ID target yang sedang diedit.


---

### Task 3: Migration — Tabel Recurring Task Templates
**Requirements:** REQ-050 to REQ-059
**Priority:** Must Have (prerequisite untuk Task 13 & 14)
**Files:**
- Create: `supabase/migrations/0011_recurring_tasks.sql`

- [x] Step 1: Buat enum `pola_ulang`:
  ```sql
  -- 0011_recurring_tasks.sql
  create type public.pola_ulang as enum (
    'daily_workday',
    'daily',
    'weekly',
    'monthly'
  );
  ```
- [x] Step 2: Buat tabel `recurring_task_templates`:
  ```sql
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
- [x] Step 3: Tambah indeks dan RLS:
  ```sql
  create index recurring_templates_division_idx
    on public.recurring_task_templates(division_id)
    where deleted_at is null;

  alter table public.recurring_task_templates enable row level security;

  create policy "Anggota divisi dapat melihat template"
    on public.recurring_task_templates for select
    using (is_division_member(auth.uid(), division_id));
  ```
- [x] Step 4: Tambah trigger `updated_at`

> **Catatan:** `board_id` menggunakan `on delete restrict` — jika board dihapus, template tidak boleh ikut hilang tanpa peringatan. Admin perlu update template terlebih dahulu.


---

### Task 4: Migration — Tasks Recurring Fields
**Requirements:** REQ-055, REQ-057, REQ-060, REQ-061
**Priority:** Must Have (prerequisite untuk Task 13 & 14)
**Files:**
- Create: `supabase/migrations/0012_tasks_recurring_fields.sql`

- [x] Step 1: Tambah dua kolom pada tabel `tasks`:
  ```sql
  -- 0012_tasks_recurring_fields.sql
  alter table public.tasks
    add column if not exists recurring_template_id uuid
      references public.recurring_task_templates(id) on delete set null,
    add column if not exists is_recurring boolean not null default false;
  ```
- [x] Step 2: Tambah indeks untuk query cron job (BR-031 cek duplikat per tanggal):
  ```sql
  create index tasks_recurring_template_idx
    on public.tasks(recurring_template_id, created_at)
    where recurring_template_id is not null;
  ```
- [x] Step 3: Verifikasi migration bisa dijalankan tanpa error di environment lokal

> **Catatan:** `on delete set null` dipilih agar task yang sudah dibuat otomatis tidak ikut terhapus ketika template dihapus/dinonaktifkan (sesuai REQ-054).

---

## Batch 2: Penyempurnaan Fitur Existing (Must Have)

### Task 5: Aktifkan Kembali Karyawan — Notifikasi
**Requirements:** REQ-001 to REQ-005
**Priority:** Must Have
**Files:**
- Modify: `src/app/admin/karyawan/actions.ts` — tambah notifikasi ke `aktifkanKembaliKaryawan()`
- Modify: `src/app/admin/karyawan/daftar-karyawan.tsx` — tombol "Aktifkan" sudah ada, tambah konfirmasi dialog
- Modify: `src/lib/notifikasi.ts` — tambah jenis `user_reactivated`
- Modify: `src/lib/aktivitas.ts` — tambah jenis `user_reactivated`

- [x] Step 1: Di `src/lib/aktivitas.ts`, tambah ke union type `JenisAktivitas`:
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
- [x] Step 2: Di `src/lib/aktivitas.ts`, tambah parameter opsional `detail` ke `catatAktivitas()`:
  ```typescript
  export async function catatAktivitas(data: {
    actorId: string
    actorNama: string
    jenis: JenisAktivitas
    objekTipe: string
    objekId: string | null
    objekNama: string
    divisionId?: string | null
    detail?: Record<string, unknown>   // <-- tambahkan ini
  }) {
    // ...di dalam try block, tambah detail ke insert:
    await admin.from('activity_log').insert({
      // ...kolom yang sudah ada...
      detail: data.detail ?? null,
    })
  }
  ```
- [x] Step 3: Di `src/lib/notifikasi.ts`, tambah `'user_reactivated'` ke union type `JenisNotifikasi`
- [x] Step 4: Di `src/app/admin/karyawan/actions.ts`, update `aktifkanKembaliKaryawan()` — ganti jenis log dan tambah notifikasi:
  ```typescript
  // Ganti jenis dari 'karyawan_diaktifkan' ke 'user_reactivated'
  await catatAktivitas({
    actorId: sesi.id,
    actorNama: sesi.nama,
    jenis: 'user_reactivated',   // ganti ini
    objekTipe: 'User',
    objekId: userId,
    objekNama: profilTarget?.nama ?? userId,
  })

  // Tambah notifikasi ke user yang diaktifkan
  await kirimNotifikasi({
    userId,
    jenis: 'user_reactivated',
    pesan: `Akun Anda telah diaktifkan kembali oleh ${sesi.nama}`,
    taskId: null,
    divisionId: null,
  })
  ```
- [x] Step 5: Di `daftar-karyawan.tsx`, tambah dialog konfirmasi di `tanganiAktifkan()`:
  ```typescript
  async function tanganiAktifkan(id: string, nama: string) {
    if (!confirm(`Aktifkan kembali akun ${nama}? Karyawan ini akan dapat login kembali.`)) return
    // ...sisa logic yang sudah ada
  }
  ```
  Pastikan signature fungsi dan pemanggilan onClick diperbarui untuk meneruskan `k.nama`

> **Catatan REQ-003:** Akses ke divisi sebelumnya otomatis dipulihkan karena row `division_members` tidak dihapus saat nonaktif — hanya `profiles.status` yang berubah.


---

### Task 6: Ubah Profil + Foto
**Requirements:** REQ-006 to REQ-012
**Priority:** Must Have
**Files:**
- Create: `src/app/profil/page.tsx`
- Create: `src/app/profil/actions.ts`
- Create: `src/app/profil/form-profil.tsx`
- Modify: `src/components/app-shell.tsx` — tambah link ke `/profil`

- [x] Step 1: Buat `src/app/profil/actions.ts`:
  ```typescript
  'use server'
  import { createAdminClient } from '@/lib/supabase/admin'
  import { ambilSesiPengguna } from '@/lib/auth/otorisasi'
  import { catatAktivitas } from '@/lib/aktivitas'

  const MAKS_UKURAN_FOTO = 2 * 1024 * 1024  // 2MB
  const TIPE_FOTO_DIIZINKAN = ['image/jpeg', 'image/png']
  const BUCKET_AVATAR = 'avatars'

  export type HasilProfil = { sukses: true } | { sukses: false; pesan: string }

  export async function updateProfil(nama: string): Promise<HasilProfil> {
    const sesi = await ambilSesiPengguna()
    const namaBersih = nama.trim()
    if (!namaBersih) return { sukses: false, pesan: 'Nama tidak boleh kosong' }
    if (namaBersih.length > 100) return { sukses: false, pesan: 'Nama maksimal 100 karakter' }
    const admin = createAdminClient()
    const { error } = await admin.from('profiles').update({ nama: namaBersih }).eq('id', sesi.id)
    if (error) return { sukses: false, pesan: 'Gagal menyimpan nama. Coba lagi.' }
    await catatAktivitas({ actorId: sesi.id, actorNama: sesi.nama, jenis: 'profile_updated',
      objekTipe: 'User', objekId: sesi.id, objekNama: namaBersih })
    return { sukses: true }
  }

  export type HasilUploadFoto = { sukses: true; fotoUrl: string } | { sukses: false; pesan: string }

  export async function uploadFoto(formData: FormData): Promise<HasilUploadFoto> {
    const sesi = await ambilSesiPengguna()
    const file = formData.get('foto') as File | null
    if (!file || file.size === 0) return { sukses: false, pesan: 'File tidak boleh kosong' }
    if (file.size > MAKS_UKURAN_FOTO) return { sukses: false, pesan: 'Ukuran foto maksimal 2 MB' }
    if (!TIPE_FOTO_DIIZINKAN.includes(file.type))
      return { sukses: false, pesan: 'Format foto harus JPG atau PNG' }
    const admin = createAdminClient()
    const path = `${sesi.id}/${crypto.randomUUID()}.jpg`
    const { error: errUpload } = await admin.storage.from(BUCKET_AVATAR).upload(path, file,
      { contentType: file.type, upsert: true })
    if (errUpload) return { sukses: false, pesan: 'Gagal mengunggah foto. Coba lagi.' }
    const { data: urlData } = admin.storage.from(BUCKET_AVATAR).getPublicUrl(path)
    const fotoUrl = urlData.publicUrl
    await admin.from('profiles').update({ foto_url: fotoUrl }).eq('id', sesi.id)
    await catatAktivitas({ actorId: sesi.id, actorNama: sesi.nama, jenis: 'profile_updated',
      objekTipe: 'User', objekId: sesi.id, objekNama: sesi.nama })
    return { sukses: true, fotoUrl }
  }
  ```
- [x] Step 2: Buat `src/app/profil/form-profil.tsx` (Client Component):
  - Props: `profilAwal: { nama: string; fotoUrl: string | null }`
  - State: `nama`, `preview`, `sedangMenyimpan`, `pesan`
  - Form nama: input text + tombol simpan → panggil `updateProfil(nama)`
  - Form foto: `<input type="file" accept="image/jpeg,image/png">` — validasi ukuran/tipe di client sebelum submit, lalu `uploadFoto(formData)`
  - Setelah upload berhasil: set `preview` dengan `URL.createObjectURL(file)` untuk tampilan langsung (REQ-011)
  - Panggil `router.refresh()` setelah setiap mutasi sukses agar sidebar/navbar update
- [x] Step 3: Buat `src/app/profil/page.tsx` (Server Component):
  - Ambil data profil via `ambilSesiPengguna()`
  - Render `<FormProfil profilAwal={{ nama, fotoUrl }} />`
- [x] Step 4: Modifikasi `src/components/app-shell.tsx` — tambah link "Profil Saya" yang mengarah ke `/profil` di menu dropdown user

> **Catatan REQ-010:** Resize ke 256×256 idealnya dilakukan via Supabase Image Transformations atau canvas API di client sebelum upload. Jika tidak tersedia, simpan as-is dan catat di tech debt.
> **Catatan bucket:** Pastikan bucket `avatars` sudah dibuat di Supabase dengan public access untuk `getPublicUrl()` berfungsi.


---

### Task 7: Nonaktifkan & Aktifkan Kembali Divisi — Dialog Konfirmasi Ketik Nama
**Requirements:** REQ-018 to REQ-026
**Priority:** Must Have
**Files:**
- Modify: `src/app/admin/divisi/actions.ts` — update `nonaktifkanDivisi()`, `aktifkanKembaliDivisi()` sudah ada
- Modify: `src/app/admin/divisi/daftar-divisi.tsx` — ganti `confirm()` dengan dialog ketik nama

- [x] Step 1: Update `nonaktifkanDivisi()` di `actions.ts` — tambah parameter `konfirmasiNama` dan validasi case-sensitive (REQ-019, REQ-020):
  ```typescript
  export async function nonaktifkanDivisi(
    divisionId: string,
    konfirmasiNama: string
  ): Promise<HasilAksiDivisi & { jumlahTaskAktif?: number }> {
    const sesi = await pastikanSuperAdmin()
    const admin = createAdminClient()

    // Ambil data divisi terlebih dahulu
    const { data: divisi } = await admin
      .from('divisions').select('nama, status').eq('id', divisionId).single()
    if (!divisi) return { sukses: false, pesan: 'Divisi tidak ditemukan' }
    if (divisi.status !== 'aktif') return { sukses: false, pesan: 'Divisi sudah nonaktif' }

    // REQ-020: validasi case-sensitive
    if (konfirmasiNama !== divisi.nama)
      return { sukses: false, pesan: 'Nama konfirmasi tidak cocok' }

    // REQ-023: cek task aktif (warning, tidak blokir)
    const { count: jumlahTaskAktif } = await admin
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .in('board_id', /* subquery boards di divisi ini */ [])
      .is('deleted_at', null)
      .is('completed_at', null)

    const { error } = await admin
      .from('divisions').update({ status: 'nonaktif' }).eq('id', divisionId)
    if (error) return { sukses: false, pesan: 'Gagal menonaktifkan divisi. Coba lagi.' }

    await catatAktivitas({ actorId: sesi.id, actorNama: sesi.nama,
      jenis: 'division_deactivated', objekTipe: 'Division',
      objekId: divisionId, objekNama: divisi.nama, divisionId })

    return { sukses: true, jumlahTaskAktif: jumlahTaskAktif ?? 0 }
  }
  ```
  > **Catatan cek task aktif:** Query boards dulu `select id from boards where division_id = $1 and deleted_at is null`, lalu gunakan `in('board_id', boardIds)` pada query tasks.
- [x] Step 2: Update `aktifkanKembaliDivisi()` — ganti jenis log ke `'division_reactivated'` (saat ini menggunakan `'divisi_diaktifkan'` yang belum ada di enum baru — update setelah Task 5 selesai)
- [x] Step 3: Update `daftar-divisi.tsx` — ganti browser `confirm()` dengan inline dialog state:
  - Tambah state: `dialogNonaktifkan: { id: string; nama: string } | null`, `inputKonfirmasi: string`
  - Tampilkan modal/overlay dengan `<input>` dan placeholder "Ketik nama divisi untuk konfirmasi"
  - Tombol "Nonaktifkan" disabled selama `inputKonfirmasi !== dialogNonaktifkan?.nama` (REQ-019)
  - Jika `hasil.jumlahTaskAktif > 0`, tampilkan warning sebelum dialog ditutup: "Terdapat X task aktif di divisi ini"
  - Tombol "Aktifkan" tetap satu klik tanpa konfirmasi ketik nama

> **Catatan REQ-021:** Divisi nonaktif sudah tidak muncul di sidebar karena `ambilDivisiSaya()` di `actions.ts` sudah filter `eq('divisions.status', 'aktif')`.


---

### Task 8: Ubah Judul Task — Inline Edit
**Requirements:** REQ-073 to REQ-075
**Priority:** Must Have
**Files:**
- Modify: `src/app/divisi/[id]/actions.ts` — tambah `ubahJudulTask()`
- Modify: `src/app/divisi/[id]/detail-task-panel.tsx` — inline edit judul

- [x] Step 1: Tambah `ubahJudulTask()` di `src/app/divisi/[id]/actions.ts`:
  ```typescript
  export async function ubahJudulTask(
    divisionId: string,
    taskId: string,
    judulBaru: string
  ): Promise<HasilBuatTask> {
    const sesi = await pastikanAnggotaDivisi(divisionId)

    const judulBersih = judulBaru.trim()
    if (!judulBersih) return { sukses: false, pesan: 'Judul task tidak boleh kosong' }
    if (judulBersih.length > 255) return { sukses: false, pesan: 'Judul task maksimal 255 karakter' }

    const admin = createAdminClient()
    const { data: task } = await admin
      .from('tasks')
      .select('judul, created_by, task_assignees(user_id)')
      .eq('id', taskId)
      .single()

    if (!task) return { sukses: false, pesan: 'Task tidak ditemukan' }

    // REQ-073: hanya assignee, pembuat, manajer, atau super admin
    type BarisAssignee = { user_id: string }
    const bolehUbah =
      sesi.roleSistem === 'super_admin' ||
      sesi.roleDivisi === 'manajer_divisi' ||
      task.created_by === sesi.id ||
      (task.task_assignees as unknown as BarisAssignee[]).some(a => a.user_id === sesi.id)

    if (!bolehUbah)
      return { sukses: false, pesan: 'Anda tidak memiliki izin mengubah judul task ini' }

    const judulLama = task.judul
    const { error } = await admin.from('tasks').update({ judul: judulBersih }).eq('id', taskId)
    if (error) return { sukses: false, pesan: 'Gagal menyimpan judul. Coba lagi.' }

    // REQ-075: log old/new value
    await catatAktivitas({
      actorId: sesi.id, actorNama: sesi.nama, jenis: 'task_judul_diubah',
      objekTipe: 'Task', objekId: taskId, objekNama: judulBersih, divisionId,
      detail: { old: judulLama, new: judulBersih },
    })

    return { sukses: true }
  }
  ```
- [x] Step 2: Di `detail-task-panel.tsx`, ubah render judul menjadi inline-editable:
  - State: `editJudul: boolean`, `judulSementara: string`
  - Saat tidak edit: `<button onClick={() => { setJudulSementara(task.judul); setEditJudul(true) }}>` menampilkan teks judul
  - Saat edit: `<input value={judulSementara} onChange={...} onBlur={simpanJudul} onKeyDown={e => { if (e.key === 'Enter') simpanJudul(); if (e.key === 'Escape') setEditJudul(false) }}>`
  - `simpanJudul()`: panggil `ubahJudulTask()`, update state lokal judul jika sukses, set `editJudul(false)`
  - Tampilkan pesan error di bawah input jika gagal


---

### Task 9: Reorder Board via Drag & Drop
**Requirements:** REQ-046 to REQ-049
**Priority:** Must Have
**Files:**
- Modify: `src/app/divisi/[id]/actions.ts` — tambah `ubahUrutanBoard()`
- Modify: `src/app/divisi/[id]/papan-divisi.tsx` — DnD horizontal untuk board
- Modify: `src/app/divisi/[id]/page.tsx` — teruskan prop `bolehReorderBoard`

- [x] Step 1: Tambah `ubahUrutanBoard()` di `actions.ts`:
  ```typescript
  export async function ubahUrutanBoard(
    divisionId: string,
    urutan: { boardId: string; urutan: number }[]
  ): Promise<HasilBuatTask> {
    const sesi = await pastikanManajerDivisi(divisionId)  // REQ-049: hanya manajer/super admin

    if (urutan.length === 0) return { sukses: true }

    const admin = createAdminClient()
    const hasilUpdate = await Promise.all(
      urutan.map(item =>
        admin.from('boards').update({ urutan: item.urutan }).eq('id', item.boardId).eq('division_id', divisionId)
      )
    )

    const gagal = hasilUpdate.find(r => r.error)
    if (gagal) return { sukses: false, pesan: 'Gagal menyimpan urutan board. Coba lagi.' }

    await catatAktivitas({ actorId: sesi.id, actorNama: sesi.nama, jenis: 'board_diurutkan',
      objekTipe: 'Board', objekId: null, objekNama: `${urutan.length} board`, divisionId })

    return { sukses: true }
  }
  ```
- [x] Step 2: Di `page.tsx`, hitung `bolehReorderBoard` dari sesi:
  ```typescript
  const bolehReorderBoard = sesi.roleSistem === 'super_admin' || sesi.roleDivisi === 'manajer_divisi'
  ```
  Teruskan sebagai prop ke `<PapanDivisi bolehReorderBoard={bolehReorderBoard} ... />`
- [x] Step 3: Di `papan-divisi.tsx`:
  - Tambah prop `bolehReorderBoard: boolean` ke komponen
  - Bungkus daftar board dengan `DndContext` + `SortableContext` menggunakan `horizontalListSortingStrategy`
  - Tambah `useSortable` pada setiap board header — handle drag hanya ditampilkan jika `bolehReorderBoard` (REQ-049)
  - `onDragEnd` handler:
    ```typescript
    function handleBoardDragEnd(event: DragEndEvent) {
      const { active, over } = event
      if (!over || active.id === over.id) return
      const oldIndex = boards.findIndex(b => b.id === active.id)
      const newIndex = boards.findIndex(b => b.id === over.id)
      const boardsBaru = arrayMove(boards, oldIndex, newIndex)
      setBoards(boardsBaru)  // REQ-048: optimistic update
      const urutan = boardsBaru.map((b, i) => ({ boardId: b.id, urutan: i }))
      ubahUrutanBoard(divisionId, urutan).then(hasil => {
        if (!hasil.sukses) setBoards(boards)  // rollback jika gagal
      })
    }
    ```

> **Catatan:** Pastikan `DndContext` untuk board reorder terpisah dari `DndContext` yang sudah ada untuk task drag-and-drop (task DnD berjalan vertikal, board DnD berjalan horizontal).


---

## Batch 3: Halaman Admin Baru (Must Have)

### Task 10: Recycle Bin — Data Terhapus
**Requirements:** REQ-039 to REQ-045
**Priority:** Must Have
**Files:**
- Create: `src/app/admin/data-terhapus/page.tsx`
- Create: `src/app/admin/data-terhapus/actions.ts`
- Modify: `src/components/sidebar.tsx` — tambah link di menu admin

- [ ] Step 1: Buat `src/app/admin/data-terhapus/actions.ts`:
  ```typescript
  'use server'
  // ambilTaskTerhapus(): query tasks dengan deleted_at IS NOT NULL,
  //   join ke boards, divisions, profiles (deleted_by),
  //   hitung sisaHari = 90 - floor((now - deleted_at) / hari)
  //   filter hanya yang sisaHari >= 0 (yang sudah > 90 hari dihapus oleh cron)

  export async function ambilTaskTerhapus(): Promise<TaskTerhapus[]> {
    await pastikanSuperAdmin()
    const admin = createAdminClient()
    const { data } = await admin
      .from('tasks')
      .select(`id, judul, deleted_at, board_id,
        boards!inner(nama, division_id, divisions!inner(nama)),
        profiles!tasks_deleted_by_fkey(nama)`)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })
    // Map ke TaskTerhapus dengan kalkulasi sisaHari
    // ...
  }

  export async function restoreTask(taskId: string): Promise<HasilRestore> {
    await pastikanSuperAdmin()
    const admin = createAdminClient()
    // 1. Ambil task + board asal
    // 2. Cek board asal masih aktif (deleted_at is null)
    //    Jika tidak: cari board pertama di divisi yg sama (order by urutan asc)
    //    Jika tidak ada board: return error
    // 3. Update tasks set deleted_at = null, board_id = boardFallback
    // 4. Catat aktivitas 'task_restored'
  }

  export async function hapusPermanenTask(taskId: string): Promise<HasilRestore> {
    await pastikanSuperAdmin()
    const admin = createAdminClient()
    // 1. Ambil semua lampiran task (path dari task_attachments)
    // 2. Hapus files dari storage bucket 'task-attachments'
    // 3. Hard delete task (cascade hapus: task_assignees, checklist_items,
    //    task_attachments, comments, task_labels)
    // 4. Catat aktivitas 'task_permanently_deleted'
  }
  ```
- [ ] Step 2: Buat `src/app/admin/data-terhapus/page.tsx` — Server Component shell:
  - `await pastikanSuperAdmin()` di atas
  - Ambil `tasksAwal = await ambilTaskTerhapus()`
  - Render `<DaftarTaskTerhapus tasksAwal={tasksAwal} />`
- [ ] Step 3: Buat Client Component `DaftarTaskTerhapus` (bisa dalam file yang sama atau file terpisah):
  - Tampilkan tabel: Judul, Divisi/Board, Tgl Dihapus, Sisa Hari (badge merah jika < 7 hari)
  - Tombol "Pulihkan" per baris → konfirmasi → `restoreTask(id)` → `router.refresh()`
  - Tombol "Hapus Permanen" per baris → dialog konfirmasi explicit ("Aksi ini tidak dapat dibatalkan") → `hapusPermanenTask(id)` → `router.refresh()`
  - `sedangProses: Set<string>` untuk track loading state per-task
- [ ] Step 4: Tambah link "Data Terhapus" di `src/components/sidebar.tsx` di bawah menu admin (hanya tampil untuk `super_admin`)

> **Catatan REQ-043:** Penghapusan otomatis setelah 90 hari perlu cron job terpisah. Untuk MVP, bisa dilakukan sebagai filter di `ambilTaskTerhapus()` yang tidak menampilkan task > 90 hari, dan permanen delete dijadwalkan manual atau via cron yang sama dengan Task 14.
> **Catatan REQ-042 restore:** Soft-deleted `checklist_items`, `comments`, `task_attachments` yang juga punya `deleted_at` perlu di-set null juga saat restore — cek migration apakah tabel-tabel ini punya kolom `deleted_at`.


---

### Task 11: Halaman Detail Karyawan
**Requirements:** REQ-013 to REQ-017
**Priority:** Could Have (di requirements prioritas = Could Have, tapi ditempatkan di Batch 3 sesuai permintaan)
**Files:**
- Create: `src/app/admin/karyawan/[id]/page.tsx`
- Modify: `src/app/admin/karyawan/actions.ts` — tambah `ambilDetailKaryawan()`, `ambilRingkasanBebanKerja()`
- Modify: `src/app/admin/karyawan/daftar-karyawan.tsx` — nama jadi link ke `/admin/karyawan/[id]`

- [ ] Step 1: Tambah fungsi di `src/app/admin/karyawan/actions.ts`:
  ```typescript
  export type DetailKaryawan = {
    id: string; nama: string; email: string; jabatan: string | null
    roleSistem: string; status: string; createdAt: string
    divisi: { id: string; nama: string; warna: string; role: string }[]
  }

  export async function ambilDetailKaryawan(userId: string): Promise<DetailKaryawan | null> {
    // Bisa diakses oleh Super Admin atau Manajer Divisi mana pun
    const sesi = await ambilSesiPengguna()
    if (sesi.roleSistem !== 'super_admin' && sesi.roleSistem !== 'user') {
      // Manajer Divisi (role_sistem = 'user' dengan roleDivisi tertentu) juga boleh
      // Gunakan pastikanSuperAdmin() atau buat fungsi otorisasi baru
    }
    // ...query profiles + division_members + divisions
  }

  export type RingkasanBeban = {
    totalAktif: number; totalSelesai: number; totalTerlambat: number
  }

  export async function ambilRingkasanBebanKerja(
    userId: string, dari: string, sampai: string
  ): Promise<RingkasanBeban> {
    await pastikanSuperAdmin()  // atau cek roleDivisi manajer
    const admin = createAdminClient()
    // Query tasks via task_assignees where user_id = userId
    // totalAktif: completed_at IS NULL AND deleted_at IS NULL
    // totalSelesai: completed_at BETWEEN dari AND sampai AND deleted_at IS NULL
    // totalTerlambat: due_date < NOW() AND completed_at IS NULL AND deleted_at IS NULL
  }
  ```
- [ ] Step 2: Buat `src/app/admin/karyawan/[id]/page.tsx` — Server Component:
  - Ambil `detail = await ambilDetailKaryawan(params.id)`
  - Render profil karyawan (nama, email, jabatan, role, status, tanggal bergabung)
  - Render daftar divisi yang diikuti
  - Render Client Component `<RingkasanBebanKerja userId={params.id}>` dengan filter tanggal
- [ ] Step 3: Buat Client Component `RingkasanBebanKerja`:
  - State: `dari`, `sampai`, `data`, `sedangMuat`
  - `useEffect` / `useTransition` untuk fetch ulang saat filter berubah
  - Tampilkan 3 angka: Total Aktif, Selesai, Terlambat dalam periode
- [ ] Step 4: Di `daftar-karyawan.tsx`, ubah `<p className="... font-bold">{k.nama}</p>` menjadi `<a href={/admin/karyawan/${k.id}}>` (atau `<Link>`) agar nama jadi link ke halaman detail


---

## Batch 4: Fitur Baru — Should Have

### Task 12: Target & Realisasi
**Requirements:** REQ-027 to REQ-038
**Priority:** Should Have
**Dependencies:** Task 2 (migration tabel `targets`)
**Files:**
- Create: `src/app/divisi/[id]/target/page.tsx`
- Create: `src/app/divisi/[id]/target/actions.ts`
- Create: `src/app/divisi/[id]/target/form-target.tsx`
- Create: `src/app/divisi/[id]/target/tabel-realisasi.tsx`
- Modify: `src/app/divisi/[id]/page.tsx` — tambah link/tab ke halaman target

- [ ] Step 1: Buat `src/app/divisi/[id]/target/actions.ts` dengan fungsi-fungsi berikut:
  ```typescript
  'use server'
  // buatTarget(divisionId, userId, periodeMulai, periodeSelesai, jumlahTarget, keterangan)
  //   1. pastikanManajerDivisi(divisionId)
  //   2. Validasi: periodeSelesai > periodeMulai
  //   3. BR-032: cek overlap — query targets WHERE user_id = userId AND division_id = divisionId
  //      AND NOT (periode_selesai < periodeMulai OR periode_mulai > periodeSelesai)
  //   4. Insert ke targets
  //   5. catatAktivitas 'target_dibuat'

  // ubahTarget(targetId, data) — hanya jika periode_selesai >= now (REQ-030)
  //   1. pastikanManajerDivisi(divisionId)
  //   2. Cek target belum berakhir
  //   3. Validasi & cek overlap dengan exclude targetId saat ini
  //   4. Update + catatAktivitas 'target_diubah'

  // hapusTarget(targetId)
  //   1. pastikanManajerDivisi(divisionId)
  //   2. Delete (hard delete untuk target)
  //   3. catatAktivitas 'target_dihapus'

  // ambilTarget(divisionId): Target[]
  //   pastikanAnggotaDivisi() — filter per role di layer UI

  // ambilRealisasi(divisionId): RealisasiTarget[]
  //   - JOIN targets + tasks
  //   - COUNT DISTINCT tasks.id WHERE assignee_id = target.user_id
  //     AND completed_at BETWEEN target.periode_mulai AND target.periode_selesai
  //     AND deleted_at IS NULL
  //   - Hitung persentase dan status via hitungStatusTarget()
  ```
- [ ] Step 2: Implementasikan `hitungStatusTarget()` sebagai fungsi helper (bukan Server Action):
  ```typescript
  function hitungStatusTarget(
    realisasi: number, target: number,
    periodeMulai: string, periodeSelesai: string
  ): 'completed' | 'on_track' | 'at_risk' {
    if (realisasi / target >= 1) return 'completed'
    const total = new Date(periodeSelesai).getTime() - new Date(periodeMulai).getTime()
    const terlewati = Date.now() - new Date(periodeMulai).getTime()
    const pctWaktu = total > 0 ? terlewati / total : 0
    if (pctWaktu > 0.75 && realisasi / target < 0.5) return 'at_risk'
    return 'on_track'
  }
  ```
- [ ] Step 3: Buat `src/app/divisi/[id]/target/form-target.tsx` (Client Component):
  - Field: dropdown pilih anggota, date range picker (input[type=date]), input jumlah, textarea keterangan
  - Validasi client-side sebelum submit
  - Panggil `buatTarget()` atau `ubahTarget()` tergantung prop `targetEdit`
- [ ] Step 4: Buat `src/app/divisi/[id]/target/tabel-realisasi.tsx`:
  - Props: `realisasi: RealisasiTarget[]`, `roleSistem`, `currentUserId`
  - Staff/Viewer hanya melihat baris data diri sendiri (filter di komponen)
  - Progress bar: `<div style={{ width: '${Math.min(100, r.persentase)}%' }}>`
  - Warna: `bg-green-500` (completed), `bg-yellow-400` (at_risk), `bg-blue-500` (on_track)
- [ ] Step 5: Buat `src/app/divisi/[id]/target/page.tsx` (Server Component):
  - `pastikanAnggotaDivisi(divisionId)` untuk akses awal
  - Ambil target + realisasi, render `FormTarget` + `TabelRealisasi`
  - `FormTarget` hanya dirender jika `roleDivisi === 'manajer_divisi'` atau `roleSistem === 'super_admin'`
- [ ] Step 6: Di `src/app/divisi/[id]/page.tsx`, tambah link/tab navigasi ke `/divisi/${id}/target`


---

### Task 13: Tugas Rutin — Template Management
**Requirements:** REQ-050 to REQ-054, REQ-060 to REQ-063
**Priority:** Should Have
**Dependencies:** Task 3 (migration `recurring_task_templates`), Task 4 (migration `tasks` recurring fields)
**Files:**
- Create: `src/app/divisi/[id]/tugas-rutin/page.tsx`
- Create: `src/app/divisi/[id]/tugas-rutin/actions.ts`
- Create: `src/app/divisi/[id]/tugas-rutin/form-template.tsx`
- Create: `src/app/divisi/[id]/tugas-rutin/daftar-template.tsx`
- Modify: `src/app/divisi/[id]/task-card.tsx` — ikon berulang
- Modify: `src/app/divisi/[id]/detail-task-panel.tsx` — tampilkan info template
- Modify: `src/app/divisi/[id]/actions.ts` — tambah `isRecurring` ke `TaskRingkas`

- [x] Step 1: Tambah `isRecurring: boolean` ke type `TaskRingkas` di `actions.ts` dan query di `ambilPapanDivisi()`:
  ```typescript
  // Di SELECT query, tambah: is_recurring
  // Di map function, tambah:
  isRecurring: t.is_recurring,
  ```
- [ ] Step 2: Buat `src/app/divisi/[id]/tugas-rutin/actions.ts`:
  ```typescript
  // buatTemplate(divisionId, data: {...semua field template})
  //   1. pastikanManajerDivisi(divisionId)
  //   2. Validasi field (judul ≤ 255, pola valid, dll.)
  //   3. Untuk pola 'weekly': wajib day_of_week; 'monthly': wajib day_of_month
  //   4. Insert ke recurring_task_templates
  //   5. catatAktivitas 'template_dibuat'

  // ubahTemplate(templateId, data)
  //   pastikanManajerDivisi(divisionId) → update → 'template_diubah'

  // hapusTemplate(templateId)  — soft delete (set deleted_at)
  //   pastikanManajerDivisi(divisionId) → update deleted_at → 'template_dihapus'

  // toggleAktifTemplate(templateId, isActive)  — aktifkan/nonaktifkan
  //   pastikanManajerDivisi(divisionId) → update is_active

  // ambilTemplates(divisionId): RecurringTemplate[]
  //   pastikanAnggotaDivisi() → select where deleted_at is null → join boards, profiles (assignee nama)

  // ambilRiwayatTemplate(templateId): TaskDariTemplate[]
  //   pastikanAnggotaDivisi(divisionId)
  //   SELECT tasks WHERE recurring_template_id = templateId AND deleted_at IS NULL
  //   ORDER BY created_at DESC
  ```
- [ ] Step 3: Buat `src/app/divisi/[id]/tugas-rutin/form-template.tsx` (Client Component):
  - State untuk semua field template
  - Field kondisional: tampilkan `day_of_week` select (Senin–Minggu) hanya jika `pola === 'weekly'`, `day_of_month` (1–31) hanya jika `pola === 'monthly'`
  - Multi-select assignee dari daftar anggota divisi
  - Field `due_offset_hari` (integer) untuk menentukan berapa hari setelah pembuatan task jatuh tempo
- [ ] Step 4: Buat `src/app/divisi/[id]/tugas-rutin/daftar-template.tsx` (Client Component):
  - Render setiap template sebagai kartu
  - Toggle aktif/nonaktif via `toggleAktifTemplate()`
  - Tombol Edit → buka `FormTemplate` dalam mode edit
  - Tombol Hapus → konfirmasi → `hapusTemplate()`
  - Tombol "Lihat Riwayat" → buka modal/panel yang memanggil `ambilRiwayatTemplate()` dan menampilkan tabel tanggal/status/assignee
- [ ] Step 5: Buat `page.tsx` (Server Component):
  - Ambil templates, boards, anggota
  - Render `DaftarTemplate` + tombol "Buat Template Baru" (hanya untuk manajer/super admin)
- [ ] Step 6: Di `task-card.tsx`, tambah badge ikon berulang (REQ-060):
  ```tsx
  {task.isRecurring && (
    <span title="Tugas Rutin"
      className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
      ↻ Rutin
    </span>
  )}
  ```
- [ ] Step 7: Di `detail-task-panel.tsx`, tambah info template di bagian meta-data (REQ-061):
  - Tambah field `templatePola?: PolaUlang` ke `DetailTask` type dan query `ambilDetailTask()`
  - Render: `{detail.isRecurring && <p>Tugas Rutin — {LABEL_POLA[detail.templatePola]}</p>}`
  - Definisikan `LABEL_POLA`: `{ daily_workday: 'Setiap hari kerja', daily: 'Setiap hari', weekly: 'Setiap minggu', monthly: 'Setiap bulan' }`


---

### Task 14: Cron Job — Pembuatan Task Otomatis
**Requirements:** REQ-055 to REQ-059
**Priority:** Should Have
**Dependencies:** Task 3, Task 4, Task 13
**Files:**
- Create: `src/lib/cron/buat-tugas-rutin.ts`
- Create: `src/app/api/cron/buat-tugas-rutin/route.ts`
- Create: `vercel.json` (atau update jika sudah ada)
- Modify: `.env.local.example` — tambah `CRON_SECRET`

- [ ] Step 1: Buat `src/lib/cron/buat-tugas-rutin.ts`:
  ```typescript
  import 'server-only'
  import { createAdminClient } from '@/lib/supabase/admin'
  import { catatAktivitas } from '@/lib/aktivitas'

  function hariIniJadwalTemplate(
    template: { pola: string; day_of_week: number | null; day_of_month: number | null },
    hariMinggu: number,  // 0=Sun, 1=Mon, ..., 6=Sat
    tanggalHariIni: string  // YYYY-MM-DD
  ): boolean {
    switch (template.pola) {
      case 'daily_workday': return hariMinggu >= 1 && hariMinggu <= 5
      case 'daily': return true
      case 'weekly': return hariMinggu === template.day_of_week
      case 'monthly': return parseInt(tanggalHariIni.slice(8, 10)) === template.day_of_month
      default: return false
    }
  }

  export async function jalankanBuatTugasRutin() {
    const admin = createAdminClient()
    const hariIniWIB = new Date(Date.now() + 7 * 60 * 60 * 1000)
    const tanggalHariIni = hariIniWIB.toISOString().slice(0, 10)
    const hariMinggu = hariIniWIB.getDay()
    const hasil = { dibuat: 0, dilewati: 0, error: 0 }

    const { data: templates } = await admin
      .from('recurring_task_templates')
      .select('*')
      .eq('is_active', true)
      .is('deleted_at', null)
      .lte('tanggal_mulai', tanggalHariIni)
      .or(`tanggal_selesai.is.null,tanggal_selesai.gte.${tanggalHariIni}`)

    for (const template of templates ?? []) {
      // Cek jadwal
      if (!hariIniJadwalTemplate(template, hariMinggu, tanggalHariIni)) {
        hasil.dilewati++
        continue
      }

      // BR-031: cek duplikat per tanggal (rentang WIB)
      const { count } = await admin.from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('recurring_template_id', template.id)
        .gte('created_at', `${tanggalHariIni}T00:00:00+07:00`)
        .lt('created_at', `${tanggalHariIni}T23:59:59+07:00`)

      if ((count ?? 0) > 0) { hasil.dilewati++; continue }

      try {
        // Hitung due_date = tanggalHariIni + due_offset_hari
        const dueDate = new Date(tanggalHariIni)
        dueDate.setDate(dueDate.getDate() + template.due_offset_hari)

        const { data: taskBaru, error } = await admin.from('tasks')
          .insert({
            board_id: template.board_id,
            judul: template.judul,
            deskripsi: template.deskripsi,
            prioritas: template.prioritas,
            due_date: dueDate.toISOString().slice(0, 10),
            created_by: template.created_by,
            recurring_template_id: template.id,
            is_recurring: true,
          })
          .select('id').single()

        if (error || !taskBaru) { hasil.error++; continue }

        // Insert assignees
        if (template.assignee_ids.length > 0) {
          await admin.from('task_assignees').insert(
            template.assignee_ids.map((uid: string) => ({
              task_id: taskBaru.id, user_id: uid, assigned_by: template.created_by
            }))
          )
        }

        // REQ-059: log aktivitas
        await catatAktivitas({
          actorId: template.created_by, actorNama: 'Sistem',
          jenis: 'task_auto_created', objekTipe: 'Task',
          objekId: taskBaru.id, objekNama: template.judul,
          divisionId: template.division_id,
        })

        // Update last_generated_date
        await admin.from('recurring_task_templates')
          .update({ last_generated_date: tanggalHariIni }).eq('id', template.id)

        hasil.dibuat++
      } catch { hasil.error++ }
    }

    return hasil
  }
  ```
- [ ] Step 2: Buat `src/app/api/cron/buat-tugas-rutin/route.ts`:
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
- [ ] Step 3: Buat (atau update) `vercel.json` di root project:
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
  > `0 0 * * *` = tengah malam UTC = pukul 07:00 WIB (REQ-055)
- [ ] Step 4: Tambah ke `.env.local.example`:
  ```
  CRON_SECRET=your-secret-here
  ```
- [ ] Step 5: Tambah `CRON_SECRET` ke `.env.local` dengan nilai random yang kuat (gunakan `openssl rand -hex 32` atau generator sejenis)


---

### Task 15: Log Sistem
**Requirements:** REQ-064 to REQ-068
**Priority:** Should Have
**Dependencies:** Task 1 (kolom `detail`), Task 5 (jenis aktivitas baru di `aktivitas.ts`)
**Files:**
- Create: `src/app/admin/log-sistem/page.tsx`
- Create: `src/app/admin/log-sistem/actions.ts`
- Modify: `src/components/sidebar.tsx` — tambah link Log Sistem di menu admin

- [ ] Step 1: Buat `src/app/admin/log-sistem/actions.ts`:
  ```typescript
  'use server'
  // ambilLogSistem(filter: FilterLog): { entries: LogEntry[]; total: number }
  //   1. pastikanSuperAdmin()
  //   2. Build query dinamis:
  //      - filter.actorId: .eq('actor_id', actorId)
  //      - filter.jenisAktivitas: .eq('jenis_aktivitas', jenisAktivitas)
  //      - filter.divisionId: .eq('division_id', divisionId)
  //      - filter.dari: .gte('created_at', dari + 'T00:00:00Z')
  //      - filter.sampai: .lte('created_at', sampai + 'T23:59:59Z')
  //   3. Paginasi: .range((halaman-1)*50, halaman*50 - 1) (REQ-067)
  //   4. ORDER BY created_at DESC

  // eksporLogCSV(filter: Omit<FilterLog, 'halaman'>): { sukses: true; csv: string } | ...
  //   1. pastikanSuperAdmin()
  //   2. Query tanpa paginasi (semua hasil filter)
  //   3. Generate CSV dengan UTF-8 BOM:
  //      Header: Timestamp,User,Aksi,Tipe Entitas,ID Entitas,Divisi,Detail
  //      Setiap baris: escape koma dan tanda kutip
  //   4. Return { sukses: true, csv: csvString }
  ```
- [ ] Step 2: Buat `src/app/admin/log-sistem/page.tsx` (Server Component):
  - Baca `searchParams` untuk filter awal (actorId, jenis, divisionId, dari, sampai, halaman)
  - Ambil data via `ambilLogSistem(filter)`
  - Ambil daftar user dan divisi untuk dropdown filter
  - Render: komponen filter URL-driven + tabel log + paginasi + tombol ekspor CSV
- [ ] Step 3: Buat Client Component `FilterLog`:
  - State lokal untuk field filter
  - Submit mengubah URL via `router.push()` dengan searchParams baru
  - Semua filter dapat dikombinasikan bebas (REQ-065)
- [ ] Step 4: Buat Client Component `TombolEkspor`:
  - Kumpulkan filter yang sedang aktif dari URL
  - Panggil `eksporLogCSV(filter)` (Server Action)
  - Buat Blob dari string CSV dan trigger download:
    ```typescript
    const blob = new Blob([hasil.csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `log-sistem-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    ```
- [ ] Step 5: Tambah link "Log Sistem" di sidebar admin


---

### Task 16: Ekspor CSV Dashboard
**Requirements:** REQ-069 to REQ-072
**Priority:** Should Have
**Files:**
- Modify: `src/app/dashboard/actions.ts` — tambah `eksporRekapCSV()`
- Modify: `src/app/dashboard/page.tsx` — tambah tombol ekspor + filter tanggal

- [ ] Step 1: Tambah `eksporRekapCSV()` ke `src/app/dashboard/actions.ts`:
  ```typescript
  export async function eksporRekapCSV(
    dari: string,
    sampai: string
  ): Promise<{ sukses: true; csv: string } | { sukses: false; pesan: string }> {
    const sesi = await ambilSesiPengguna()

    // REQ-072: Super Admin → semua divisi; Manajer → divisi miliknya saja
    // Ambil divisi yang relevan sesuai role

    const admin = createAdminClient()
    // Query: untuk setiap anggota dari divisi yang relevan, hitung:
    //   - totalTugas: count task_assignees WHERE completed_at BETWEEN dari AND sampai
    //     OR (completed_at IS NULL AND created_at BETWEEN dari AND sampai)
    //   - selesai: count tasks WHERE completed_at BETWEEN dari AND sampai
    //   - terlambat: count tasks WHERE due_date < completed_at (terlambat selesai)
    //     OR (due_date < NOW() AND completed_at IS NULL) (belum selesai dan overdue)
    //   - tingkatTepatWaktu: (selesai_tepat_waktu / total_selesai) * 100

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
- [ ] Step 2: Di `src/app/dashboard/page.tsx`, tambah Client Component `TombolEkspor`:
  - State: `dari`, `sampai` (default: awal bulan ini → hari ini), `sedangEkspor`
  - Tombol "Ekspor CSV" → panggil `eksporRekapCSV(dari, sampai)` → trigger download (pola yang sama dengan Task 15 Step 4)
  - Nama file: `rekap-tugas-[YYYY-MM-DD].csv` (REQ-071)
- [ ] Step 3: Pastikan tombol ekspor hanya muncul untuk Manajer Divisi dan Super Admin (REQ-069)

---

## Batch 5: Could Have

### Task 17: Mention @nama dalam Komentar
**Requirements:** REQ-076 to REQ-079
**Priority:** Could Have
**Dependencies:** Task 5 (jenis notifikasi `mention` di `notifikasi.ts`)
**Files:**
- Modify: `src/app/divisi/[id]/komentar-section.tsx` — ganti textarea dengan `KomentarEditor`
- Modify: `src/app/notifikasi/actions.ts` — tambah dukungan tipe `mention`
- Modify: `src/lib/notifikasi.ts` — tambah jenis `mention` (sudah dilakukan di Task 5)

- [ ] Step 1: Di `komentar-section.tsx`, buat atau ekstrak komponen `KomentarEditor` (Client Component):
  - State: `teks`, `mencariMention`, `queryMention`, `indexSuggestion`
  - Sekali saat mount: fetch `ambilAnggotaDivisi(divisionId)` dan simpan ke state `semuaAnggota`
  - Pada setiap keystroke, jalankan regex untuk deteksi pola `@query`:
    ```typescript
    const match = teks.slice(0, cursorPos).match(/@(\w*)$/)
    if (match) {
      setMencariMention(true)
      setQueryMention(match[1])
    } else {
      setMencariMention(false)
    }
    ```
  - Filter `semuaAnggota` berdasarkan `queryMention`, tampilkan maks 5 saran (REQ-077)
  - Navigasi keyboard dropdown: ArrowUp/Down memindahkan `indexSuggestion`, Enter memilih, Escape menutup
  - Saat anggota dipilih: replace `@query` dengan `@${anggota.nama}` di `teks`
- [ ] Step 2: Fungsi render komentar — parse `@mention` dalam teks yang sudah tersimpan:
  ```typescript
  function renderIsiKomentar(isi: string): React.ReactNode {
    const parts = isi.split(/(@\w[\w\s]*?\b)/)
    return parts.map((part, i) =>
      part.startsWith('@')
        ? <span key={i} className="font-bold text-blue-600">{part}</span>
        : <span key={i}>{part}</span>
    )
  }
  ```
- [ ] Step 3: Update `tambahKomentar()` di `actions.ts` untuk parse @mention dan kirim notifikasi:
  ```typescript
  // Setelah insert komentar berhasil, parse mention dari teks:
  const mentionRegex = /@([\w\s]+)/g
  const namaDisebut = [...teks.matchAll(mentionRegex)].map(m => m[1].trim())

  if (namaDisebut.length > 0) {
    const { data: anggota } = await admin
      .from('division_members')
      .select('user_id, profiles!inner(nama)')
      .eq('division_id', divisionId)

    // Cocokkan nama → user_id, kirim notifikasi ke yang di-mention
    for (const nama of namaDisebut) {
      const anggotaTarget = anggota?.find(a =>
        (a.profiles as { nama: string }).nama.toLowerCase() === nama.toLowerCase()
      )
      if (anggotaTarget && anggotaTarget.user_id !== sesi.id) {
        await kirimNotifikasi({
          userId: anggotaTarget.user_id,
          jenis: 'mention',
          pesan: `${sesi.nama} menyebut Anda dalam komentar di task "${task?.judul ?? 'Task'}"`,
          taskId,
          divisionId,
        })
      }
    }
  }
  ```
- [ ] Step 4: Update `src/app/notifikasi/actions.ts` untuk parse dan render notifikasi tipe `mention` dengan label yang sesuai di UI notifikasi

> **Catatan REQ-079:** Jika user yang di-mention sudah bukan anggota divisi, mention tetap ditampilkan di komentar tapi notifikasi tidak dikirim (cek keanggotaan sebelum `kirimNotifikasi()`).
> **Catatan implementasi mention parsing:** Menggunakan nama (bukan username/id) karena sistem tidak memiliki username unik. Jika nama anggota mengandung spasi, regex perlu disesuaikan. Pertimbangkan edge case nama duplikat dalam divisi.


---

## Ringkasan & Urutan Implementasi

| # | Task | Priority | Dependencies |
|---|------|----------|--------------|
| 1 | Migration — Activity Log Detail Column | Must Have | — |
| 2 | Migration — Tabel Targets | Must Have | — |
| 3 | Migration — Tabel Recurring Task Templates | Must Have | — |
| 4 | Migration — Tasks Recurring Fields | Must Have | Task 3 |
| 5 | Aktifkan Kembali Karyawan — Notifikasi | Must Have | Task 1 |
| 6 | Ubah Profil + Foto | Must Have | — |
| 7 | Nonaktifkan & Aktifkan Divisi — Dialog Ketik Nama | Must Have | Task 5 (jenis aktivitas) |
| 8 | Ubah Judul Task — Inline Edit | Must Have | Task 1 |
| 9 | Reorder Board via Drag & Drop | Must Have | — |
| 10 | Recycle Bin — Data Terhapus | Must Have | Task 5 (jenis aktivitas) |
| 11 | Halaman Detail Karyawan | Could Have | — |
| 12 | Target & Realisasi | Should Have | Task 2 |
| 13 | Tugas Rutin — Template Management | Should Have | Task 3, 4 |
| 14 | Cron Job — Pembuatan Task Otomatis | Should Have | Task 13 |
| 15 | Log Sistem | Should Have | Task 1, 5 |
| 16 | Ekspor CSV Dashboard | Should Have | — |
| 17 | Mention @nama dalam Komentar | Could Have | Task 5 |

### Business Rules Checklist

- [ ] **BR-019** — Minimal 1 Super Admin aktif: sudah diimplementasikan di `nonaktifkanKaryawan()`, tidak berlaku untuk reaktivasi
- [ ] **BR-022** — Warning jika divisi punya task aktif saat dinonaktifkan: implementasi di Task 7
- [ ] **BR-028** — Setiap task dihitung sekali per target: `count(distinct tasks.id)` di `ambilRealisasi()` (Task 12)
- [ ] **BR-029** — Soft delete + 90-hari retention: `deleted_at` pada tasks, hapus permanen di Task 10
- [ ] **BR-030** — Validasi foto profil di server (ukuran ≤ 2 MB, format JPG/PNG): implementasi di Task 6
- [ ] **BR-031** — No duplicate recurring task per tanggal: cek `recurring_template_id + DATE(created_at)` di Task 14
- [ ] **BR-032** — No overlap target periode per anggota: cek overlap query di `buatTarget()` / `ubahTarget()` (Task 12)
