import { cn } from "@/lib/utils";

export function Select({ className, children, ...props }) {
  return (
    <select
      className={cn(
        "h-10 rounded-lg border border-input bg-slate-950/70 px-3 text-sm font-medium text-foreground outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
