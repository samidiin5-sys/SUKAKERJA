# Requirements: SukaKerja — Fitur Lanjutan

## Deskripsi

Dokumen ini mendefinisikan requirements untuk fitur-fitur lanjutan aplikasi SukaKerja, sistem manajemen tugas internal berbasis web untuk perusahaan Suka Shawarma. Fitur-fitur ini merupakan pengembangan di atas fondasi yang sudah ada (auth, user management, divisi, board, task, checklist, lampiran, komentar, label, notifikasi, dashboard, dan activity log).

**Stack:** Next.js 16 App Router · TypeScript · Tailwind v4 · Supabase (Auth + PostgreSQL + Storage) · DnD Kit

---

## Modul 1: Manajemen Pengguna (User Management)

### FR-USER-004 — Aktifkan Kembali Akun Karyawan

- [ ] The system shall allow a Super Admin to reactivate a previously deactivated employee account. {REQ-001}
- [ ] The system shall display a confirmation dialog before reactivating an account, showing the employee's name and current status. {REQ-002}
- [ ] The system shall restore the employee's access to all divisions they were previously a member of upon reactivation. {REQ-003}
- [ ] The system shall log the reactivation event to the activity log, recording the acting Super Admin's identity and timestamp. {REQ-004}
- [ ] The system shall enforce Business Rule BR-019: reactivation must not result in zero active Super Admins at any time. {REQ-005}

**Acceptance Criteria:**
- Super Admin melihat tombol "Aktifkan" pada baris karyawan nonaktif di halaman daftar karyawan.
- Setelah konfirmasi, status berubah dari `inactive` menjadi `active` dan karyawan dapat login kembali.
- Entry activity log tercatat dengan `action = 'user_reactivated'`.
- Karyawan yang diaktifkan kembali mendapat notifikasi bahwa akunnya telah aktif.

---

### FR-USER-006 — Ubah Profil Sendiri

- [ ] The system shall allow any authenticated user to update their own display name. {REQ-006}
- [ ] The system shall allow any authenticated user to upload a profile photo. {REQ-007}
- [ ] The system shall reject profile photo uploads that exceed 2 MB in file size and display an error message. {REQ-008}
- [ ] The system shall only accept profile photos in JPG or PNG format and reject all other file types. {REQ-009}
- [ ] The system shall automatically resize profile photos to a maximum dimension of 256×256 pixels before storing them to Supabase Storage. {REQ-010}
- [ ] The system shall display the updated profile photo immediately after a successful upload without requiring a full page reload. {REQ-011}
- [ ] The system shall log the profile update event to the activity log with `action = 'profile_updated'`. {REQ-012}

**Acceptance Criteria:**
- Halaman `/profil` tersedia untuk semua role.
- Validasi ukuran (> 2 MB) dan format (bukan JPG/PNG) menghasilkan pesan error yang jelas sebelum upload dimulai.
- Foto tersimpan di bucket `avatars` pada Supabase Storage dengan nama file unik per user.
- Nama tampilan baru langsung terlihat di sidebar dan navbar tanpa reload.

---

### FR-USER-007/008 — Halaman Detail Karyawan & Ringkasan Beban Kerja

- [ ] The system shall provide a detail page for each employee accessible by Managers and Super Admins. {REQ-013}
- [ ] The system shall display the employee's profile information (name, email, role, status, join date) on the detail page. {REQ-014}
- [ ] The system shall display a workload summary on the employee detail page showing: total active tasks, total completed tasks, and total overdue tasks. {REQ-015}
- [ ] The system shall display the list of divisions the employee is a member of on the detail page. {REQ-016}
- [ ] The system shall allow filtering the workload summary by date range. {REQ-017}

**Acceptance Criteria:**
- URL halaman: `/admin/karyawan/[id]`.
- Ringkasan beban kerja dihitung secara real-time dari tabel `tasks` berdasarkan `assignee_id`.
- Task aktif = status bukan `completed` dan `deleted_at IS NULL`.
- Task selesai = `completed_at IS NOT NULL` dan dalam rentang filter tanggal yang dipilih.
- Task overdue = `due_date < NOW()` dan status bukan `completed`.

