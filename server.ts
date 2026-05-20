import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

interface Student {
  id: number;
  nama: string;
  nisn: string;
  email: string;
  jalurId: number;
  status: "Pending" | "Diverifikasi" | "Ditolak";
  tanggal: string; // format: "YYYY-MM-DD"
  alamat_kk?: string;
  sekolah_asal?: string;
  no_kk?: string;
  no_hp?: string;
  nik?: string;
  nama_ayah?: string;
  nik_ayah?: string;
  pekerjaan_ayah?: string;
  nama_ibu?: string;
  nik_ibu?: string;
  pekerjaan_ibu?: string;
  nama_wali?: string;
  nik_wali?: string;
  pekerjaan_wali?: string;
  penghasilan_ortu?: string;
}

interface Pathway {
  id: number;
  nama: string;
  kuota: number;
  keterangan: string;
}

const pathways: Pathway[] = [
  { id: 1, nama: "Zonasi", kuota: 150, keterangan: "Pendaftaran berdasarkan wilayah jarak domisili tinggal terdekat." },
  { id: 2, nama: "Afirmasi", kuota: 60, keterangan: "Penerimaan khusus untuk keluarga ekonomi tidak mampu & penyandang disabilitas." },
  { id: 3, nama: "Prestasi", kuota: 80, keterangan: "Pendaftaran berdasarkan prestasi akademik atau non-akademik." },
  { id: 4, nama: "Perpindahan Orang Tua", kuota: 20, keterangan: "Khusus bagi anak guru atau orang tua yang dipindahtugaskan." }
];

