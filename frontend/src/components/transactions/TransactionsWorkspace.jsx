import { createElement } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileText,
  Filter,
  ReceiptText,
  Search,
  Send,
  TrendingUp,
  Wallet,
  XCircle,
} from "lucide-react";

import AnimatedNumber from "@/components/motion/AnimatedNumber";
import EmptyState from "@/components/common/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatCompactCurrency, formatCurrency, formatNumber } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const MotionDiv = motion.div;

const heroMetrics = [
  { accent: "emerald", formatter: formatCurrency, icon: Wallet, key: "cashBalance", label: "Cash Balance", meta: "Available to deploy" },
  { accent: "amber", formatter: formatCurrency, icon: Clock3, key: "pendingDeposits", label: "Pending Deposits", meta: "Awaiting admin approval" },
  { accent: "sky", formatter: formatCurrency, icon: CheckCircle2, key: "approvedDeposits", label: "Approved Deposits", meta: "Recently funded" },
  { accent: "violet", formatter: formatCurrency, icon: Banknote, key: "totalDeposited", label: "Total Deposited", meta: "Approved funding total" },
];

const timelineIcons = {
  buy: ArrowDownRight,
  "deposit-approved": CheckCircle2,
  "deposit-rejected": XCircle,
  "deposit-requested": Send,
  sell: ArrowUpRight,
};

