export interface SummaryStats {
  total: number;
  diverifikasi: number;
  ditolak: number;
  pending: number;
}

export interface PathwayQuota {
  id: number;
  jalur: string;
  kuota: number;
  sisa: number;
}

export interface TrendDay {
  tanggal: string;
  jumlah: number;
}

export interface Student {
  id: number;
  nama: string;
  nisn: string;
  email: string;
  jalurId: number;
  jalur: string;
  tanggal: string;
  status: "Pending" | "Diverifikasi" | "Ditolak";
  alamat_kk?: string;
  sekolah_asal?: string;
  no_kk?: string;
  no_hp?: string;
  nik?: string;
  
  // Data Orang Tua sesuai KK
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

export interface DashboardResponse {
  summary: SummaryStats;
  jalur: PathwayQuota[];
  tren: TrendDay[];
  pendaftar_terbaru: Student[];
  semua_siswa: Student[];
}
