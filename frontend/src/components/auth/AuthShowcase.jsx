import { createElement } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowUpRight,
  CandlestickChart,
  Layers3,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const MotionDiv = motion.div;

const highlights = [
  "Trade Major US Stocks",
  "Track Your Portfolio",
  "Simulate Real Market Conditions",
  "Build Strategies Without Risk",
];

const tickerSymbols = ["AAPL", "NVDA", "MSFT", "META", "AMD", "AVGO", "JPM", "PEP"];

const floatingCards = [
  { label: "Account State", value: "Clean Start", detail: "Balances and holdings appear after real activity", icon: Layers3, tone: "info" },
  { label: "Market Access", value: "US Equities", detail: "Browse supported symbols and market sessions", icon: ArrowUpRight, tone: "positive" },
  { label: "Funding Flow", value: "Reviewed", detail: "Deposit requests require admin approval", icon: Activity, tone: "info" },
];

export default function AuthShowcase({ mode = "user" }) {
  const duplicatedTicker = [...tickerSymbols, ...tickerSymbols];
  const isAdmin = mode === "admin";

  return (
    <section className="auth-visual-panel relative min-h-[620px] w-full max-w-[calc(100vw-2rem)] min-w-0 overflow-hidden rounded-[2rem] border border-white/10 p-4 shadow-2xl shadow-black/30 sm:p-6 lg:min-h-[760px] lg:p-8 xl:max-w-full">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(16,185,129,0.18),transparent_32%),radial-gradient(circle_at_80%_18%,rgba(56,189,248,0.14),transparent_28%),linear-gradient(145deg,rgba(15,23,42,0.92),rgba(2,6,23,0.96))]" />
      <MotionDiv
        animate={{ opacity: [0.25, 0.45, 0.25], scale: [1, 1.04, 1] }}
        className="absolute -left-24 top-24 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl"
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <MotionDiv
        animate={{ opacity: [0.16, 0.32, 0.16], y: [0, -16, 0] }}
        className="absolute -right-20 bottom-20 h-72 w-72 rounded-full bg-sky-400/20 blur-3xl"
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 flex h-full w-full max-w-full min-w-0 flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
            <CandlestickChart className="h-4 w-4 text-emerald-300" aria-hidden="true" />
            Paper trading workspace
          </div>
          <Badge variant={isAdmin ? "info" : "positive"}>{isAdmin ? "Admin Console" : "User Workspace"}</Badge>
        </div>

        <MotionDiv
          animate={{ opacity: 1, y: 0 }}
          className="mt-12 max-w-xl"
          initial={{ opacity: 0, y: 18 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">
            Modern market simulation
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">
            Build trading habits before risking capital.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
            Review major US stocks, follow portfolio growth, and practice order decisions in a clean trading workspace.
          </p>
        </MotionDiv>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {highlights.map((highlight, index) => (
            <MotionDiv
              className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 backdrop-blur"
              initial={{ opacity: 0, y: 12 }}
              key={highlight}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.45 }}
              viewport={{ once: true }}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="shrink-0 rounded-xl bg-emerald-400/10 p-2 text-emerald-300">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                </div>
                <span className="min-w-0 text-sm font-semibold text-slate-100">{highlight}</span>
              </div>
            </MotionDiv>
          ))}
        </div>

        <div className="mt-8 min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/55 py-3">
          <MotionDiv
            animate={{ x: ["0%", "-50%"] }}
            className="flex w-max gap-3 px-3"
            transition={{ duration: 28, ease: "linear", repeat: Infinity }}
          >
            {duplicatedTicker.map((symbol, index) => (
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2" key={symbol + index}>
                <span className="text-sm font-semibold text-white">{symbol}</span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-300">
                  <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                  Supported
                </span>
              </div>
            ))}
          </MotionDiv>
        </div>

        <div className="mt-8 grid flex-1 gap-4 xl:grid-cols-[1fr_0.8fr]">
          <MotionDiv
            animate={{ y: [0, -8, 0] }}
            className="min-w-0 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/60 p-4 shadow-2xl shadow-black/20 backdrop-blur sm:p-5"
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Portfolio growth</p>
                <p className="mt-1 text-xs text-slate-400">Account value appears after trading activity</p>
              </div>
              <Badge variant="info">Clean Start</Badge>
            </div>
            <div className="mt-4 grid gap-3">
              {["No starting holdings", "No fabricated transactions", "Portfolio data comes from account activity"].map((item) => (
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm text-slate-300" key={item}>
                  {item}
                </div>
              ))}
            </div>
          </MotionDiv>

          <div className="grid gap-4">
            {floatingCards.map((card, index) => (
              <FloatingCard card={card} index={index} key={card.label} />
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <MarketWidget icon={ShieldCheck} label="Workspace" value={isAdmin ? "Admin" : "User"} />
          <MarketWidget icon={Layers3} label="Market Coverage" value="US Stocks" />
          <MarketWidget icon={Activity} label="Account State" value="Clean Start" />
        </div>
      </div>
    </section>
  );
}

function FloatingCard({ card, index }) {
  return (
    <MotionDiv
      animate={{ y: [0, index % 2 ? 8 : -8, 0] }}
      className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-xl shadow-black/20 backdrop-blur sm:p-5"
      transition={{ duration: 6 + index, repeat: Infinity, ease: "easeInOut" }}
      whileHover={{ y: -4, borderColor: "rgba(16,185,129,0.35)" }}
    >
      <div className="flex min-w-0 items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{card.label}</p>
          <p className="mt-2 text-2xl font-semibold text-white">{card.value}</p>
          <p className={cn("mt-2 text-sm", card.tone === "positive" ? "text-emerald-300" : "text-sky-300")}>
            {card.detail}
          </p>
        </div>
        <div className={cn("shrink-0 rounded-xl p-2.5", card.tone === "positive" ? "bg-emerald-400/10 text-emerald-300" : "bg-sky-400/10 text-sky-300")}>
          {createElement(card.icon, { className: "h-5 w-5", "aria-hidden": "true" })}
        </div>
      </div>
    </MotionDiv>
  );
}

function MarketWidget({ icon, label, value }) {
  return (
    <MotionDiv
      className="rounded-2xl border border-white/10 bg-slate-950/45 p-4 backdrop-blur"
      whileHover={{ y: -3, backgroundColor: "rgba(15,23,42,0.72)" }}
    >
      {createElement(icon, { className: "h-4 w-4 text-emerald-300", "aria-hidden": "true" })}
      <p className="mt-3 text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </MotionDiv>
  );
}
