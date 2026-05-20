import { Folder, Database, Terminal, CheckCircle } from "lucide-react";

export default function InstructionPanel() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600" />
          Petunjuk Instalasi Dashboard PPDB (XAMPP / Laragon)
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Langkah mudah memindahkan kode PHP Native & database MySQL ke server lokal komputer Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Kolom Kiri: Setup Folders & Database */}
        <div className="space-y-5">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Folder className="w-4 h-4 text-slate-400" />
                Siapkan Direktori Web (HTDOCS)
              </h4>
              <p className="text-xs leading-relaxed text-slate-500">
                Buatlah folder baru bernama <code className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1.5 py-0.5 rounded text-[11px] font-mono">ppdb-admin</code> di dalam folder root web server Anda:
              </p>
              <ul className="text-xs list-disc list-inside space-y-1 text-slate-500 pl-1 mt-2">
                <li><strong>XAMPP:</strong> <code className="bg-slate-50 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-[11px]">C:\xampp\htdocs\ppdb-admin\</code></li>
                <li><strong>Laragon:</strong> <code className="bg-slate-50 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-[11px]">C:\laragon\www\ppdb-admin\</code></li>
              </ul>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-slate-400" />
                Salin File Sumber PHP
              </h4>
              <p className="text-xs leading-relaxed text-slate-500">
                Unduh atau salin semua file dari tab <strong>"Sumber Kode PHP"</strong> di dashboard ini ke dalam folder tersebut:
              </p>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {["koneksi.php", "get_stats.php", "update_status.php", "tambah_pendaftar.php", "index.php"].map((f) => (
                  <div key={f} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 p-2 rounded-lg text-xs font-mono text-slate-600 dark:text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Database Seeding & Launching */}
        <div className="space-y-5">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-slate-400" />
                Impor Skema Database MySQL
              </h4>
              <p className="text-xs leading-relaxed text-slate-500">
                Impor SQL schema untuk membuat database PPDB otomatis:
              </p>
              <ol className="text-xs list-decimal list-inside space-y-1.5 text-slate-500 pl-1 mt-2">
                <li>Buka aplikasi web database explorer Anda (misalnya: <strong>phpMyAdmin</strong> di <code className="bg-slate-50 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-[11px]">http://localhost/phpmyadmin</code>).</li>
                <li>Klik tab <strong>"SQL"</strong>, atau buat database baru bernama <code className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-250 px-1 rounded font-mono text-[11px]">db_ppdb</code> kemudian klik Impor.</li>
                <li>Salin seluruh skrip dari file <code className="font-mono text-[11px] text-slate-700 dark:text-slate-350">db_ppdb.sql</code> dan eksekusi (klik <strong>Go/Kirim</strong>).</li>
              </ol>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
              4
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-slate-400" />
                Uji Coba & Jalankan Aplikasi!
              </h4>
              <p className="text-xs leading-relaxed text-slate-500">
                Pastikan modul Apache & MySQL di XAMPP control panel aktif. Lalu luncurkan peramban dan akses alamat berikut:
              </p>
              <div className="mt-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/40 p-3 rounded-xl flex items-center justify-between">
                <div>
                  <span className="block text-[10px] text-blue-600 uppercase font-bold tracking-wider">Tautan Lokal</span>
                  <a href="http://localhost/ppdb-admin/" target="_blank" rel="noreferrer" className="text-sm font-mono font-bold text-blue-700 dark:text-blue-300 hover:underline">
                    http://localhost/ppdb-admin/
                  </a>
                </div>
                <span className="text-[10px] bg-blue-600 text-white font-bold px-3 py-1 rounded-full text-center">READY</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
