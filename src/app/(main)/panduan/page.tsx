import { redirect } from 'next/navigation'
import { ambilDataShell } from '@/lib/shell-data'

export default async function HalamanPanduan() {
  const data = await ambilDataShell()

  if (data.roleSistem !== 'user') {
    redirect('/dashboard')
  }

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

        {/* Seksi 1: Dashboard */}
        <SeksiPanduan
          id="dashboard"
          nomor="01"
          judul="Dashboard & Statistik"
          deskripsi="Dashboard adalah halaman utama yang kamu lihat setelah login. Di sini kamu bisa melihat ringkasan semua tugasmu dalam sekali pandang."
          icon={<IkonRumah />}
          warna="orange"
        >
          <ItemPanduan
            judul="Kartu Statistik"
            deskripsi="4 kartu di bagian atas menampilkan: jumlah tugas aktif, tugas yang jatuh tempo hari ini, tugas selesai minggu ini, dan tugas terlambat."
            tip="Kartu 'Terlambat' akan berwarna merah jika ada tugas yang melewati deadline — segera buka dan selesaikan!"
          />
          <ItemPanduan
            judul="Tugas Prioritas Saya"
            deskripsi="Daftar tugas dengan prioritas Tinggi atau Mendesak yang sedang berjalan. Klik nama divisi di setiap tugas untuk membuka papan kanban-nya."
          />
          <ItemPanduan
            judul="Progress Kerja"
            deskripsi="Grafik lingkaran yang menunjukkan persentase tugas selesai dalam minggu atau bulan ini. Gunakan tombol toggle untuk berganti periode."
          />
          <ItemPanduan
            judul="Deadline Terdekat"
            deskripsi="Daftar tugas yang paling mendekati jatuh tempo. Tugas yang sudah lewat deadline ditandai dengan label merah."
          />
        </SeksiPanduan>

        {/* Seksi 2: Tugas Saya */}
        <SeksiPanduan
          id="tugas-saya"
          nomor="02"
          judul="Tugas Saya"
          deskripsi="Halaman Tugas Saya menampilkan SEMUA tugas yang ditugaskan kepadamu dari seluruh divisi yang kamu ikuti — tanpa perlu membuka papan satu per satu."
          icon={<IkonDaftar />}
          warna="blue"
        >
          <ItemPanduan
            judul="Filter & Pencarian"
            deskripsi="Gunakan kotak pencarian untuk menemukan tugas berdasarkan nama, atau filter berdasarkan prioritas (Rendah, Sedang, Tinggi, Mendesak) dan status (Aktif / Selesai)."
          />
          <ItemPanduan
            judul="Badge Prioritas"
            deskripsi="Setiap tugas memiliki badge warna: abu-abu (Rendah), biru (Sedang), oranye (Tinggi), merah (Mendesak). Semakin terang warnanya, semakin perlu perhatian segera."
          />
          <ItemPanduan
            judul="Buka Detail Tugas"
            deskripsi="Klik tombol 'Detail' di setiap baris tugas untuk membuka panel detail. Di sana kamu bisa mengerjakan checklist, menulis komentar, dan mengunduh lampiran."
            tip="Kamu juga bisa klik nama divisi untuk langsung masuk ke papan kanban divisi tersebut."
          />
        </SeksiPanduan>

        {/* Seksi 3: Kanban */}
        <SeksiPanduan
          id="kanban"
          nomor="03"
          judul="Papan Kanban Divisi"
          deskripsi="Papan kanban adalah tempat utama pekerjaan tim berlangsung. Setiap divisi punya papan sendiri dengan kolom-kolom yang mewakili tahapan pekerjaan."
          icon={<IkonPapan />}
          warna="green"
        >
          <ItemPanduan
            judul="Cara Membuka Papan"
            deskripsi="Klik nama divisi di sidebar kiri (misalnya 'IT' atau 'Kreatif'). Papan kanban divisi tersebut akan terbuka dengan semua kolom dan tugasnya."
          />
          <ItemPanduan
            judul="Alur Kolom"
            deskripsi="Ada 4 tahapan utama: To Do (belum mulai) → Dikerjakan (sedang dikerjakan) → Review (menunggu persetujuan owner) → Selesai (disetujui & selesai). Tugasmu mengalir dari kiri ke kanan sesuai progres."
          />
          <ItemPanduan
            judul="Geser Tugas (Drag & Drop)"
            deskripsi="Seret kartu tugas ke kolom berikutnya untuk memperbarui statusnya. Saat selesai mengerjakan, seret ke kolom 'Review' agar owner bisa memeriksa hasilmu."
            tip="Filter aktif akan menonaktifkan drag & drop sementara. Reset filter terlebih dahulu untuk bisa menyeret kartu."
          />
          <ItemPanduan
            judul="Proses Persetujuan di Kolom Review"
            deskripsi="Saat tugasmu ada di kolom Review, owner atau admin divisi akan memeriksa hasilnya. Mereka bisa menekan 'Setujui' — tugas langsung pindah ke Selesai, atau 'Revisi' — tugas dikembalikan ke Dikerjakan dan perlu diperbaiki."
            tip="Pantau tugasmu secara berkala. Kalau kartu tiba-tiba kembali ke kolom Dikerjakan, artinya owner meminta perbaikan — buka detail tugas untuk lihat catatannya."
          />
          <ItemPanduan
            judul="Tugas Rutin Otomatis"
            deskripsi="Beberapa tugas dibuat otomatis oleh sistem setiap hari, minggu, atau bulan berdasarkan template yang dibuat admin. Tugas ini langsung muncul di kolommu secara terjadwal — tidak perlu menunggu ditugaskan manual."
          />
          <ItemPanduan
            judul="Filter & Pencarian"
            deskripsi="Gunakan bar filter di atas papan untuk menyaring tugas berdasarkan nama, status, prioritas, atau penanggung jawab. Berguna saat papan sudah punya banyak tugas."
          />
          <ItemPanduan
            judul="Scroll Horizontal"
            deskripsi="Jika papan memiliki banyak kolom, geser ke kanan untuk melihat kolom berikutnya. Gunakan tombol panah kiri/kanan di tepi papan untuk navigasi lebih mudah."
          />
        </SeksiPanduan>

        {/* Seksi 4: Detail Tugas */}
        <SeksiPanduan
          id="detail-tugas"
          nomor="04"
          judul="Detail & Checklist Tugas"
          deskripsi="Klik kartu tugas di papan kanban untuk membuka panel detail di sisi kanan. Di sini kamu bisa melihat dan mengelola semua informasi tugas tersebut."
          icon={<IkonChecklist />}
          warna="purple"
        >
          <ItemPanduan
            judul="Informasi Tugas"
            deskripsi="Panel detail menampilkan: nama tugas, deskripsi, prioritas, deadline, siapa yang membuat tugas, dan siapa saja yang ditugaskan (assignee)."
          />
          <ItemPanduan
            judul="Checklist"
            deskripsi="Jika tugas punya daftar pekerjaan (checklist), klik tiap item untuk menandainya selesai. Progress bar di kartu akan otomatis terupdate sesuai jumlah item yang selesai."
            tip="Checklist hanya bisa dicentang oleh assignee tugas tersebut atau admin divisi."
          />
          <ItemPanduan
            judul="Pindah Kolom"
            deskripsi="Gunakan dropdown 'Pindah ke Kolom' di panel detail untuk memindahkan tugas ke kolom lain tanpa perlu drag & drop di papan."
          />
        </SeksiPanduan>

        {/* Seksi 5: Komentar & Lampiran */}
        <SeksiPanduan
          id="komentar"
          nomor="05"
          judul="Komentar & Lampiran"
          deskripsi="Di panel detail tugas, kamu bisa berkomunikasi dengan rekan satu tim dan berbagi file terkait pekerjaan."
          icon={<IkonKomentar />}
          warna="teal"
        >
          <ItemPanduan
            judul="Menulis Komentar"
            deskripsi="Scroll ke bawah di panel detail, ketik pesanmu di kotak komentar, lalu tekan 'Kirim'. Semua anggota divisi bisa membaca dan membalas komentar."
            tip="Gunakan komentar untuk update perkembangan, bertanya, atau memberikan catatan kepada rekan kerja — lebih terstruktur daripada grup chat."
          />
          <ItemPanduan
            judul="Mengunggah Lampiran"
            deskripsi="Klik tab 'Lampiran' di panel detail, lalu pilih file dari perangkatmu. Semua anggota divisi bisa mengunduh file yang sudah diunggah."
            tip="Ukuran file maksimal 10 MB per file. Lampiran mendukung semua format umum (PDF, gambar, dokumen, ZIP)."
          />
          <ItemPanduan
            judul="Riwayat Perubahan"
            deskripsi="Tab 'Riwayat' di panel detail menampilkan semua perubahan yang pernah terjadi pada tugas tersebut — siapa yang mengubah apa dan kapan."
          />
        </SeksiPanduan>

        {/* Seksi 6: Notifikasi */}
        <SeksiPanduan
          id="notifikasi"
          nomor="06"
          judul="Notifikasi"
          deskripsi="Notifikasi memberitahumu secara otomatis saat ada hal penting terkait tugasmu."
          icon={<IkonBell />}
          warna="amber"
        >
          <ItemPanduan
            judul="Ikon Lonceng"
            deskripsi="Klik ikon lonceng (🔔) di pojok kanan atas navbar untuk melihat notifikasi terbaru. Titik merah muncul jika ada notifikasi yang belum dibaca."
          />
          <ItemPanduan
            judul="Kapan Notifikasi Muncul?"
            deskripsi="Kamu akan mendapat notifikasi saat: (1) ditugaskan ke sebuah tugas, (2) ada komentar baru di tugas yang kamu ikuti, atau (3) tugas yang kamu kerjakan dipindahkan ke kolom lain oleh admin."
          />
          <ItemPanduan
            judul="Tandai Sudah Dibaca"
            deskripsi="Klik notifikasi untuk membacanya sekaligus menandainya sudah dibaca. Notifikasi yang sudah dibaca akan berubah warna menjadi lebih redup."
          />
        </SeksiPanduan>

        {/* Tips Umum */}
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
          <a
            href="/dashboard"
            className="flex items-center gap-2 rounded-xl bg-maroon-800 hover:bg-maroon-700 px-5 py-2.5 text-sm font-bold text-cream-50 shadow-sm transition active:scale-95"
          >
            Ke Dashboard
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
          </a>
          <a
            href="/tugas-saya"
            className="flex items-center gap-2 rounded-xl border border-cream-200 bg-white hover:border-orange-300 hover:text-orange-600 px-5 py-2.5 text-sm font-bold text-maroon-800 shadow-sm transition active:scale-95"
          >
            Lihat Tugas Saya
          </a>
        </div>
      </div>
  )
}

function SeksiPanduan({
  id,
  nomor,
  judul,
  deskripsi,
  icon,
  warna,
  children,
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
