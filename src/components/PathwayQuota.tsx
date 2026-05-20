import { Activity } from "lucide-react";
import { PathwayQuota as PathwayQuotaType } from "../types";

interface PathwayQuotaProps {
  quota: PathwayQuotaType;
  key?: number;
}

export default function PathwayQuota({ quota }: PathwayQuotaProps) {
  // sisa kuota, terisi
  const terisi = quota.kuota - quota.sisa;
  const persenTerisi = Math.round((terisi / quota.kuota) * 100);

  // Bagian warna berdasarkan kepenuhan
  let barColor = "bg-emerald-500";
  let textColor = "text-emerald-600 dark:text-emerald-400";
  let bgTheme = "bg-emerald-500/10";

  if (persenTerisi >= 90) {
    barColor = "bg-rose-500 animate-pulse";
    textColor = "text-rose-600 dark:text-rose-400";
    bgTheme = "bg-rose-500/10";
  } else if (persenTerisi >= 65) {
    barColor = "bg-amber-500";
    textColor = "text-amber-600 dark:text-amber-400";
    bgTheme = "bg-amber-500/10";
  }

  return (
    <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors duration-200">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
            {quota.jalur}
          </h4>
          <span className="text-[11px] text-slate-400">
            Jalur Penerimaan PPDB Online
          </span>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${textColor} ${bgTheme}`}>
          {persenTerisi}% terisi
        </div>
      </div>

      <div className="space-y-2 mt-4">
        <div className="h-2 w-full bg-slate-200/60 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${persenTerisi}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>Terisi: <strong className="text-slate-700 dark:text-slate-300">{terisi}</strong> siswa</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Sisa Kuota: <strong className="text-emerald-600 dark:text-emerald-400">{quota.sisa}</strong>/ {quota.kuota}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