---

## Modul 2: Manajemen Divisi

### FR-DIV-003 — Nonaktifkan Divisi

- [ ] The system shall allow a Super Admin to deactivate a division. {REQ-018}
- [ ] The system shall require the Super Admin to type the exact division name as confirmation before deactivation proceeds. {REQ-019}
- [ ] The system shall prevent deactivation if the confirmation text does not exactly match the division name (case-sensitive). {REQ-020}
- [ ] The system shall hide a deactivated division from navigation and member views while retaining all its data. {REQ-021}
- [ ] The system shall log the deactivation event to the activity log with `action = 'division_deactivated'`. {REQ-022}
- [ ] The system shall enforce Business Rule BR-022: the system shall warn if the division being deactivated still has active tasks assigned to members. {REQ-023}

**Acceptance Criteria:**
- Dialog konfirmasi menampilkan field input dengan placeholder "Ketik nama divisi untuk konfirmasi".
- Tombol "Nonaktifkan" tetap disabled selama teks input tidak sama persis dengan nama divisi.
- Setelah deaktivasi, divisi tidak muncul di sidebar karyawan anggotanya.
- Super Admin masih dapat melihat divisi nonaktif di halaman admin dengan filter "Nonaktif".

---

### FR-DIV-004 — Aktifkan Kembali Divisi

- [ ] The system shall allow a Super Admin to reactivate a previously deactivated division. {REQ-024}
- [ ] The system shall restore the division's visibility to all its existing members upon reactivation. {REQ-025}
- [ ] The system shall log the reactivation event to the activity log with `action = 'division_reactivated'`. {REQ-026}

**Acceptance Criteria:**
- Tombol "Aktifkan" tersedia di halaman admin pada baris divisi nonaktif.
- Setelah diaktifkan, divisi muncul kembali di sidebar semua anggotanya.
- Semua board dan task dalam divisi tetap utuh setelah reaktivasi.

---

## Modul 3: Target & Realisasi

### FR-TARGET-001 — Penetapan Target

- [ ] The system shall allow a Division Manager or Super Admin to set a task-count target for a specific member within a defined period. {REQ-027}
- [ ] The system shall require a target to have a start date, end date, and a positive integer target count. {REQ-028}
- [ ] The system shall prevent overlapping target periods for the same member within the same division. {REQ-029}
- [ ] The system shall allow editing an existing target before its period has ended. {REQ-030}
- [ ] The system shall log target creation and modification events to the activity log. {REQ-031}

**Acceptance Criteria:**
- Halaman manajemen target tersedia di `/divisi/[id]/target`.
- Form penetapan target memvalidasi bahwa tanggal akhir lebih besar dari tanggal mulai.
- Sistem menolak penyimpanan jika ada target lain yang periodenya overlap untuk anggota yang sama.
- Target yang sedang berjalan dapat diubah hanya oleh Manajer Divisi atau Super Admin.

---

### FR-TARGET-002 — Perhitungan Realisasi Otomatis

- [ ] The system shall automatically calculate a member's task completion realization for each target period based on the `completed_at` field of tasks assigned to that member. {REQ-032}
- [ ] The system shall only count tasks whose `completed_at` timestamp falls within the target period's start and end dates. {REQ-033}
- [ ] The system shall enforce Business Rule BR-028: each completed task shall be counted only once per target period, regardless of how many times its status changed. {REQ-034}
- [ ] The system shall recalculate realization in real-time whenever a relevant task is marked as complete or uncomplete. {REQ-035}

**Acceptance Criteria:**
- Realisasi dihitung dari `tasks` di mana `assignee_id = member_id` AND `completed_at BETWEEN target.start_date AND target.end_date` AND `deleted_at IS NULL`.
- Perubahan status task memperbarui tampilan realisasi tanpa reload penuh.
- Task yang di-uncomplete tidak lagi dihitung dalam realisasi.

