import { useState, useEffect, FormEvent } from "react";
import { 
  GraduationCap, 
  LayoutDashboard, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RefreshCw, 
  UserPlus, 
  Database, 
  BookOpen, 
  Sparkles, 
  RotateCcw, 
  Search, 
  ChevronRight,
  Info,
  Check,
  Plus,
  Lock,
  Shield,
  Printer,
  Download,
  LogOut,
  LogIn,
  User,
  FileText,
  Edit2,
  Settings
} from "lucide-react";
import StatCard from "./components/StatCard";
import PathwayQuota from "./components/PathwayQuota";
import DailyTrendChart from "./components/DailyTrendChart";
import CodeViewer from "./components/CodeViewer";
import InstructionPanel from "./components/InstructionPanel";
import { DashboardResponse, Student } from "./types";

export default function App() {
  const [currentUser, setCurrentUser] = useState<{
    role: "admin" | "siswa";
    username?: string;
    nama?: string;
    studentData?: Student;
  } | null>(() => {
    const saved = localStorage.getItem("ppdb_session");
    return saved ? JSON.parse(saved) : null;
  });

  const [authRole, setAuthRole] = useState<"admin" | "siswa">("admin");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [studentNisn, setStudentNisn] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Student portal navigation tab
  const [studentTab, setStudentTab] = useState<"biodata" | "bukti">("biodata");

  // Multi-fields biodata editor states (for admin/students profile modifications)
  const [selectedStudentForBio, setSelectedStudentForBio] = useState<Student | null>(null);
  const [bioFormData, setBioFormData] = useState({
    nama: "",
    email: "",
    sekolah_asal: "",
    alamat_kk: "",
    no_kk: "",
    nik: "",
    no_hp: "",
    nama_ayah: "",
    nik_ayah: "",
    pekerjaan_ayah: "",
    nama_ibu: "",
    nik_ibu: "",
    pekerjaan_ibu: "",
    nama_wali: "",
    nik_wali: "",
    pekerjaan_wali: "",
    penghasilan_ortu: ""
  });

  const [activeTab, setActiveTab] = useState<"dashboard" | "manajemen" | "php-src" | "pengaturan">("dashboard");
  const [stats, setStats] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pollingActive, setPollingActive] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"All" | "Pending" | "Diverifikasi" | "Ditolak">("All");

  // School Customizer Settings
  const [schoolName, setSchoolName] = useState("SMP Negeri 1 Jakarta");
  const [schoolLogo, setSchoolLogo] = useState("https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=150&auto=format&fit=crop&q=80");
  const [schoolNameInput, setSchoolNameInput] = useState("SMP Negeri 1 Jakarta");
  const [schoolLogoInput, setSchoolLogoInput] = useState("https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=150&auto=format&fit=crop&q=80");

  // Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    nama_lengkap: "",
    nisn: "",
    email: "",
    jalur_id: "1"
  });

  // Feedback State
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" | "warning"; } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "warning" = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      const json = await res.json();
      if (res.ok && json.status === "success" && json.data) {
        const n = json.data.nama || "SMP Negeri 1 Jakarta";
        const l = json.data.logo || "https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=150&auto=format&fit=crop&q=80";
        setSchoolName(n);
        setSchoolLogo(l);
        setSchoolNameInput(n);
        setSchoolLogoInput(l);
      }
    } catch (err) {
      console.error("Gagal memuat settings:", err);
    }
  };

  const handleUpdateSchoolSettings = async (nama: string, logo: string) => {
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama, logo })
      });
      const json = await res.json();
      if (res.ok && json.status === "success") {
        setSchoolName(json.data.nama);
        setSchoolLogo(json.data.logo);
        showToast(json.message, "success");
      } else {
        showToast(json.message || "Gagal memperbarui pengaturan sekolah.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Gagal terhubung ke modul pengaturan server.", "error");
    }
  };

  // Auto-fill student profile whenever currentUser changes (Login / Save)
  useEffect(() => {
    if (currentUser && currentUser.role === "siswa" && currentUser.studentData) {
      const s = currentUser.studentData;
      setBioFormData({
        nama: s.nama || "",
        email: s.email || "",
        sekolah_asal: s.sekolah_asal || "",
        alamat_kk: s.alamat_kk || "",
        no_kk: s.no_kk || "",
        nik: s.nik || "",
        no_hp: s.no_hp || "",
        nama_ayah: s.nama_ayah || "",
        nik_ayah: s.nik_ayah || "",
        pekerjaan_ayah: s.pekerjaan_ayah || "",
        nama_ibu: s.nama_ibu || "",
        nik_ibu: s.nik_ibu || "",
        pekerjaan_ibu: s.pekerjaan_ibu || "",
        nama_wali: s.nama_wali || "",
        nik_wali: s.nik_wali || "",
        pekerjaan_wali: s.pekerjaan_wali || "",
        penghasilan_ortu: s.penghasilan_ortu || ""
      });
    }
  }, [currentUser]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      const payload = authRole === "admin" 
        ? { role: "admin", username: adminUsername, password: adminPassword }
        : { role: "siswa", nisn: studentNisn };

      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (res.ok && json.status === "success") {
        const session = {
          role: json.role,
          username: json.role === "admin" ? json.data.username : undefined,
          nama: json.role === "admin" ? json.data.nama : json.data.nama,
          studentData: json.role === "siswa" ? json.data : undefined
        };
        setCurrentUser(session);
        localStorage.setItem("ppdb_session", JSON.stringify(session));
        showToast(`Selamat datang kembali, ${session.nama}!`, "success");
        
        // Reset login inputs
        setAdminUsername("");
        setAdminPassword("");
        setStudentNisn("");
        
        // Load fresh stats if admin
        if (json.role === "admin") {
          fetchStats();
        }
      } else {
        showToast(json.message || "Gagal melakukan verifikasi masuk.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Gagal terhubung ke modul otentikasi server.", "error");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("ppdb_session");
    setCurrentUser(null);
    showToast("Anda telah keluar dari sistem administrator / siswa PPDB.", "success");
  };

  const handleSaveBiodata = async (id: number, isSelf = false) => {
    try {
      const res = await fetch("/api/update-biodata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          ...bioFormData
        })
      });
      const json = await res.json();
      if (res.ok && json.status === "success") {
        showToast(json.message, "success");
        if (isSelf && currentUser) {
          const updatedSession = {
            ...currentUser,
            nama: json.data.nama,
            studentData: json.data
          };
          setCurrentUser(updatedSession);
          localStorage.setItem("ppdb_session", JSON.stringify(updatedSession));
        }
        setSelectedStudentForBio(null);
        fetchStats();
      } else {
        showToast(json.message || "Gagal memperbarui biodata.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Gagal menyimpan data ke server.", "error");
    }
  };

  // Modern and secure multi-format exporters
  const exportAsJSON = (student: Student) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(student, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `PPDB_Biodata_${student.nama.replace(/\s+/g, "_")}_${student.nisn}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(`Biodata siswa ${student.nama} telah diekspor ke berkas JSON!`, "success");
  };

  const exportAsCSV = (student: Student) => {
    const headers = ["ID Registrasi", "Nama", "NISN", "Email", "Jalur", "Tanggal Daftar", "Status", "No KK", "NIK", "No HP", "Alamat KK", "Sekolah Asal"];
    const rows = [
      `REG-${String(student.id).padStart(4, "0")}`,
      student.nama,
      student.nisn,
      student.email,
      student.jalur,
      student.tanggal,
      student.status,
      student.no_kk || "-",
      student.nik || "-",
      student.no_hp || "-",
      student.alamat_kk || "-",
      student.sekolah_asal || "-"
    ];
    
    // Format safely to prevent excel breaking in native CSV parsing
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), rows.map(r => `"${r.replace(/"/g, '""')}"`).join(",")].join("\n");
      
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", encodeURI(csvContent));
    downloadAnchor.setAttribute("download", `PPDB_Biodata_${student.nama.replace(/\s+/g, "_")}_${student.nisn}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(`Biodata siswa ${student.nama} telah diekspor ke berkas CSV!`, "success");
  };

  const exportAsTXT = (student: Student) => {
    const textContent = `
=============================================
         KARTU BUKTI PENDAFTARAN PPDB 2026   
=============================================
ID Registrasi  : #REG-${String(student.id).padStart(4, "0")}
Nama Lengkap   : ${student.nama.toUpperCase()}
NISN           : ${student.nisn}
NIK Kandidat   : ${student.nik || "- Belum Dilengkapi -"}
No. Kartu Kel. : ${student.no_kk || "- Belum Dilengkapi -"}
Asal Sekolah   : ${student.sekolah_asal || "- Belum Dilengkapi -"}
Jalur PPDB     : ${student.jalur}
Alamat Rumah   : ${student.alamat_kk || "- Belum Dilengkapi -"}
No. Telp/HP    : ${student.no_hp || "- Belum Dilengkapi -"}
Alamat Email   : ${student.email}
Tanggal Daftar : ${student.tanggal}
Status Berkas  : ${student.status.toUpperCase()}

Keterangan:
Simpan bukti pendaftaran ini dengan baik sebagai salah satu
persyaratan daftar ulang jika dinyatakan DIVERIFIKASI oleh
panitia PPDB sekolah tujuan.

Tanggal Cetak: ${new Date().toLocaleDateString("id-ID")}
PPDB PANITIA OFFICIAL SYSTEM
=============================================
`;
    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(textContent.trim());
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `PPDB_Biodata_${student.nama.replace(/\s+/g, "_")}_${student.nisn}.txt`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(`Resume biodata ${student.nama} berhasil diekspor ke berkas Teks!`, "success");
  };

  const startEditingBiodata = (student: Student) => {
    setSelectedStudentForBio(student);
    setBioFormData({
      nama: student.nama || "",
      email: student.email || "",
      sekolah_asal: student.sekolah_asal || "",
      alamat_kk: student.alamat_kk || "",
      no_kk: student.no_kk || "",
      nik: student.nik || "",
      no_hp: student.no_hp || "",
      nama_ayah: student.nama_ayah || "",
      nik_ayah: student.nik_ayah || "",
      pekerjaan_ayah: student.pekerjaan_ayah || "",
      nama_ibu: student.nama_ibu || "",
      nik_ibu: student.nik_ibu || "",
      pekerjaan_ibu: student.pekerjaan_ibu || "",
      nama_wali: student.nama_wali || "",
      nik_wali: student.nik_wali || "",
      pekerjaan_wali: student.pekerjaan_wali || "",
      penghasilan_ortu: student.penghasilan_ortu || ""
    });
  };

  // Fetch Dashboard Statistics from simulated API
  const fetchStats = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch("/api/stats");
      const json = await res.json();
      if (json.status === "success") {
        setStats(json.data);
      } else {
        showToast("Hubungan ke server backend bermasalah.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Gagal mengambil data dari API lokal.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Setup Live Polling API emulation to demonstrate auto-updating AJAX/Fetch without reload
  useEffect(() => {
    fetchStats();
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!pollingActive) return;
    const interval = setInterval(() => {
      fetchStats();
    }, 4500); // Poll every 4.5 seconds to showcase real-time AJAX behavior
    return () => clearInterval(interval);
  }, [pollingActive]);

  const handleUpdateStatus = async (id: number, status: "Pending" | "Diverifikasi" | "Ditolak") => {
    try {
      const response = await fetch("/api/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status })
      });
      const data = await response.json();
      if (response.ok && data.status === "success") {
        showToast(data.message, "success");
        fetchStats(); // Update immediately
      } else {
        showToast(data.message || "Gagal mengubah status.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Kesalahan jaringan.", "error");
    }
  };

  const resetDatabase = async () => {
    if (!confirm("Apakah Anda yakin ingin menyetel ulang database simulasi PPDB ke bentuk semula?")) return;
    try {
      const response = await fetch("/api/reset", { method: "POST" });
      const data = await response.json();
      if (data.status === "success") {
        showToast(data.message, "success");
        fetchStats();
      }
    } catch (err) {
      showToast("Gagal menyetel ulang database simulasi.", "error");
    }
  };

  const handleCreateStudent = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/add-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (response.ok && data.status === "success") {
        showToast(data.message, "success");
        setShowAddModal(false);
        setFormData({ nama_lengkap: "", nisn: "", email: "", jalur_id: "1" });
        fetchStats();
      } else {
        showToast(data.message || "Gagal menambahkan siswa.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Kesalahan saat mendaftarkan siswa.", "error");
    }
  };

  // Automated Mock Registrar to show live AJAl/Fetch response transitions
  const triggerAutoRegister = async () => {
    const listNames = [
      "Bagus Kurniawan", "Keysha Maharani", "Dika Pratama", "Clara Amanda", 
      "Vano Setiawan", "Rania Nabila", "Syarif Hidayatollah", "Fanny Lestari",
      "Genta Wardhana", "Adinda Salsabila"
    ];
    const pathwaysIds = [1, 2, 3, 4];
    
    const randomName = listNames[Math.floor(Math.random() * listNames.length)];
    const randomNisn = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const randomEmail = `${randomName.toLowerCase().replace(" ", "")}${Math.floor(Math.random() * 90)}@gmail.com`;
    const randomJalur = pathwaysIds[Math.floor(Math.random() * pathwaysIds.length)];

    try {
      const response = await fetch("/api/add-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama_lengkap: randomName,
          nisn: randomNisn,
          email: randomEmail,
          jalur_id: randomJalur
        })
      });
      const data = await response.json();
      if (response.ok && data.status === "success") {
        showToast(`[Simulasi AJAX] Mendaftarkan ${randomName} secara otomatis!`, "success");
        fetchStats();
      } else {
        showToast(data.message || "Gagal simulasikan pendaftar otomatis.", "warning");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter & Search Log
  const filteredStudents = stats?.semua_siswa.filter(s => {
    const matchesSearch = s.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.nisn.includes(searchQuery);
    const matchesFilter = filterStatus === "All" || s.status === filterStatus;
    return matchesSearch && matchesFilter;
  }) || [];

  // 1. GUEST PORTAL - LOGIN SELECTION
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans text-slate-100 antialiased">
        {/* Ambient glow backgrounds */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[130px]" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[130px]" />

        <div className="w-full max-w-md space-y-8 relative z-10">
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-xl shadow-blue-500/15 overflow-hidden border border-slate-700/50">
              {schoolLogo && (schoolLogo.startsWith("http://") || schoolLogo.startsWith("https://") || schoolLogo.startsWith("data:image")) ? (
                <img src={schoolLogo} alt="Logo Sekolah" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <GraduationCap className="w-8 h-8" />
              )}
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-white mt-4 uppercase">
              {schoolName}
            </h1>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
              Portal Resmi Pendaftaran Penerimaan Peserta Didik Baru (PPDB) Terpadu
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
            {/* Custom Tab Selector */}
            <div className="flex gap-2 p-1 bg-slate-950 border border-slate-800/80 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => setAuthRole("siswa")}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  authRole === "siswa"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Portal Calon Siswa
              </button>
              <button
                type="button"
                onClick={() => setAuthRole("admin")}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  authRole === "admin"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Panitia Admin
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              {authRole === "admin" ? (
                <>
                  <div className="space-y-1 text-left">
                    <label className="text-[11px] font-bold text-slate-400 block pb-1">
                      Username Administrator
                    </label>
                    <input
                      type="text"
                      placeholder="Masukkan username admin"
                      required
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-800 rounded-xl bg-slate-950 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[11px] font-bold text-slate-400 block pb-1">
                      Password Panitia
                    </label>
                    <input
                      type="password"
                      placeholder="Masukkan password admin"
                      required
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-800 rounded-xl bg-slate-950 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div className="p-3.5 bg-slate-950 border border-slate-800/60 rounded-xl text-[11px] text-slate-400 text-left leading-normal">
                    💡 <span className="font-semibold text-slate-300">Panitia PPDB Login Standard: </span>
                    Gunakan username <code className="text-blue-400 font-mono">admin</code> dan password <code className="text-blue-400 font-mono">admin123</code> untuk menguji akses.
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1 text-left">
                    <label className="text-[11px] font-bold text-slate-400 block pb-1">
                      Nomor Induk Siswa Nasional (NISN)
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      placeholder="Masukkan 10 digit NISN Anda"
                      required
                      value={studentNisn}
                      onChange={(e) => setStudentNisn(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-800 rounded-xl bg-slate-950 text-white focus:outline-none focus:border-blue-500 transition-colors font-mono"
                    />
                  </div>

                  <div className="p-3.5 bg-slate-950 border border-slate-800/60 rounded-xl text-[11px] text-slate-400 text-left leading-normal space-y-2">
                    <div className="font-semibold text-slate-300">💡 Akses Siswa Terdaftar:</div>
                    <p>Masukkan NISN siswa yang terdaftar dalam database untuk melihat dan memperlengkap biodata KK/Sekolah Asal:</p>
                    <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px] text-blue-400 mt-1">
                      <button type="button" onClick={() => setStudentNisn("1234567890")} className="text-left bg-slate-900 py-1.5 px-2 rounded hover:bg-slate-850 truncate cursor-pointer select-none">
                        • 1234567890 (Rian)
                      </button>
                      <button type="button" onClick={() => setStudentNisn("0987654321")} className="text-left bg-slate-900 py-1.5 px-2 rounded hover:bg-slate-850 truncate cursor-pointer select-none">
                        • 0987654321 (Siti)
                      </button>
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg shadow-blue-600/10 flex items-center justify-center gap-1.5 text-xs cursor-pointer"
              >
                {authLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                Masuk ke Portal PPDB
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs">
              <span className="text-slate-500 text-[10px]">
                Belum mendaftarkan diri?
              </span>
              <button
                type="button"
                onClick={() => {
                  setFormData({ nama_lengkap: "", nisn: "", email: "", jalur_id: "1" });
                  setShowAddModal(true);
                }}
                className="text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors text-right cursor-pointer"
              >
                Formulir Pendaftaran Baru →
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic global toast */}
        {notification && (
          <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-205 text-left">
            <div className={`p-4 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 ${
              notification.type === "success" 
                ? "bg-slate-900 border-emerald-500/20 text-emerald-400" 
                : "bg-slate-900 border-rose-500/20 text-rose-400"
            }`}>
              <Info className="w-4 h-4 text-emerald-500" />
              {notification.message}
            </div>
          </div>
        )}

        {/* Add modal for new student registrations */}
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl overflow-hidden shadow-xl max-w-md w-full animate-in zoom-in-95 duration-150">
              <div className="bg-slate-950 px-6 py-4 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2 text-white">
                  <UserPlus className="w-5 h-5 text-blue-400" />
                  <h3 className="font-bold text-sm">Registrasi Calon Siswa Baru</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateStudent} className="p-6 space-y-4 text-xs text-left">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 block">Nama Lengkap Calon Siswa</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Muhammad Akhyar"
                    value={formData.nama_lengkap}
                    onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-800 rounded-xl bg-slate-1000 bg-slate-950 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 block">NISN (10 Digit)</label>
                  <input
                    type="text"
                    maxLength={10}
                    minLength={10}
                    placeholder="Contoh: 0045617281"
                    required
                    value={formData.nisn}
                    onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-800 rounded-xl bg-slate-1000 bg-slate-950 text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 block">Alamat Email Aktif</label>
                  <input
                    type="email"
                    placeholder="Contoh: akhyar@gmail.com"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-800 rounded-xl bg-slate-1000 bg-slate-950 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 block">Pilih Jalur Pendaftaran PPDB</label>
                  <select
                    required
                    value={formData.jalur_id}
                    onChange={(e) => setFormData({ ...formData, jalur_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-800 rounded-xl bg-slate-1000 bg-slate-950 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="1">Zonasi (Tersedia Kuota)</option>
                    <option value="2">Afirmasi (Keluarga Prasejahtera)</option>
                    <option value="3">Prestasi (Akademis/Non-Akademis)</option>
                    <option value="4">Perpindahan Orang Tua (Pindahan Dinas)</option>
                  </select>
                </div>

                <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-850">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 hover:bg-slate-800 text-slate-400 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-550 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Simpan Pendaftaran
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. LOGGED IN PORTAL - SISWA CANDIDATE
  if (currentUser && currentUser.role === "siswa") {
    const siswa = currentUser.studentData!;
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-700 dark:text-slate-300 flex flex-col md:flex-row antialiased">
        
        {/* Student Sidebar */}
        <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-5 flex flex-col justify-between shrink-0 no-print">
          <div className="space-y-8">
            <div className="flex items-center gap-3 px-1.5 py-1">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-600/20">
                <User className="w-5 h-5 stroke-[2]" />
              </div>
              <div className="text-left">
                <h2 className="font-extrabold tracking-tight text-white text-sm truncate max-w-[130px]" title={siswa.nama}>
                  {siswa.nama}
                </h2>
                <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest leading-none mt-1.5">
                  PORTAL SISWA
                </p>
              </div>
            </div>

            <div className="h-[1px] bg-slate-800" />

            <nav className="space-y-1">
              <button
                onClick={() => setStudentTab("biodata")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
                  studentTab === "biodata"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/15"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <FileText className="w-4 h-4" />
                Lengkapi Biodata KK
              </button>

              <button
                onClick={() => setStudentTab("bukti")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
                  studentTab === "bukti"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/15"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Printer className="w-4 h-4" />
                Cetak Bukti & Status
              </button>
            </nav>
          </div>

          <div className="pt-8">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white font-bold text-xs transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-450" />
              Keluar Portal
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Header info bar */}
            <div className="flex justify-between items-center sm:flex-row flex-col gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm no-print">
              <div className="space-y-1 text-left w-full sm:w-auto">
                <span className="text-[10px] bg-indigo-550/10 text-indigo-500 font-extrabold uppercase px-2 py-0.5 rounded-full">
                  Status Berkas PPDB Anda
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                  Halo, {siswa.nama}!
                </h2>
                <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                  NISN: {siswa.nisn} | Email: {siswa.email}
                </p>
              </div>

              {/* Status Badge */}
              <div className="flex flex-col items-end shrink-0 w-full sm:w-auto">
                <div className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 ${
                  siswa.status === "Diverifikasi"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : siswa.status === "Ditolak"
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                }`}>
                  {siswa.status === "Diverifikasi" && <Check className="w-4 h-4 text-emerald-500" />}
                  {siswa.status === "Ditolak" && <XCircle className="w-4 h-4 text-rose-500" />}
                  {siswa.status === "Pending" && <Clock className="w-4 h-4 text-amber-500 animate-pulse" />}
                  {siswa.status === "Diverifikasi" ? "BERKAS DIVERIFIKASI" : siswa.status === "Ditolak" ? "BERKAS DITOLAK" : "MENUNGGU VERIFIKASI"}
                </div>
              </div>
            </div>

            {/* TAB 1: FORMULIR BIODATA */}
            {studentTab === "biodata" && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 no-print text-left">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600 font-semibold" />
                    Lengkapi Biodata Sesuai Alamat Kartu Keluarga & Sekolah Asal
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Pastikan informasi yang diunggah akurat untuk menghindari status pendaftaran ditolak oleh panitia verifikasi.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block pb-1">Nama Lengkap Siswa</label>
                    <input
                      type="text"
                      className="w-full px-3.5 py-2.5 border border-slate-250 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={bioFormData.nama}
                      onChange={(e) => setBioFormData({ ...bioFormData, nama: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block pb-1">Alamat Email</label>
                    <input
                      type="email"
                      className="w-full px-3.5 py-2.5 border border-slate-250 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                      value={bioFormData.email}
                      onChange={(e) => setBioFormData({ ...bioFormData, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block pb-1">NISN (Akademis ID)</label>
                    <input
                      type="text"
                      disabled
                      title="NISN tidak dapat dimodifikasi setelah pendaftaran."
                      className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-100 dark:bg-slate-900/50 text-slate-400 cursor-not-allowed font-mono"
                      value={siswa.nisn}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block pb-1">Asal Sekolah PPDB (SMP/MTs)</label>
                    <input
                      type="text"
                      placeholder="Contoh: SMP Negeri 1 Jakarta"
                      className="w-full px-3.5 py-2.5 border border-slate-250 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                      value={bioFormData.sekolah_asal || ""}
                      onChange={(e) => setBioFormData({ ...bioFormData, sekolah_asal: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block pb-1">NIK (Nomor Induk Kependudukan - 16 Digit)</label>
                    <input
                      type="text"
                      maxLength={16}
                      placeholder="Contoh: 3171012345678912"
                      className="w-full px-3.5 py-2.5 border border-slate-250 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                      value={bioFormData.nik || ""}
                      onChange={(e) => setBioFormData({ ...bioFormData, nik: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block pb-1">No. Kartu Keluarga (KK - 16 Digit)</label>
                    <input
                      type="text"
                      maxLength={16}
                      placeholder="Contoh: 3171011234567890"
                      className="w-full px-3.5 py-2.5 border border-slate-250 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                      value={bioFormData.no_kk || ""}
                      onChange={(e) => setBioFormData({ ...bioFormData, no_kk: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block pb-1">No. Handphone / WhatsApp Aktif</label>
                    <input
                      type="text"
                      placeholder="Contoh: 081234567890"
                      className="w-full px-3.5 py-2.5 border border-slate-250 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                      value={bioFormData.no_hp || ""}
                      onChange={(e) => setBioFormData({ ...bioFormData, no_hp: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block pb-1">Alamat Lengkap (Sesuai Kartu Keluarga)</label>
                    <textarea
                      rows={3}
                      placeholder="Masukkan nama jalan, RT/RW, nama kelurahan, nama kecamatan, kota/kabupaten, dan provinsi"
                      className="w-full px-3.5 py-2.5 border border-slate-250 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                      value={bioFormData.alamat_kk || ""}
                      onChange={(e) => setBioFormData({ ...bioFormData, alamat_kk: e.target.value })}
                    />
                  </div>

                  {/* SUB-SECTION ORANG TUA SESUAI KK */}
                  <div className="md:col-span-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
                    <div className="flex items-center gap-1.5 pb-1">
                      <Users className="w-5 h-5 text-indigo-500" />
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                          Biodata Orang Tua Siswa (Sesuai Kartu Keluarga)
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Isi rincian lengkap mengenai ayah kandung, ibu kandung, atau wali yang sah.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                      {/* CARD AYAH */}
                      <div className="p-4 border border-slate-200/80 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 space-y-3.5 text-left">
                        <span className="text-[10px] font-extrabold bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 px-2 py-0.5 rounded-full tracking-wider">
                          DATA AYAH KANDUNG
                        </span>
                        
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-400 block pb-0.5">Nama Lengkap Ayah</label>
                          <input
                            type="text"
                            placeholder="Nama sesuai KK"
                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 text-xs"
                            value={bioFormData.nama_ayah || ""}
                            onChange={(e) => setBioFormData({ ...bioFormData, nama_ayah: e.target.value })}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-400 block pb-0.5">NIK Ayah (16 Digit)</label>
                          <input
                            type="text"
                            maxLength={16}
                            placeholder="NIK Ayah sesuai KK"
                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 font-mono text-xs"
                            value={bioFormData.nik_ayah || ""}
                            onChange={(e) => setBioFormData({ ...bioFormData, nik_ayah: e.target.value })}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-400 block pb-0.5">Pekerjaan Ayah</label>
                          <input
                            type="text"
                            placeholder="Contoh: Wiraswasta, Karyawan Swasta"
                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 text-xs"
                            value={bioFormData.pekerjaan_ayah || ""}
                            onChange={(e) => setBioFormData({ ...bioFormData, pekerjaan_ayah: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* CARD IBU */}
                      <div className="p-4 border border-slate-200/80 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 space-y-3.5 text-left">
                        <span className="text-[10px] font-extrabold bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-400 px-2 py-0.5 rounded-full tracking-wider">
                          DATA IBU KANDUNG
                        </span>
                        
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-400 block pb-0.5">Nama Lengkap Ibu</label>
                          <input
                            type="text"
                            placeholder="Nama sesuai KK"
                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 text-xs"
                            value={bioFormData.nama_ibu || ""}
                            onChange={(e) => setBioFormData({ ...bioFormData, nama_ibu: e.target.value })}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-400 block pb-0.5">NIK Ibu (16 Digit)</label>
                          <input
                            type="text"
                            maxLength={16}
                            placeholder="NIK Ibu sesuai KK"
                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 font-mono text-xs"
                            value={bioFormData.nik_ibu || ""}
                            onChange={(e) => setBioFormData({ ...bioFormData, nik_ibu: e.target.value })}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-400 block pb-0.5">Pekerjaan Ibu</label>
                          <input
                            type="text"
                            placeholder="Contoh: Ibu Rumah Tangga, Guru"
                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 text-xs"
                            value={bioFormData.pekerjaan_ibu || ""}
                            onChange={(e) => setBioFormData({ ...bioFormData, pekerjaan_ibu: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* CARD WALI (OPSIONAL) */}
                      <div className="md:col-span-2 p-4 border border-slate-200/80 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 space-y-3 text-left">
                        <div className="flex justify-between items-center pb-1">
                          <span className="text-[10px] font-extrabold bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 px-2 py-0.5 rounded-full tracking-wider text-left">
                            DATA WALI (OPSIONAL)
                          </span>
                          <span className="text-[9px] text-slate-400">Diisi jika tinggal bersama wali yang sah</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-extrabold text-slate-400 block pb-0.5">Nama Lengkap Wali</label>
                            <input
                              type="text"
                              placeholder="Nama Wali (jika ada)"
                              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 text-xs"
                              value={bioFormData.nama_wali || ""}
                              onChange={(e) => setBioFormData({ ...bioFormData, nama_wali: e.target.value })}
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-extrabold text-slate-400 block pb-0.5">NIK Wali (16 Digit)</label>
                            <input
                              type="text"
                              maxLength={16}
                              placeholder="NIK Wali"
                              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 font-mono text-xs"
                              value={bioFormData.nik_wali || ""}
                              onChange={(e) => setBioFormData({ ...bioFormData, nik_wali: e.target.value })}
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-extrabold text-slate-400 block pb-0.5">Pekerjaan Wali</label>
                            <input
                              type="text"
                              placeholder="Pekerjaan Wali"
                              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 text-xs"
                              value={bioFormData.pekerjaan_wali || ""}
                              onChange={(e) => setBioFormData({ ...bioFormData, pekerjaan_wali: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>

                      {/* CARD PENGHASILAN GABUNGAN */}
                      <div className="md:col-span-2 p-4 border border-slate-200/80 dark:border-slate-800 rounded-2xl bg-indigo-50/10 dark:bg-indigo-950/10 space-y-2 text-left">
                        <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 block">
                          PENGHASILAN BULANAN ORANG TUA / GABUNGAN (SESUAI KK FISIK)
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-slate-250 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 text-xs"
                          value={bioFormData.penghasilan_ortu || ""}
                          onChange={(e) => setBioFormData({ ...bioFormData, penghasilan_ortu: e.target.value })}
                        >
                          <option value="">-- Pilih Penghasilan Bulanan --</option>
                          <option value="Kurang dari Rp 1.000.000">Kurang dari Rp 1.000.000</option>
                          <option value="Rp 1.000.000 - Rp 3.000.000">Rp 1.000.000 - Rp 3.000.000</option>
                          <option value="Rp 3.000.000 - Rp 5.000.000">Rp 3.000.000 - Rp 5.000.000</option>
                          <option value="Rp 5.000.000 - Rp 10.000.000">Rp 5.000.000 - Rp 10.000.000</option>
                          <option value="Lebih dari Rp 10.000.000">Lebih dari Rp 10.000.000</option>
                        </select>
                        <p className="text-[10px] text-slate-400 leading-normal">
                          💡 Informasi penghasilan gabungan diperlukan sebagai prasyarat pemeringkatan kuota khusus (terutama pada Jalur Ekonomi Afirmasi).
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={() => handleSaveBiodata(siswa.id, true)}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white rounded-xl shadow-lg shadow-blue-500/10 transition-all cursor-pointer"
                  >
                    Simpan Perubahan Biodata
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: CETAK SURAT BUKTI */}
            {studentTab === "bukti" && (
              <div className="space-y-6 text-left">
                
                {/* Print Control Bar */}
                <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm gap-2 flex-wrap no-print">
                  <div className="flex items-center gap-1">
                    <Printer className="w-5 h-5 text-indigo-500" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Menu Cetak & Ekspor Biodata Siswa:
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-550 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      Cetak Surat (PDF)
                    </button>

                    <button
                      onClick={() => exportAsTXT(siswa)}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      Ekspor TXT
                    </button>

                    <button
                      onClick={() => exportAsCSV(siswa)}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                    >
                      <FileText className="w-4 h-4" />
                      Ekspor CSV
                    </button>

                    <button
                      onClick={() => exportAsJSON(siswa)}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                    >
                      <span className="font-mono text-[10px] font-extrabold text-blue-500">{"{}"}</span>
                      Ekspor JSON
                    </button>
                  </div>
                </div>

                {/* Print area container */}
                <div className="bg-white text-slate-900 border-2 border-slate-350 dark:border-slate-700 p-8 rounded-2xl shadow-sm relative overflow-hidden" id="print-section">
                  {/* Kop Surat */}
                  <div className="text-center space-y-1.5 pb-5 border-b-4 border-slate-900">
                    <h2 className="font-extrabold text-[14px] sm:text-base tracking-tight leading-none text-slate-950 uppercase">
                      KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET, DAN TEKNOLOGI
                    </h2>
                    <h3 className="font-bold text-[12px] sm:text-[13px] text-slate-800 uppercase leading-none mt-1">
                      PANITIA PENERIMAAN PESERTA DIDIK BARU (PPDB) 2026
                    </h3>
                    <h4 className="font-semibold text-xs text-slate-500 lowercase underline leading-none mt-1">
                      http://ppdb.sekolah-nasional.sch.id | email: ppdb@kemdikbud.go.id
                    </h4>
                  </div>

                  <div className="text-center my-6 space-y-1">
                    <h1 className="text-sm sm:text-base font-extrabold text-slate-950 uppercase tracking-wide">
                      KARTU BUKTI PENDAFTARAN & REGISTRASI SISWA PPDB
                    </h1>
                    <p className="text-[11px] font-mono font-bold text-slate-500">
                      ID Registrasi Keabsahan Sistem: #REG-{String(siswa.id).padStart(4, "0")}
                    </p>
                  </div>

                  {/* Biodata info block of student */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 my-8 text-xs">
                    
                    {/* Left details */}
                    <div className="md:col-span-8">
                      <table className="w-full text-left text-slate-850">
                        <tbody>
                          <tr className="border-b border-slate-200 animate-in fade-in">
                            <td className="py-2.5 font-bold text-slate-500 w-[140px]">NAMA LENGKAP</td>
                            <td className="py-2.5 font-extrabold text-slate-950 uppercase">{siswa.nama}</td>
                          </tr>
                          <tr className="border-b border-slate-200">
                            <td className="py-2.5 font-bold text-slate-500">NISN (ACADEMIC ID)</td>
                            <td className="py-2.5 font-bold font-mono text-slate-900">{siswa.nisn}</td>
                          </tr>
                          <tr className="border-b border-slate-200">
                            <td className="py-2.5 font-bold text-slate-500">NIK (KTP SISWA)</td>
                            <td className="py-2.5 font-mono text-slate-900">{siswa.nik || "- Belum Dilengkapi -"}</td>
                          </tr>
                          <tr className="border-b border-slate-200">
                            <td className="py-2.5 font-bold text-slate-500">NO. KARTU KELUARGA</td>
                            <td className="py-2.5 font-mono text-slate-900">{siswa.no_kk || "- Belum Dilengkapi -"}</td>
                          </tr>
                          <tr className="border-b border-slate-200">
                            <td className="py-2.5 font-bold text-slate-500">SEKOLAH ASAL</td>
                            <td className="py-2.5 font-bold text-slate-900 text-[12px]">{siswa.sekolah_asal || "- Belum Dilengkapi -"}</td>
                          </tr>
                          <tr className="border-b border-slate-200">
                            <td className="py-2.5 font-bold text-slate-500">JALUR PENDAFTARAN</td>
                            <td className="py-3 font-extrabold text-indigo-600 uppercase">{siswa.jalur}</td>
                          </tr>
                          <tr className="border-b border-slate-200">
                            <td className="py-2.5 font-bold text-slate-500">ALAMAT DOMISILI (KK)</td>
                            <td className="py-2.5 text-slate-900 leading-relaxed font-semibold italic">{siswa.alamat_kk || "- Belum Dilengkapi -"}</td>
                          </tr>
                          <tr className="border-b border-slate-200">
                            <td className="py-2.5 font-bold text-slate-500">DOKUMEN EMAIL</td>
                            <td className="py-2.5 font-semibold text-slate-900">{siswa.email}</td>
                          </tr>
                          <tr className="border-b border-slate-200">
                            <td className="py-2.5 font-bold text-slate-500">KONTAK PONSEL / HP</td>
                            <td className="py-2.5 font-mono font-semibold text-slate-900">{siswa.no_hp || "- Belum Dilengkapi -"}</td>
                          </tr>
                          <tr className="border-b border-slate-200">
                            <td className="py-2.5 font-bold text-slate-500">TANGGAL SUBMIT</td>
                            <td className="py-2.5 text-slate-500 font-semibold">{siswa.tanggal}</td>
                          </tr>
                          <tr className="border-b border-slate-200">
                            <td className="py-2.5 font-bold text-slate-500">STATUS VALIDASI</td>
                            <td className="py-2.5">
                              <span className={`inline-block px-3 py-1 rounded font-extrabold ${
                                siswa.status === "Diverifikasi"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                  : siswa.status === "Ditolak"
                                  ? "bg-rose-100 text-rose-800 border border-rose-300"
                                  : "bg-amber-100 text-amber-800 border border-amber-300"
                              }`}>
                                {siswa.status.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Right PHOTO placeholder / signature box */}
                    <div className="md:col-span-4 flex flex-col justify-start items-center space-y-5 shrink-0">
                      {/* Photo Placeholder Box */}
                      <div className="w-[3cm] h-[4cm] border-2 border-dashed border-slate-400 bg-slate-50 flex flex-col items-center justify-center text-center p-3 text-[10px] text-slate-400 font-bold shrink-0">
                        FOTO 3 X 4<br />CALON SISWA
                      </div>

                      {/* Mock QR Code Seal of Authentication */}
                      <div className="border border-slate-350 p-2 bg-white rounded flex flex-col items-center shrink-0">
                        <div className="w-20 h-20 bg-slate-100 flex items-center justify-center relative overflow-hidden border border-slate-200">
                          <div className="grid grid-cols-4 gap-1 w-16 h-16 opacity-80">
                            <div className="bg-slate-900 rounded-xs" />
                            <div className="bg-slate-900 rounded-xs" />
                            <div className="bg-white rounded-xs" />
                            <div className="bg-slate-900 rounded-xs" />
                            <div className="bg-white rounded-xs" />
                            <div className="bg-slate-900 rounded-xs" />
                            <div className="bg-slate-900 rounded-xs" />
                            <div className="bg-white rounded-xs" />
                            <div className="bg-slate-900 rounded-xs" />
                            <div className="bg-white rounded-xs" />
                            <div className="bg-slate-900 rounded-xs" />
                            <div className="bg-slate-900 rounded-xs" />
                            <div className="bg-slate-900 rounded-xs" />
                            <div className="bg-slate-900 rounded-xs" />
                            <div className="bg-white rounded-xs" />
                            <div className="bg-slate-900 rounded-xs" />
                          </div>
                        </div>
                        <span className="text-[8px] font-mono text-slate-450 font-bold tracking-tight mt-1 uppercase">
                          VERIFIED PPDB SYSTEM
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Data Orang Tua di Kartu Cetak */}
                  <div className="my-6 pt-4 border-t border-slate-200 text-xs text-left">
                    <h4 className="font-extrabold text-slate-900 uppercase border-b border-slate-200 pb-1 mb-3 tracking-wide text-xs">
                      DATA ORANG TUA / WALI (SESUAI KARTU KELUARGA)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5">
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <span className="font-bold text-slate-500">NAMA AYAH KANDUNG</span>
                        <span className="font-semibold text-slate-950 uppercase">{siswa.nama_ayah || "-"}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <span className="font-bold text-slate-500">NAMA IBU KANDUNG</span>
                        <span className="font-semibold text-slate-950 uppercase">{siswa.nama_ibu || "-"}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <span className="font-bold text-slate-500">NIK AYAH</span>
                        <span className="font-mono text-slate-950">{siswa.nik_ayah || "-"}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <span className="font-bold text-slate-500">NIK IBU</span>
                        <span className="font-mono text-slate-950">{siswa.nik_ibu || "-"}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <span className="font-bold text-slate-500">PEKERJAAN AYAH</span>
                        <span className="font-semibold text-slate-900">{siswa.pekerjaan_ayah || "-"}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <span className="font-bold text-slate-500">PEKERJAAN IBU</span>
                        <span className="font-semibold text-slate-900">{siswa.pekerjaan_ibu || "-"}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <span className="font-bold text-slate-500">NAMA WALI</span>
                        <span className="font-semibold text-slate-900">{siswa.nama_wali ? `${siswa.nama_wali} (${siswa.pekerjaan_wali || "Tidak Ada Pekerjaan"})` : "-"}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <span className="font-bold text-slate-500">PENGHASILAN ORANG TUA</span>
                        <span className="font-extrabold text-slate-950 bg-indigo-50 px-1.5 py-0.5 rounded text-[11px]">{siswa.penghasilan_ortu || "- Belum Dilengkapi -"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Signatures */}
                  <div className="flex justify-between items-end text-xs text-slate-800 pt-10 border-t border-slate-200">
                    <div className="text-center space-y-12">
                      <p className="font-semibold text-slate-500 uppercase">Tanda Tangan Pendaftar,</p>
                      <div className="w-32 border-b border-slate-900 mx-auto" />
                      <p className="font-extrabold text-slate-950 uppercase">{siswa.nama}</p>
                    </div>

                    <div className="text-center space-y-12">
                      <p className="font-semibold text-slate-500 uppercase">Mengetahui, Ketua PPDB,</p>
                      <div className="w-32 border-b border-slate-900 mx-auto" />
                      <p className="font-extrabold text-slate-950 uppercase">Drs. H. Mulyono, M.Pd.</p>
                    </div>
                  </div>

                  {/* Footnote */}
                  <div className="text-center mt-12 text-[10px] text-slate-400 font-bold italic leading-normal border-t border-dashed border-slate-200 pt-3">
                    * Catatan: Cetak kartu bukti registrasi ini sebagai berkas fisik verifikasi di sekretariat panitia pada jadwal resmi sekolah tujuan.
                  </div>
                </div>

              </div>
            )}

          </div>
        </main>

        {/* Global Toast */}
        {notification && (
          <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200 text-left">
            <div className={`p-4 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 ${
              notification.type === "success" 
                ? "bg-slate-900 border-emerald-500/20 text-emerald-400" 
                : "bg-slate-900 border-rose-500/20 text-rose-400"
            }`}>
              <Info className="w-4 h-4 text-emerald-500" />
              {notification.message}
            </div>
          </div>
        )}

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-700 dark:text-slate-300 flex flex-col md:flex-row antialiased">
      
      {/* Sidebar (Kiri) */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-5 flex flex-col justify-between shrink-0">
        <div className="space-y-8">
          {/* Logo Brand */}
          <div className="flex items-center gap-3 px-1.5 py-1">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-600/20 overflow-hidden border border-slate-700/50 shrink-0">
              {schoolLogo && (schoolLogo.startsWith("http://") || schoolLogo.startsWith("https://") || schoolLogo.startsWith("data:image")) ? (
                <img src={schoolLogo} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <GraduationCap className="w-5 h-5 stroke-[2]" />
              )}
            </div>
            <div>
              <h2 className="font-extrabold tracking-tight text-white text-xs uppercase leading-none truncate max-w-[150px]">
                {schoolName}
              </h2>
              <p className="text-[9px] text-blue-400 font-bold uppercase tracking-widest leading-none mt-1.5">
                Admin Panel v1.0
              </p>
            </div>
          </div>

          <div className="h-[1px] bg-slate-800" />

          {/* Navigasi Utama */}
          <nav className="space-y-1">
            <button
              id="sidebar-link-dashboard"
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/15"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard Utama
            </button>

            <button
              id="sidebar-link-manajemen"
              onClick={() => setActiveTab("manajemen")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
                activeTab === "manajemen"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/15"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Users className="w-4 h-4" />
              Manajemen Siswa
            </button>

            <button
              id="sidebar-link-php-src"
              onClick={() => setActiveTab("php-src")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
                activeTab === "php-src"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/15"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Database className="w-4 h-4" />
              Kode PHP & MySQL
            </button>

            <button
              id="sidebar-link-pengaturan"
              onClick={() => setActiveTab("pengaturan")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
                activeTab === "pengaturan"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/15"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Settings className="w-4 h-4" />
              Pengaturan Sekolah
            </button>
          </nav>
        </div>

        {/* Database Quick Actions & State Control */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 space-y-4">
          <div className="bg-slate-800/40 border border-slate-800/80 p-3 rounded-xl text-center space-y-2">
            <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase block">
              Simulasi Database PPDB
            </span>
            <button
              id="btn-reset-db"
              onClick={resetDatabase}
              className="w-full py-2 px-3 border border-slate-700/60 hover:bg-slate-800 text-slate-300 font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition-colors duration-150 cursor-pointer"
              title="Kembalikan pendaftar ke bawaan contoh kueri MySQL"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Setel Ulang DB contoh
            </button>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-2 px-3 border border-rose-950/50 hover:bg-rose-950/35 text-rose-400 font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition-colors duration-150 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Keluar Panel Admin
          </button>
          <p className="text-[10px] text-center text-slate-500 font-medium pt-1">
            PPDB Admin Dashboard © 2026
          </p>
        </div>
      </aside>

      {/* Main Panel Content Container (Kanan) */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Header Sekunder (Atas) */}
        <header className="h-16 border-b border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 flex items-center justify-between z-10 sticky top-0">
          <div className="flex items-center gap-3 select-none">
            {/* Live Synchronizer Pulse Indicator badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/30 border border-blue-100/50 dark:border-blue-900/30 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 ${pollingActive ? "" : "hidden"}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${pollingActive ? "bg-emerald-500" : "bg-slate-350"}`}></span>
              </span>
              Auto polling: {pollingActive ? "Aktif" : "Mati"} (Fetch AJAX)
            </div>
            
            <button
              id="btn-toggle-polling"
              onClick={() => setPollingActive(!pollingActive)}
              className="text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              Tonton {pollingActive ? "Jeda" : "Mulai"}
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Generator action to demonstrate AJAX dynamic data loading */}
            <button
              id="btn-auto-register"
              onClick={triggerAutoRegister}
              className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg shadow-sm font-bold text-xs flex items-center gap-1.5 transition-all duration-150 hover:shadow-blue-500/10 hover:-translate-y-0.5"
              title="Tambahkan calon siswa acak menggunakan nama umum untuk melihat statistik real-time melonjak seketika"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-100" />
              Simulasikan Pendaftaran Acak
            </button>

            <button
              id="btn-manual-refresh"
              onClick={() => fetchStats(true)}
              disabled={refreshing}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-all duration-150"
              title="Segarkan data statistik"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-blue-500" : ""}`} />
            </button>

            <button
              id="btn-tambah-siswa"
              onClick={() => setShowAddModal(true)}
              className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors duration-150"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Daftar Baru
            </button>
          </div>
        </header>

        {/* Isian Halaman Utama */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-7xl w-full mx-auto">
          
          {/* Notification Toast */}
          {notification && (
            <div className={`p-4 rounded-xl border flex items-center gap-3 shadow-sm text-xs md:text-sm font-medium animate-in fade-in slide-in-from-top-3 duration-200 ${
              notification.type === "success" 
                ? "bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-300"
                : notification.type === "error"
                ? "bg-rose-50 border-rose-100 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-300"
                : "bg-amber-50 border-amber-100 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-300"
            }`}>
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{notification.message}</span>
            </div>
          )}

          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium text-slate-400">Menghubungkan ke API simulasi PPDB...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: DASHBOARD NYATA */}
              {activeTab === "dashboard" && stats && (
                <div className="space-y-6">
                  {/* Row 1: Banner Penjelasan Info */}
                  <div className="bg-gradient-to-r from-blue-500/10 via-slate-500/5 to-transparent border border-blue-500/15 p-5 rounded-2xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 text-sm md:text-base">
                        <Sparkles className="w-4 h-4 text-blue-500 animate-bounce" />
                        Aplikasi PPDB Admin Real-time
                      </h3>
                      <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                        Halaman ini merupakan representasi asinkron (Fetch API) dari dashboard PPDB admin. Anda dapat menyetujui, menolak, atau menambahkan pendaftar baru. Setiap aksi akan memperbarui grafik tren & sisa kuota secara kilat tanpa melakukan refresh seluruh layar browser!
                      </p>
                    </div>
                    <button
                      id="btn-learn-code"
                      onClick={() => setActiveTab("php-src")}
                      className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-xl transition-colors shrink-0 flex items-center gap-1.5"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      Baca Kode PHP
                    </button>
                  </div>

                  {/* Row 2: 4 Statistik Ringkasan Utama */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Total Siswa Terdaftar" value={stats.summary.total} type="total" />
                    <StatCard title="Berkas Diverifikasi" value={stats.summary.diverifikasi} type="diverifikasi" />
                    <StatCard title="Berkas Ditolak" value={stats.summary.ditolak} type="ditolak" />
                    <StatCard title="Sedang Diverifikasi" value={stats.summary.pending} type="pending" />
                  </div>

                  {/* Row 3: Grafik Tren & Sisa Kuota Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Line area tren chart */}
                    <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-sm min-h-[340px]">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">
                            Grafik Tren Pendaftaran Calon Siswa
                          </h3>
                          <span className="text-[10px] bg-blue-650/10 text-blue-600 dark:text-blue-400 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                            7 Hari Terakhir
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Menampilkan fluktuasi jumlah input entri data pendaftaran harian.
                        </p>
                      </div>

                      <div className="flex-1 min-h-[220px] mt-4">
                        <DailyTrendChart data={stats.tren} />
                      </div>
                    </div>

                    {/* Pathway quota status list */}
                    <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                      <div className="mb-4">
                        <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">
                          Sisa Kuota Pendaftaran
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          Detail sisa alokasi kuota per jalur (total dikurangi terverifikasi).
                        </p>
                      </div>

                      <div className="space-y-3.5 flex-1 overflow-y-auto">
                        {stats.jalur.map((quota) => (
                          <PathwayQuota key={quota.id} quota={quota} />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Row 4: 5 Pendaftar Terbaru Table */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <div>
                        <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">
                          5 Siswa Pendaftar Terbaru
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          Status kelengkapan dokumen siswa yang baru mendaftar di database.
                        </p>
                      </div>
                      <button
                        id="btn-all-students-view"
                        onClick={() => setActiveTab("manajemen")}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        Kelola Semua Siswa ({stats.summary.total})
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="overflow-x-auto border border-slate-50 dark:border-slate-800 rounded-xl">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                            <th className="p-3">No Registrasi</th>
                            <th className="p-3">Nama Lengkap</th>
                            <th className="p-3">NISN</th>
                            <th className="p-3">Jalur Pilihan</th>
                            <th className="p-3">Tanggal Unggah</th>
                            <th className="p-3 text-center">Status Berkas</th>
                            <th className="p-3 text-center">Tindakan Cepat</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {stats.pendaftar_terbaru.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                                Belum ada entri pendaftaran baru dalam database.
                              </td>
                            </tr>
                          ) : (
                            stats.pendaftar_terbaru.map((siswa) => {
                              return (
                                <tr key={siswa.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                                  <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                    #REG-{String(siswa.id).padStart(4, "0")}
                                  </td>
                                  <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                                    {siswa.nama}
                                  </td>
                                  <td className="p-3">
                                    <code className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 px-1.5 py-0.5 rounded text-[11px]">
                                      {siswa.nisn}
                                    </code>
                                  </td>
                                  <td className="p-3 text-slate-600 dark:text-slate-400">
                                    {siswa.jalur}
                                  </td>
                                  <td className="p-3 text-slate-400">
                                    {siswa.tanggal}
                                  </td>
                                  <td className="p-3 text-center">
                                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${
                                      siswa.status === "Diverifikasi"
                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                        : siswa.status === "Ditolak"
                                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                    }`}>
                                      {siswa.status}
                                    </span>
                                  </td>
                                  <td className="p-3">
                                    <div className="flex flex-col gap-1.5 items-center justify-center">
                                      {/* Status verification */}
                                      {siswa.status === "Pending" ? (
                                        <div className="flex items-center gap-1">
                                          <button
                                            id={`btn-approve-new-${siswa.id}`}
                                            onClick={() => handleUpdateStatus(siswa.id, "Diverifikasi")}
                                            className="px-2 py-1 rounded bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] transition-colors cursor-pointer"
                                          >
                                            Setuju
                                          </button>
                                          <button
                                            id={`btn-reject-new-${siswa.id}`}
                                            onClick={() => handleUpdateStatus(siswa.id, "Ditolak")}
                                            className="px-2 py-1 rounded bg-rose-500 hover:bg-rose-600 text-white font-bold text-[10px] transition-colors cursor-pointer"
                                          >
                                            Tolak
                                          </button>
                                        </div>
                                      ) : null}

                                      {/* Aux tools: Ubah Biodata, Print, and Export */}
                                      <div className="flex items-center gap-1 text-[9px]">
                                        <button
                                          onClick={() => {
                                            setSelectedStudentForBio(siswa);
                                            setBioFormData({
                                              nama: siswa.nama,
                                              email: siswa.email,
                                              alamat_kk: siswa.alamat_kk || "",
                                              sekolah_asal: siswa.sekolah_asal || "",
                                              nik: siswa.nik || "",
                                              no_kk: siswa.no_kk || "",
                                              no_hp: siswa.no_hp || ""
                                            });
                                          }}
                                          title="Ubah Biodata & Alamat KK"
                                          className="px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors cursor-pointer"
                                        >
                                          Biodata
                                        </button>
                                        <button
                                          onClick={() => {
                                            setSelectedStudentForBio(siswa);
                                            setTimeout(() => window.print(), 200);
                                          }}
                                          title="Cetak Berkas Pendaftaran Siswa"
                                          className="px-1.5 py-0.5 rounded border border-indigo-200 bg-indigo-50 text-indigo-600 font-bold hover:bg-indigo-100 dark:bg-indigo-950/30 dark:border-indigo-900/50 dark:text-indigo-400 transition-colors cursor-pointer"
                                        >
                                          Cetak
                                        </button>
                                        <button
                                          onClick={() => exportAsJSON(siswa)}
                                          title="Ekspor Biodata Calon Siswa (JSON)"
                                          className="px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-600 font-bold hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                                        >
                                          JSON
                                        </button>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: MANAJEMEN SISWA LENGKAP */}
              {activeTab === "manajemen" && stats && (
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
                  
                  <div className="flex justify-between items-start flex-wrap gap-4 border-b border-slate-100 dark:border-slate-850 pb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        Manajemen Lengkap Calon Siswa Baru ({filteredStudents.length} siswa)
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Tabel pencarian, penyaringan, dan verifikasi berkas keseluruhan pendaftar.
                      </p>
                    </div>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="input-search-siswa"
                        type="text"
                        placeholder="Cari siswa berdasarkan nama atau NISN secara instan..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setFilterStatus("All")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          filterStatus === "All"
                            ? "bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-slate-900 dark:border-white"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        Semua Status
                      </button>
                      <button
                        onClick={() => setFilterStatus("Pending")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          filterStatus === "Pending"
                            ? "bg-amber-500 text-white border-amber-500"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        Sedang Diverifikasi
                      </button>
                      <button
                        onClick={() => setFilterStatus("Diverifikasi")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          filterStatus === "Diverifikasi"
                            ? "bg-emerald-500 text-white border-emerald-500"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        Diverifikasi
                      </button>
                      <button
                        onClick={() => setFilterStatus("Ditolak")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          filterStatus === "Ditolak"
                            ? "bg-rose-500 text-white border-rose-500"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        Ditolak
                      </button>
                    </div>
                  </div>

                  {/* Main List Table */}
                  <div className="overflow-x-auto border border-slate-100 dark:border-slate-850 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                          <th className="p-4">Reg ID</th>
                          <th className="p-4">Nama Lengkap</th>
                          <th className="p-4">NISN</th>
                          <th className="p-4">Alamat Email</th>
                          <th className="p-4">Jalur</th>
                          <th className="p-4">Tanggal Daftar</th>
                          <th className="p-4 text-center">Status</th>
                          <th className="p-4 text-center">Tindakan Editor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredStudents.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-12 text-center text-slate-400 font-medium">
                              Tidak ada siswa yang cocok dengan kriteria filter pendaftaran.
                            </td>
                          </tr>
                        ) : (
                          filteredStudents.map((siswa) => (
                            <tr key={siswa.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/10">
                              <td className="p-4 font-mono font-bold text-slate-500">
                                #REG-{String(siswa.id).padStart(4, "0")}
                              </td>
                              <td className="p-4 font-bold text-slate-800 dark:text-slate-100">
                                {siswa.nama}
                              </td>
                              <td className="p-4">
                                <code className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-1 rounded font-mono text-[11px]">
                                  {siswa.nisn}
                                </code>
                              </td>
                              <td className="p-4 text-slate-500 text-[11px]">
                                {siswa.email || "-"}
                              </td>
                              <td className="p-4">
                                {siswa.jalur}
                              </td>
                              <td className="p-4 text-slate-400">
                                {siswa.tanggal}
                              </td>
                              <td className="p-4 text-center">
                                <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${
                                  siswa.status === "Diverifikasi"
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                    : siswa.status === "Ditolak"
                                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                }`}>
                                  {siswa.status}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="flex flex-col gap-1.5 items-center justify-center">
                                  {/* Status Controls */}
                                  <div className="flex items-center gap-1">
                                    {siswa.status === "Pending" ? (
                                      <>
                                        <button
                                          id={`btn-approve-log-${siswa.id}`}
                                          onClick={() => handleUpdateStatus(siswa.id, "Diverifikasi")}
                                          className="px-2 py-1 rounded bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] transition-colors cursor-pointer"
                                        >
                                          Setuju
                                        </button>
                                        <button
                                          id={`btn-reject-log-${siswa.id}`}
                                          onClick={() => handleUpdateStatus(siswa.id, "Ditolak")}
                                          className="px-2 py-1 rounded bg-rose-500 hover:bg-rose-600 text-white font-bold text-[10px] transition-colors cursor-pointer"
                                        >
                                          Tolak
                                        </button>
                                      </>
                                    ) : (
                                      <button
                                        id={`btn-reset-status-${siswa.id}`}
                                        onClick={() => handleUpdateStatus(siswa.id, "Pending")}
                                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded font-bold text-[10px] transition-colors cursor-pointer"
                                        title="Kembalikan status ke Pending"
                                      >
                                        Buka Kunci
                                      </button>
                                    )}
                                  </div>

                                  {/* Utilities Row: Edit, Cetak, and Export */}
                                  <div className="flex items-center gap-1 text-[9px]">
                                    <button
                                      onClick={() => {
                                        setSelectedStudentForBio(siswa);
                                        setBioFormData({
                                          nama: siswa.nama,
                                          email: siswa.email,
                                          alamat_kk: siswa.alamat_kk || "",
                                          sekolah_asal: siswa.sekolah_asal || "",
                                          nik: siswa.nik || "",
                                          no_kk: siswa.no_kk || "",
                                          no_hp: siswa.no_hp || ""
                                        });
                                      }}
                                      title="Lengkapi & Ubah Biodata"
                                      className="px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors cursor-pointer"
                                    >
                                      Biodata
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedStudentForBio(siswa);
                                        setTimeout(() => window.print(), 200);
                                      }}
                                      title="Cetak Kelulusan / Bukti Registrasi"
                                      className="px-1.5 py-0.5 rounded border border-indigo-200 bg-indigo-50 text-indigo-600 font-bold hover:bg-indigo-100 dark:bg-indigo-950/30 dark:border-indigo-900/50 dark:text-indigo-400 transition-colors cursor-pointer"
                                    >
                                      Cetak
                                    </button>
                                    <button
                                      onClick={() => exportAsJSON(siswa)}
                                      title="Ekspor Data JSON"
                                      className="px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-600 font-bold hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                                    >
                                      JSON
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: SOURCE CODE EXPLORER */}
              {activeTab === "php-src" && (
                <div className="space-y-6">
                  {/* Banner Info Tab */}
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between text-white gap-4 flex-wrap">
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-sm text-emerald-400 flex items-center gap-1.5">
                        <Database className="w-4 h-4" />
                        Kode Sumber PHP Native & Skema Database MySQL
                      </h4>
                      <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                        Di tab ini, Panitia dapat mengunduh secara langsung file backend PHP yang aman dari SQL Injection (menggunakan driver MySQLi dengan <code className="font-mono text-emerald-300">Prepared Statements</code>) untuk di-deploy ke XAMPP atau web hosting.
                      </p>
                    </div>
                  </div>

                  {/* High Fidelity file tab viewer */}
                  <CodeViewer />

                  {/* Petunjuk instalasi lokal */}
                  <InstructionPanel />
                </div>
              )}

              {/* TAB 4: PENGATURAN SEKOLAH */}
              {activeTab === "pengaturan" && (
                <div className="space-y-6 text-left">
                  {/* Top custom headers */}
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between text-white gap-4 flex-wrap">
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-sm text-indigo-400 flex items-center gap-1.5">
                        <Settings className="w-4 h-4" />
                        Pengaturan Nama & Logo Instansi Sekolah
                      </h4>
                      <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                        Modifikasi identitas instansi sekolah penyelenggara PPDB secara terpadu di Admin Panel. Perubahan nama dan logo instansi akan langsung merefleksikan tampilan visual di halaman login login portal utama, kop cetak dokumen bukti pendaftaran, serta lencana panel panitia.
                      </p>
                    </div>
                  </div>

                  {/* Settings Dual Columns Card Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Input configuration form (cols-2) */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
                      <h5 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                        <Edit2 className="w-4 h-4 text-indigo-505" />
                        Formulir Ubah Identitas Instansi
                      </h5>

                      <div className="space-y-4 text-xs">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                            Nama Sekolah / Instansi Penyelenggara:
                          </label>
                          <input
                            type="text"
                            placeholder="Contoh: SMP Negeri 1 Jakarta"
                            className="w-full px-3.5 py-2.5 border border-slate-250 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 font-bold"
                            value={schoolNameInput}
                            onChange={(e) => setSchoolNameInput(e.target.value)}
                          />
                          <p className="text-[10px] text-slate-450 leading-normal">
                            Nama lengkap ini akan tertulis tebal di kop surat bukti cetak maupun tulisan selamat datang di login utama pendaftaran.
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                            URL Gambar Logo Sekolah / Lencana Instansi:
                          </label>
                          <input
                            type="text"
                            placeholder="Masukkan link URL gambar atau path logo"
                            className="w-full px-3.5 py-2.5 border border-slate-250 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 font-mono text-xs"
                            value={schoolLogoInput}
                            onChange={(e) => setSchoolLogoInput(e.target.value)}
                          />
                          <p className="text-[10px] text-slate-450 leading-normal">
                            Masukkan URL gambar yang valid (dimulai dengan <code className="font-mono text-[9px]">https://</code> atau <code className="font-mono text-[9px]">data:image...</code>). Pastikan gambar berbentuk rasio simetris persegi (1:1) berkualitas ikon atau logo transparan.
                          </p>
                        </div>
                      </div>

                      {/* Preset Options to help test */}
                      <div className="pt-3 space-y-2">
                        <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">
                          Pilihan Cepat Templat (Preset Contoh):
                        </span>
                        
                        <div className="flex gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              setSchoolNameInput("SMP Negeri 1 Jakarta");
                              setSchoolLogoInput("https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=150&auto=format&fit=crop&q=80");
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-755 text-slate-700 dark:text-slate-300 font-bold text-[10px] transition-all cursor-pointer"
                          >
                            Preses 1: SMPN 1 Jakarta
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSchoolNameInput("SMA Taruna Nusantara Magelang");
                              setSchoolLogoInput("https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=150&auto=format&fit=crop&q=80");
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-755 text-slate-700 dark:text-slate-300 font-bold text-[10px] transition-all cursor-pointer"
                          >
                            Preset 2: SMA Taruna Nusantara
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSchoolNameInput("SD Nasional Plus Jakarta - Boarding");
                              setSchoolLogoInput("https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150&auto=format&fit=crop&q=80");
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-755 text-slate-700 dark:text-slate-300 font-bold text-[10px] transition-all cursor-pointer"
                          >
                            Preset 3: SD Nasional Plus
                          </button>
                        </div>
                      </div>

                      {/* Action Commit Buttons */}
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSchoolNameInput(schoolName);
                            setSchoolLogoInput(schoolLogo);
                          }}
                          className="px-4 py-2 bg-slate-100 dark:bg-slate-805 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                        >
                          Batal / Reset Input
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateSchoolSettings(schoolNameInput, schoolLogoInput)}
                          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/10 transition-all cursor-pointer"
                        >
                          Simpan Perubahan Identitas
                        </button>
                      </div>
                    </div>

                    {/* Branding Preview Component Panel (col-1) */}
                    <div className="bg-slate-55/60 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-5">
                      <div>
                        <h5 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-indigo-505" />
                          Pratinjau Live Hasil Konfigurasi
                        </h5>
                        <p className="text-[11px] text-slate-400 mt-2">
                          Berikut adalah pratinjau instan bagaimana sekolah Anda ditampilkan pada halaman otentikasi pendaftar:
                        </p>
                      </div>

                      {/* Mini Preview Box */}
                      <div className="p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col items-center justify-center text-center space-y-3 py-8">
                        {/* Logo Preview box */}
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/10 overflow-hidden border border-slate-200 dark:border-slate-800">
                          {schoolLogoInput && (schoolLogoInput.startsWith("http://") || schoolLogoInput.startsWith("https://") || schoolLogoInput.startsWith("data:image")) ? (
                            <img src={schoolLogoInput} alt="Preview Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <GraduationCap className="w-6 h-6" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <h6 className="text-[14px] font-black text-slate-900 dark:text-white uppercase leading-tight tracking-tight">
                            {schoolNameInput || "(Belum Menginputkan Nama)"}
                          </h6>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest leading-none font-bold pt-1">
                            PANITIA PPDB RESMI
                          </p>
                        </div>
                      </div>

                      {/* Helpful Guidelines */}
                      <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-105/10 rounded-xl space-y-1">
                        <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 block uppercase tracking-wide">
                          Panduan Logo Sukses & Ramah Cetak
                        </span>
                        <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-normal">
                          Apabila Panitia akan mengunggah berkas logo khusus ke internet, gunakan web hosting gambar gratis rahasia atau salin link publiknya ke isian di sebelah kiri untuk menampilkan lambang resmi sekolah.
                        </p>
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* MODAL REGISTRASI MANUAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl max-w-md w-full animate-in zoom-in-95 duration-150">
            <div className="bg-slate-950 px-6 py-4 flex items-center justify-between border-b border-slate-900">
              <div className="flex items-center gap-2 text-white">
                <UserPlus className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-sm">Registrasi Calon Siswa Baru</h3>
              </div>
              <button
                id="btn-close-modal"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
                  Nama Lengkap Calon Siswa
                </label>
                <input
                  id="form-input-name"
                  type="text"
                  placeholder="Contoh: Muhammad Akhyar"
                  required
                  value={formData.nama_lengkap}
                  onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
                  NISN (Nomor Induk Siswa Nasional) - Harus 10 Digit
                </label>
                <input
                  id="form-input-nisn"
                  type="text"
                  maxLength={10}
                  minLength={10}
                  placeholder="Contoh: 0045617281"
                  required
                  value={formData.nisn}
                  onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
                <span className="text-[10px] text-slate-400 leading-none">
                  Pastikan NISN unik & bernilai tepat 10 digit angka asli.
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
                  Alamat Email Aktif
                </label>
                <input
                  id="form-input-email"
                  type="email"
                  placeholder="Contoh: akhyar@gmail.com"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
                  Pilih Jalur Pendaftaran PPDB
                </label>
                <select
                  id="form-select-jalur"
                  required
                  value={formData.jalur_id}
                  onChange={(e) => setFormData({ ...formData, jalur_id: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value="1">Zonasi (Tersedia Kuota)</option>
                  <option value="2">Afirmasi (Keluarga Prasejahtera)</option>
                  <option value="3">Prestasi (Akademis/Non-Akademis)</option>
                  <option value="4">Perpindahan Orang Tua (Pindahan Dinas)</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 bg-slate-50 dark:bg-slate-900 -mx-6 -mb-6 p-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 text-slate-600 dark:text-slate-400 font-bold text-xs rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 font-bold text-xs text-white rounded-xl shadow-md shadow-emerald-500/10 transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Simpan Pendaftaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. FLOATING ADMIN BIODATA VERIFICATION/EDIT MODAL */}
      {selectedStudentForBio && currentUser?.role === "admin" && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl overflow-hidden shadow-xl max-w-lg w-full animate-in zoom-in-95 duration-155">
            <div className="bg-slate-50 dark:bg-slate-950 px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                <div className="text-left">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Verifikasi & Edit Biodata Calon Siswa</h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: #REG-{String(selectedStudentForBio.id).padStart(4, "0")} | NISN: {selectedStudentForBio.nisn}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentForBio(null)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveBiodata(selectedStudentForBio.id, false);
              }}
              className="p-6 space-y-4 text-xs max-h-[70vh] overflow-y-auto"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 md:col-span-2 text-left">
                  <label className="text-[11px] font-bold text-slate-500 block pb-1">Nama Lengkap Siswa</label>
                  <input
                    type="text"
                    required
                    value={bioFormData.nama}
                    onChange={(e) => setBioFormData({ ...bioFormData, nama: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1 block text-left">
                  <label className="text-[11px] font-bold text-slate-500 block pb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={bioFormData.email}
                    onChange={(e) => setBioFormData({ ...bioFormData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1 block text-left">
                  <label className="text-[11px] font-bold text-slate-500 block pb-1">Sekolah Asal (SMP)</label>
                  <input
                    type="text"
                    placeholder="Alun-Alun SMP..."
                    value={bioFormData.sekolah_asal || ""}
                    onChange={(e) => setBioFormData({ ...bioFormData, sekolah_asal: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1 block text-left">
                  <label className="text-[11px] font-bold text-slate-500 block pb-1">Nomor Induk Kependudukan (NIK)</label>
                  <input
                    type="text"
                    maxLength={16}
                    placeholder="16 digit NIK"
                    value={bioFormData.nik || ""}
                    onChange={(e) => setBioFormData({ ...bioFormData, nik: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="space-y-1 block text-left">
                  <label className="text-[11px] font-bold text-slate-500 block pb-1">Nomor Kartu Keluarga (KK)</label>
                  <input
                    type="text"
                    maxLength={16}
                    placeholder="16 digit No KK"
                    value={bioFormData.no_kk || ""}
                    onChange={(e) => setBioFormData({ ...bioFormData, no_kk: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="space-y-1 md:col-span-2 text-left font-mono">
                  <label className="text-[11px] font-bold text-slate-500 block pb-1 font-sans">No. Handphone Pendaftar</label>
                  <input
                    type="text"
                    placeholder="Contoh: 081234567890"
                    value={bioFormData.no_hp || ""}
                    onChange={(e) => setBioFormData({ ...bioFormData, no_hp: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="space-y-1 md:col-span-2 text-left">
                  <label className="text-[11px] font-bold text-slate-500 block pb-1">Alamat Domisili Tetap (Sesuai Kartu Keluarga)</label>
                  <textarea
                    rows={3}
                    placeholder="Masukkan jalan kelurahan kecamatan sesuai KK fisik..."
                    value={bioFormData.alamat_kk || ""}
                    onChange={(e) => setBioFormData({ ...bioFormData, alamat_kk: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-white leading-relaxed"
                  />
                </div>

                {/* PARENT DETAILS BIODATA - ADMIN EDITOR SECTION */}
                <div className="md:col-span-2 border-t border-slate-100 dark:border-slate-850 pt-4 mt-2 space-y-3">
                  <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-450 uppercase tracking-widest block text-left">
                    Biodata Orang Tua Kandung & Penerimaan (Sesuai KK)
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 py-1">
                    {/* AYAH */}
                    <div className="p-3 border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/20 rounded-xl space-y-2.5 text-left">
                      <span className="text-[9px] font-black tracking-wide text-slate-400 block uppercase">DETAIL AYAH</span>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 block">Nama Ayah</label>
                        <input
                          type="text"
                          value={bioFormData.nama_ayah || ""}
                          onChange={(e) => setBioFormData({ ...bioFormData, nama_ayah: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 block">NIK Ayah (16 Digit)</label>
                        <input
                          type="text"
                          maxLength={16}
                          value={bioFormData.nik_ayah || ""}
                          onChange={(e) => setBioFormData({ ...bioFormData, nik_ayah: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 font-mono text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 block">Pekerjaan Ayah</label>
                        <input
                          type="text"
                          value={bioFormData.pekerjaan_ayah || ""}
                          onChange={(e) => setBioFormData({ ...bioFormData, pekerjaan_ayah: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-xs"
                        />
                      </div>
                    </div>

                    {/* IBU */}
                    <div className="p-3 border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/20 rounded-xl space-y-2.5 text-left">
                      <span className="text-[9px] font-black tracking-wide text-slate-400 block uppercase">DETAIL IBU</span>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 block">Nama Ibu</label>
                        <input
                          type="text"
                          value={bioFormData.nama_ibu || ""}
                          onChange={(e) => setBioFormData({ ...bioFormData, nama_ibu: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 block">NIK Ibu (16 Digit)</label>
                        <input
                          type="text"
                          maxLength={16}
                          value={bioFormData.nik_ibu || ""}
                          onChange={(e) => setBioFormData({ ...bioFormData, nik_ibu: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 font-mono text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 block">Pekerjaan Ibu</label>
                        <input
                          type="text"
                          value={bioFormData.pekerjaan_ibu || ""}
                          onChange={(e) => setBioFormData({ ...bioFormData, pekerjaan_ibu: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-xs"
                        />
                      </div>
                    </div>

                    {/* WALI */}
                    <div className="md:col-span-2 p-3 border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/20 rounded-xl space-y-2 text-left">
                      <span className="text-[9px] font-black tracking-wide text-slate-400 block uppercase">DETAIL WALI (OPSIONAL)</span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pb-1">
                        <div>
                          <label className="text-[8px] font-bold text-slate-550 block mb-0.5">Nama Wali</label>
                          <input
                            type="text"
                            value={bioFormData.nama_wali || ""}
                            onChange={(e) => setBioFormData({ ...bioFormData, nama_wali: e.target.value })}
                            className="w-full px-2 py-1 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[8px] font-bold text-slate-550 block mb-0.5">NIK Wali</label>
                          <input
                            type="text"
                            maxLength={16}
                            value={bioFormData.nik_wali || ""}
                            onChange={(e) => setBioFormData({ ...bioFormData, nik_wali: e.target.value })}
                            className="w-full px-2 py-1 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[8px] font-bold text-slate-550 block mb-0.5">Pekerjaan Wali</label>
                          <input
                            type="text"
                            value={bioFormData.pekerjaan_wali || ""}
                            onChange={(e) => setBioFormData({ ...bioFormData, pekerjaan_wali: e.target.value })}
                            className="w-full px-2 py-1 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* PENGHASILAN ORANG TUA */}
                    <div className="md:col-span-2 p-3 border border-indigo-100 dark:border-indigo-950/30 bg-indigo-50/10 dark:bg-indigo-950/10 rounded-xl space-y-1 text-left">
                      <label className="text-[9px] font-bold text-slate-500 block">PENGHASILAN GABUNGAN BULANAN (SESUAI KK FISIK):</label>
                      <select
                        className="w-full p-2 border border-slate-250 dark:border-slate-800 rounded bg-white dark:bg-slate-950 text-xs text-slate-850 dark:text-white"
                        value={bioFormData.penghasilan_ortu || ""}
                        onChange={(e) => setBioFormData({ ...bioFormData, penghasilan_ortu: e.target.value })}
                      >
                        <option value="">-- Pilih Penghasilan Bulanan --</option>
                        <option value="Kurang dari Rp 1.000.000">Kurang dari Rp 1.000.000</option>
                        <option value="Rp 1.000.000 - Rp 3.000.000">Rp 1.000.000 - Rp 3.000.000</option>
                        <option value="Rp 3.000.000 - Rp 5.000.000">Rp 3.000.000 - Rp 5.000.000</option>
                        <option value="Rp 5.000.000 - Rp 10.000.000">Rp 5.000.000 - Rp 10.000.000</option>
                        <option value="Lebih dari Rp 10.000.000">Lebih dari Rp 10.000.000</option>
                      </select>
                    </div>

                  </div>
                </div>
              </div>

              {/* Action tools inside modal */}
              <div className="pt-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setTimeout(() => window.print(), 200);
                    }}
                    className="px-3.5 py-2 border border-slate-250 hover:bg-slate-50 text-indigo-600 font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1 dark:border-slate-805 dark:hover:bg-slate-950 text-[10px]"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Cetak
                  </button>
                  <button
                    type="button"
                    onClick={() => exportAsJSON(selectedStudentForBio)}
                    className="px-3.5 py-2 border border-slate-250 hover:bg-slate-50 text-slate-600 font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1 dark:border-slate-805 dark:hover:bg-slate-950 dark:text-slate-350 text-[10px]"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-555" />
                    JSON
                  </button>
                </div>

                <div className="flex gap-2 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setSelectedStudentForBio(null)}
                    className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 font-bold rounded-xl cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-550 text-white font-bold rounded-xl shadow-lg shadow-blue-500/15 cursor-pointer"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hidden layout section loaded specifically on print request */}
      {selectedStudentForBio && currentUser?.role === "admin" && (
        <div className="absolute top-[9999px] left-[9999px] hidden print:block text-slate-950 bg-white" id="print-section-hidden">
          <div className="p-8 text-xs font-sans w-full leading-normal">
            
            <div className="text-center space-y-1.5 pb-5 border-b-4 border-slate-900">
              <h2 className="font-extrabold text-sm uppercase">KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET, DAN TEKNOLOGI</h2>
              <h3 className="font-bold text-xs uppercase">PANITIA PENERIMAAN PESERTA DIDIK BARU (PPDB) 2026</h3>
              <p className="text-[10px] text-slate-500">http://ppdb.sekolah-nasional.sch.id | email: ppdb@kemdikbud.go.id</p>
            </div>

            <div className="text-center my-6">
              <h1 className="text-sm font-extrabold uppercase">KARTU VERIFIKASI SELEKSI & BERKAS KEABSAHAN PPDB</h1>
              <p className="text-[10px] font-mono font-bold text-slate-500">ID Registrasi Keabsahan Sistem: #REG-{String(selectedStudentForBio.id).padStart(4, "0")}</p>
            </div>

            <div className="grid grid-cols-12 gap-4 my-6">
              <div className="col-span-8">
                <table className="w-full text-left">
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="py-2.5 font-bold w-[140px]">NAMA LENGKAP</td>
                      <td className="py-2.5 font-extrabold uppercase">{selectedStudentForBio.nama}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-2.5 font-bold">NISN (ACADEMIC ID)</td>
                      <td className="py-2.5 font-mono">{selectedStudentForBio.nisn}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-2.5 font-bold">NIK (KTP SISWA)</td>
                      <td className="py-2.5 font-mono">{selectedStudentForBio.nik || "- Belum Dilengkapi -"}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-2.5 font-bold">NO. KARTU KELUARGA</td>
                      <td className="py-2.5 font-mono">{selectedStudentForBio.no_kk || "- Belum Dilengkapi -"}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-2.5 font-bold">SEKOLAH ASAL</td>
                      <td className="py-2.5 font-bold">{selectedStudentForBio.sekolah_asal || "- Belum Dilengkapi -"}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-2.5 font-bold">JALUR PENDAFTARAN</td>
                      <td className="py-2.5 font-extrabold text-blue-600 uppercase">{selectedStudentForBio.jalur}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-2.5 font-bold">ALAMAT DOMISILI (KK)</td>
                      <td className="py-2.5 italic">{selectedStudentForBio.alamat_kk || "- Belum Dilengkapi -"}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-2.5 font-bold">DOKUMEN EMAIL</td>
                      <td className="py-2.5">{selectedStudentForBio.email}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-2.5 font-bold">KONTAK PONSEL / HP</td>
                      <td className="py-2.5 font-mono">{selectedStudentForBio.no_hp || "- Belum Dilengkapi -"}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-2.5 font-bold">TANGGAL SUBMIT</td>
                      <td className="py-2.5">{selectedStudentForBio.tanggal}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="col-span-4 flex flex-col items-center justify-start space-y-4 pt-4">
                <div className="w-[3cm] h-[4cm] border-2 border-dashed border-slate-400 bg-slate-50 flex flex-col items-center justify-center text-center p-3 text-[10px] text-slate-400 font-bold shrink-0">
                  FOTO 3 X 4<br />CALON SISWA
                </div>
                <div className="border border-slate-350 p-2 bg-white rounded flex flex-col items-center shrink-0 w-20">
                  <div className="w-14 h-14 bg-slate-100 flex items-center justify-center relative overflow-hidden border border-slate-200">
                    <div className="grid grid-cols-4 gap-1 w-12 h-12 opacity-80">
                      <div className="bg-slate-900 rounded-xs" />
                      <div className="bg-slate-905 rounded-xs" />
                      <div className="bg-white rounded-xs" />
                      <div className="bg-slate-900 rounded-xs" />
                      <div className="bg-white rounded-xs" />
                      <div className="bg-slate-900 rounded-xs" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Orang Tua di Kartu Cetak Admin */}
            <div className="my-6 pt-4 border-t border-slate-200 text-xs text-left">
              <h4 className="font-extrabold text-slate-900 uppercase border-b border-slate-200 pb-1 mb-3 tracking-wide text-xs">
                DATA ORANG TUA / WALI (SESUAI KARTU KELUARGA)
              </h4>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2.5">
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="font-bold text-slate-500">NAMA AYAH KANDUNG</span>
                  <span className="font-semibold text-slate-950 uppercase">{selectedStudentForBio.nama_ayah || "-"}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="font-bold text-slate-500">NAMA IBU KANDUNG</span>
                  <span className="font-semibold text-slate-950 uppercase">{selectedStudentForBio.nama_ibu || "-"}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="font-bold text-slate-500">NIK AYAH</span>
                  <span className="font-mono text-slate-950">{selectedStudentForBio.nik_ayah || "-"}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="font-bold text-slate-500">NIK IBU</span>
                  <span className="font-mono text-slate-950">{selectedStudentForBio.nik_ibu || "-"}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="font-bold text-slate-500">PEKERJAAN AYAH</span>
                  <span className="font-semibold text-slate-900">{selectedStudentForBio.pekerjaan_ayah || "-"}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="font-bold text-slate-500">PEKERJAAN IBU</span>
                  <span className="font-semibold text-slate-900">{selectedStudentForBio.pekerjaan_ibu || "-"}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="font-bold text-slate-500">NAMA & PEKERJAAN WALI</span>
                  <span className="font-semibold text-slate-900">{selectedStudentForBio.nama_wali ? `${selectedStudentForBio.nama_wali} (${selectedStudentForBio.pekerjaan_wali || "-"})` : "-"}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="font-bold text-slate-500">PENGHASILAN ORANG TUA</span>
                  <span className="font-extrabold text-slate-950 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">{selectedStudentForBio.penghasilan_ortu || "- Belum Dilengkapi -"}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-end text-xs pt-10 border-t border-slate-200">
              <div className="text-center space-y-12">
                <p className="font-semibold text-slate-500">Tanda Tangan Pendaftar,</p>
                <div className="w-32 border-b border-slate-900 mx-auto" />
                <p className="font-extrabold uppercase">{selectedStudentForBio.nama}</p>
              </div>

              <div className="text-center space-y-12">
                <p className="font-semibold text-slate-500">Mengetahui, Ketua PPDB,</p>
                <div className="w-32 border-b border-slate-900 mx-auto" />
                <p className="font-extrabold uppercase">Drs. H. Mulyono, M.Pd.</p>
              </div>
            </div>

            <p className="text-center mt-12 text-[10px] text-slate-400 font-bold italic border-t border-dashed border-slate-200 pt-3">
              * Cetak kartu bukti registrasi ini sebagai berkas fisik verifikasi di sekretariat panitia pada jadwal resmi sekolah tujuan.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
