import { createElement } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  BarChart3,
  BriefcaseBusiness,
  CalendarClock,
  CircleDollarSign,
  Layers3,
  LineChart,
  PieChart,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

import AllocationPieChart from "@/components/charts/AllocationPieChart";
import PortfolioGrowthChart from "@/components/charts/PortfolioGrowthChart";
import EmptyState from "@/components/common/EmptyState";
import AnimatedNumber from "@/components/motion/AnimatedNumber";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatCompactCurrency,
  formatCurrency,
  formatNumber,
  formatPercent,
} from "@/lib/formatters";
import { cn } from "@/lib/utils";

const MotionDiv = motion.div;
const MotionTr = motion.tr;

const metricConfig = [
  {
    accent: "emerald",
    formatter: formatCurrency,
    icon: BriefcaseBusiness,
    key: "portfolioValue",
    label: "Portfolio Value",
    meta: "Current market value",
  },
  {
    accent: "sky",
    formatter: formatCurrency,
    icon: TrendingUp,
    key: "totalReturn",
    label: "Total Return",
    metaKey: "totalReturnPercent",
  },
  {
    accent: "emerald",
    formatter: formatCurrency,
    icon: Activity,
    key: "dailyReturn",
    label: "Daily Return",
    metaKey: "dailyReturnPercent",
  },
  {
    accent: "amber",
    formatter: formatCurrency,
    icon: Banknote,
    key: "investedAmount",
    label: "Invested Amount",
    meta: "Capital deployed",
  },
  {
    accent: "violet",
    formatter: formatCurrency,
    icon: Wallet,
    key: "cashAvailable",
    label: "Cash Available",
    meta: "Ready to deploy",
  },
];

const eventIcons = {
  buy: ArrowUpRight,
  cash: CircleDollarSign,
  rebalance: RefreshCw,
  sell: ArrowDownRight,
};