---

### FR-TARGET-003 — Tampilan Progress Target

- [ ] The system shall display a progress indicator (percentage and bar) comparing realization against the target for each member. {REQ-036}
- [ ] The system shall display the target, realization, and percentage on the division target page, visible to all division members. {REQ-037}
- [ ] The system shall highlight target completion status: on-track, at-risk (< 50% progress at > 75% period elapsed), or completed. {REQ-038}

**Acceptance Criteria:**
- Progress bar berwarna hijau (completed), kuning (at-risk), atau biru (on-track).
- Anggota biasa hanya melihat data milik mereka sendiri; Manajer dan Super Admin melihat semua anggota.
- Persentase ditampilkan sebagai `(realisasi / target) * 100`, dibulatkan ke satu desimal.

---

## Modul 4: Data Terhapus (Recycle Bin)

### FR-TASK-014 — Halaman Data Terhapus

- [ ] The system shall provide a "Data Terhapus" page accessible only to Super Admins, listing all soft-deleted tasks. {REQ-039}
- [ ] The system shall display the original division, board, task title, deleted date, and the user who deleted each task on the recycle bin page. {REQ-040}
- [ ] The system shall allow a Super Admin to restore a soft-deleted task to its original board. {REQ-041}
- [ ] The system shall restore all associated data when a task is restored, including checklist items, attachments, comments, and labels. {REQ-042}
- [ ] The system shall permanently delete tasks and all their associated data after 90 days from the `deleted_at` timestamp (Business Rule: 90-day retention). {REQ-043}
- [ ] The system shall display the remaining retention days for each deleted task. {REQ-044}
- [ ] The system shall allow a Super Admin to permanently delete a task before the 90-day retention period expires, with an explicit confirmation. {REQ-045}

**Acceptance Criteria:**
- Halaman tersedia di `/admin/data-terhapus`.
- Task yang sudah dihapus > 90 hari dihapus permanen oleh cron job atau scheduled function.
- Saat restore: `deleted_at` di-set kembali ke NULL pada task dan semua entitas terkait.
- Jika board asal sudah dihapus saat restore, task ditempatkan ke board pertama yang tersedia di divisi tersebut.
- Entry activity log dengan `action = 'task_restored'` atau `action = 'task_permanently_deleted'`.

---

## Modul 5: Manajemen Board

### FR-BOARD-003 — Ubah Urutan Board via Drag & Drop

- [ ] The system shall allow a Division Manager or Super Admin to reorder boards within a division via drag and drop. {REQ-046}
- [ ] The system shall persist the new board order immediately after the drag operation completes. {REQ-047}
- [ ] The system shall use an optimistic update pattern: the UI reflects the new order instantly, with rollback if the server save fails. {REQ-048}
- [ ] The system shall restrict board reordering to Division Managers and Super Admins; regular members cannot reorder boards. {REQ-049}

**Acceptance Criteria:**
- Menggunakan DnD Kit (sudah tersedia di stack).
- Handle drag tersedia di header setiap board.
- Urutan tersimpan di kolom `position` pada tabel `boards`.
- Anggota biasa tidak melihat handle drag dan tidak dapat memindahkan board.

---

## Modul 6: Tugas Rutin (Recurring Tasks)

### FR-RECUR-001 — Template Tugas Rutin

- [ ] The system shall allow a Division Manager or Super Admin to create a recurring task template with a title, description, assignee, priority, and recurrence pattern. {REQ-050}
- [ ] The system shall support the following recurrence patterns: daily (work days only), daily (every day), weekly (specific day of week), and monthly (specific date). {REQ-051}
- [ ] The system shall allow specifying the target board for tasks generated from the template. {REQ-052}
- [ ] The system shall allow a template to have an optional end date after which no new tasks are generated. {REQ-053}
- [ ] The system shall allow editing or deactivating a recurring task template without affecting already-generated tasks. {REQ-054}

