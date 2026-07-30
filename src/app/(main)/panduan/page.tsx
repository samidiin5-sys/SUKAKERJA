import { ambilDataShell } from '@/lib/shell-data'
import PanduanLayout, { PanduanText, PanduanSub, PanduanTip, PanduanKode } from '@/components/panduan-layout'

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
  const adminSections = [
    {
      id: 'dashboard',
      nomor: '01',
      judul: 'Dashboard',
      icon: <IkonRumah />,
      content: (
        <>
          <PanduanText>
            Dashboard admin menampilkan ringkasan kondisi seluruh sistem — bukan hanya tugasmu sendiri.
          </PanduanText>
          <PanduanSub judul="Statistik Sistem">
            <PanduanText>
              Kartu di dashboard menampilkan jumlah karyawan aktif, total divisi, tugas yang sedang berjalan di seluruh divisi, dan tugas yang terlambat diselesaikan.
            </PanduanText>
          </PanduanSub>
          <PanduanSub judul="Aktivitas Terbaru">
            <PanduanText>
              Scroll ke bawah untuk melihat ringkasan aktivitas terbaru di seluruh divisi — tugas yang baru dibuat, diselesaikan, atau ditolak.
            </PanduanText>
          </PanduanSub>
        </>
      ),
    },
    {
      id: 'kanban',
      nomor: '02',
      judul: 'Papan Kanban & Approve Tugas',
      icon: <IkonPapan />,
      content: (
        <>
          <PanduanText>
            Klik nama divisi di sidebar untuk membuka papan kanban. Di sini tugasmu yang utama adalah memeriksa dan menyetujui pekerjaan staff di kolom Review.
          </PanduanText>
          <PanduanSub judul="Kolom Review">
            <PanduanText>
              Saat staff selesai mengerjakan tugas, mereka memindahkan kartu ke kolom <PanduanKode>Review</PanduanKode>. Tugasmu adalah membuka panel detail kartu tersebut dan memeriksa hasilnya.
            </PanduanText>
          </PanduanSub>
          <PanduanSub judul="Setujui Tugas">
            <PanduanText>
              Jika pekerjaan sudah sesuai, klik tombol <span className="font-semibold text-green-700">Setujui</span> di panel detail. Kartu otomatis pindah ke kolom Selesai dan staff mendapat notifikasi.
            </PanduanText>
            <PanduanTip>
              Hanya owner divisi, admin divisi, atau super admin yang bisa menyetujui tugas di kolom Review.
            </PanduanTip>
          </PanduanSub>
          <PanduanSub judul="Kembalikan untuk Revisi">
            <PanduanText>
              Jika pekerjaan perlu diperbaiki, klik <span className="font-semibold text-orange-700">Revisi</span>. Kartu kembali ke kolom Dikerjakan. Tulis komentar di panel detail agar staff tahu apa yang harus diperbaiki.
            </PanduanText>
            <PanduanTip>
              Selalu tulis komentar saat meminta revisi — staff butuh tahu alasannya untuk bisa memperbaiki dengan tepat.
            </PanduanTip>
          </PanduanSub>
          <PanduanSub judul="Buat & Assign Tugas">
            <PanduanText>
              Klik tombol <PanduanKode>+ Tugas Baru</PanduanKode> di atas papan untuk membuat tugas baru. Isi nama, deskripsi, deadline, prioritas, dan pilih siapa yang bertanggung jawab (assignee).
            </PanduanText>
          </PanduanSub>
          <PanduanSub judul="Pantau Produktivitas Staff">
            <PanduanText>
              Buka halaman <span className="font-semibold">Anggota</span> dari menu divisi untuk melihat statistik produktivitas tiap staff — jumlah tugas selesai, terlambat, dan sedang berjalan.
            </PanduanText>
          </PanduanSub>
        </>
      ),
    },
    {
      id: 'karyawan',
      nomor: '03',
      judul: isSuperAdmin ? 'Kelola Karyawan' : 'Data Karyawan',
      icon: <IkonOrang />,
      content: isSuperAdmin ? (
        <>
          <PanduanText>
            Halaman Kelola Karyawan adalah pusat manajemen seluruh akun pengguna dalam sistem.
          </PanduanText>
          <PanduanSub judul="Undang Karyawan Baru">
            <PanduanText>
              Klik tombol <PanduanKode>Undang Karyawan</PanduanKode> dan masukkan email mereka. Sistem mengirimkan email undangan berisi link untuk membuat password. Karyawan bisa langsung login setelah itu.
            </PanduanText>
            <PanduanTip>
              Pastikan email yang dimasukkan benar — link undangan dikirim ke email tersebut dan hanya berlaku satu kali.
            </PanduanTip>
          </PanduanSub>
          <PanduanSub judul="Edit Profil & Role">
            <PanduanText>
              Klik nama karyawan untuk membuka halaman detailnya. Di sana kamu bisa mengubah nama, jabatan, dan role sistem mereka (User / Owner / Super Admin).
            </PanduanText>
            <PanduanTip>
              Hati-hati mengubah role ke Super Admin — role ini punya akses penuh ke seluruh sistem termasuk menghapus data.
            </PanduanTip>
          </PanduanSub>
          <PanduanSub judul="Nonaktifkan Akun">
            <PanduanText>
              Jika karyawan sudah tidak bekerja, gunakan tombol <span className="font-semibold text-red-700">Nonaktifkan</span> di halaman detail mereka. Akun yang dinonaktifkan tidak bisa login, tapi data dan riwayat tugasnya tetap tersimpan.
            </PanduanText>
          </PanduanSub>
          <PanduanSub judul="Tambah ke Divisi">
            <PanduanText>
              Untuk menambahkan karyawan ke divisi tertentu, buka halaman Kelola Divisi → pilih divisi → buka tab Anggota → klik <PanduanKode>Tambah Anggota</PanduanKode>.
            </PanduanText>
          </PanduanSub>
        </>
      ) : (
        <>
          <PanduanText>
            Halaman Data Karyawan menampilkan profil semua karyawan dalam divisi yang kamu kelola.
          </PanduanText>
          <PanduanSub judul="Profil Karyawan">
            <PanduanText>
              Klik nama karyawan untuk melihat profil lengkapnya — jabatan, divisi yang diikuti, dan statistik produktivitas mereka.
            </PanduanText>
          </PanduanSub>
          <PanduanSub judul="Ruang Kerja Staff">
            <PanduanText>
              Dari tabel Produktivitas di halaman anggota divisi, klik nama staff untuk membuka ruang kerja mereka — papan kanban yang difilter khusus ke tugas milik staff tersebut.
            </PanduanText>
          </PanduanSub>
        </>
      ),
    },
    ...(isSuperAdmin
      ? [
          {
            id: 'divisi',
            nomor: '04',
            judul: 'Kelola Divisi',
            icon: <IkonGrup />,
            content: (
              <>
                <PanduanText>
                  Halaman Kelola Divisi adalah tempat kamu membuat, mengatur, dan memantau semua divisi dalam organisasi.
                </PanduanText>
                <PanduanSub judul="Buat Divisi Baru">
                  <PanduanText>
                    Klik tombol <PanduanKode>Buat Divisi</PanduanKode>, isi nama dan pilih warna penanda. Divisi baru langsung muncul di sidebar semua anggota yang kamu tambahkan ke dalamnya.
                  </PanduanText>
                </PanduanSub>
                <PanduanSub judul="Kelola Anggota Divisi">
                  <PanduanText>
                    Buka halaman detail divisi → tab Anggota. Di sana kamu bisa menambah atau mengeluarkan anggota, serta mengubah role mereka di dalam divisi (Member / Admin Divisi).
                  </PanduanText>
                  <PanduanTip>
                    Admin Divisi bisa membuat tugas, approve review, dan mengatur anggota divisi tersebut — tapi tidak punya akses ke menu Admin sistem.
                  </PanduanTip>
                </PanduanSub>
                <PanduanSub judul="Hapus Divisi">
                  <PanduanText>
                    Divisi hanya bisa dihapus jika sudah tidak ada anggota aktif di dalamnya. Data divisi yang dihapus masuk ke halaman Data Terhapus dan bisa dipulihkan dalam 30 hari.
                  </PanduanText>
                </PanduanSub>
              </>
            ),
          },
        ]
      : []),
    {
      id: 'tugas-rutin-admin',
      nomor: isSuperAdmin ? '05' : '04',
      judul: 'Tugas Rutin',
      icon: <IkonUlang />,
      content: (
        <>
          <PanduanText>
            Tugas rutin adalah template yang membuat tugas baru secara otomatis sesuai jadwal — tanpa perlu assign manual setiap periodenya.
          </PanduanText>
          <PanduanSub judul="Cara Mengakses">
            <PanduanText>
              Buka papan kanban divisi, lalu klik tab <span className="font-semibold">Tugas Rutin</span> di navigasi atas (di samping Kalender dan Target). Halaman ini menampilkan semua template aktif untuk divisi tersebut.
            </PanduanText>
          </PanduanSub>
          <PanduanSub judul="Buat Template Baru">
            <PanduanText>
              Klik <PanduanKode>Buat Template</PanduanKode>, isi judul tugas, pilih pola pengulangan, dan tentukan penanggung jawab (assignee). Sistem akan otomatis membuat tugas baru setiap kali jadwal terpenuhi.
            </PanduanText>
          </PanduanSub>
          <PanduanSub judul="Pola Pengulangan">
            <PanduanText>
              Ada 4 pilihan: (1) Setiap hari kerja — Senin sampai Sabtu, (2) Setiap hari — termasuk Minggu, (3) Setiap minggu — pilih hari spesifik (misal setiap Jumat), (4) Setiap bulan — pilih tanggal spesifik (misal setiap tanggal 1).
            </PanduanText>
          </PanduanSub>
          <PanduanSub judul="Tenggat Otomatis">
            <PanduanText>
              Isi kolom 'Tenggat Otomatis' dengan jumlah hari setelah tugas dibuat. Contoh: isi '1' artinya tugas yang dibuat hari Senin punya deadline hari Selasa. Isi '0' jika tidak ada tenggat.
            </PanduanText>
            <PanduanTip>
              Tenggat dihitung dari hari tugas dibuat, bukan dari tanggal mulai template.
            </PanduanTip>
          </PanduanSub>
          <PanduanSub judul="Tanggal Aktif Template">
            <PanduanText>
              Isi Tanggal Mulai agar template mulai berjalan dari tanggal tersebut. Tanggal Selesai bersifat opsional — kosongkan jika template harus berjalan tanpa batas waktu.
            </PanduanText>
          </PanduanSub>
          <PanduanSub judul="Edit atau Nonaktifkan">
            <PanduanText>
              Klik ikon pensil di kartu template untuk mengubah pengaturannya. Untuk menghentikan sementara, ubah Tanggal Selesai ke hari ini. Untuk menghapus permanen, gunakan tombol hapus di halaman template.
            </PanduanText>
            <PanduanTip>
              Tugas yang sudah terlanjur dibuat dari template tidak ikut terhapus saat template dihapus.
            </PanduanTip>
          </PanduanSub>
        </>
      ),
    },
    {
      id: 'tugas-terbuka',
      nomor: isSuperAdmin ? '06' : '05',
      judul: 'Tugas Terbuka',
      icon: <IkonClipboard />,
      content: (
        <>
          <PanduanText>
            Tugas Terbuka (pool) adalah kumpulan template tugas yang bisa diambil dan ditugaskan ke divisi mana saja — berguna untuk proyek lintas divisi atau tugas insidental.
          </PanduanText>
          <PanduanSub judul="Buat Template Tugas">
            <PanduanText>
              Klik <PanduanKode>Buat Tugas Baru</PanduanKode> dan isi detail tugasnya — nama, deskripsi, prioritas, dan deadline. Tugas ini belum ditugaskan ke siapa pun sampai kamu assign secara manual.
            </PanduanText>
          </PanduanSub>
          <PanduanSub judul="Assign ke Divisi & Karyawan">
            <PanduanText>
              Klik nama tugas di daftar, lalu pilih divisi tujuan dan karyawan yang bertanggung jawab. Setelah di-assign, tugas muncul di papan kanban divisi tersebut di kolom To Do.
            </PanduanText>
            <PanduanTip>
              Satu template tugas bisa di-assign ke beberapa divisi sekaligus jika pekerjaan yang sama perlu dilakukan oleh tim berbeda.
            </PanduanTip>
          </PanduanSub>
          <PanduanSub judul="Proposal dari Staff">
            <PanduanText>
              Staff bisa mengajukan proposal tugas dari halaman Tugas Tersedia mereka. Proposal yang masuk perlu kamu tinjau — setujui untuk membuat tugas resmi dari proposal tersebut, atau tolak.
            </PanduanText>
          </PanduanSub>
        </>
      ),
    },
    {
      id: 'lembur',
      nomor: isSuperAdmin ? '07' : '06',
      judul: 'Tetapkan & Review Lembur',
      icon: <IkonJam />,
      content: (
        <>
          <PanduanText>
            Ada dua alur lembur: kamu yang menetapkan langsung untuk staff, atau staff mengajukan dan kamu meninjaunya.
          </PanduanText>
          <PanduanSub judul="Tetapkan Lembur (langsung disetujui)">
            <PanduanText>
              Buka halaman Tetapkan Lembur dari sidebar. Pilih staff, isi tanggal dan jumlah jam lembur, lalu submit. Lembur yang kamu tetapkan langsung berstatus Disetujui — tidak perlu melewati proses review.
            </PanduanText>
            <PanduanTip>
              Gunakan alur ini untuk lembur yang kamu minta sendiri kepada staff, bukan yang mereka ajukan.
            </PanduanTip>
          </PanduanSub>
          <PanduanSub judul="Review Pengajuan dari Staff">
            <PanduanText>
              Buka halaman Review Lembur di sidebar. Semua pengajuan lembur dari staff yang menunggu persetujuan tampil di sini. Klik 'Setujui' atau 'Tolak' untuk tiap pengajuan.
            </PanduanText>
            <PanduanTip>
              Pengajuan yang sudah melewati tanggal lemburnya tidak otomatis ditolak — kamu tetap perlu meninjaunya secara manual.
            </PanduanTip>
          </PanduanSub>
          <PanduanSub judul="Riwayat Lembur">
            <PanduanText>
              Scroll ke bawah di halaman Tetapkan Lembur untuk melihat riwayat semua lembur yang sudah diproses — baik yang kamu tetapkan maupun yang diajukan staff.
            </PanduanText>
          </PanduanSub>
        </>
      ),
    },
    {
      id: 'log',
      nomor: isSuperAdmin ? '08' : '07',
      judul: 'Log Aktivitas',
      icon: <IkonLog />,
      content: (
        <>
          <PanduanText>
            Halaman Log mencatat semua aksi penting yang terjadi di sistem — siapa yang melakukan apa dan kapan.
          </PanduanText>
          <PanduanSub judul="Apa yang Dicatat?">
            <PanduanText>
              Log mencakup: login/logout, perubahan data karyawan, pembuatan/penghapusan divisi, perubahan status tugas, dan penghapusan data. Setiap entri menampilkan waktu, pelaku, dan detail aksinya.
            </PanduanText>
          </PanduanSub>
          <PanduanSub judul="Filter & Cari">
            <PanduanText>
              Gunakan kolom pencarian atau filter tanggal untuk mempersempit log yang ditampilkan. Berguna saat menyelidiki insiden atau memeriksa aktivitas karyawan tertentu.
            </PanduanText>
          </PanduanSub>
        </>
      ),
    },
    ...(isSuperAdmin
      ? [
          {
            id: 'data-terhapus',
            nomor: '09',
            judul: 'Data Terhapus',
            icon: <IkonSampah />,
            content: (
              <>
                <PanduanText>
                  Data yang dihapus tidak langsung hilang permanen — tersimpan dulu di sini selama 30 hari sebelum benar-benar dihapus dari sistem.
                </PanduanText>
                <PanduanSub judul="Pulihkan Data">
                  <PanduanText>
                    Cari data yang terhapus di daftar, lalu klik <span className="font-semibold text-green-700">Pulihkan</span>. Data kembali aktif seolah tidak pernah dihapus — termasuk relasi ke divisi, tugas, dan anggota yang terkait.
                  </PanduanText>
                </PanduanSub>
                <PanduanSub judul="Hapus Permanen">
                  <PanduanText>
                    Jika yakin data tidak diperlukan, klik <span className="font-semibold text-red-700">Hapus Permanen</span>. Tindakan ini tidak bisa dibalikkan — data hilang selamanya dari sistem.
                  </PanduanText>
                  <PanduanTip>
                    Hapus permanen hanya jika benar-benar diperlukan, misalnya untuk kepatuhan privasi data atau pembersihan data lama.
                  </PanduanTip>
                </PanduanSub>
              </>
            ),
          },
        ]
      : []),
  ]

  return (
    <PanduanLayout
      judul={`Panduan ${isSuperAdmin ? 'Super Admin' : 'Owner'}`}
      deskripsi={
        isSuperAdmin
          ? 'Sebagai Super Admin, kamu punya akses penuh ke seluruh sistem — dari mengelola karyawan dan divisi hingga memantau log aktivitas.'
          : 'Sebagai Owner, kamu bertanggung jawab atas operasional divisi — menyetujui tugas, menetapkan lembur, dan memantau aktivitas tim.'
      }
      badge="REFERENSI PENGELOLAAN SISTEM"
      sections={adminSections}
      tips={{
        icon: <IkonTips />,
        judul: 'Tips Operasional',
        items: [
          'Cek kolom Review di papan kanban divisi secara rutin — staff menunggu persetujuanmu sebelum bisa lanjut ke tugas berikutnya.',
          'Tulis komentar yang jelas saat meminta revisi — semakin spesifik catatanmu, semakin cepat staff bisa memperbaikinya.',
          ...(isSuperAdmin
            ? [
                'Jangan langsung hapus permanen data yang baru saja terhapus — beri waktu beberapa hari untuk memastikan tidak ada yang membutuhkannya.',
                'Gunakan tugas rutin untuk pekerjaan berulang agar tidak perlu assign manual setiap periode.',
                'Perubahan role karyawan berlaku segera — pastikan kamu yakin sebelum mengubah ke Super Admin.',
              ]
            : [
                'Pantau halaman Anggota divisi secara berkala untuk melihat beban kerja masing-masing staff.',
                'Tetapkan lembur lebih awal agar muncul di catatan sebelum periode lembur berlangsung.',
              ]),
          'Log Aktivitas adalah sumber kebenaran untuk investigasi insiden — biasakan cek di sana sebelum menyimpulkan ada kesalahan.',
        ],
      }}
      footerLinks={[
        { label: 'Ke Dashboard', href: '/dashboard', primary: true },
        ...(isSuperAdmin ? [{ label: 'Kelola Karyawan', href: '/admin/karyawan' }] : []),
      ]}
    />
  )
}

