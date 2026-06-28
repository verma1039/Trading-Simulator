import { createElement } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const MotionDiv = motion.div;

export default function MetricCard({ accent = "emerald", icon, label, meta, trend, value }) {
  const isNegative = typeof trend === "string" && trend.trim().startsWith("-");
  const TrendIcon = isNegative ? ArrowDownRight : ArrowUpRight;
  const accentClasses = {
    emerald: "bg-emerald-500/10 text-emerald-300",
    sky: "bg-sky-500/10 text-sky-300",
    amber: "bg-amber-500/10 text-amber-300",
    violet: "bg-violet-500/10 text-violet-300",
    slate: "bg-slate-500/10 text-slate-300",
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
        </div>
        {icon ? (
          <MotionDiv
            className={cn("rounded-xl p-2.5", accentClasses[accent] || accentClasses.emerald)}
            transition={{ duration: 0.2 }}
            whileHover={{ rotate: -3, scale: 1.04 }}
          >
            {createElement(icon, { className: "h-5 w-5", "aria-hidden": "true" })}
          </MotionDiv>
        ) : null}
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        {trend ? (
          <span className={cn("inline-flex items-center gap-1 font-semibold", isNegative ? "text-red-300" : "text-emerald-300")}>
            {createElement(TrendIcon, { className: "h-3.5 w-3.5", "aria-hidden": "true" })}
            {trend}
          </span>
        ) : null}
        <span>{meta}</span>
      </div>
    </Card>
  );
}