**Acceptance Criteria:**
- Halaman manajemen template tersedia di `/divisi/[id]/tugas-rutin`.
- Template disimpan di tabel `recurring_task_templates` dengan kolom `pattern`, `day_of_week`, `day_of_month`, `active`, `end_date`.
- Deaktivasi template menghentikan pembuatan task baru tanpa menghapus task yang sudah ada.

---

### FR-RECUR-002 — Pembuatan Task Otomatis

- [ ] The system shall automatically generate tasks from active recurring templates at the scheduled time based on each template's recurrence pattern. {REQ-055}
- [ ] The system shall generate daily work-day tasks only on Monday through Friday, skipping weekends. {REQ-056}
- [ ] The system shall not generate a task from a template if a task with the same template ID already exists for the same target date (Business Rule: no duplicates per date). {REQ-057}
- [ ] The system shall set the generated task's due date to the same day it is created. {REQ-058}
- [ ] The system shall log each auto-generated task in the activity log with `action = 'task_auto_created'`. {REQ-059}

**Acceptance Criteria:**
- Cron job berjalan setiap hari pada pukul 07:00 WIB (UTC+7).
- Sebelum membuat task, sistem memeriksa keberadaan task dengan `recurring_template_id = template.id AND DATE(created_at) = today`.
- Task yang dibuat otomatis memiliki flag `is_recurring = true` untuk membedakannya dari task manual.
- Jika template sudah melewati `end_date`, cron job melewati template tersebut tanpa error.

---

### FR-RECUR-003 — Indikator Task Rutin

- [ ] The system shall visually distinguish auto-generated recurring tasks from manually created tasks on the Kanban board. {REQ-060}
- [ ] The system shall display the recurrence pattern of the source template on the task detail panel. {REQ-061}

**Acceptance Criteria:**
- Task card menampilkan ikon berulang (recurrence icon) jika `is_recurring = true`.
- Panel detail task menampilkan label "Tugas Rutin" beserta pola pengulangan (misal: "Setiap hari kerja").

---

### FR-RECUR-004 — Riwayat Pembuatan Tugas Rutin

- [ ] The system shall provide a view of all tasks generated from a specific recurring template, accessible from the template management page. {REQ-062}
- [ ] The system shall display the generation date, task status, and assignee for each generated task in the history view. {REQ-063}

**Acceptance Criteria:**
- Tombol "Lihat Riwayat" di halaman template membuka daftar task yang di-generate dari template tersebut.
- Daftar diurutkan dari yang terbaru ke yang terlama.

---

## Modul 7: Log Sistem

### FR-ACTIVITY-003 — Halaman Log Sistem

- [ ] The system shall provide a System Log page accessible only to Super Admins. {REQ-064}
- [ ] The system shall allow filtering the activity log by user (actor), action type, date range, and division. {REQ-065}
- [ ] The system shall display log entries with: timestamp, acting user, action type, target entity, and division context. {REQ-066}
- [ ] The system shall paginate log results with a maximum of 50 entries per page. {REQ-067}
- [ ] The system shall allow exporting the filtered log results as a CSV file. {REQ-068}

**Acceptance Criteria:**
- Halaman tersedia di `/admin/log-sistem`.
- Filter dapat dikombinasikan secara bebas (misal: filter user + tanggal sekaligus).
- CSV export menghasilkan file dengan kolom: `timestamp`, `user`, `action`, `entity_type`, `entity_id`, `division`, `detail`.
- Log diurutkan dari yang terbaru ke yang terlama secara default.

---

## Modul 8: Ekspor Data

### FR-DASH-005 — Ekspor Rekap CSV dari Dashboard

- [ ] The system shall allow a Division Manager or Super Admin to export a workload summary report as a CSV file from the dashboard. {REQ-069}
- [ ] The system shall include in the CSV export: member name, total assigned tasks, completed tasks, overdue tasks, and on-time completion rate. {REQ-070}
- [ ] The system shall allow the user to select the date range before generating the export. {REQ-071}
- [ ] The system shall scope the export to the division(s) the requesting user has access to. {REQ-072}

