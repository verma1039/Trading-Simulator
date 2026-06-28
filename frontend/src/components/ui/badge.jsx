import { cn } from "@/lib/utils";

const variants = {
  default: "border-slate-700 bg-slate-900 text-slate-300",
  neutral: "border-slate-700 bg-slate-900 text-slate-300",
  positive: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  negative: "border-red-500/30 bg-red-500/10 text-red-300",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  approved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  rejected: "border-red-500/30 bg-red-500/10 text-red-300",
  active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  suspended: "border-red-500/30 bg-red-500/10 text-red-300",
};

export function Badge({ children, className, variant = "default" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
        variants[variant] || variants.default,
        className,
      )}
    >
      {children}
    </span>
  );
}
