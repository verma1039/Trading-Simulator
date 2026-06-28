import { createElement } from "react";
import { motion } from "framer-motion";
import { BarChart3, BadgeDollarSign, CandlestickChart, Layers3, LineChart, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const MotionDiv = motion.div;

const whyItems = [
  "Practice trading without risking real money",
  "Build portfolio management skills",
  "Explore major US market indexes",
  "Evaluate investment ideas before going live",
];

const platformHighlights = [
  "Real-time market simulation",
  "Portfolio performance tracking",
  "Admin-controlled virtual funding",
  "Multi-index stock universe",
  "Strategy experimentation environment",
];

const metrics = [
  { icon: Layers3, label: "Markets", value: "US Equities" },
  { icon: BarChart3, label: "Portfolio", value: "Activity-Based" },
  { icon: BadgeDollarSign, label: "Funding", value: "Admin Reviewed" },
];

export default function AuthPanelDetails({ mode = "user" }) {
  const isAdmin = mode === "admin";
  const accent = isAdmin ? "sky" : "emerald";

  return (
    <MotionDiv className="space-y-4" variants={detailsVariant}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={isAdmin ? "info" : "positive"}>{isAdmin ? "Admin Operations" : "Paper Trading Workspace"}</Badge>
        <span className="text-xs text-muted-foreground">Account data appears from real user activity</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {metrics.map((metric) => (
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3" key={metric.label}>
            <div className={cn("mb-3 inline-flex rounded-xl p-2", isAdmin ? "bg-sky-500/10 text-sky-300" : "bg-emerald-500/10 text-emerald-300")}>
              {createElement(metric.icon, { className: "h-4 w-4", "aria-hidden": "true" })}
            </div>
            <p className="text-lg font-semibold text-white">{metric.value}</p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{metric.label}</p>
          </div>
        ))}
      </div>

      <InfoBlock
        accent={accent}
        icon={CandlestickChart}
        items={whyItems}
        title="Why Use This Simulator"
      />
      <InfoBlock
        accent={accent}
        icon={isAdmin ? ShieldCheck : LineChart}
        items={platformHighlights}
        title="Platform Highlights"
      />
    </MotionDiv>
  );
}

function InfoBlock({ accent, icon, items, title }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex items-center gap-3">
        <div className={cn("rounded-xl p-2", accent === "sky" ? "bg-sky-500/10 text-sky-300" : "bg-emerald-500/10 text-emerald-300")}>
          {createElement(icon, { className: "h-4 w-4", "aria-hidden": "true" })}
        </div>
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
      <div className="grid gap-2">
        {items.map((item) => (
          <div className="flex items-start gap-2 text-sm text-muted-foreground" key={item}>
            <span className={cn("mt-2 h-1.5 w-1.5 shrink-0 rounded-full", accent === "sky" ? "bg-sky-300" : "bg-emerald-300")} />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const detailsVariant = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.12,
      duration: 0.42,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};