**Acceptance Criteria:**
- Tombol "Ekspor CSV" tersedia di halaman dashboard.
- File CSV diberi nama `rekap-tugas-[tanggal-export].csv`.
- Super Admin dapat mengekspor data dari semua divisi; Manajer hanya dari divisi miliknya.
- Ekspor menggunakan data real-time, bukan data cache.

---

## Modul 9: Task — Penyempurnaan

### FR-TASK-003 Tambahan — Ubah Judul Task

- [ ] The system shall allow an authorized user (assignee, Division Manager, or Super Admin) to edit the title of an existing task. {REQ-073}
- [ ] The system shall require the task title to be non-empty and no longer than 255 characters. {REQ-074}
- [ ] The system shall log the title change to the activity log, recording the old and new title values. {REQ-075}

**Acceptance Criteria:**
- Field judul task di panel detail dapat diedit secara inline (klik untuk edit, Enter/blur untuk simpan).
- Validasi dilakukan di sisi server via Server Action.
- Activity log menyimpan `{ old: "judul lama", new: "judul baru" }` di kolom `detail`.

---

## Modul 10: Komentar (Could Have)

### FR-COMMENT-002 — Mention @nama dalam Komentar

- [ ] The system shall allow users to mention other division members in comments using the `@username` syntax. {REQ-076}
- [ ] The system shall display an autocomplete dropdown of matching division members when the user types `@` followed by characters in the comment field. {REQ-077}
- [ ] The system shall send an in-app notification to each mentioned user when the comment is submitted. {REQ-078}
- [ ] The system shall visually highlight `@mentions` in rendered comments to distinguish them from plain text. {REQ-079}

**Acceptance Criteria:**
- Autocomplete muncul setelah mengetik minimal 1 karakter setelah `@`.
- Dropdown menampilkan maksimal 5 anggota divisi yang paling cocok.
- Notifikasi dikirim via mekanisme notifikasi yang sudah ada (`notifikasi` tabel), dengan `type = 'mention'`.
- Mention yang di-render menggunakan styling berbeda (misal: warna biru, font bold).
- Jika user yang di-mention tidak lagi menjadi anggota divisi, mention tetap ditampilkan namun tidak memicu notifikasi.

---

## Business Rules

| ID     | Deskripsi |
|--------|-----------|
| BR-019 | Minimal satu Super Admin aktif harus selalu ada. Sistem menolak aksi yang menghasilkan nol Super Admin aktif. |
| BR-022 | Setiap divisi aktif harus memiliki minimal satu Manajer Divisi. Sistem menolak aksi yang menghasilkan divisi aktif tanpa Manajer. |
| BR-028 | Setiap task hanya dihitung satu kali dalam realisasi target per periode, berdasarkan `completed_at`. |
| BR-029 | Semua penghapusan adalah soft delete. Data yang dihapus diretain selama 90 hari sebelum dihapus permanen. |
| BR-030 | Foto profil divalidasi di sisi server (ukuran ≤ 2 MB, format JPG/PNG) dan di-resize otomatis ke 256×256 sebelum disimpan. |
| BR-031 | Tugas rutin tidak boleh menghasilkan duplikat task untuk tanggal yang sama dari template yang sama. |
| BR-032 | Target periode tidak boleh overlap untuk anggota yang sama dalam divisi yang sama. |

---

## Prioritas Requirements

| Prioritas | Modul |
|-----------|-------|
| Must Have | FR-USER-004, FR-USER-006, FR-DIV-003, FR-DIV-004, FR-TASK-014, FR-BOARD-003, FR-TASK-003 Tambahan |
| Should Have | FR-TARGET-001/002/003, FR-RECUR-001/002/003/004, FR-ACTIVITY-003, FR-DASH-005 |
| Could Have | FR-USER-007/008, FR-COMMENT-002 |
