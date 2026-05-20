export interface SourceFile {
  name: string;
  path: string;
  language: string;
  description: string;
  code: string;
}

export const phpProjectFiles: SourceFile[] = [
  {
    name: "db_ppdb.sql",
    path: "database/db_ppdb.sql",
    language: "sql",
    description: "Skema Database MySQL untuk sistem PPDB yang mencakup tabel master jalur pendaftaran dan tabel pendaftar siswa beserta trigger/relasi yang benar.",
    code: `-- ==========================================
-- SKEMA DATABASE PPDB (Penerimaan Peserta Didik Baru)
-- ==========================================

CREATE DATABASE IF NOT EXISTS db_ppdb;
USE db_ppdb;

-- 1. Tabel Jalur Pendaftaran
-- Menyimpan kuota maksimal jalur PPDB
CREATE TABLE IF NOT EXISTS jalur_pendaftaran (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_jalur VARCHAR(50) NOT NULL UNIQUE,
    kuota INT NOT NULL,
    keterangan VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabel Siswa Pendaftar
-- Menyimpan data registrasi siswa baru yang terikat dengan Jalur Pendaftaran
CREATE TABLE IF NOT EXISTS pendaftar (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_lengkap VARCHAR(100) NOT NULL,
    nisn VARCHAR(10) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL,
    jalur_id INT NOT NULL,
    status ENUM('Pending', 'Diverifikasi', 'Ditolak') DEFAULT 'Pending',
    tanggal_daftar DATE DEFAULT CURRENT_DATE,
    FOREIGN KEY (jalur_id) REFERENCES jalur_pendaftaran(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Seeding Data Jalur Pendaftaran (Master Data Luas Kuota)
INSERT INTO jalur_pendaftaran (id, nama_jalur, kuota, keterangan) VALUES
(1, 'Zonasi', 150, 'Pendaftaran berdasarkan wilayah jarak domisili tinggal terdekat.'),
(2, 'Afirmasi', 60, 'Penerimaan khusus untuk keluarga ekonomi tidak mampu & penyandang disabilitas.'),
(3, 'Prestasi', 80, 'Pendaftaran berdasarkan prestasi akademik atau non-akademik.'),
(4, 'Perpindahan Orang Tua', 20, 'Khusus bagi anak guru atau orang tua yang dipindahtugaskan.')
ON DUPLICATE KEY UPDATE kuota=VALUES(kuota);

-- 4. Seeding Data Siswa Awal (Untuk contoh pendaftaran beruntun)
INSERT INTO pendaftar (nama_lengkap, nisn, email, jalur_id, status, tanggal_daftar) VALUES
('Rian Hidayat', '1234567890', 'rian.hidayat@gmail.com', 1, 'Diverifikasi', DATE_SUB(CURDATE(), INTERVAL 5 DAY)),
('Siti Aminah', '0987654321', 'siti.aminah@yahoo.com', 2, 'Diverifikasi', DATE_SUB(CURDATE(), INTERVAL 4 DAY)),
('Budi Santoso', '1122334455', 'budi.santoso@outlook.com', 3, 'Pending', DATE_SUB(CURDATE(), INTERVAL 3 DAY)),
('Ahmad Fauzi', '5544332211', 'ahmad.fauzi@gmail.com', 1, 'Diverifikasi', DATE_SUB(CURDATE(), INTERVAL 2 DAY)),
('Lani Wijaya', '9988776655', 'lani.wijaya@gmail.com', 4, 'Ditolak', DATE_SUB(CURDATE(), INTERVAL 2 DAY)),
('Rizky Pratama', '3344556677', 'rizky.pratama@gmail.com', 3, 'Pending', DATE_SUB(CURDATE(), INTERVAL 1 DAY)),
('Safira Indah', '8877665544', 'safira.indah@gmail.com', 1, 'Pending', CURDATE())
ON DUPLICATE KEY UPDATE nisn=nisn;
`
  },
  {
    name: "koneksi.php",
    path: "koneksi.php",
    language: "php",
    description: "Koneksi database menggunakan driver MySQLi berorientasi objek + penanganan error yang andal tanpa menyingkap rahasia kredensial.",
    code: `<?php
/**
 * @license Apache-2.0
 * KONEKSI DATABASE PPDB - MYSQLI OBJECT ORIENTED
 */

$host = "localhost";
$user = "root";
$pass = "";
$db   = "db_ppdb";

// Mengaktifkan reporting kesalahan mysqli demi keamanan & kemudahan debugging
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {
    // Membuat instance koneksi baru
    $koneksi = new mysqli($host, $user, $pass, $db);
    
    // Konfigurasi character set ke utf8mb4 agar mendukung semua emoji/karakter internasional
    $koneksi->set_charset("utf8mb4");
} catch (mysqli_sql_exception $e) {
    // Di lingkungan produksi, cetak log aman dan tampilkan pesan umum ke pengguna
    error_log("Gagal menyambung database: " . $e->getMessage());
    
    header('HTTP/1.1 500 Internal Server Error');
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        "status" => "error", 
        "message" => "Gagal terhubung ke server database. Pastikan MySQL aktif dan database db_ppdb sudah dibuat!"
    ]);
    exit();
}
?>`
  },
  {
    name: "get_stats.php",
    path: "get_stats.php",
    language: "php",
    description: "API server basis JSON yang menghasilkan data statistik kuota, tren pendaftaran 7 hari terakhir, dan 5 siswa pendaftar terbaru secara real-time.",
    code: `<?php
/**
 * API REAL-TIME STATISTIK PPDB
 * Mengembalikan respons berformat JSON untuk dikonsumsi AJAX/Fetch API
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=utf-8");

require_once 'koneksi.php';

try {
    // 1. QUERY RINGKASAN STATISTIK UTAMA (Real-time counts)
    $query_summary = "SELECT 
        COUNT(*) AS total_pendaftar,
        SUM(CASE WHEN status = 'Diverifikasi' THEN 1 ELSE 0 END) AS total_diverifikasi,
        SUM(CASE WHEN status = 'Ditolak' THEN 1 ELSE 0 END) AS total_ditolak,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS total_pending
    FROM pendaftar";
    
    $res_summary = $koneksi->query($query_summary);
    $data_summary = $res_summary->fetch_assoc();

    // Pastikan nilai default bukan NULL jika belum ada data sama sekali
    $summary = [
        "total" => (int)($data_summary['total_pendaftar'] ?? 0),
        "diverifikasi" => (int)($data_summary['total_diverifikasi'] ?? 0),
        "ditolak" => (int)($data_summary['total_ditolak'] ?? 0),
        "pending" => (int)($data_summary['total_pending'] ?? 0)
    ];

    // 2. QUERY JALUR PENDAFTARAN & SISA KUOTA DINAMIS
    // Sisa kuota dihitung dari: Kuota jalur dikurangi pendaftar yang sudah "Diverifikasi" pada jalur tersebut
    $query_jalur = "SELECT 
        j.id, 
        j.nama_jalur, 
        j.kuota,
        (j.kuota - COUNT(CASE WHEN p.status = 'Diverifikasi' THEN 1 END)) AS sisa_kuota
    FROM jalur_pendaftaran j
    LEFT JOIN pendaftar p ON j.id = p.jalur_id
    GROUP BY j.id";
    
    $res_jalur = $koneksi->query($query_jalur);
    $jalur = [];
    while ($row = $res_jalur->fetch_assoc()) {
        $jalur[] = [
            "id" => (int)$row['id'],
            "jalur" => $row['nama_jalur'],
            "kuota" => (int)$row['kuota'],
            "sisa" => max(0, (int)$row['sisa_kuota']) // Tidak memperbolehkan nilai negatif
        ];
    }

    // 3. QUERY TREN PENDAFTARAN (7 Hari Terakhir)
    $query_tren = "SELECT 
        tanggal_daftar AS tanggal_asli,
        DATE_FORMAT(tanggal_daftar, '%d %b') AS tanggal_formatted, 
        COUNT(*) AS jumlah 
    FROM pendaftar 
    WHERE tanggal_daftar >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
    GROUP BY tanggal_daftar 
    ORDER BY tanggal_daftar ASC";
    
    $res_tren = $koneksi->query($query_tren);
    $tren_data_raw = [];
    while ($row = $res_tren->fetch_assoc()) {
        $tren_data_raw[$row['tanggal_formatted']] = (int)$row['jumlah'];
    }

    // Generate array lengkap 7 hari terakhir demi menghindari celah jika ada hari tanpa pendaftar
    $tren = [];
    for ($i = 6; $i >= 0; $i--) {
        $date_formatted = date('d M', strtotime("-$i days"));
        $tren[] = [
            "tanggal" => $date_formatted,
            "jumlah" => isset($tren_data_raw[$date_formatted]) ? $tren_data_raw[$date_formatted] : 0
        ];
    }

    // 4. QUERY 5 PENDAFTAR TERBARU
    $query_newest = "SELECT 
        p.id, 
        p.nama_lengkap, 
        p.nisn, 
        j.nama_jalur, 
        p.tanggal_daftar, 
        p.status 
    FROM pendaftar p
    JOIN jalur_pendaftaran j ON p.jalur_id = j.id
    ORDER BY p.id DESC 
    LIMIT 5";
    
    $res_newest = $koneksi->query($query_newest);
    $terbaru = [];
    while ($row = $res_newest->fetch_assoc()) {
        $terbaru[] = [
            "id" => (int)$row['id'],
            "nama" => $row['nama_lengkap'],
            "nisn" => $row['nisn'],
            "jalur" => $row['nama_jalur'],
            "tanggal" => date('d-m-Y', strtotime($row['tanggal_daftar'])),
            "status" => $row['status']
        ];
    }

    // 5. OUTPUT KE JSON RESPONS
    echo json_encode([
        "status" => "success",
        "data" => [
            "summary" => $summary,
            "jalur" => $jalur,
            "tren" => $tren,
            "pendaftar_terbaru" => $terbaru
        ]
    ]);

} catch (Exception $e) {
    header('HTTP/1.1 500 Internal Server Error');
    echo json_encode([
        "status" => "error",
        "message" => "Gagal mengambil data real-time: " . $e->getMessage()
    ]);
}
?>`
  },
  {
    name: "update_status.php",
    path: "update_status.php",
    language: "php",
    description: "Mengubah status pendaftar (Verifikasi/Tolak) menggunakan PREPARED STATEMENTS MySQLi untuk keamanan mutlak terhadap SQL Injection.",
    code: `<?php
/**
 * BACKEND ACTION UNTUK UPDATE STATUS SISWA (VERIFIKASI & PENOLAKAN)
 * Dipanggil secara asinkron (AJAX POST) demi UI reaktif tanpa reload
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json; charset=utf-8");

// Hubungkan koneksi database yang aman
require_once 'koneksi.php';

// Hanya izinkan metode request POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('HTTP/1.1 405 Method Not Allowed');
    echo json_encode(["status" => "error", "message" => "Format request tidak diizinkan!"]);
    exit();
}

// Ambil input JSON/Form
$input = json_decode(file_get_contents('php://input'), true);

$id = isset($input['id']) ? (int)$input['id'] : null;
$status = isset($input['status']) ? trim($input['status']) : null;

// Validasi input parameter
if (empty($id) || empty($status)) {
    header('HTTP/1.1 400 Bad Request');
    echo json_encode(["status" => "error", "message" => "Parameter ID dan Status tidak lengkap!"]);
    exit();
}

// Validasi nilai status ENUM agar aman dari modifikasi eksternal
$allowed_status = ['Pending', 'Diverifikasi', 'Ditolak'];
if (!in_array($status, $allowed_status)) {
    header('HTTP/1.1 400 Bad Request');
    echo json_encode(["status" => "error", "message" => "Nilai status tidak valid!"]);
    exit();
}

try {
    // Gunakan Prepared Statements demi mengamankan kueri dari SQL Injection
    $stmt = $koneksi->prepare("UPDATE pendaftar SET status = ? WHERE id = ?");
    
    // Bind parameter (s = string, i = integer)
    $stmt->bind_param("si", $status, $id);
    
    // Jalankan statemen
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            echo json_encode([
                "status" => "success",
                "message" => "Status siswa berhasil dimutakhirkan menjadi: $status"
            ]);
        } else {
            echo json_encode([
                "status" => "warning",
                "message" => "Siswa ditemukan, namun tidak ada perubahan status."
            ]);
        }
    } else {
        throw new Exception("Gagal mengeksekusi perintah database.");
    }
    
    $stmt->close();
} catch (Exception $e) {
    header('HTTP/1.1 500 Internal Server Error');
    echo json_encode([
        "status" => "error",
        "message" => "Gagal mengubah status pendaftar: " . $e->getMessage()
    ]);
}
?>`
  },
  {
    name: "tambah_pendaftar.php",
    path: "tambah_pendaftar.php",
    language: "php",
    description: "Mendaftarkan siswa baru secara aman menggunakan Prepared Statements dengan pengecekan ganda ketersediaan kuota jalur.",
    code: `<?php
/**
 * BACKEND REGISTER SISWA BARU (PPDB BACKEND PROCESS)
 * Menambahkan data siswa baru ke tabel pendaftar dengan input validation & SQL Injection protection.
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json; charset=utf-8");

require_once 'koneksi.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('HTTP/1.1 405 Method Not Allowed');
    echo json_encode(["status" => "error", "message" => "Format kiriman data tidak diizinkan!"]);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);

$nama_lengkap = isset($input['nama_lengkap']) ? trim($input['nama_lengkap']) : '';
$nisn = isset($input['nisn']) ? trim($input['nisn']) : '';
$email = isset($input['email']) ? trim($input['email']) : '';
$jalur_id = isset($input['jalur_id']) ? (int)$input['jalur_id'] : 0;

// Validasi Form Wajib
if (empty($nama_lengkap) || empty($nisn) || empty($email) || empty($jalur_id)) {
    header('HTTP/1.1 400 Bad Request');
    echo json_encode(["status" => "error", "message" => "Semua kolom pendaftaran wajib diisi!"]);
    exit();
}

// Cek format NISN (Harus 10 angka)
if (!preg_match("/^[0-9]{10}$/", $nisn)) {
    header('HTTP/1.1 400 Bad Request');
    echo json_encode(["status" => "error", "message" => "NISN harus berupa 10 digit angka asli!"]);
    exit();
}

// Cek validitas email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    header('HTTP/1.1 400 Bad Request');
    echo json_encode(["status" => "error", "message" => "Format Email tidak valid!"]);
    exit();
}

try {
    // 1. Cek apakah NISN sudah terdaftar (Pilar Unik NISN)
    $stmt_check = $koneksi->prepare("SELECT id FROM pendaftar WHERE nisn = ?");
    $stmt_check->bind_param("s", $nisn);
    $stmt_check->execute();
    $stmt_check->store_result();
    
    if ($stmt_check->num_rows > 0) {
        $stmt_check->close();
        header('HTTP/1.1 400 Bad Request');
        echo json_encode(["status" => "error", "message" => "Siswa dengan NISN $nisn ini sudah pernah terdaftar!"]);
        exit();
    }
    $stmt_check->close();

    // 2. Cek apakah sisa kuota jalur masih mencukupi
    $stmt_quota = $koneksi->prepare("SELECT 
        j.kuota,
        (j.kuota - COUNT(p.id)) AS sisa
        FROM jalur_pendaftaran j
        LEFT JOIN pendaftar p ON j.id = p.jalur_id AND p.status = 'Diverifikasi'
        WHERE j.id = ?
        GROUP BY j.id");
    
    $stmt_quota->bind_param("i", $jalur_id);
    $stmt_quota->execute();
    $res_quota = $stmt_quota->get_result();
    $quota_data = $res_quota->fetch_assoc();
    $stmt_quota->close();

    if (!$quota_data) {
        header('HTTP/1.1 400 Bad Request');
        echo json_encode(["status" => "error", "message" => "Jalur pendaftaran yang dipilih tidak sah!"]);
        exit();
    }

    if ($quota_data['sisa'] <= 0) {
        header('HTTP/1.1 400 Bad Request');
        echo json_encode(["status" => "error", "message" => "Kuota pendaftaran untuk jalur ini sudah habis!"]);
        exit();
    }

    // 3. Masukkan data pendaftar baru secara aman
    $stmt_insert = $koneksi->prepare("INSERT INTO pendaftar (nama_lengkap, nisn, email, jalur_id, status, tanggal_daftar) VALUES (?, ?, ?, ?, 'Pending', CURDATE())");
    $stmt_insert->bind_param("sssi", $nama_lengkap, $nisn, $email, $jalur_id);
    
    if ($stmt_insert->execute()) {
        echo json_encode([
            "status" => "success",
            "message" => "Pendaftaran berhasil dikirim! Silakan instruksikan panitia untuk memverifikasi dokumen.",
            "pendaftar_id" => $stmt_insert->insert_id
        ]);
    } else {
        throw new Exception("Gagal menyimpan data pendaftaran ke database.");
    }
    $stmt_insert->close();

} catch (Exception $e) {
    header('HTTP/1.1 500 Internal Server Error');
    echo json_encode([
        "status" => "error",
        "message" => "Exception Error: " . $e->getMessage()
    ]);
}
?>`
  },
  {
    name: "index.php",
    path: "index.php",
    language: "php",
    description: "Tampilan utama dashboard PPDB interaktif menggunakan Bootstrap 5, AJAX (Fetch API) untuk polling real-time data, dan Chart.js untuk menggambar grafik tren.",
    code: `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sistem PPDB - Dashboard Admin Real-Time</title>
    
    <!-- Link Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-9ndCyUaIbzAi2FUVXJi0CjmCapSmO7SnpJef0486qhLnuZ2cdeRhO02iuK6FUUVM" crossorigin="anonymous">
    <!-- Lucide Icons untuk estetika ikon dashboard -->
    <script src="https://unpkg.com/lucide@latest"></script>
    
    <style>
        body {
            background-color: #f4f6f9;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .sidebar {
            background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
            min-height: 100vh;
            color: #f8fafc;
        }
        .sidebar .nav-link {
            color: #94a3b8;
            border-radius: 0.375rem;
            margin-bottom: 0.25rem;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .sidebar .nav-link.active, .sidebar .nav-link:hover {
            color: #fff;
            background-color: rgba(255, 255, 255, 0.1);
        }
        .card-stat {
            border: none;
            border-radius: 12px;
            transition: transform 0.2s, box-shadow 0.2s;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.02);
        }
        .card-stat:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 15px rgba(0,0,0,0.05);
        }
        .stat-icon {
            padding: 16px;
            border-radius: 12px;
            display: inline-flex;
        }
        .pulse-indicator {
            width: 10px;
            height: 10px;
            background-color: #10b981;
            border-radius: 50%;
            display: inline-block;
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
            animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
            0% {
                transform: scale(0.95);
                box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
            }
            70% {
                transform: scale(1);
                box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
            }
            100% {
                transform: scale(0.95);
                box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
            }
        }
    </style>
</head>
<body>

<div class="container-fluid">
    <div class="row">
        <!-- Sidebar Kiri -->
        <nav class="col-md-3 col-lg-2 d-md-block sidebar collapse p-3">
            <div class="d-flex align-items-center gap-2 mb-4 px-2">
                <i data-lucide="graduation-cap" class="text-success" style="width: 28px; height: 28px;"></i>
                <h5 class="fw-bold m-0 text-white">PANITIA PPDB</h5>
            </div>
            
            <hr class="text-secondary">
            
            <ul class="nav flex-column mt-3">
                <li class="nav-item">
                    <a class="nav-link active" href="#">
                        <i data-lucide="layout-dashboard" style="width: 18px;"></i>
                        Dashboard Utama
                    </a>
                </li>
            </ul>
            
            <div class="mt-auto pt-5 text-center text-muted" style="font-size: 11px;">
                <p>PPDB Dashboard Admin © 2026 Admin Panel</p>
            </div>
        </nav>

        <!-- Konten Utama Kanan -->
        <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4 py-4">
            <!-- Header Atas -->
            <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-1 pb-2 mb-4 border-bottom">
                <div>
                    <h1 class="h2 fw-bold text-dark m-0">Dashboard Statistik PPDB</h1>
                    <p class="text-muted">Selamat datang, Panitia PPDB Online. Memonitor entri data calon siswa.</p>
                </div>
                <div class="d-flex align-items-center gap-3">
                    <div class="d-flex align-items-center gap-2 bg-white px-3 py-2 border rounded-3 shadow-sm">
                        <span class="pulse-indicator"></span>
                        <span class="text-secondary fw-semibold" style="font-size: 13px;" id="ajaxStatus">Realtime AJAX Aktif</span>
                    </div>
                    <button class="btn btn-primary d-flex align-items-center gap-1 shadow-sm px-3" onclick="loadDashboardData()">
                        <i data-lucide="refresh-cw" style="width: 16px;"></i> Refresh
                    </button>
                    <!-- Tombol Cepat Pendaftaran (Trigger Modal) -->
                    <button class="btn btn-success d-flex align-items-center gap-1 shadow-sm px-3" data-bs-toggle="modal" data-bs-target="#modalTambah">
                        <i data-lucide="user-plus" style="width: 16px;"></i> Daftar Baru
                    </button>
                </div>
            </div>

            <!-- Bagian 1: Row Statistik Ringkasan Real-time -->
            <div class="row g-3 mb-4">
                <!-- Card Total Pendaftar -->
                <div class="col-12 col-sm-6 col-lg-3">
                    <div class="card card-stat bg-white h-100 p-3">
                        <div class="d-flex align-items-center justify-content-between">
                            <div>
                                <span class="text-muted text-uppercase fw-bold" style="font-size: 11px; letter-spacing: 0.5px;">Total Pendaftar</span>
                                <h3 class="fw-bold mt-1 text-dark" id="statTotal">0</h3>
                            </div>
                            <div class="stat-icon bg-primary-subtle text-primary">
                                <i data-lucide="users" style="width: 24px; height: 24px;"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Card Diverifikasi -->
                <div class="col-12 col-sm-6 col-lg-3">
                    <div class="card card-stat bg-white h-100 p-3">
                        <div class="d-flex align-items-center justify-content-between">
                            <div>
                                <span class="text-muted text-uppercase fw-bold" style="font-size: 11px; letter-spacing: 0.5px;">Diverifikasi</span>
                                <h3 class="fw-bold mt-1 text-success" id="statVerified">0</h3>
                            </div>
                            <div class="stat-icon bg-success-subtle text-success">
                                <i data-lucide="check-circle-2" style="width: 24px; height: 24px;"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Card Ditolak -->
                <div class="col-12 col-sm-6 col-lg-3">
                    <div class="card card-stat bg-white h-100 p-3">
                        <div class="d-flex align-items-center justify-content-between">
                            <div>
                                <span class="text-muted text-uppercase fw-bold" style="font-size: 11px; letter-spacing: 0.5px;">Ditolak</span>
                                <h3 class="fw-bold mt-1 text-danger" id="statRejected">0</h3>
                            </div>
                            <div class="stat-icon bg-danger-subtle text-danger">
                                <i data-lucide="x-circle" style="width: 24px; height: 24px;"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Card Pending -->
                <div class="col-12 col-sm-6 col-lg-3">
                    <div class="card card-stat bg-white h-100 p-3">
                        <div class="d-flex align-items-center justify-content-between">
                            <div>
                                <span class="text-muted text-uppercase fw-bold" style="font-size: 11px; letter-spacing: 0.5px;">Menunggu Verifikasi</span>
                                <h3 class="fw-bold mt-1 text-warning" id="statPending">0</h3>
                            </div>
                            <div class="stat-icon bg-warning-subtle text-warning">
                                <i data-lucide="clock" style="width: 24px; height: 24px;"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row g-4 mb-4">
                <!-- Grafik Pendaftaran (Chart.js) -->
                <div class="col-12 col-lg-8">
                    <div class="card border-0 shadow-sm p-4 h-100 bg-white" style="border-radius: 12px;">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h5 class="fw-bold text-dark m-0">Tren Pendaftaran Calon Siswa</h5>
                            <span class="text-muted" style="font-size: 12px;">(7 Hari Terakhir)</span>
                        </div>
                        <div style="height: 300px; position: relative;" id="canvasParent">
                            <canvas id="chartTren"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Sisa Kuota Jalur Pendaftaran -->
                <div class="col-12 col-lg-4">
                    <div class="card border-0 shadow-sm p-4 h-100 bg-white" style="border-radius: 12px;">
                        <h5 class="fw-bold text-dark mb-3">Sisa Kuota PPDB</h5>
                        <div class="list-group list-group-flush" id="kuotaList">
                            <!-- Dimuat secara dinamis via AJAX -->
                            <div class="text-center py-4">
                                <div class="spinner-border spinner-border-sm text-secondary" role="status"></div>
                                <span class="ms-2 text-muted">Memuat data...</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tabel 5 Pendaftar Terbaru -->
            <div class="card border-0 shadow-sm bg-white" style="border-radius: 12px;">
                <div class="card-header bg-white border-0 py-3 px-4 d-flex justify-content-between align-items-center">
                    <h5 class="fw-bold text-dark m-0">5 Siswa Pendaftar Terbaru</h5>
                    <span class="badge bg-secondary px-3 py-2 text-white fw-medium">Tabel Dinamis</span>
                </div>
                <div class="table-responsive px-4">
                    <table class="table table-hover align-middle">
                        <thead>
                            <tr class="table-light">
                                <th class="py-3">No Registrasi</th>
                                <th class="py-3">Nama Lengkap</th>
                                <th class="py-3">NISN</th>
                                <th class="py-3">Jalur</th>
                                <th class="py-3">Tgl Daftar</th>
                                <th class="py-3 text-center">Status</th>
                                <th class="py-3 text-end">Aksi Verifikasi</th>
                            </tr>
                        </thead>
                        <tbody id="tblPendaftar">
                            <tr>
                                <td colspan="7" class="text-center py-4 text-muted">
                                    <div class="spinner-border spinner-border-sm" role="status"></div>
                                    <span class="ms-1">Memuat data siswa baru...</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    </div>
</div>

<!-- Modal Tambah Pendaftaran -->
<div class="modal fade" id="modalTambah" tabindex="-1" aria-labelledby="modalTambahLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0" style="border-radius: 12px;">
            <div class="modal-header bg-success text-white">
                <h5 class="modal-title fw-bold" id="modalTambahLabel">Registrasi Calon Siswa Baru</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <form id="formPedaftaran" onsubmit="submitFormPendaftar(event)">
                <div class="modal-body p-4">
                    <div class="mb-3">
                        <label for="regNama" class="form-label fw-semibold">Nama Lengkap Siswa</label>
                        <input type="text" class="form-control" id="regNama" placeholder="Contoh: Muhammad Akhyar" required>
                    </div>
                    <div class="mb-3">
                        <label for="regNisn" class="form-label fw-semibold">NISN (10 Digit)</label>
                        <input type="text" maxLength="10" minLength="10" class="form-control" id="regNisn" placeholder="Contoh: 0045617281" required>
                        <small class="text-muted">Harus bernilai 10 digit angka unik.</small>
                    </div>
                    <div class="mb-3">
                        <label for="regEmail" class="form-label fw-semibold">Alamat Email Aktif</label>
                        <input type="email" class="form-control" id="regEmail" placeholder="Contoh: akhyar@gmail.com" required>
                    </div>
                    <div class="mb-3">
                        <label for="regJalur" class="form-label fw-semibold">Pilih Jalur PPDB</label>
                        <select class="form-select" id="regJalur" required>
                            <option value="1">Zonasi</option>
                            <option value="2">Afirmasi</option>
                            <option value="3">Prestasi</option>
                            <option value="4">Perpindahan Orang Tua</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer px-4 py-3 bg-light">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                    <button type="submit" class="btn btn-success d-flex align-items-center gap-1">
                        <i data-lucide="check" style="width: 16px;"></i> Simpan Pendaftaran
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- CDN Chartjs & Bootstrap Bundle -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js" integrity="sha384-geWF76RCwLtnZ8qwWowPQNguL3RmwHVBC9FhGdlKrxdiJJigb/j/68SIy3Te4Bkz" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<script>
    // Variabel grafik global
    let instanceChart = null;

    // 1. Memuat seluruh data asinkron via AJAX Fetch API
    function loadDashboardData() {
        document.getElementById('ajaxStatus').innerText = "Mengambil data...";
        
        // Panggil endpoint get_stats.php
        fetch('get_stats.php')
            .then(response => {
                if (!response.ok) {
                    throw new Error("Gagal mengambil data dari server");
                }
                return response.json();
            })
            .then(res => {
                if (res.status === 'success') {
                    const data = res.data;
                    
                    // a. Update ringkasan statistik utama
                    document.getElementById('statTotal').innerText = data.summary.total;
                    document.getElementById('statVerified').innerText = data.summary.diverifikasi;
                    document.getElementById('statRejected').innerText = data.summary.ditolak;
                    document.getElementById('statPending').innerText = data.summary.pending;

                    // b. Update daftar kuota pendaftaran
                    const kuotaContainer = document.getElementById('kuotaList');
                    kuotaContainer.innerHTML = '';
                    
                    data.jalur.forEach(item => {
                        const sisaPersen = Math.round((item.sisa / item.kuota) * 100);
                        let progressColor = "bg-success";
                        if (sisaPersen < 20) progressColor = "bg-danger";
                        else if (sisaPersen < 50) progressColor = "bg-warning";

                        kuotaContainer.innerHTML += \`
                            <div class="mb-3">
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <span class="fw-semibold text-secondary" style="font-size: 13px;">\${item.jalur}</span>
                                    <span class="text-muted" style="font-size: 12px;">\${item.sisa} / \${item.kuota} Sisa</span>
                                </div>
                                <div class="progress" style="height: 8px;">
                                    <div class="progress-bar \${progressColor}" role="progressbar" style="width: \${100 - sisaPersen}%" aria-valuenow="\${100 - sisaPersen}" aria-valuemin="0" aria-valuemax="100"></div>
                                </div>
                            </div>
                        \`;
                    });

                    // c. Render daftar 5 siswa pendaftar terbaru
                    const tblBody = document.getElementById('tblPendaftar');
                    tblBody.innerHTML = '';

                    if (data.pendaftar_terbaru.length === 0) {
                        tblBody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">Belum ada siswa terdaftar saat ini.</td></tr>';
                    } else {
                        data.pendaftar_terbaru.forEach(siswa => {
                            let badgeClass = "bg-warning text-dark";
                            if (siswa.status === 'Diverifikasi') badgeClass = "bg-success text-white";
                            else if (siswa.status === 'Ditolak') badgeClass = "bg-danger text-white";

                            // Berikan tombol aksi jika status masih Pending
                            let actionButtons = '-';
                            if (siswa.status === 'Pending') {
                                actionButtons = \`
                                    <div class="d-flex justify-content-end gap-1">
                                        <button class="btn btn-sm btn-success px-2 py-1" onclick="updateSiswaStatus(\${siswa.id}, 'Diverifikasi')" style="font-size: 11px;">
                                            Setujui
                                        </button>
                                        <button class="btn btn-sm btn-danger px-2 py-1" onclick="updateSiswaStatus(\${siswa.id}, 'Ditolak')" style="font-size: 11px;">
                                            Tolak
                                        </button>
                                    </div>
                                \`;
                            }

                            tblBody.innerHTML += \`
                                <tr>
                                    <td class="fw-bold text-secondary">#REG-\${siswa.id.toString().padStart(4, '0')}</td>
                                    <td><strong>\${siswa.nama}</strong></td>
                                    <td><code class="text-dark bg-light px-1 rounded">\${siswa.nisn}</code></td>
                                    <td>\${siswa.jalur}</td>
                                    <td>\${siswa.tanggal}</td>
                                    <td class="text-center"><span class="badge rounded shadow-sm \${badgeClass}">\${siswa.status}</span></td>
                                    <td>\${actionButtons}</td>
                                </tr>
                            \`;
                        });
                    }

                    // d. Perbarui Chart.js Tren
                    const labelHari = data.tren.map(item => item.tanggal);
                    const dataHari = data.tren.map(item => item.jumlah);
                    
                    renderChart(labelHari, dataHari);

                    setTimeout(() => {
                        document.getElementById('ajaxStatus').innerText = "Realtime AJAX Aktif";
                    }, 800);
                }
            })
            .catch(err => {
                document.getElementById('ajaxStatus').innerText = "Koneksi Bermasalah";
                console.error(err);
            });
    }

    // 2. Fungsi Mengganti Status Siswa (Verifikasi / Tolak)
    function updateSiswaStatus(id, statusBaru) {
        if (!confirm(\`Apakah Anda yakin ingin mengganti status siswa ini menjadi \${statusBaru}?\`)) {
            return;
        }

        fetch('update_status.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id, status: statusBaru })
        })
        .then(response => response.json())
        .then(res => {
            if (res.status === 'success') {
                alert(res.message);
                loadDashboardData(); // Segera perbarui layar tanpa reload total!
            } else {
                alert("Gagal: " + res.message);
            }
        })
        .catch(err => {
            alert("Terjadi kesalahan jaringan.");
            console.error(err);
        });
    }

    // 3. Fungsi Tambah Calon Siswa Baru secara Dinamis
    function submitFormPendaftar(event) {
        event.preventDefault();

        const nama = document.getElementById('regNama').value;
        const nisn = document.getElementById('regNisn').value;
        const email = document.getElementById('regEmail').value;
        const jalur_id = document.getElementById('regJalur').value;

        fetch('tambah_pendaftar.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nama_lengkap: nama,
                nisn: nisn,
                email: email,
                jalur_id: jalur_id
            })
        })
        .then(response => response.json())
        .then(res => {
            if (res.status === 'success') {
                alert(res.message);
                // Reset form
                document.getElementById('formPedaftaran').reset();
                // Tutup modal bootstrap
                const modalEl = document.getElementById('modalTambah');
                const modalInstance = bootstrap.Modal.getInstance(modalEl);
                modalInstance.hide();
                // Muat ulang data terbaru
                loadDashboardData();
            } else {
                alert("Gagal registrasi: " + res.message);
            }
        })
        .catch(err => {
            alert("Terjadi kegagalan koneksi saat registrasi.");
            console.error(err);
        });
    }

    // 4. Inisiasi dan Gambar Grafik Tren menggunakan Chart.js
    function renderChart(labels, values) {
        const ctx = document.getElementById('chartTren').getContext('2d');
        
        if (instanceChart) {
            instanceChart.data.labels = labels;
            instanceChart.data.datasets[0].data = values;
            instanceChart.update();
            return;
        }

        instanceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Registrasi Siswa Baru',
                    data: values,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.3,
                    fill: true,
                    borderWidth: 3,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#10b981',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0,
                            color: '#64748b'
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.05)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#64748b'
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Jalankan pertama kali saat dokumen siap
    document.addEventListener('DOMContentLoaded', () => {
        lucide.createIcons();
        loadDashboardData();

        // SIMULASI REAL-TIME POLLING: Ambil data statistik PPDB otomatis setiap 5 detik tanpa refresh halaman
        setInterval(loadDashboardData, 5000);
    });
</script>

</body>
</html>`
  }
];