export function AccountHero({ summary }) {
  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[radial-gradient(circle_at_16%_0%,rgba(16,185,129,0.18),transparent_34%),radial-gradient(circle_at_80%_14%,rgba(56,189,248,0.12),transparent_30%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(2,6,23,0.96))] p-5 shadow-2xl shadow-black/25 lg:p-6">
      <div className="pointer-events-none absolute -right-24 top-8 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-56 w-56 rounded-full bg-sky-400/10 blur-3xl" />

      <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 max-w-[300px] space-y-6 sm:max-w-none">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="positive">Account Center</Badge>
            <Badge className="border-sky-400/25 bg-sky-400/10 text-sky-300" variant="info">Account Ledger</Badge>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">Transactions</p>
            <h1 className="mt-3 max-w-[300px] break-words text-2xl font-semibold tracking-tight text-white sm:max-w-3xl sm:text-3xl md:text-4xl">
              Manage cash requests, funding status, and trading activity from one account view.
            </h1>
            <p className="mt-3 max-w-[300px] text-sm leading-6 text-muted-foreground sm:max-w-2xl">
              Track available cash, pending approvals, recent trades, and the full account ledger.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
            {heroMetrics.map((metric) => (
              <HeroMetric key={metric.key} metric={metric} summary={summary} />
            ))}
          </div>
        </div>

        <Card className="min-w-0 max-w-[300px] rounded-[1.5rem] border-emerald-400/20 bg-slate-950/45 sm:max-w-none">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">Cash Health</p>
                <h2 className="mt-3 text-4xl font-semibold text-white">
                  <AnimatedNumber format={formatCompactCurrency} value={summary.cashBalance} />
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">Ready for trades after approvals settle.</p>
              </div>
              <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
                <span className="absolute h-3 w-3 animate-ping rounded-full bg-emerald-300/40" />
                <CircleDollarSign className="relative h-5 w-5" aria-hidden="true" />
              </span>
            </div>

            <div className="mt-6 grid gap-3">
              <HeroSideStat label="Pending Requests" tone="warning" value={summary.pendingCount} />
              <HeroSideStat label="Approved Requests" tone="positive" value={summary.approvedCount} />
              <HeroSideStat label="Rejected Requests" tone="negative" value={summary.rejectedCount} />
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export function DepositRequestCenter({
  draft,
  isSubmitting = false,
  onAmountChange,
  onNotesChange,
  onSubmit,
  pendingCount,
  pendingTotal,
}) {
  return (
    <Card className="overflow-hidden rounded-[1.5rem] border-emerald-400/15">
      <CardContent className="p-0">
        <div className="border-b border-white/10 p-5 lg:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <WidgetHeading
              eyebrow="Deposit Request"
              icon={Send}
              subtitle="Create a funding request for admin approval."
              title="Deposit request center"
            />
            <Badge variant="warning">{pendingCount} Pending</Badge>
          </div>
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Amount</span>
              <Input
                min="1"
                onChange={(event) => onAmountChange?.(Number(event.target.value) || 0)}
                type="number"
                value={draft.amount}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes</span>
              <textarea
                className="min-h-28 w-full rounded-lg border border-input bg-slate-950/70 p-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                onChange={(event) => onNotesChange?.(event.target.value)}
                value={draft.notes}
              />
            </label>
            <Button className="h-12 w-full rounded-xl shadow-lg shadow-emerald-500/10" disabled={isSubmitting} onClick={onSubmit} size="lg">
              <Send className="mr-2 h-4 w-4" aria-hidden="true" />
              {isSubmitting ? "Requesting..." : "Request Deposit"}
            </Button>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Request Summary</p>
              <p className="mt-3 text-2xl font-semibold">{formatCurrency(draft.amount)}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{draft.notes}</p>
            </div>
            <InfoCard label="Admin Approval" value="Required" />
            <InfoCard label="Current Pending" value={formatCurrency(pendingTotal)} />
            <InfoCard label="Processing State" value="Queued for review" />
            <p className="text-xs leading-5 text-muted-foreground">{draft.processingEstimate}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function RequestStatusWidget({ statuses }) {
  return (
    <Card className="rounded-[1.5rem]">
      <CardContent>
        <WidgetHeading
          eyebrow="Request Status"
          icon={ReceiptText}
          subtitle="Deposit requests grouped by current status."
          title="Funding status"
        />
        <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
          {statuses.map((status) => (
            <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4" key={status.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{status.label}</p>
                  <p className="mt-2 text-2xl font-semibold">{formatNumber(status.count)}</p>
                </div>
                <StatusBadge status={status.label.toUpperCase()} />
              </div>
              <p className={cn("mt-3 text-sm font-semibold", toneTextClass(status.tone))}>{formatCurrency(status.amount)}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function TransactionTimeline({ items }) {
  return (
    <Card className="rounded-[1.5rem]">
      <CardContent>
        <WidgetHeading
          eyebrow="Activity Timeline"
          icon={Clock3}
          subtitle="Recent funding and trade activity in account-center format."
          title="Transaction timeline"
        />
        <div className="mt-6 space-y-1">
          {items.length ? (
            items.map((item, index) => (
              <TimelineItem index={index} item={item} key={item.id} />
            ))
          ) : (
            <EmptyState
              description="Deposit requests and executed trades will appear here as they happen."
              title="No account activity yet"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function TransactionHistory({ filters, onFilterChange, rows }) {
  return (
    <Card className="overflow-hidden rounded-[1.5rem]">
      <CardContent className="p-0">
        <div className="border-b border-white/10 p-5 lg:p-6">
          <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:justify-between">
            <WidgetHeading
              eyebrow="Detailed History"
              icon={FileText}
              subtitle={"Showing " + rows.length + " filtered ledger events."}
              title="Transaction history"
            />
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <label className="relative sm:col-span-2 xl:col-span-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  className="h-11 rounded-xl pl-9"
                  onChange={(event) => onFilterChange("search", event.target.value)}
                  placeholder="Search detail or type"
                  value={filters.search}
                />
              </label>
              <FilterSelect
                label="Type"
                onChange={(value) => onFilterChange("type", value)}
                options={[
                  { label: "All Types", value: "All" },
                  { label: "Deposits", value: "DEPOSIT" },
                  { label: "Buys", value: "BUY" },
                  { label: "Sells", value: "SELL" },
                ]}
                value={filters.type}
              />
              <FilterSelect
                label="Status"
                onChange={(value) => onFilterChange("status", value)}
                options={[
                  { label: "All Statuses", value: "All" },
                  { label: "Approved", value: "APPROVED" },
                  { label: "Pending", value: "PENDING" },
                  { label: "Rejected", value: "REJECTED" },
                ]}
                value={filters.status}
              />
              <FilterSelect
                label="Sort"
                onChange={(value) => onFilterChange("sort", value)}
                options={[
                  { label: "Newest First", value: "newest" },
                  { label: "Amount High", value: "amount-desc" },
                  { label: "Amount Low", value: "amount-asc" },
                ]}
                value={filters.sort}
              />
            </div>
          </div>
        </div>

        <div className="space-y-3 p-5">
          <div className="hidden rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:grid lg:grid-cols-[0.8fr_0.8fr_0.9fr_minmax(140px,1fr)_0.9fr] lg:items-center lg:gap-4">
            <span>Date</span>
            <span>Type</span>
            <span>Status</span>
            <span>Detail</span>
            <span className="text-right">Amount</span>
          </div>
          {rows.length ? (
            rows.map((row, index) => (
              <HistoryRow index={index} key={row.id} row={row} />
            ))
          ) : (
            <EmptyState
              description="Change filters or submit a deposit/trade to populate the account ledger."
              title="No transactions match"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function AccountInsights({ insights }) {
  return (
    <Card className="rounded-[1.5rem]">
      <CardContent>
        <WidgetHeading
          eyebrow="Account Insights"
          icon={TrendingUp}
          subtitle="Compact money movement metrics from the account ledger."
          title="Cash movement"
        />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          {insights.map((insight) => (
            <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4" key={insight.id}>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{insight.label}</p>
              <p className="mt-2 text-2xl font-semibold">
                <AnimatedNumber
                  format={insight.type === "currency" ? formatCurrency : formatNumber}
                  value={insight.value}
                />
              </p>
              <p className="mt-2 text-xs text-muted-foreground">{insight.detail}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ActivitySummary({ items }) {
  return (
    <Card className="rounded-[1.5rem]">
      <CardContent>
        <WidgetHeading
          eyebrow="Summary"
          icon={Activity}
          subtitle="Last meaningful account events at a glance."
          title="Activity summary"
        />
        <div className="mt-5 space-y-3">
          {items.map((item) => (
            <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4" key={item.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{item.label}</p>
                  <p className="mt-1 font-semibold">{item.value}</p>
                </div>
                <span className={cn("rounded-xl p-2", toneClass(item.tone))}>
                  <Activity className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{item.detail}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function HeroMetric({ metric, summary }) {
  const value = summary[metric.key];

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
          {createElement(metric.icon, { className: "h-4 w-4", "aria-hidden": "true" })}
        </span>
      </div>
      <p className="text-2xl font-semibold tracking-tight text-white">
        <AnimatedNumber format={metric.formatter} value={value} />
      </p>
      <p className="mt-2 text-xs font-semibold text-muted-foreground">{metric.meta}</p>
    </MotionDiv>
  );
}

function HeroSideStat({ label, tone, value }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
      <p className="text-sm font-semibold">{label}</p>
      <span className={cn("rounded-full border px-2.5 py-1 text-xs font-semibold", toneBadgeClass(tone))}>{formatNumber(value)}</span>
    </div>
  );
}

function TimelineItem({ index, item }) {
  const Icon = timelineIcons[item.type] || Activity;
  const positiveAmount = item.amount >= 0;

  return (
    <MotionDiv
      className="relative pl-10"
      initial={{ opacity: 0, y: 12 }}
      transition={{ delay: Math.min(index * 0.05, 0.25), duration: 0.35 }}
      viewport={{ once: true }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      <span className="absolute left-4 top-10 h-full w-px bg-white/10" aria-hidden="true" />
      <span className={cn("absolute left-0 top-1 flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-slate-950", positiveAmount ? "text-emerald-300" : "text-sky-300")}>
        {createElement(Icon, { className: "h-4 w-4", "aria-hidden": "true" })}
      </span>
      <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4 transition-colors hover:border-emerald-400/20">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">{item.title}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p>
          </div>
          <div className="text-right">
            <p className={cn("text-sm font-semibold", positiveAmount ? "text-emerald-300" : "text-red-300")}>{formatSignedCurrency(item.amount)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.time}</p>
          </div>
        </div>
        <div className="mt-3">
          <StatusBadge status={item.status} />
        </div>
      </div>
    </MotionDiv>
  );
}

function HistoryRow({ index, row }) {
  return (
    <MotionDiv
      className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/45 p-4 transition hover:border-emerald-400/25 hover:bg-slate-900/80 lg:grid-cols-[0.8fr_0.8fr_0.9fr_minmax(140px,1fr)_0.9fr] lg:items-center"
      initial={{ opacity: 0, y: 8 }}
      transition={{ delay: Math.min(index * 0.025, 0.18), duration: 0.28 }}
      viewport={{ once: true }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      <div className="text-sm text-muted-foreground">{row.date}</div>
      <div>
        <TypeBadge type={row.type} />
      </div>
      <div>
        <StatusBadge status={row.status} />
      </div>
      <div className="text-sm text-muted-foreground">{row.detail}</div>
      <div className={cn("font-semibold lg:text-right", row.amount >= 0 ? "text-emerald-300" : "text-red-300")}>
        {formatSignedCurrency(row.amount)}
      </div>
    </MotionDiv>
  );
}

function FilterSelect({ label, onChange, options, value }) {
  return (
    <label className="flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-slate-950/45 px-3">
      <Filter className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span className="sr-only">{label}</span>
      <Select
        aria-label={label}
        className="h-auto w-full border-0 bg-transparent px-0 focus:ring-0"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </label>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 font-semibold">{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const normalized = status.toLowerCase();
  const variantMap = {
    approved: "approved",
    pending: "pending",
    rejected: "rejected",
  };

  return <Badge variant={variantMap[normalized] || "neutral"}>{status}</Badge>;
}

function TypeBadge({ type }) {
  const variant = type === "BUY" ? "negative" : type === "SELL" ? "positive" : "info";
  return <Badge variant={variant}>{type}</Badge>;
}

function WidgetHeading({ eyebrow, icon, subtitle, title }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="rounded-xl bg-emerald-500/10 p-2 text-emerald-300">
          {createElement(icon, { className: "h-4 w-4", "aria-hidden": "true" })}
        </span>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">{eyebrow}</p>
      </div>
      <h2 className="mt-4 text-2xl font-semibold tracking-tight">{title}</h2>
      {subtitle ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}

function formatSignedCurrency(value) {
  const prefix = value > 0 ? "+" : value < 0 ? "-" : "";
  return prefix + formatCurrency(Math.abs(value));
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

function toneBadgeClass(tone) {
  const tones = {
    negative: "border-red-500/30 bg-red-500/10 text-red-300",
    positive: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    warning: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  };

  return tones[tone] || tones.positive;
}

function toneClass(tone) {
  const tones = {
    info: "bg-sky-500/10 text-sky-300",
    negative: "bg-red-500/10 text-red-300",
    positive: "bg-emerald-500/10 text-emerald-300",
    warning: "bg-amber-500/10 text-amber-300",
  };

  return tones[tone] || tones.info;
}

function toneTextClass(tone) {
  const tones = {
    negative: "text-red-300",
    positive: "text-emerald-300",
    warning: "text-amber-300",
  };

  return tones[tone] || tones.positive;
}