// Helper to get formatted date relative to today (YYYY-MM-DD)
function getRelativeDate(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Initial school settings
let schoolSettings = {
  nama: "SMP Negeri 1 Jakarta",
  logo: "https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=150&auto=format&fit=crop&q=80"
};

// Initial in-memory seed data representing the MySQL DB
let studentsDb: Student[] = [
  { 
    id: 1, 
    nama: "Rian Hidayat", 
    nisn: "1234567890", 
    email: "rian.hidayat@gmail.com", 
    jalurId: 1, 
    status: "Diverifikasi", 
    tanggal: getRelativeDate(-5), 
    alamat_kk: "Jl. Merdeka No. 45, RT 02/RW 04, Gambir, Jakarta Pusat", 
    sekolah_asal: "SMP Negeri 1 Jakarta", 
    no_kk: "3171011234567890", 
    nik: "3171011212950001", 
    no_hp: "081234567890",
    nama_ayah: "Hidayat Syarifuddin",
    nik_ayah: "3171011502680001",
    pekerjaan_ayah: "Pegawai Negeri Sipil",
    nama_ibu: "Siti Rahmawati",
    nik_ibu: "3171012304720002",
    pekerjaan_ibu: "Ibu Rumah Tangga",
    penghasilan_ortu: "Rp 3.000.000 - Rp 5.000.000"
  },
  { 
    id: 2, 
    nama: "Siti Aminah", 
    nisn: "0987654321", 
    email: "siti.aminah@yahoo.com", 
    jalurId: 2, 
    status: "Diverifikasi", 
    tanggal: getRelativeDate(-4), 
    alamat_kk: "Jl. Mawar Indah No. 12, RT 01/RW 03, Coblong, Bandung", 
    sekolah_asal: "SMP N 2 Bandung", 
    no_kk: "3273011234567891", 
    nik: "3273012405020002", 
    no_hp: "081987654321",
    nama_ayah: "Ahmad Aminudin",
    nik_ayah: "3273011708700003",
    pekerjaan_ayah: "Wiraswasta",
    nama_ibu: "Salma Karimah",
    nik_ibu: "3273015510750004",
    pekerjaan_ibu: "Guru Swasta",
    penghasilan_ortu: "Rp 1.000.000 - Rp 3.000.000"
  },
  { id: 3, nama: "Budi Santoso", nisn: "1122334455", email: "budi.santoso@outlook.com", jalurId: 3, status: "Pending", tanggal: getRelativeDate(-3) },
  { id: 4, nama: "Ahmad Fauzi", nisn: "5544332211", email: "ahmad.fauzi@gmail.com", jalurId: 1, status: "Diverifikasi", tanggal: getRelativeDate(-2), alamat_kk: "Jl. Kebon Jeruk No. 8, RT 05/RW 01, Palmerah, Jakarta Barat", sekolah_asal: "SMP Swasta Merdeka", no_kk: "3173011234567892", nik: "3173011311020005", no_hp: "085611223344" },
  { id: 5, nama: "Lani Wijaya", nisn: "9988776655", email: "lani.wijaya@gmail.com", jalurId: 4, status: "Ditolak", tanggal: getRelativeDate(-2) },
  { id: 6, nama: "Rizky Pratama", nisn: "3344556677", email: "rizky.pratama@gmail.com", jalurId: 3, status: "Pending", tanggal: getRelativeDate(-1) },
  { id: 7, nama: "Safira Indah", nisn: "8877665544", email: "safira.indah@gmail.com", jalurId: 1, status: "Pending", tanggal: getRelativeDate(0) }
];

let nextStudentId = 8;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. Endpoint: Reset data statistik ke set semula
  app.post("/api/reset", (req, res) => {
    studentsDb = [
      { id: 1, nama: "Rian Hidayat", nisn: "1234567890", email: "rian.hidayat@gmail.com", jalurId: 1, status: "Diverifikasi", tanggal: getRelativeDate(-5) },
      { id: 2, nama: "Siti Aminah", nisn: "0987654321", email: "siti.aminah@yahoo.com", jalurId: 2, status: "Diverifikasi", tanggal: getRelativeDate(-4) },
      { id: 3, nama: "Budi Santoso", nisn: "1122334455", email: "budi.santoso@outlook.com", jalurId: 3, status: "Pending", tanggal: getRelativeDate(-3) },
      { id: 4, nama: "Ahmad Fauzi", nisn: "5544332211", email: "ahmad.fauzi@gmail.com", jalurId: 1, status: "Diverifikasi", tanggal: getRelativeDate(-2) },
      { id: 5, nama: "Lani Wijaya", nisn: "9988776655", email: "lani.wijaya@gmail.com", jalurId: 4, status: "Ditolak", tanggal: getRelativeDate(-2) },
      { id: 6, nama: "Rizky Pratama", nisn: "3344556677", email: "rizky.pratama@gmail.com", jalurId: 3, status: "Pending", tanggal: getRelativeDate(-1) },
      { id: 7, nama: "Safira Indah", nisn: "8877665544", email: "safira.indah@gmail.com", jalurId: 1, status: "Pending", tanggal: getRelativeDate(0) }
    ];
    nextStudentId = 8;
    return res.json({ status: "success", message: "Database simulasi berhasil disetel ulang!" });
  });

  // 2. Endpoint: get_stats.php yang diemulasikan dalam format Express JSON
  app.get("/api/stats", (req, res) => {
    // A. Urus hitung ringkasan
    const total = studentsDb.length;
    const diverifikasi = studentsDb.filter(s => s.status === "Diverifikasi").length;
    const ditolak = studentsDb.filter(s => s.status === "Ditolak").length;
    const pending = studentsDb.filter(s => s.status === "Pending").length;

    // B. Urus sisa kuota jalur pendaftaran
    // Sisa kuota = Total Kuota - Jumlah Siswa Diverifikasi pada jalur tersebut
    const jalurStats = pathways.map(p => {
      const terverifikasiJalur = studentsDb.filter(s => s.jalurId === p.id && s.status === "Diverifikasi").length;
      return {
        id: p.id,
        jalur: p.nama,
        kuota: p.kuota,
        sisa: Math.max(0, p.kuota - terverifikasiJalur)
      };
    });

    // C. Tren pendaftaran 7 hari terakhir (mencakup hari ini)
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
    const tren: { tanggal: string; jumlah: number; }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const monthStr = String(d.getMonth() + 1).padStart(2, "0");
      const dayStr = String(d.getDate()).padStart(2, "0");
      const dbDateString = `${year}-${monthStr}-${dayStr}`;

      const dateLabel = `${d.getDate()} ${months[d.getMonth()]}`;

      // Hitung pendaftar di hari ini
      const count = studentsDb.filter(s => s.tanggal === dbDateString).length;

      tren.push({
        tanggal: dateLabel,
        jumlah: count
      });
    }

    // D. 5 Pendaftar Terbaru
    const pendaftarTerbaru = [...studentsDb]
      .sort((a, b) => b.id - a.id)
      .slice(0, 5)
      .map(s => {
        const j = pathways.find(p => p.id === s.jalurId);
        // Date formatting DD-MM-YYYY
        const parts = s.tanggal.split("-");
        const formattedDate = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : s.tanggal;

        return {
          ...s,
          jalur: j ? j.nama : "Tidak Diketahui",
          tanggal: formattedDate
        };
      });

    // Kembalikan semua data siswa untuk tabel penuh (panel admin yang kaya fitur)
    const semuaSiswa = [...studentsDb]
      .sort((a, b) => b.id - a.id)
      .map(s => {
        const j = pathways.find(p => p.id === s.jalurId);
        const parts = s.tanggal.split("-");
        const formattedDate = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : s.tanggal;

        return {
          ...s,
          jalur: j ? j.nama : "Tidak Diketahui",
          tanggal: formattedDate
        };
      });

    return res.json({
      status: "success",
      data: {
        summary: { total, diverifikasi, ditolak, pending },
        jalur: jalurStats,
        tren: tren,
        pendaftar_terbaru: pendaftarTerbaru,
        semua_siswa: semuaSiswa
      }
    });
  });

  // 3. Endpoint: update_status.php asinkron secara simulasi
  app.post("/api/update-status", (req, res) => {
    const { id, status } = req.body;

    if (!id || !status) {
      return res.status(400).json({ status: "error", message: "Parameter ID dan Status tidak lengkap!" });
    }

    if (!["Pending", "Diverifikasi", "Ditolak"].includes(status)) {
      return res.status(400).json({ status: "error", message: "Nilai status tidak valid!" });
    }

    const index = studentsDb.findIndex(s => s.id === Number(id));
    if (index === -1) {
      return res.status(404).json({ status: "error", message: "Siswa dengan ID tersebut tidak ditemukan!" });
    }

    // Cek sisa kuota jika status beralih ke "Diverifikasi"
    const student = studentsDb[index];
    if (status === "Diverifikasi" && student.status !== "Diverifikasi") {
      const j = pathways.find(p => p.id === student.jalurId);
      if (j) {
        const terverifikasiJalur = studentsDb.filter(s => s.jalurId === j.id && s.status === "Diverifikasi").length;
        if (terverifikasiJalur >= j.kuota) {
          return res.status(400).json({
            status: "error",
            message: `Kuota untuk jalur "${j.nama}" sudah penuh (${j.kuota}/${j.kuota}). Tidak dapat melakukan verifikasi!`
          });
        }
      }
    }

    // Ubah status
    studentsDb[index].status = status;

    return res.json({
      status: "success",
      message: `Status siswa "${studentsDb[index].nama}" berhasil dimutakhirkan menjadi: ${status}`
    });
  });

  // 4. Endpoint: tambah_pendaftar.php asinkron secara simulasi
  app.post("/api/add-student", (req, res) => {
    const { nama_lengkap, nisn, email, jalur_id } = req.body;

    if (!nama_lengkap || !nisn || !email || !jalur_id) {
      return res.status(400).json({ status: "error", message: "Semua kolom pendaftaran wajib diisi!" });
    }

    // Validasi NISN (10 digit angka)
    if (!/^[0-9]{10}$/.test(nisn)) {
      return res.status(400).json({ status: "error", message: "NISN harus berupa 10 digit angka asli!" });
    }

    // Validasi duplikasi NISN
    if (studentsDb.some(s => s.nisn === nisn)) {
      return res.status(400).json({ status: "error", message: `Siswa dengan NISN ${nisn} sudah pernah terdaftar!` });
    }

    // Cek keberadaan jalur
    const pathwayId = Number(jalur_id);
    const j = pathways.find(p => p.id === pathwayId);
    if (!j) {
      return res.status(400).json({ status: "error", message: "Jalur pendaftaran yang dipilih tidak sah!" });
    }

    // Tambahkan pendaftar baru
    const newStudent: Student = {
      id: nextStudentId++,
      nama: nama_lengkap,
      nisn,
      email,
      jalurId: pathwayId,
      status: "Pending",
      tanggal: getRelativeDate(0) // Hari ini
    };

    studentsDb.push(newStudent);

    return res.json({
      status: "success",
      message: "Pendaftaran berhasil dikirim! Silakan instruksikan panitia untuk memverifikasi dokumen.",
      pendaftar_id: newStudent.id
    });
  });

  // 4a. Endpoint: login admin atau siswa
  app.post("/api/login", (req, res) => {
    const { role, username, password, nisn } = req.body;
    if (role === "admin") {
      if (username === "admin" && password === "admin123") {
        return res.json({ 
          status: "success", 
          role: "admin", 
          data: { username: "admin", nama: "Administrator" } 
        });
      } else {
        return res.status(401).json({ 
          status: "error", 
          message: "Username atau password Admin salah! (Bawaan: admin / admin123)" 
        });
      }
    } else if (role === "siswa") {
      if (!nisn) {
        return res.status(400).json({ status: "error", message: "NISN siswa wajib dimasukkan!" });
      }
      const student = studentsDb.find(s => s.nisn === nisn);
      if (student) {
        // Find pathway name
        const j = pathways.find(p => p.id === student.jalurId);
        const parts = student.tanggal.split("-");
        const formattedDate = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : student.tanggal;

        return res.json({ 
          status: "success", 
          role: "siswa", 
          data: {
            ...student,
            jalur: j ? j.nama : "Tidak Diketahui",
            tanggal: formattedDate
          } 
        });
      } else {
        return res.status(404).json({ 
          status: "error", 
          message: "Siswa dengan NISN tersebut tidak ditemukan! Silakan lakukan Pendaftaran Baru terlebih dahulu." 
        });
      }
    }
    return res.status(400).json({ status: "error", message: "Role login tidak valid!" });
  });

  // 4b. Endpoint: update biodata siswa (alamat kk, sekolah asal, no_kk, no_hp, dll serta Orang Tua)
  app.post("/api/update-biodata", (req, res) => {
    const { 
      id, alamat_kk, sekolah_asal, no_kk, no_hp, nik, email, nama,
      nama_ayah, nik_ayah, pekerjaan_ayah,
      nama_ibu, nik_ibu, pekerjaan_ibu,
      nama_wali, nik_wali, pekerjaan_wali,
      penghasilan_ortu
    } = req.body;

    if (!id) {
       return res.status(400).json({ status: "error", message: "ID siswa dibutuhkan!" });
    }
    const index = studentsDb.findIndex(s => s.id === Number(id));
    if (index === -1) {
       return res.status(404).json({ status: "error", message: "Siswa tidak ditemukan!" });
    }
    
    // Update fields
    if (alamat_kk !== undefined) studentsDb[index].alamat_kk = alamat_kk;
    if (sekolah_asal !== undefined) studentsDb[index].sekolah_asal = sekolah_asal;
    if (no_kk !== undefined) studentsDb[index].no_kk = no_kk;
    if (no_hp !== undefined) studentsDb[index].no_hp = no_hp;
    if (nik !== undefined) studentsDb[index].nik = nik;
    if (email !== undefined) studentsDb[index].email = email;
    if (nama !== undefined) studentsDb[index].nama = nama;

    // Parent details update
    if (nama_ayah !== undefined) studentsDb[index].nama_ayah = nama_ayah;
    if (nik_ayah !== undefined) studentsDb[index].nik_ayah = nik_ayah;
    if (pekerjaan_ayah !== undefined) studentsDb[index].pekerjaan_ayah = pekerjaan_ayah;
    if (nama_ibu !== undefined) studentsDb[index].nama_ibu = nama_ibu;
    if (nik_ibu !== undefined) studentsDb[index].nik_ibu = nik_ibu;
    if (pekerjaan_ibu !== undefined) studentsDb[index].pekerjaan_ibu = pekerjaan_ibu;
    if (nama_wali !== undefined) studentsDb[index].nama_wali = nama_wali;
    if (nik_wali !== undefined) studentsDb[index].nik_wali = nik_wali;
    if (pekerjaan_wali !== undefined) studentsDb[index].pekerjaan_wali = pekerjaan_wali;
    if (penghasilan_ortu !== undefined) studentsDb[index].penghasilan_ortu = penghasilan_ortu;

    // Get pathway name
    const student = studentsDb[index];
    const j = pathways.find(p => p.id === student.jalurId);
    const parts = student.tanggal.split("-");
    const formattedDate = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : student.tanggal;

    return res.json({
       status: "success",
       message: "Biodata pendaftaran Anda ke sistem PPDB berhasil diperbarui!",
       data: {
         ...student,
         jalur: j ? j.nama : "Tidak Diketahui",
         tanggal: formattedDate
       }
    });
  });

  // 4c. Endpoint: get school settings
  app.get("/api/settings", (req, res) => {
    return res.json({ status: "success", data: schoolSettings });
  });

  // 4d. Endpoint: update school settings
  app.post("/api/settings", (req, res) => {
    const { nama, logo } = req.body;
    if (nama !== undefined) schoolSettings.nama = nama;
    if (logo !== undefined) schoolSettings.logo = logo;
    return res.json({ 
      status: "success", 
      message: "Pengaturan nama dan logo sekolah berhasil diperbarui!", 
      data: schoolSettings 
    });
  });

  // 5. Integrasi Vite atau serving file statis
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running on http://localhost:${PORT}`);
  });
}

startServer();
