import { Users, CheckCircle2, XCircle, Clock } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  type: "total" | "diverifikasi" | "ditolak" | "pending";
}

export default function StatCard({ title, value, type }: StatCardProps) {
  const configs = {
    total: {
      icon: Users,
      bgColor: "bg-blue-50 dark:bg-blue-900/10",
      textColor: "text-blue-600 dark:text-blue-400",
      iconColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      borderColor: "border-blue-100 dark:border-blue-900/30",
    },
    diverifikasi: {
      icon: CheckCircle2,
      bgColor: "bg-emerald-50 dark:bg-emerald-900/10",
      textColor: "text-emerald-600 dark:text-emerald-400",
      iconColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      borderColor: "border-emerald-100 dark:border-emerald-900/30",
    },
    ditolak: {
      icon: XCircle,
      bgColor: "bg-rose-50 dark:bg-rose-900/10",
      textColor: "text-rose-600 dark:text-rose-400",
      iconColor: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
      borderColor: "border-rose-100 dark:border-rose-900/30",
    },
    pending: {
      icon: Clock,
      bgColor: "bg-amber-50 dark:bg-amber-900/10",
      textColor: "text-amber-600 dark:text-amber-400",
      iconColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      borderColor: "border-amber-100 dark:border-amber-900/30",
    },
  };

  const current = configs[type];
  const IconComponent = current.icon;

  return (
    <div className={`p-5 rounded-2xl border bg-white dark:bg-slate-900 ${current.borderColor} shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 flex items-center justify-between`}>
      <div className="space-y-1.5">
        <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
          {title}
        </span>
        <div className="flex items-baseline gap-1.5">
          <span className={`text-3xl font-bold tracking-tight ${current.textColor}`}>
            {value.toLocaleString("id-ID")}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">siswa</span>
        </div>
      </div>
      <div className={`p-3.5 rounded-xl ${current.iconColor} flex items-center justify-center`}>
        <IconComponent className="w-6 h-6 stroke-[2]" />
      </div>
    </div>
  );
}