// ─── Panduan User ────────────────────────────────────────────────────────────

function PanduanUser() {
  const userSections = [
    {
      id: 'dashboard',
      nomor: '01',
      judul: 'Dashboard & Statistik',
      icon: <IkonRumah />,
      content: (
        <>
          <PanduanText>
            Dashboard adalah halaman utama yang kamu lihat setelah login. Di sini kamu bisa melihat ringkasan semua tugasmu dalam sekali pandang.
          </PanduanText>
          <PanduanSub judul="Kartu Statistik">
            <PanduanText>
              4 kartu di bagian atas menampilkan: jumlah tugas aktif, tugas yang jatuh tempo hari ini, tugas selesai minggu ini, dan tugas terlambat.
            </PanduanText>
            <PanduanTip>
              Kartu 'Terlambat' akan berwarna merah jika ada tugas yang melewati deadline — segera buka dan selesaikan!
            </PanduanTip>
          </PanduanSub>
          <PanduanSub judul="Tugas Prioritas Saya">
            <PanduanText>
              Daftar tugas dengan prioritas Tinggi atau Mendesak yang sedang berjalan. Klik nama divisi di setiap tugas untuk membuka papan kanban-nya.
            </PanduanText>
          </PanduanSub>
          <PanduanSub judul="Progress Kerja">
            <PanduanText>
              Grafik lingkaran yang menunjukkan persentase tugas selesai dalam minggu atau bulan ini. Gunakan tombol toggle untuk berganti periode.
            </PanduanText>
          </PanduanSub>
          <PanduanSub judul="Deadline Terdekat">
            <PanduanText>
              Daftar tugas yang paling mendekati jatuh tempo. Tugas yang sudah lewat deadline ditandai dengan label merah.
            </PanduanText>
          </PanduanSub>
        </>
      ),
    },
    {
      id: 'tugas-saya',
      nomor: '02',
      judul: 'Tugas Saya',
      icon: <IkonDaftar />,
      content: (
        <>
          <PanduanText>
            Halaman Tugas Saya menampilkan SEMUA tugas yang ditugaskan kepadamu dari seluruh divisi yang kamu ikuti — tanpa perlu membuka papan satu per satu.
          </PanduanText>
          <PanduanSub judul="Filter & Pencarian">
            <PanduanText>
              Gunakan kotak pencarian untuk menemukan tugas berdasarkan nama, atau filter berdasarkan prioritas (Rendah, Sedang, Tinggi, Mendesak) dan status (Aktif / Selesai).
            </PanduanText>
          </PanduanSub>
          <PanduanSub judul="Badge Prioritas">
            <PanduanText>
              Setiap tugas memiliki badge warna: abu-abu (Rendah), biru (Sedang), oranye (Tinggi), merah (Mendesak). Semakin terang warnanya, semakin perlu perhatian segera.
            </PanduanText>
          </PanduanSub>
          <PanduanSub judul="Buka Detail Tugas">
            <PanduanText>
              Klik tombol <span className="font-semibold">Detail</span> di setiap baris tugas untuk membuka panel detail. Di sana kamu bisa mengerjakan checklist, menulis komentar, dan mengunduh lampiran.
            </PanduanText>
            <PanduanTip>
              Kamu juga bisa klik nama divisi untuk langsung masuk ke papan kanban divisi tersebut.
            </PanduanTip>
          </PanduanSub>
        </>
      ),
    },
    {
      id: 'kanban',
      nomor: '03',
      judul: 'Papan Kanban Divisi',
      icon: <IkonPapan />,
      content: (
        <>
          <PanduanText>
            Papan kanban adalah tempat utama pekerjaan tim berlangsung. Setiap divisi punya papan sendiri dengan kolom-kolom yang mewakili tahapan pekerjaan.
          </PanduanText>
          <PanduanSub judul="Cara Membuka Papan">
            <PanduanText>
              Klik nama divisi di sidebar kiri (misalnya 'IT' atau 'Kreatif'). Papan kanban divisi tersebut akan terbuka dengan semua kolom dan tugasnya.
            </PanduanText>
          </PanduanSub>
          <PanduanSub judul="Alur Kolom">
            <PanduanText>
              Ada 4 tahapan utama: To Do (belum mulai) → Dikerjakan (sedang dikerjakan) → Review (menunggu persetujuan owner) → Selesai (disetujui & selesai). Tugasmu mengalir dari kiri ke kanan sesuai progres.
            </PanduanText>
          </PanduanSub>
          <PanduanSub judul="Geser Tugas (Drag & Drop)">
            <PanduanText>
              Seret kartu tugas ke kolom berikutnya untuk memperbarui statusnya. Saat selesai mengerjakan, seret ke kolom <PanduanKode>Review</PanduanKode> agar owner bisa memeriksa hasilmu.
            </PanduanText>
            <PanduanTip>
              Filter aktif akan menonaktifkan drag & drop sementara. Reset filter terlebih dahulu untuk bisa menyeret kartu.
            </PanduanTip>
          </PanduanSub>
          <PanduanSub judul="Proses Persetujuan di Kolom Review">
            <PanduanText>
              Saat tugasmu ada di kolom Review, owner atau admin divisi akan memeriksa hasilnya. Mereka bisa menekan <span className="font-semibold text-green-700">Setujui</span> — tugas langsung pindah ke Selesai, atau <span className="font-semibold text-orange-700">Revisi</span> — tugas dikembalikan ke Dikerjakan dan perlu diperbaiki.
            </PanduanText>
            <PanduanTip>
              Pantau tugasmu secara berkala. Kalau kartu tiba-tiba kembali ke kolom Dikerjakan, artinya owner meminta perbaikan — buka detail tugas untuk lihat catatannya.
            </PanduanTip>
          </PanduanSub>
          <PanduanSub judul="Filter & Pencarian">
            <PanduanText>
              Gunakan bar filter di atas papan untuk menyaring tugas berdasarkan nama, status, prioritas, atau penanggung jawab. Berguna saat papan sudah punya banyak tugas.
            </PanduanText>
          </PanduanSub>
        </>
      ),
    },
    {
      id: 'tugas-rutin',
      nomor: '04',
      judul: 'Tugas Rutin',
      icon: <IkonUlang />,
      content: (
        <>
          <PanduanText>
            Tugas rutin adalah tugas yang dibuat otomatis oleh sistem secara terjadwal — kamu tidak perlu menunggu ditugaskan manual setiap periodenya.
          </PanduanText>
          <PanduanSub judul="Kenapa tiba-tiba ada tugas baru?">
            <PanduanText>
              Tugas rutin dibuat dari template yang sudah diatur admin/owner divisimu. Pada waktu yang sudah dijadwalkan, sistem otomatis membuat kartu tugas baru di kolom To Do dengan namamu sebagai assignee.
            </PanduanText>
            <PanduanTip>
              Ini bukan kesalahan sistem — artinya ada pekerjaan berulang yang memang sudah dijadwalkan untukmu.
            </PanduanTip>
          </PanduanSub>
          <PanduanSub judul="Kapan tugas rutin muncul?">
            <PanduanText>
              Tergantung pola yang diatur admin: (1) Setiap hari kerja — muncul setiap Senin sampai Sabtu, (2) Setiap hari — muncul termasuk Minggu, (3) Setiap minggu — muncul pada hari tertentu setiap minggunya, (4) Setiap bulan — muncul pada tanggal tertentu setiap bulannya.
            </PanduanText>
          </PanduanSub>
          <PanduanSub judul="Tenggat waktu otomatis">
            <PanduanText>
              Tugas rutin bisa punya tenggat yang dihitung otomatis — misalnya '1 hari setelah dibuat', artinya tugas yang muncul hari Senin harus selesai hari Selasa. Jika tidak ada tenggat, kerjakan sesuai arahan atasanmu.
            </PanduanText>
          </PanduanSub>
          <PanduanSub judul="Cara mengerjakannya">
            <PanduanText>
              Sama persis seperti tugas biasa — kerjakan, lalu seret kartu ke kolom Review saat selesai agar owner bisa menyetujuinya. Tugas rutin juga bisa punya checklist dan lampiran.
            </PanduanText>
          </PanduanSub>
          <PanduanSub judul="Apakah bisa ditolak atau dihapus?">
            <PanduanText>
              Kamu tidak bisa menghapus atau melewati tugas rutin sendiri. Jika ada tugas rutin yang tidak relevan atau salah assign, hubungi Super Admin atau Owner divisimu untuk menonaktifkan templatenya.
            </PanduanText>
          </PanduanSub>
        </>
      ),
    },
    {
      id: 'detail-tugas',
      nomor: '05',
      judul: 'Detail & Checklist Tugas',
      icon: <IkonChecklist />,
      content: (
        <>
          <PanduanText>
            Klik kartu tugas di papan kanban untuk membuka panel detail di sisi kanan. Di sini kamu bisa melihat dan mengelola semua informasi tugas tersebut.
          </PanduanText>
          <PanduanSub judul="Informasi Tugas">
            <PanduanText>
              Panel detail menampilkan: nama tugas, deskripsi, prioritas, deadline, siapa yang membuat tugas, dan siapa saja yang ditugaskan (assignee).
            </PanduanText>
          </PanduanSub>
          <PanduanSub judul="Checklist">
            <PanduanText>
              Jika tugas punya daftar pekerjaan (checklist), klik tiap item untuk menandainya selesai. Progress bar di kartu akan otomatis terupdate sesuai jumlah item yang selesai.
            </PanduanText>
            <PanduanTip>
              Checklist hanya bisa dicentang oleh assignee tugas tersebut atau admin divisi.
            </PanduanTip>
          </PanduanSub>
          <PanduanSub judul="Pindah Kolom">
            <PanduanText>
              Gunakan dropdown 'Pindah ke Kolom' di panel detail untuk memindahkan tugas ke kolom lain tanpa perlu drag & drop di papan.
            </PanduanText>
          </PanduanSub>
        </>
      ),
    },
    {
      id: 'komentar',
      nomor: '06',
      judul: 'Komentar & Lampiran',
      icon: <IkonKomentar />,
      content: (
        <>
          <PanduanText>
            Di panel detail tugas, kamu bisa berkomunikasi dengan rekan satu tim dan berbagi file terkait pekerjaan.
          </PanduanText>
          <PanduanSub judul="Menulis Komentar">
            <PanduanText>
              Scroll ke bawah di panel detail, ketik pesanmu di kotak komentar, lalu tekan <span className="font-semibold text-maroon-800">Kirim</span>. Semua anggota divisi bisa membaca dan membalas komentar.
            </PanduanText>
            <PanduanTip>
              Gunakan komentar untuk update perkembangan, bertanya, atau memberikan catatan kepada rekan kerja — lebih terstruktur daripada grup chat.
            </PanduanTip>
          </PanduanSub>
          <PanduanSub judul="Mengunggah Lampiran">
            <PanduanText>
              Klik tab 'Lampiran' di panel detail, lalu pilih file dari perangkatmu. Semua anggota divisi bisa mengunduh file yang sudah diunggah.
            </PanduanText>
            <PanduanTip>
              Ukuran file maksimal 10 MB per file. Lampiran mendukung semua format umum (PDF, gambar, dokumen, ZIP).
            </PanduanTip>
          </PanduanSub>
          <PanduanSub judul="Riwayat Perubahan">
            <PanduanText>
              Tab 'Riwayat' di panel detail menampilkan semua perubahan yang pernah terjadi pada tugas tersebut — siapa yang mengubah apa dan kapan.
            </PanduanText>
          </PanduanSub>
        </>
      ),
    },
    {
      id: 'notifikasi',
      nomor: '07',
      judul: 'Notifikasi',
      icon: <IkonBell />,
      content: (
        <>
          <PanduanText>
            Notifikasi memberitahumu secara otomatis saat ada hal penting terkait tugasmu.
          </PanduanText>
          <PanduanSub judul="Ikon Lonceng">
            <PanduanText>
              Klik ikon lonceng (🔔) di pojok kanan atas navbar untuk melihat notifikasi terbaru. Titik merah muncul jika ada notifikasi yang belum dibaca.
            </PanduanText>
          </PanduanSub>
          <PanduanSub judul="Kapan Notifikasi Muncul?">
            <PanduanText>
              Kamu akan mendapat notifikasi saat: (1) ditugaskan ke sebuah tugas, (2) ada komentar baru di tugas yang kamu ikuti, atau (3) tugas yang kamu kerjakan dipindahkan ke kolom lain oleh admin.
            </PanduanText>
          </PanduanSub>
          <PanduanSub judul="Tandai Sudah Dibaca">
            <PanduanText>
              Klik notifikasi untuk membacanya sekaligus menandainya sudah dibaca. Notifikasi yang sudah dibaca akan berubah warna menjadi lebih redup.
            </PanduanText>
          </PanduanSub>
        </>
      ),
    },
  ]

  return (
    <PanduanLayout
      judul="Panduan Penggunaan"
      deskripsi="Selamat datang di SukaKerja! Halaman ini menjelaskan cara menggunakan fitur-fitur yang tersedia untuk kamu sebagai anggota tim."
      badge="PORTAL KARYAWAN"
      sections={userSections}
      tips={{
        icon: <IkonTips />,
        judul: 'Tips Umum',
        items: [
          'Selalu perbarui status tugasmu dengan menggeser kartu ke kolom yang sesuai — ini membantu tim memantau perkembangan pekerjaan.',
          'Saat selesai mengerjakan tugas, segera seret kartu ke kolom Review agar owner bisa memeriksa dan menyetujuinya.',
          'Kalau tugasmu dikembalikan ke Dikerjakan (revisi), buka detail tugas dan baca komentar terbaru untuk tahu apa yang perlu diperbaiki.',
          'Gunakan komentar di panel tugas, bukan grup chat eksternal, agar catatan pekerjaan tetap terdokumentasi di satu tempat.',
          'Cek dashboard setiap pagi untuk memantau tugas yang jatuh tempo hari ini.',
          'Jika menemukan masalah atau butuh akses ke divisi tertentu, hubungi Super Admin atau Owner organisasimu.',
        ],
      }}
      footerLinks={[
        { label: 'Ke Dashboard', href: '/dashboard', primary: true },
        { label: 'Lihat Tugas Saya', href: '/tugas-saya' },
      ]}
    />
  )
}

// ─── Shared SVG Icons ────────────────────────────────────────────────────────

function IkonRumah() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v10h14V10" />
    </svg>
  )
}
function IkonDaftar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16M4 12h16M4 18h10" />
    </svg>
  )
}
function IkonPapan() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M8 4v17M16 4v17M3 10h5M16 10h5" />
    </svg>
  )
}
function IkonChecklist() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  )
}
function IkonKomentar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}
function IkonBell() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}
function IkonOrang() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 4.5a3.5 3.5 0 0 1 0 7" />
      <path d="M15.5 13.5c3 .3 5 2.2 5.5 6.5" />
    </svg>
  )
}
function IkonGrup() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}
function IkonClipboard() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  )
}
function IkonJam() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  )
}
function IkonLog() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  )
}
function IkonSampah() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}
function IkonUlang() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="M7 22l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  )
}
function IkonTips() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}
