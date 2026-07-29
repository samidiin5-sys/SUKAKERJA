import { ambilDataShell } from '@/lib/shell-data'

export default async function HalamanPanduan() {
  const data = await ambilDataShell()
  const isSuperAdmin = data.roleSistem === 'super_admin'
  const isOwner = data.roleSistem === 'owner'
  const isAdmin = isSuperAdmin || isOwner

  if (isAdmin) return <PanduanAdmin isSuperAdmin={isSuperAdmin} />
  return <PanduanUser />
}

// ─── Panduan Admin / Owner ───────────────────────────────────────────────────

function PanduanAdmin({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-10">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-maroon-950 via-maroon-800 to-maroon-700 p-6 text-cream-50 shadow-lg">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cream-50/10 backdrop-blur-sm">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">Panduan {isSuperAdmin ? 'Super Admin' : 'Owner'}</h1>
            <p className="text-xs text-cream-200/70 mt-0.5">SukaKerja — Referensi Pengelolaan Sistem</p>
          </div>
        </div>
        <p className="text-sm text-cream-100/85 leading-relaxed">
          {isSuperAdmin
            ? 'Sebagai Super Admin, kamu punya akses penuh ke seluruh sistem — dari mengelola karyawan dan divisi hingga memantau log aktivitas.'
            : 'Sebagai Owner, kamu bertanggung jawab atas operasional divisi — menyetujui tugas, menetapkan lembur, dan memantau aktivitas tim.'}
        </p>
      </div>

      {/* Daftar Isi */}
      <div className="rounded-2xl border border-cream-200 bg-white p-5 shadow-sm">
        <p className="text-[10px] font-bold tracking-widest text-muted uppercase mb-3">Daftar Isi</p>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {[
            { no: '01', label: 'Dashboard', anchor: '#dashboard' },
            { no: '02', label: 'Papan Kanban & Approve Tugas', anchor: '#kanban' },
            ...(isSuperAdmin ? [
              { no: '03', label: 'Kelola Karyawan', anchor: '#karyawan' },
              { no: '04', label: 'Kelola Divisi', anchor: '#divisi' },
            ] : [
              { no: '03', label: 'Data Karyawan', anchor: '#karyawan' },
            ]),
            { no: isSuperAdmin ? '05' : '04', label: 'Tugas Terbuka', anchor: '#tugas-terbuka' },
            { no: isSuperAdmin ? '06' : '05', label: 'Tetapkan & Review Lembur', anchor: '#lembur' },
            { no: isSuperAdmin ? '07' : '06', label: 'Log Aktivitas', anchor: '#log' },
            ...(isSuperAdmin ? [{ no: '08', label: 'Data Terhapus', anchor: '#data-terhapus' }] : []),
          ].map((item) => (
            <a
              key={item.anchor}
              href={item.anchor}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink hover:bg-orange-50 hover:text-orange-600 transition group"
            >
              <span className="text-[10px] font-black text-muted/50 group-hover:text-orange-400 w-5">{item.no}</span>
              {item.label}
              <span className="ml-auto text-muted/30 group-hover:text-orange-400">→</span>
            </a>
          ))}
        </div>
      </div>

      {/* 01: Dashboard */}
      <SeksiPanduan
        id="dashboard"
        nomor="01"
        judul="Dashboard"
        deskripsi="Dashboard admin menampilkan ringkasan kondisi seluruh sistem — bukan hanya tugasmu sendiri."
        icon={<IkonRumah />}
        warna="orange"
      >
        <ItemPanduan
          judul="Statistik Sistem"
          deskripsi="Kartu di dashboard menampilkan jumlah karyawan aktif, total divisi, tugas yang sedang berjalan di seluruh divisi, dan tugas yang terlambat diselesaikan."
        />
        <ItemPanduan
          judul="Aktivitas Terbaru"
          deskripsi="Scroll ke bawah untuk melihat ringkasan aktivitas terbaru di seluruh divisi — tugas yang baru dibuat, diselesaikan, atau ditolak."
        />
      </SeksiPanduan>

      {/* 02: Papan Kanban */}
      <SeksiPanduan
        id="kanban"
        nomor="02"
        judul="Papan Kanban & Approve Tugas"
        deskripsi="Klik nama divisi di sidebar untuk membuka papan kanban. Di sini tugasmu yang utama adalah memeriksa dan menyetujui pekerjaan staff di kolom Review."
        icon={<IkonPapan />}
        warna="blue"
      >
        <ItemPanduan
          judul="Kolom Review"
          deskripsi="Saat staff selesai mengerjakan tugas, mereka memindahkan kartu ke kolom Review. Tugasmu adalah membuka panel detail kartu tersebut dan memeriksa hasilnya."
        />
        <ItemPanduan
          judul="Setujui Tugas"
          deskripsi="Jika pekerjaan sudah sesuai, klik tombol 'Setujui' di panel detail. Kartu otomatis pindah ke kolom Selesai dan staff mendapat notifikasi."
          tip="Hanya owner divisi, admin divisi, atau super admin yang bisa menyetujui tugas di kolom Review."
        />
        <ItemPanduan
          judul="Kembalikan untuk Revisi"
          deskripsi="Jika pekerjaan perlu diperbaiki, klik 'Revisi'. Kartu kembali ke kolom Dikerjakan. Tulis komentar di panel detail agar staff tahu apa yang harus diperbaiki."
          tip="Selalu tulis komentar saat meminta revisi — staff butuh tahu alasannya untuk bisa memperbaiki dengan tepat."
        />
        <ItemPanduan
          judul="Buat & Assign Tugas"
          deskripsi="Klik tombol '+ Tugas Baru' di atas papan untuk membuat tugas baru. Isi nama, deskripsi, deadline, prioritas, dan pilih siapa yang bertanggung jawab (assignee)."
        />
        <ItemPanduan
          judul="Pantau Produktivitas Staff"
          deskripsi="Buka halaman Anggota dari menu divisi untuk melihat statistik produktivitas tiap staff — jumlah tugas selesai, terlambat, dan sedang berjalan."
        />
        {isSuperAdmin && (
          <ItemPanduan
            judul="Tugas Rutin (Recurring)"
            deskripsi="Di halaman Tugas Rutin dalam suatu divisi, kamu bisa membuat template tugas yang otomatis dibuat oleh sistem secara harian, mingguan, atau bulanan — tanpa perlu assign manual setiap kali."
            tip="Tugas rutin berguna untuk pekerjaan berulang seperti laporan mingguan atau backup harian. Kamu bisa atur hari, jam, dan assignee default-nya."
          />
        )}
      </SeksiPanduan>

      {/* 03: Karyawan */}
      <SeksiPanduan
        id="karyawan"
        nomor="03"
        judul={isSuperAdmin ? 'Kelola Karyawan' : 'Data Karyawan'}
        deskripsi={isSuperAdmin
          ? 'Halaman Kelola Karyawan adalah pusat manajemen seluruh akun pengguna dalam sistem.'
          : 'Halaman Data Karyawan menampilkan profil semua karyawan dalam divisi yang kamu kelola.'}
        icon={<IkonOrang />}
        warna="green"
      >
        {isSuperAdmin ? (
          <>
            <ItemPanduan
              judul="Undang Karyawan Baru"
              deskripsi="Klik tombol 'Undang Karyawan' dan masukkan email mereka. Sistem mengirimkan email undangan berisi link untuk membuat password. Karyawan bisa langsung login setelah itu."
              tip="Pastikan email yang dimasukkan benar — link undangan dikirim ke email tersebut dan hanya berlaku satu kali."
            />
            <ItemPanduan
              judul="Edit Profil & Role"
              deskripsi="Klik nama karyawan untuk membuka halaman detailnya. Di sana kamu bisa mengubah nama, jabatan, dan role sistem mereka (User / Owner / Super Admin)."
              tip="Hati-hati mengubah role ke Super Admin — role ini punya akses penuh ke seluruh sistem termasuk menghapus data."
            />
            <ItemPanduan
              judul="Nonaktifkan Akun"
              deskripsi="Jika karyawan sudah tidak bekerja, gunakan tombol 'Nonaktifkan' di halaman detail mereka. Akun yang dinonaktifkan tidak bisa login, tapi data dan riwayat tugasnya tetap tersimpan."
            />
            <ItemPanduan
              judul="Tambah ke Divisi"
              deskripsi="Untuk menambahkan karyawan ke divisi tertentu, buka halaman Kelola Divisi → pilih divisi → buka tab Anggota → klik 'Tambah Anggota'."
            />
          </>
        ) : (
          <>
            <ItemPanduan
              judul="Profil Karyawan"
              deskripsi="Klik nama karyawan untuk melihat profil lengkapnya — jabatan, divisi yang diikuti, dan statistik produktivitas mereka."
            />
            <ItemPanduan
              judul="Ruang Kerja Staff"
              deskripsi="Dari tabel Produktivitas di halaman anggota divisi, klik nama staff untuk membuka ruang kerja mereka — papan kanban yang difilter khusus ke tugas milik staff tersebut."
            />
          </>
        )}
      </SeksiPanduan>

      {/* 04: Kelola Divisi (super admin only) */}
      {isSuperAdmin && (
        <SeksiPanduan
          id="divisi"
          nomor="04"
          judul="Kelola Divisi"
          deskripsi="Halaman Kelola Divisi adalah tempat kamu membuat, mengatur, dan memantau semua divisi dalam organisasi."
          icon={<IkonGrup />}
          warna="purple"
        >
          <ItemPanduan
            judul="Buat Divisi Baru"
            deskripsi="Klik tombol 'Buat Divisi', isi nama dan pilih warna penanda. Divisi baru langsung muncul di sidebar semua anggota yang kamu tambahkan ke dalamnya."
          />
          <ItemPanduan
            judul="Kelola Anggota Divisi"
            deskripsi="Buka halaman detail divisi → tab Anggota. Di sana kamu bisa menambah atau mengeluarkan anggota, serta mengubah role mereka di dalam divisi (Member / Admin Divisi)."
            tip="Admin Divisi bisa membuat tugas, approve review, dan mengatur anggota divisi tersebut — tapi tidak punya akses ke menu Admin sistem."
          />
          <ItemPanduan
            judul="Hapus Divisi"
            deskripsi="Divisi hanya bisa dihapus jika sudah tidak ada anggota aktif di dalamnya. Data divisi yang dihapus masuk ke halaman Data Terhapus dan bisa dipulihkan dalam 30 hari."
          />
        </SeksiPanduan>
      )}

      {/* Tugas Terbuka */}
      <SeksiPanduan
        id="tugas-terbuka"
        nomor={isSuperAdmin ? '05' : '04'}
        judul="Tugas Terbuka"
        deskripsi="Tugas Terbuka (pool) adalah kumpulan template tugas yang bisa diambil dan ditugaskan ke divisi mana saja — berguna untuk proyek lintas divisi atau tugas insidental."
        icon={<IkonClipboard />}
        warna="teal"
      >
        <ItemPanduan
          judul="Buat Template Tugas"
          deskripsi="Klik 'Buat Tugas Baru' dan isi detail tugasnya — nama, deskripsi, prioritas, dan deadline. Tugas ini belum ditugaskan ke siapa pun sampai kamu assign secara manual."
        />
        <ItemPanduan
          judul="Assign ke Divisi & Karyawan"
          deskripsi="Klik nama tugas di daftar, lalu pilih divisi tujuan dan karyawan yang bertanggung jawab. Setelah di-assign, tugas muncul di papan kanban divisi tersebut di kolom To Do."
          tip="Satu template tugas bisa di-assign ke beberapa divisi sekaligus jika pekerjaan yang sama perlu dilakukan oleh tim berbeda."
        />
        <ItemPanduan
          judul="Proposal dari Staff"
          deskripsi="Staff bisa mengajukan proposal tugas dari halaman Tugas Tersedia mereka. Proposal yang masuk perlu kamu tinjau — setujui untuk membuat tugas resmi dari proposal tersebut, atau tolak."
        />
      </SeksiPanduan>

      {/* Lembur */}
      <SeksiPanduan
        id="lembur"
        nomor={isSuperAdmin ? '06' : '05'}
        judul="Tetapkan & Review Lembur"
        deskripsi="Ada dua alur lembur: kamu yang menetapkan langsung untuk staff, atau staff mengajukan dan kamu tinjaunya."
        icon={<IkonJam />}
        warna="amber"
      >
        <ItemPanduan
          judul="Tetapkan Lembur (langsung disetujui)"
          deskripsi="Buka halaman Tetapkan Lembur dari sidebar. Pilih staff, isi tanggal dan jumlah jam lembur, lalu submit. Lembur yang kamu tetapkan langsung berstatus Disetujui — tidak perlu melewati proses review."
          tip="Gunakan alur ini untuk lembur yang kamu minta sendiri kepada staff, bukan yang mereka ajukan."
        />
        <ItemPanduan
          judul="Review Pengajuan dari Staff"
          deskripsi="Buka halaman Review Lembur di sidebar. Semua pengajuan lembur dari staff yang menunggu persetujuan tampil di sini. Klik 'Setujui' atau 'Tolak' untuk tiap pengajuan."
          tip="Pengajuan yang sudah melewati tanggal lemburnya tidak otomatis ditolak — kamu tetap perlu meninjaunya secara manual."
        />
        <ItemPanduan
          judul="Riwayat Lembur"
          deskripsi="Scroll ke bawah di halaman Tetapkan Lembur untuk melihat riwayat semua lembur yang sudah diproses — baik yang kamu tetapkan maupun yang diajukan staff."
        />
      </SeksiPanduan>

      {/* Log */}
      <SeksiPanduan
        id="log"
        nomor={isSuperAdmin ? '07' : '06'}
        judul="Log Aktivitas"
        deskripsi="Halaman Log mencatat semua aksi penting yang terjadi di sistem — siapa yang melakukan apa dan kapan."
        icon={<IkonLog />}
        warna="blue"
      >
        <ItemPanduan
          judul="Apa yang Dicatat?"
          deskripsi="Log mencakup: login/logout, perubahan data karyawan, pembuatan/penghapusan divisi, perubahan status tugas, dan penghapusan data. Setiap entri menampilkan waktu, pelaku, dan detail aksinya."
        />
        <ItemPanduan
          judul="Filter & Cari"
          deskripsi="Gunakan kolom pencarian atau filter tanggal untuk mempersempit log yang ditampilkan. Berguna saat menyelidiki insiden atau memeriksa aktivitas karyawan tertentu."
        />
      </SeksiPanduan>

      {/* Data Terhapus (super admin only) */}
      {isSuperAdmin && (
        <SeksiPanduan
          id="data-terhapus"
          nomor="08"
          judul="Data Terhapus"
          deskripsi="Data yang dihapus tidak langsung hilang permanen — tersimpan dulu di sini selama 30 hari sebelum benar-benar dihapus dari sistem."
          icon={<IkonSampah />}
          warna="orange"
        >
          <ItemPanduan
            judul="Pulihkan Data"
            deskripsi="Cari data yang terhapus di daftar, lalu klik 'Pulihkan'. Data kembali aktif seolah tidak pernah dihapus — termasuk relasi ke divisi, tugas, dan anggota yang terkait."
          />
          <ItemPanduan
            judul="Hapus Permanen"
            deskripsi="Jika yakin data tidak diperlukan, klik 'Hapus Permanen'. Tindakan ini tidak bisa dibalikkan — data hilang selamanya dari sistem."
            tip="Hapus permanen hanya jika benar-benar diperlukan, misalnya untuk kepatuhan privasi data atau pembersihan data lama."
          />
        </SeksiPanduan>
      )}

      {/* Tips */}
      <div className="rounded-2xl border border-orange-200/60 bg-orange-50/40 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500 text-white">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <p className="text-sm font-black text-orange-800">Tips Operasional</p>
        </div>
        <ul className="space-y-2.5 text-sm text-ink/80">
          {[
            'Cek kolom Review di papan kanban divisi secara rutin — staff menunggu persetujuanmu sebelum bisa lanjut ke tugas berikutnya.',
            'Tulis komentar yang jelas saat meminta revisi — semakin spesifik catatanmu, semakin cepat staff bisa memperbaikinya.',
            ...(isSuperAdmin ? [
              'Jangan langsung hapus permanen data yang baru saja terhapus — beri waktu beberapa hari untuk memastikan tidak ada yang membutuhkannya.',
              'Gunakan tugas rutin untuk pekerjaan berulang agar tidak perlu assign manual setiap periode.',
              'Perubahan role karyawan berlaku segera — pastikan kamu yakin sebelum mengubah ke Super Admin.',
            ] : [
              'Pantau halaman Anggota divisi secara berkala untuk melihat beban kerja masing-masing staff.',
              'Tetapkan lembur lebih awal agar muncul di catatan sebelum periode lembur berlangsung.',
            ]),
            'Log Aktivitas adalah sumber kebenaran untuk investigasi insiden — biasakan cek di sana sebelum menyimpulkan ada kesalahan.',
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-orange-400" />
              <span className="leading-relaxed">{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      <div className="flex flex-wrap gap-3">
        <a
          href="/dashboard"
          className="flex items-center gap-2 rounded-xl bg-maroon-800 hover:bg-maroon-700 px-5 py-2.5 text-sm font-bold text-cream-50 shadow-sm transition active:scale-95"
        >
          Ke Dashboard
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
        </a>
        {isSuperAdmin && (
          <a
            href="/admin/karyawan"
            className="flex items-center gap-2 rounded-xl border border-cream-200 bg-white hover:border-orange-300 hover:text-orange-600 px-5 py-2.5 text-sm font-bold text-maroon-800 shadow-sm transition active:scale-95"
          >
            Kelola Karyawan
          </a>
        )}
      </div>
    </div>
  )
}

// ─── Panduan User ────────────────────────────────────────────────────────────

function PanduanUser() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-10">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-maroon-950 via-maroon-800 to-maroon-700 p-6 text-cream-50 shadow-lg">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cream-50/10 backdrop-blur-sm">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">Panduan Penggunaan</h1>
            <p className="text-xs text-cream-200/70 mt-0.5">SukaKerja — Portal Karyawan</p>
          </div>
        </div>
        <p className="text-sm text-cream-100/85 leading-relaxed">
          Selamat datang di SukaKerja! Halaman ini menjelaskan cara menggunakan fitur-fitur yang tersedia untuk kamu sebagai anggota tim.
        </p>
      </div>

      {/* Daftar Isi */}
      <div className="rounded-2xl border border-cream-200 bg-white p-5 shadow-sm">
        <p className="text-[10px] font-bold tracking-widest text-muted uppercase mb-3">Daftar Isi</p>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {[
            { no: '01', label: 'Dashboard & Statistik', anchor: '#dashboard' },
            { no: '02', label: 'Tugas Saya', anchor: '#tugas-saya' },
            { no: '03', label: 'Papan Kanban & Alur Review', anchor: '#kanban' },
            { no: '04', label: 'Detail & Checklist Tugas', anchor: '#detail-tugas' },
            { no: '05', label: 'Komentar & Lampiran', anchor: '#komentar' },
            { no: '06', label: 'Notifikasi', anchor: '#notifikasi' },
          ].map((item) => (
            <a
              key={item.no}
              href={item.anchor}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink hover:bg-orange-50 hover:text-orange-600 transition group"
            >
              <span className="text-[10px] font-black text-muted/50 group-hover:text-orange-400 w-5">{item.no}</span>
              {item.label}
              <span className="ml-auto text-muted/30 group-hover:text-orange-400">→</span>
            </a>
          ))}
        </div>
      </div>

      <SeksiPanduan id="dashboard" nomor="01" judul="Dashboard & Statistik" deskripsi="Dashboard adalah halaman utama yang kamu lihat setelah login. Di sini kamu bisa melihat ringkasan semua tugasmu dalam sekali pandang." icon={<IkonRumah />} warna="orange">
        <ItemPanduan judul="Kartu Statistik" deskripsi="4 kartu di bagian atas menampilkan: jumlah tugas aktif, tugas yang jatuh tempo hari ini, tugas selesai minggu ini, dan tugas terlambat." tip="Kartu 'Terlambat' akan berwarna merah jika ada tugas yang melewati deadline — segera buka dan selesaikan!" />
        <ItemPanduan judul="Tugas Prioritas Saya" deskripsi="Daftar tugas dengan prioritas Tinggi atau Mendesak yang sedang berjalan. Klik nama divisi di setiap tugas untuk membuka papan kanban-nya." />
        <ItemPanduan judul="Progress Kerja" deskripsi="Grafik lingkaran yang menunjukkan persentase tugas selesai dalam minggu atau bulan ini. Gunakan tombol toggle untuk berganti periode." />
        <ItemPanduan judul="Deadline Terdekat" deskripsi="Daftar tugas yang paling mendekati jatuh tempo. Tugas yang sudah lewat deadline ditandai dengan label merah." />
      </SeksiPanduan>

      <SeksiPanduan id="tugas-saya" nomor="02" judul="Tugas Saya" deskripsi="Halaman Tugas Saya menampilkan SEMUA tugas yang ditugaskan kepadamu dari seluruh divisi yang kamu ikuti — tanpa perlu membuka papan satu per satu." icon={<IkonDaftar />} warna="blue">
        <ItemPanduan judul="Filter & Pencarian" deskripsi="Gunakan kotak pencarian untuk menemukan tugas berdasarkan nama, atau filter berdasarkan prioritas (Rendah, Sedang, Tinggi, Mendesak) dan status (Aktif / Selesai)." />
        <ItemPanduan judul="Badge Prioritas" deskripsi="Setiap tugas memiliki badge warna: abu-abu (Rendah), biru (Sedang), oranye (Tinggi), merah (Mendesak). Semakin terang warnanya, semakin perlu perhatian segera." />
        <ItemPanduan judul="Buka Detail Tugas" deskripsi="Klik tombol 'Detail' di setiap baris tugas untuk membuka panel detail. Di sana kamu bisa mengerjakan checklist, menulis komentar, dan mengunduh lampiran." tip="Kamu juga bisa klik nama divisi untuk langsung masuk ke papan kanban divisi tersebut." />
      </SeksiPanduan>

      <SeksiPanduan id="kanban" nomor="03" judul="Papan Kanban Divisi" deskripsi="Papan kanban adalah tempat utama pekerjaan tim berlangsung. Setiap divisi punya papan sendiri dengan kolom-kolom yang mewakili tahapan pekerjaan." icon={<IkonPapan />} warna="green">
        <ItemPanduan judul="Cara Membuka Papan" deskripsi="Klik nama divisi di sidebar kiri (misalnya 'IT' atau 'Kreatif'). Papan kanban divisi tersebut akan terbuka dengan semua kolom dan tugasnya." />
        <ItemPanduan judul="Alur Kolom" deskripsi="Ada 4 tahapan utama: To Do (belum mulai) → Dikerjakan (sedang dikerjakan) → Review (menunggu persetujuan owner) → Selesai (disetujui & selesai). Tugasmu mengalir dari kiri ke kanan sesuai progres." />
        <ItemPanduan judul="Geser Tugas (Drag & Drop)" deskripsi="Seret kartu tugas ke kolom berikutnya untuk memperbarui statusnya. Saat selesai mengerjakan, seret ke kolom 'Review' agar owner bisa memeriksa hasilmu." tip="Filter aktif akan menonaktifkan drag & drop sementara. Reset filter terlebih dahulu untuk bisa menyeret kartu." />
        <ItemPanduan judul="Proses Persetujuan di Kolom Review" deskripsi="Saat tugasmu ada di kolom Review, owner atau admin divisi akan memeriksa hasilnya. Mereka bisa menekan 'Setujui' — tugas langsung pindah ke Selesai, atau 'Revisi' — tugas dikembalikan ke Dikerjakan dan perlu diperbaiki." tip="Pantau tugasmu secara berkala. Kalau kartu tiba-tiba kembali ke kolom Dikerjakan, artinya owner meminta perbaikan — buka detail tugas untuk lihat catatannya." />
        <ItemPanduan judul="Tugas Rutin Otomatis" deskripsi="Beberapa tugas dibuat otomatis oleh sistem setiap hari, minggu, atau bulan berdasarkan template yang dibuat admin. Tugas ini langsung muncul di kolommu secara terjadwal — tidak perlu menunggu ditugaskan manual." />
        <ItemPanduan judul="Filter & Pencarian" deskripsi="Gunakan bar filter di atas papan untuk menyaring tugas berdasarkan nama, status, prioritas, atau penanggung jawab. Berguna saat papan sudah punya banyak tugas." />
      </SeksiPanduan>

      <SeksiPanduan id="detail-tugas" nomor="04" judul="Detail & Checklist Tugas" deskripsi="Klik kartu tugas di papan kanban untuk membuka panel detail di sisi kanan. Di sini kamu bisa melihat dan mengelola semua informasi tugas tersebut." icon={<IkonChecklist />} warna="purple">
        <ItemPanduan judul="Informasi Tugas" deskripsi="Panel detail menampilkan: nama tugas, deskripsi, prioritas, deadline, siapa yang membuat tugas, dan siapa saja yang ditugaskan (assignee)." />
        <ItemPanduan judul="Checklist" deskripsi="Jika tugas punya daftar pekerjaan (checklist), klik tiap item untuk menandainya selesai. Progress bar di kartu akan otomatis terupdate sesuai jumlah item yang selesai." tip="Checklist hanya bisa dicentang oleh assignee tugas tersebut atau admin divisi." />
        <ItemPanduan judul="Pindah Kolom" deskripsi="Gunakan dropdown 'Pindah ke Kolom' di panel detail untuk memindahkan tugas ke kolom lain tanpa perlu drag & drop di papan." />
      </SeksiPanduan>

      <SeksiPanduan id="komentar" nomor="05" judul="Komentar & Lampiran" deskripsi="Di panel detail tugas, kamu bisa berkomunikasi dengan rekan satu tim dan berbagi file terkait pekerjaan." icon={<IkonKomentar />} warna="teal">
        <ItemPanduan judul="Menulis Komentar" deskripsi="Scroll ke bawah di panel detail, ketik pesanmu di kotak komentar, lalu tekan 'Kirim'. Semua anggota divisi bisa membaca dan membalas komentar." tip="Gunakan komentar untuk update perkembangan, bertanya, atau memberikan catatan kepada rekan kerja — lebih terstruktur daripada grup chat." />
        <ItemPanduan judul="Mengunggah Lampiran" deskripsi="Klik tab 'Lampiran' di panel detail, lalu pilih file dari perangkatmu. Semua anggota divisi bisa mengunduh file yang sudah diunggah." tip="Ukuran file maksimal 10 MB per file. Lampiran mendukung semua format umum (PDF, gambar, dokumen, ZIP)." />
        <ItemPanduan judul="Riwayat Perubahan" deskripsi="Tab 'Riwayat' di panel detail menampilkan semua perubahan yang pernah terjadi pada tugas tersebut — siapa yang mengubah apa dan kapan." />
      </SeksiPanduan>

      <SeksiPanduan id="notifikasi" nomor="06" judul="Notifikasi" deskripsi="Notifikasi memberitahumu secara otomatis saat ada hal penting terkait tugasmu." icon={<IkonBell />} warna="amber">
        <ItemPanduan judul="Ikon Lonceng" deskripsi="Klik ikon lonceng (🔔) di pojok kanan atas navbar untuk melihat notifikasi terbaru. Titik merah muncul jika ada notifikasi yang belum dibaca." />
        <ItemPanduan judul="Kapan Notifikasi Muncul?" deskripsi="Kamu akan mendapat notifikasi saat: (1) ditugaskan ke sebuah tugas, (2) ada komentar baru di tugas yang kamu ikuti, atau (3) tugas yang kamu kerjakan dipindahkan ke kolom lain oleh admin." />
        <ItemPanduan judul="Tandai Sudah Dibaca" deskripsi="Klik notifikasi untuk membacanya sekaligus menandainya sudah dibaca. Notifikasi yang sudah dibaca akan berubah warna menjadi lebih redup." />
      </SeksiPanduan>

      {/* Tips */}
      <div className="rounded-2xl border border-orange-200/60 bg-orange-50/40 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500 text-white">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <p className="text-sm font-black text-orange-800">Tips Umum</p>
        </div>
        <ul className="space-y-2.5 text-sm text-ink/80">
          {[
            'Selalu perbarui status tugasmu dengan menggeser kartu ke kolom yang sesuai — ini membantu tim memantau perkembangan pekerjaan.',
            'Saat selesai mengerjakan tugas, segera seret kartu ke kolom Review agar owner bisa memeriksa dan menyetujuinya.',
            'Kalau tugasmu dikembalikan ke Dikerjakan (revisi), buka detail tugas dan baca komentar terbaru untuk tahu apa yang perlu diperbaiki.',
            'Gunakan komentar di panel tugas, bukan grup chat eksternal, agar catatan pekerjaan tetap terdokumentasi di satu tempat.',
            'Cek dashboard setiap pagi untuk memantau tugas yang jatuh tempo hari ini.',
            'Jika menemukan masalah atau butuh akses ke divisi tertentu, hubungi Super Admin atau Owner organisasimu.',
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-orange-400" />
              <span className="leading-relaxed">{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer CTA */}
      <div className="flex flex-wrap gap-3">
        <a href="/dashboard" className="flex items-center gap-2 rounded-xl bg-maroon-800 hover:bg-maroon-700 px-5 py-2.5 text-sm font-bold text-cream-50 shadow-sm transition active:scale-95">
          Ke Dashboard
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
        </a>
        <a href="/tugas-saya" className="flex items-center gap-2 rounded-xl border border-cream-200 bg-white hover:border-orange-300 hover:text-orange-600 px-5 py-2.5 text-sm font-bold text-maroon-800 shadow-sm transition active:scale-95">
          Lihat Tugas Saya
        </a>
      </div>
    </div>
  )
}

// ─── Shared Components ───────────────────────────────────────────────────────

function SeksiPanduan({
  id, nomor, judul, deskripsi, icon, warna, children,
}: {
  id: string
  nomor: string
  judul: string
  deskripsi: string
  icon: React.ReactNode
  warna: 'orange' | 'blue' | 'green' | 'purple' | 'teal' | 'amber'
  children: React.ReactNode
}) {
  const warnaCss = {
    orange: { bg: 'bg-orange-50', border: 'border-orange-200/60', icon: 'bg-orange-500', badge: 'bg-orange-100 text-orange-700' },
    blue:   { bg: 'bg-blue-50',   border: 'border-blue-200/60',   icon: 'bg-blue-500',   badge: 'bg-blue-100 text-blue-700' },
    green:  { bg: 'bg-green-50',  border: 'border-green-200/60',  icon: 'bg-green-600',  badge: 'bg-green-100 text-green-700' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200/60', icon: 'bg-purple-600', badge: 'bg-purple-100 text-purple-700' },
    teal:   { bg: 'bg-teal-50',   border: 'border-teal-200/60',   icon: 'bg-teal-600',   badge: 'bg-teal-100 text-teal-700' },
    amber:  { bg: 'bg-amber-50',  border: 'border-amber-200/60',  icon: 'bg-amber-500',  badge: 'bg-amber-100 text-amber-700' },
  }[warna]

  return (
    <div id={id} className={`rounded-2xl border ${warnaCss.border} ${warnaCss.bg} p-5 shadow-sm scroll-mt-6`}>
      <div className="flex items-start gap-3 mb-4">
        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${warnaCss.icon} text-white`}>
          {icon}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[10px] font-black rounded-full px-2 py-0.5 ${warnaCss.badge}`}>{nomor}</span>
            <h2 className="text-base font-black text-ink">{judul}</h2>
          </div>
          <p className="text-sm text-muted leading-relaxed">{deskripsi}</p>
        </div>
      </div>
      <div className="space-y-3 ml-12">
        {children}
      </div>
    </div>
  )
}

function ItemPanduan({ judul, deskripsi, tip }: { judul: string; deskripsi: string; tip?: string }) {
  return (
    <div className="rounded-xl bg-white/70 border border-white/80 p-3.5 shadow-sm backdrop-blur-sm">
      <p className="text-xs font-black text-ink mb-1">{judul}</p>
      <p className="text-xs text-muted/90 leading-relaxed">{deskripsi}</p>
      {tip && (
        <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-orange-50 border border-orange-100 px-2.5 py-1.5">
          <span className="text-orange-500 text-[10px] font-black mt-0.5 flex-shrink-0">💡</span>
          <p className="text-[10px] text-orange-700 leading-relaxed font-medium">{tip}</p>
        </div>
      )}
    </div>
  )
}

function IkonRumah() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/></svg>
}
function IkonDaftar() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M4 6h16M4 12h16M4 18h10"/></svg>
}
function IkonPapan() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 4v17M16 4v17M3 10h5M16 10h5"/></svg>
}
function IkonChecklist() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
}
function IkonKomentar() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
}
function IkonBell() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
}
function IkonOrang() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M15.5 13.5c3 .3 5 2.2 5.5 6.5"/></svg>
}
function IkonGrup() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
}
function IkonClipboard() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>
}
function IkonJam() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
}
function IkonLog() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
}
function IkonSampah() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
}