export function PortfolioHero({ attentionItems, summary }) {
  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[radial-gradient(circle_at_18%_0%,rgba(16,185,129,0.18),transparent_36%),radial-gradient(circle_at_80%_20%,rgba(56,189,248,0.12),transparent_28%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(2,6,23,0.96))] p-5 shadow-2xl shadow-black/25 lg:p-6">
      <div className="pointer-events-none absolute -right-24 top-4 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-sky-400/10 blur-3xl" />

      <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 max-w-[300px] space-y-6 sm:max-w-none">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="positive">Portfolio Workstation</Badge>
            <Badge className="border-sky-400/25 bg-sky-400/10 text-sky-300" variant="info">
              Portfolio Analytics
            </Badge>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">Portfolio</p>
            <h1 className="mt-3 max-w-[300px] break-words text-2xl font-semibold tracking-tight text-white sm:max-w-3xl sm:text-3xl md:text-4xl">
              Manage performance, allocation, and position risk from one view.
            </h1>
            <p className="mt-3 max-w-[300px] text-sm leading-6 text-muted-foreground sm:max-w-2xl">
              Track what is driving returns, where cash is available, and which positions need attention before the next trade decision.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-5">
            {metricConfig.map((metric) => (
              <HeroMetric key={metric.key} metric={metric} summary={summary} />
            ))}
          </div>
        </div>

        <Card className="min-w-0 max-w-[300px] rounded-[1.5rem] border-white/10 bg-slate-950/45 sm:max-w-none">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <span className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-300">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold">Attention Board</p>
                <p className="mt-1 text-xs text-muted-foreground">Signals to review during this session.</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {attentionItems.map((item) => (
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4" key={item.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
                      <p className="mt-1 text-lg font-semibold">{item.value}</p>
                    </div>
                    <Badge variant={item.tone === "negative" ? "negative" : item.tone === "positive" ? "positive" : "info"}>
                      {item.tone}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.detail}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export function PerformanceCenterpiece({ growth, ranges, summary }) {
  return (
    <Card className="min-h-[520px] overflow-hidden rounded-[1.5rem]">
      <CardContent className="p-0">
        <div className="border-b border-white/10 p-5 lg:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <WidgetHeading
              eyebrow="Performance"
              icon={LineChart}
              subtitle="Portfolio growth and invested capital over the selected range."
              title="Equity curve control center"
            />

            <div className="flex flex-wrap gap-2">
              {ranges.map((range) => (
                <button
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                    range === "6M"
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

        <div className="grid xl:grid-cols-[minmax(0,1fr)_250px]">
          <div className="relative h-[360px] p-4 lg:h-[430px] lg:p-6">
            <div className="pointer-events-none absolute inset-x-8 top-14 h-44 rounded-full bg-emerald-400/5 blur-3xl" />
            <div className="relative h-full">
              <PortfolioGrowthChart data={growth} />
            </div>
          </div>
          <div className="grid border-t border-white/10 xl:border-l xl:border-t-0">
            <SideStat label="Current Value" value={formatCurrency(summary.portfolioValue)} />
            <SideStat label="Total Return" meta={formatPercent(summary.totalReturnPercent)} value={formatCurrency(summary.totalReturn)} />
            <SideStat label="Daily Return" meta={formatPercent(summary.dailyReturnPercent)} value={formatCurrency(summary.dailyReturn)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AllocationAnalysis({ sectorAllocation, stockAllocation }) {
  return (
    <Card className="overflow-hidden rounded-[1.5rem]">
      <CardContent className="p-5 lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <WidgetHeading
            eyebrow="Allocation"
            icon={PieChart}
            subtitle="Understand concentration by sector and by individual position."
            title="Allocation analysis"
          />
          <Badge variant="info">Concentration View</Badge>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          <AllocationPanel data={sectorAllocation} description="Sector weights show where portfolio exposure is concentrated." title="Sector Allocation" />
          <AllocationPanel data={stockAllocation} description="Cash and single-name weights show where portfolio attention is concentrated." title="Stock Allocation" />
        </div>
      </CardContent>
    </Card>
  );
}

export function WinnersLosersWidget({ losers, winners }) {
  return (
    <Card className="rounded-[1.5rem]">
      <CardContent>
        <WidgetHeading
          eyebrow="Winners & Losers"
          icon={Target}
          subtitle="Position-level contribution signals from current holdings."
          title="Performance drivers"
        />

        <div className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-1">
          <PerformerGroup icon={TrendingUp} items={winners} title="Top Performers" tone="positive" />
          <PerformerGroup icon={TrendingDown} items={losers} title="Worst Performers" tone="negative" />
        </div>
      </CardContent>
    </Card>
  );
}

export function HoldingsExperience({ holdings, onSelect, selectedHolding }) {
  return (
    <Card className="overflow-hidden rounded-[1.5rem]">
      <CardContent className="p-0">
        <div className="flex flex-col gap-4 border-b border-white/10 p-5 lg:flex-row lg:items-start lg:justify-between lg:p-6">
          <WidgetHeading
            eyebrow="Holdings"
            icon={Layers3}
            subtitle="Click a position to update the detail panel."
            title="Position book"
          />
          <div className="flex flex-wrap gap-2">
            <Badge variant="positive">{formatNumber(holdings.length)} Positions</Badge>
            <Badge variant="neutral">Account Data</Badge>
          </div>
        </div>

        {holdings.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] border-collapse text-left text-sm">
              <thead className="bg-slate-950/90 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-4 font-semibold">Symbol</th>
                  <th className="px-5 py-4 font-semibold">Quantity</th>
                  <th className="px-5 py-4 font-semibold">Avg Price</th>
                  <th className="px-5 py-4 font-semibold">Current Price</th>
                  <th className="px-5 py-4 font-semibold">Value</th>
                  <th className="px-5 py-4 font-semibold">P/L</th>
                  <th className="px-5 py-4 font-semibold">Allocation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {holdings.map((holding, index) => (
                  <HoldingRow
                    holding={holding}
                    index={index}
                    isSelected={selectedHolding?.id === holding.id}
                    key={holding.id}
                    onSelect={onSelect}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-5">
            <EmptyState
              description="Buy shares from the Trade or Buy/Sell page to start building this portfolio."
              title="No holdings yet"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PositionDetailPanel({ holding }) {
  if (!holding) {
    return (
      <Card className="rounded-[1.5rem]">
        <CardContent>
          <WidgetHeading
            eyebrow="Position"
            icon={ShieldCheck}
            subtitle="Select a holding to inspect position details."
            title="Position detail"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden rounded-[1.5rem] border-emerald-400/20 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_34%),rgba(15,23,42,0.86)]">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">Position Detail</p>
            <h2 className="mt-3 text-3xl font-semibold">{holding.symbol}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{holding.company}</p>
          </div>
          <Badge variant={holding.pnl >= 0 ? "positive" : "negative"}>{formatPercent(holding.pnlPercent)}</Badge>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/45 p-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Position Value</p>
              <p className="mt-2 text-2xl font-semibold">{formatCurrency(holding.value)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Gain/Loss</p>
              <p className={cn("mt-2 text-lg font-semibold", holding.pnl >= 0 ? "text-emerald-300" : "text-red-300")}>
                {formatCurrency(holding.pnl)}
              </p>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className={cn("h-full rounded-full", holding.pnl >= 0 ? "bg-emerald-400" : "bg-red-400")}
              style={{ width: Math.min(Math.max(holding.allocationPercent * 5, 8), 100) + "%" }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{formatPercent(holding.allocationPercent)} of total portfolio value</p>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <DetailMetric label="Shares" value={formatNumber(holding.quantity)} />
          <DetailMetric label="Sector" value={holding.sector} />
          <DetailMetric label="Avg Price" value={formatCurrency(holding.avgPrice)} />
          <DetailMetric label="Current Price" value={formatCurrency(holding.currentPrice)} />
        </div>
      </CardContent>
    </Card>
  );
}

export function PortfolioActivityTimeline({ events }) {
  return (
    <Card className="rounded-[1.5rem]">
      <CardContent>
        <WidgetHeading
          eyebrow="Activity"
          icon={CalendarClock}
          subtitle="Recent buys, sells, cash updates, and portfolio events."
          title="Portfolio timeline"
        />

        <div className="mt-6 space-y-1">
          {events.length ? (
            events.map((event, index) => (
              <TimelineEvent event={event} index={index} key={event.id} />
            ))
          ) : (
            <EmptyState
              description="Executed buys, sells, and portfolio events will appear here."
              title="No portfolio activity yet"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function HeroMetric({ metric, summary }) {
  const Icon = metric.icon;
  const value = summary[metric.key];
  const meta = metric.metaKey ? formatPercent(summary[metric.metaKey]) : metric.meta;
  const positive = typeof value === "number" && value >= 0;

  return (
    <MotionDiv
      className="min-w-0 rounded-2xl border border-white/10 bg-slate-950/45 p-4"
      initial={{ opacity: 0, y: 14 }}
      transition={{ duration: 0.35 }}
      viewport={{ once: true }}
      whileHover={{ y: -3, scale: 1.01 }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{metric.label}</p>
        <span className={cn("rounded-xl p-2", accentClass(metric.accent))}>
          {createElement(Icon, { className: "h-4 w-4", "aria-hidden": "true" })}
        </span>
      </div>
      <p className="text-2xl font-semibold tracking-tight text-white">
        <AnimatedNumber format={metric.formatter} value={value} />
      </p>
      <p className={cn("mt-2 text-xs font-semibold", meta.startsWith("+") || positive ? "text-emerald-300" : "text-muted-foreground")}>{meta}</p>
    </MotionDiv>
  );
}

function AllocationPanel({ data, description, title }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-[210px_minmax(0,1fr)]">
        <div className="h-[220px]">
          <AllocationPieChart data={data} />
        </div>
        <div className="space-y-2 self-center">
          {data.slice(0, 6).map((item) => (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2" key={item.label}>
              <div className="flex min-w-0 items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="truncate text-sm font-medium">{item.label}</span>
              </div>
              <span className="text-xs font-semibold text-muted-foreground">{formatPercent(item.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PerformerGroup({ icon: Icon, items, title, tone }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
      <div className="mb-4 flex items-center gap-3">
        <span className={cn("rounded-xl p-2", tone === "positive" ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300")}>
          {createElement(Icon, { className: "h-4 w-4", "aria-hidden": "true" })}
        </span>
        <p className="text-sm font-semibold">{title}</p>
      </div>
      <div className="space-y-3">
        {items.length ? items.map((holding) => {
          const isPositive = holding.pnlPercent >= 0;

          return (
            <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.025] p-3" key={holding.id}>
              <div className="min-w-0">
                <p className="font-semibold">{holding.symbol}</p>
                <p className="truncate text-xs text-muted-foreground">{holding.company}</p>
              </div>
              <div className="text-right">
                <p className={cn("font-semibold", isPositive ? "text-emerald-300" : "text-red-300")}>{formatPercent(holding.pnlPercent)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatCompactCurrency(holding.value)}</p>
              </div>
            </div>
          );
        }) : (
          <EmptyState
            description="Positions will appear here after the first completed order."
            title="No positions yet"
          />
        )}
      </div>
    </div>
  );
}

function HoldingRow({ holding, index, isSelected, onSelect }) {
  const positive = holding.pnl >= 0;

  return (
    <MotionTr
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "cursor-pointer bg-card/35 transition hover:bg-slate-900/85",
        isSelected && "bg-emerald-500/[0.08] outline outline-1 outline-emerald-400/20",
      )}
      initial={{ opacity: 0, y: 8 }}
      onClick={() => onSelect(holding)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          onSelect(holding);
        }
      }}
      role="button"
      tabIndex={0}
      transition={{ delay: Math.min(index * 0.025, 0.18), duration: 0.28 }}
    >
      <td className="px-5 py-4 align-middle">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/65 text-sm font-semibold text-emerald-300">
            {holding.symbol.slice(0, 2)}
          </span>
          <div>
            <p className="font-semibold text-white">{holding.symbol}</p>
            <p className="text-xs text-muted-foreground">{holding.company}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-4 align-middle">{formatNumber(holding.quantity)}</td>
      <td className="px-5 py-4 align-middle">{formatCurrency(holding.avgPrice)}</td>
      <td className="px-5 py-4 align-middle">{formatCurrency(holding.currentPrice)}</td>
      <td className="px-5 py-4 align-middle font-semibold">{formatCurrency(holding.value)}</td>
      <td className="px-5 py-4 align-middle">
        <div className={cn("font-semibold", positive ? "text-emerald-300" : "text-red-300")}>{formatCurrency(holding.pnl)}</div>
        <div className="mt-1 text-xs text-muted-foreground">{formatPercent(holding.pnlPercent)}</div>
      </td>
      <td className="px-5 py-4 align-middle">
        <div className="flex items-center gap-3">
          <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full rounded-full bg-emerald-400" style={{ width: Math.min(Math.max(holding.allocationPercent * 6, 8), 100) + "%" }} />
          </div>
          <span className="text-xs font-semibold text-muted-foreground">{formatPercent(holding.allocationPercent)}</span>
        </div>
      </td>
    </MotionTr>
  );
}

function TimelineEvent({ event, index }) {
  const Icon = eventIcons[event.type] || Activity;

  return (
    <MotionDiv
      className="relative pl-10"
      initial={{ opacity: 0, y: 12 }}
      transition={{ delay: Math.min(index * 0.05, 0.25), duration: 0.35 }}
      viewport={{ once: true }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      <span className="absolute left-4 top-10 h-full w-px bg-white/10" aria-hidden="true" />
      <span className="absolute left-0 top-1 flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-slate-950 text-emerald-300">
        {createElement(Icon, { className: "h-4 w-4", "aria-hidden": "true" })}
      </span>
      <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4 transition-colors hover:border-emerald-400/20">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">{event.title}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{event.description}</p>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">{event.time}</span>
        </div>
      </div>
    </MotionDiv>
  );
}

function DetailMetric({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 font-semibold">{value}</p>
    </div>
  );
}

function SideStat({ label, meta, value }) {
  return (
    <div className="border-b border-white/10 p-5 last:border-b-0">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
      {meta ? <p className={cn("mt-2 text-xs font-semibold", meta.startsWith("+") ? "text-emerald-300" : "text-red-300")}>{meta}</p> : null}
    </div>
  );
}

function WidgetHeading({ eyebrow, icon: Icon, subtitle, title }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="rounded-xl bg-emerald-500/10 p-2 text-emerald-300">
          {createElement(Icon, { className: "h-4 w-4", "aria-hidden": "true" })}
        </span>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">{eyebrow}</p>
      </div>
      <h2 className="mt-4 text-2xl font-semibold tracking-tight">{title}</h2>
      {subtitle ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}

function accentClass(accent) {
  const accents = {
    amber: "bg-amber-500/10 text-amber-300",
    emerald: "bg-emerald-500/10 text-emerald-300",
    sky: "bg-sky-500/10 text-sky-300",
    violet: "bg-violet-500/10 text-violet-300",
  };

  return accents[accent] || accents.emerald;
}
