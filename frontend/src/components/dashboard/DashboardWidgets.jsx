import { createElement } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  CalendarClock,
  CandlestickChart,
  Clock3,
  LineChart,
  Newspaper,
  PieChart,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

import PortfolioGrowthChart from "@/components/charts/PortfolioGrowthChart";
import EmptyState from "@/components/common/EmptyState";
import AnimatedNumber from "@/components/motion/AnimatedNumber";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCompactCurrency, formatCurrency, formatPercent } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const MotionDiv = motion.div;

const heroMetrics = [
  { key: "portfolioValue", label: "Total Portfolio Value", icon: BriefcaseBusiness, accent: "emerald" },
  { key: "todayPnl", label: "Today's P&L", icon: TrendingUp, accent: "emerald" },
  { key: "totalReturn", label: "Total Return", icon: PieChart, accent: "sky" },
  { key: "cashAvailable", label: "Cash Available", icon: Wallet, accent: "amber" },
];

const activityIcons = {
  info: RefreshCw,
  negative: ArrowDownRight,
  positive: ArrowUpRight,
  warning: Clock3,
};

export function DashboardHero({ attentionItems, greeting, marketSummary, name, snapshot, summary }) {
  const hasPositions = summary.holdingsCount > 0;
  const commandBrief = [
    {
      icon: Activity,
      label: "Today's Focus",
      value: hasPositions ? "Review positions" : "Set up funding",
      detail: hasPositions ? formatPercent(snapshot.todayPnlPercent) + " intraday P&L" : "No position movement yet",
    },
    {
      icon: Wallet,
      label: "Buying Power",
      value: formatCompactCurrency(summary.cashAvailable),
      detail: "Available for new ideas",
    },
    {
      icon: Sparkles,
      label: "Next Review",
      value: marketSummary.countdownValue,
      detail: marketSummary.countdownLabel,
    },
  ];
  const metricValue = {
    cashAvailable: summary.cashAvailable,
    portfolioValue: summary.portfolioValue,
    todayPnl: snapshot.todayPnl,
    totalReturn: summary.totalReturn,
  };

  const metricMeta = {
    cashAvailable: "Ready to deploy",
    portfolioValue: snapshot.portfolioTrend,
    todayPnl: formatPercent(snapshot.todayPnlPercent),
    totalReturn: formatPercent(summary.totalReturnPercent),
  };

  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[radial-gradient(circle_at_20%_0%,rgba(16,185,129,0.16),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(2,6,23,0.95))] p-5 shadow-2xl shadow-black/25 lg:p-6">
      <div className="pointer-events-none absolute -right-20 top-4 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-sky-400/10 blur-3xl" />

      <div className="relative grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="positive">Trading Command Center</Badge>
            <span className="text-xs text-muted-foreground">{marketSummary.updatedAt}</span>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">Dashboard</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
              {greeting}, {name}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Review your account balance, open positions, funding requests, and current market context from one place.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
            {heroMetrics.map((metric) => (
              <SnapshotTile
                accent={metric.accent}
                icon={metric.icon}
                key={metric.key}
                label={metric.label}
                meta={metricMeta[metric.key]}
                value={metricValue[metric.key]}
              />
            ))}
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            {commandBrief.map((item) => (
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4" key={item.label}>
                <div className="flex items-center gap-3">
                  <span className="rounded-xl bg-emerald-500/10 p-2 text-emerald-300">
                    {createElement(item.icon, { className: "h-4 w-4", "aria-hidden": "true" })}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
                    <p className="mt-1 truncate text-sm font-semibold">{item.value}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-1">
          <MarketSessionCard marketSummary={marketSummary} />
          <AttentionStack items={attentionItems} />
        </div>
      </div>
    </section>
  );
}

export function MarketOverviewStrip({ indices }) {
  return (
    <section className="space-y-4">
      <WidgetHeader
        eyebrow="Market Overview"
        icon={CandlestickChart}
        subtitle="Major US index pulse for the current session."
        title="Session snapshot"
      />
      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
        {indices.map((index, itemIndex) => (
          <MotionDiv
            className="group overflow-hidden rounded-2xl border border-white/10 bg-card/80 p-4 shadow-sm shadow-black/20 transition-colors hover:border-emerald-400/25 hover:bg-card"
            initial={{ opacity: 0, y: 14 }}
            key={index.id}
            transition={{ delay: itemIndex * 0.04, duration: 0.35 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.01, y: -3 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{index.label}</p>
                <p className="mt-2 text-2xl font-semibold">{formatMarketValue(index.value)}</p>
              </div>
              <ChangePill value={index.changePercent} />
            </div>
            <MiniTrend positive={index.changePercent >= 0} seed={itemIndex} />
          </MotionDiv>
        ))}
      </div>
    </section>
  );
}

export function PortfolioPerformanceArea({ growth, ranges, snapshot, summary }) {
  return (
    <Card className="min-h-[520px] overflow-hidden rounded-[1.5rem]">
      <CardContent className="p-0">
        <div className="border-b border-white/10 p-5 lg:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-xl bg-emerald-500/10 p-2 text-emerald-300">
                  <LineChart className="h-4 w-4" aria-hidden="true" />
                </span>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Portfolio Performance</p>
              </div>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight">Equity curve command view</h2>
              <p className="mt-2 text-sm text-muted-foreground">Portfolio growth, invested capital, and current trend for the selected range.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {ranges.map((range) => (
                <button
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                    range === snapshot.activeRange
                      ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
                      : "border-white/10 bg-slate-950/40 text-muted-foreground hover:border-white/20 hover:text-white",
                  )}
                  key={range}
                  type="button"
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-0 xl:grid-cols-[1fr_240px]">
          <div className="relative h-[360px] p-4 lg:h-[420px] lg:p-6">
            <div className="pointer-events-none absolute inset-x-10 top-12 h-40 rounded-full bg-emerald-400/5 blur-3xl" />
            <div className="relative h-full">
              <PortfolioGrowthChart animated={false} data={growth} />
            </div>
          </div>
          <div className="grid border-t border-white/10 xl:border-l xl:border-t-0">
            <PerformanceStat label="Current Value" value={formatCurrency(summary.portfolioValue)} />
            <PerformanceStat label="Total Return" meta={formatPercent(summary.totalReturnPercent)} value={formatCurrency(summary.totalReturn)} />
            <PerformanceStat label="Cash Weight" meta="Available buying power" value={formatCompactCurrency(summary.cashAvailable)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TopMoversWidget({ gainers, losers }) {
  return (
    <Card className="rounded-[1.5rem]">
      <CardContent>
        <WidgetHeader
          eyebrow="Top Movers"
          icon={Activity}
          subtitle="Session leaders and laggards."
          title="Momentum board"
        />
        <div className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-1">
          <MoverGroup icon={TrendingUp} items={gainers} title="Top Gainers" tone="positive" />
          <MoverGroup icon={TrendingDown} items={losers} title="Top Losers" tone="negative" />
        </div>
      </CardContent>
    </Card>
  );
}

export function WatchlistWidget({ stocks }) {
  return (
    <Card className="rounded-[1.5rem]">
      <CardContent>
        <WidgetHeader
          eyebrow="Watchlist"
          icon={Bell}
          subtitle="High-signal names to watch next."
          title="Focus symbols"
        />
        <div className="mt-5 space-y-3">
          {stocks.length ? (
            stocks.map((stock) => (
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/45 p-3" key={stock.symbol}>
                <div className="min-w-0">
                  <p className="font-semibold">{stock.symbol}</p>
                  <p className="truncate text-xs text-muted-foreground">{stock.company}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(stock.price)}</p>
                  <ChangePill compact value={stock.changePercent} />
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              description="Saved symbols will appear here after you add them to a watchlist."
              title="No watchlist symbols"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function MarketNewsWidget({ news }) {
  return (
    <Card className="rounded-[1.5rem]">
      <CardContent>
        <WidgetHeader
          eyebrow="Market News"
          icon={Newspaper}
          subtitle="Market context for the current session."
          title="What traders are watching"
        />
        <div className="mt-5 grid gap-3">
          {news.length ? (
            news.map((item, index) => (
              <MotionDiv
                className="rounded-2xl border border-white/10 bg-slate-950/45 p-4 transition-colors hover:border-sky-400/25"
                initial={{ opacity: 0, y: 12 }}
                key={item.id}
                transition={{ delay: index * 0.05, duration: 0.35 }}
                viewport={{ once: true }}
                whileHover={{ x: 3 }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <p className="text-sm font-semibold leading-6">{item.headline}</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{item.source}</span>
                  <span className="h-1 w-1 rounded-full bg-slate-600" />
                  <span>{item.time}</span>
                </div>
              </MotionDiv>
            ))
          ) : (
            <EmptyState
              description="No headlines are available right now."
              title="No market headlines"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ActivityTimeline({ items }) {
  return (
    <Card className="rounded-[1.5rem]">
      <CardContent>
        <WidgetHeader
          eyebrow="Recent Activity"
          icon={CalendarClock}
          subtitle="A timeline of the latest account events."
          title="What changed recently"
        />
        <div className="mt-6 space-y-1">
          {items.length ? (
            items.map((item, index) => (
              <TimelineItem index={index} item={item} key={item.id} />
            ))
          ) : (
            <EmptyState
              description="Deposit requests and completed trades will appear here after you start using the account."
              title="No account activity yet"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SnapshotTile({ accent, icon, label, meta, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <span className={cn("rounded-xl p-2", accentClass(accent))}>
          {createElement(icon, { className: "h-4 w-4", "aria-hidden": "true" })}
        </span>
      </div>
      <p className="text-2xl font-semibold tracking-tight text-white">
        <AnimatedNumber format={formatCurrency} value={value} />
      </p>
      <p className={cn("mt-2 text-xs font-semibold", meta.startsWith("+") ? "text-emerald-300" : "text-muted-foreground")}>{meta}</p>
    </div>
  );
}

function MarketSessionCard({ marketSummary }) {
  return (
    <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/[0.055] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">Market Status</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">{marketSummary.status === "OPEN" ? "Market Open" : "Market Closed"}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{marketSummary.sessionLabel || marketSummary.session}</p>
        </div>
        <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
          <span className="absolute h-3 w-3 animate-ping rounded-full bg-emerald-300/40" />
          <Activity className="relative h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-3">
          <p className="text-xs text-muted-foreground">{marketSummary.countdownLabel}</p>
          <p className="mt-1 text-lg font-semibold">{marketSummary.countdownValue}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-3">
          <p className="text-xs text-muted-foreground">Signal</p>
          <p className="mt-1 text-lg font-semibold text-emerald-300">Active</p>
        </div>
      </div>
    </div>
  );
}

function AttentionStack({ items }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-emerald-300" aria-hidden="true" />
        <p className="text-sm font-semibold">Needs attention</p>
      </div>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3" key={item.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
                <p className="mt-1 font-semibold">{item.value}</p>
              </div>
              <Badge variant={item.tone === "warning" ? "warning" : item.tone === "positive" ? "positive" : "neutral"}>{item.tone}</Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{item.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MoverGroup({ icon, items, title, tone }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
      <div className="mb-4 flex items-center gap-2">
        <span className={cn("rounded-xl p-2", tone === "positive" ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300")}>
          {createElement(icon, { className: "h-4 w-4", "aria-hidden": "true" })}
        </span>
        <p className="text-sm font-semibold">{title}</p>
      </div>
      <div className="space-y-2">
        {items.map((stock) => (
          <div className="flex items-center justify-between gap-3" key={stock.symbol}>
            <div>
              <p className="font-semibold">{stock.symbol}</p>
              <p className="text-xs text-muted-foreground">{formatCurrency(stock.price)}</p>
            </div>
            <ChangePill value={stock.changePercent} />
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineItem({ index, item }) {
  const icon = activityIcons[item.tone] || RefreshCw;
  const isLast = false;

  return (
    <MotionDiv
      className="relative grid grid-cols-[32px_1fr] gap-3 pb-5"
      initial={{ opacity: 0, y: 12 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      viewport={{ once: true }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      <div className="relative flex justify-center">
        {!isLast ? <div className="absolute bottom-0 top-9 w-px bg-white/10" /> : null}
        <span className={cn("relative z-10 flex h-8 w-8 items-center justify-center rounded-xl", timelineToneClass(item.tone))}>
          {createElement(icon, { className: "h-4 w-4", "aria-hidden": "true" })}
        </span>
      </div>
      <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-semibold">{item.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">{item.time}</span>
        </div>
      </div>
    </MotionDiv>
  );
}

function PerformanceStat({ label, meta, value }) {
  return (
    <div className="border-b border-white/10 p-5 last:border-b-0 xl:min-h-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
      {meta ? <p className="mt-2 text-xs font-semibold text-emerald-300">{meta}</p> : null}
    </div>
  );
}

function WidgetHeader({ eyebrow, icon, subtitle, title }) {
  return (
    <div className="flex items-start gap-3">
      <span className="rounded-xl bg-emerald-500/10 p-2 text-emerald-300">
        {createElement(icon, { className: "h-4 w-4", "aria-hidden": "true" })}
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">{eyebrow}</p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

function ChangePill({ compact = false, value }) {
  const positive = value >= 0;
  const icon = positive ? ArrowUpRight : ArrowDownRight;

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold", positive ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-red-500/30 bg-red-500/10 text-red-300", compact && "mt-1")}>
      {createElement(icon, { className: "h-3 w-3", "aria-hidden": "true" })}
      {formatPercent(value)}
    </span>
  );
}

function MiniTrend({ positive, seed }) {
  const bars = [36, 52, 44, 68, 58, 78].map((height) => height + seed * 2);

  return (
    <div className="mt-5 flex h-12 items-end gap-1.5">
      {bars.map((height, index) => (
        <span
          className={cn("flex-1 rounded-t-full", positive ? "bg-emerald-400/25 group-hover:bg-emerald-300/40" : "bg-red-400/25 group-hover:bg-red-300/40")}
          key={String(height) + index}
          style={{ height: String(Math.min(height, 90)) + "%" }}
        />
      ))}
    </div>
  );
}

function accentClass(accent) {
  const classes = {
    amber: "bg-amber-500/10 text-amber-300",
    emerald: "bg-emerald-500/10 text-emerald-300",
    sky: "bg-sky-500/10 text-sky-300",
  };

  return classes[accent] || classes.emerald;
}

function timelineToneClass(tone) {
  const classes = {
    info: "bg-sky-500/10 text-sky-300",
    negative: "bg-red-500/10 text-red-300",
    positive: "bg-emerald-500/10 text-emerald-300",
    warning: "bg-amber-500/10 text-amber-300",
  };

  return classes[tone] || classes.info;
}

function formatMarketValue(value) {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}
