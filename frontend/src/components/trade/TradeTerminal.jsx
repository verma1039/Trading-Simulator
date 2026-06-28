import { createElement } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CandlestickChart,
  Clock3,
  Filter,
  Flame,
  LineChart,
  Search,
  ShoppingCart,
  Signal,
  Star,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import EmptyState from "@/components/common/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatCompactNumber, formatCurrency, formatPercent } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const MotionDiv = motion.div;
const MotionTr = motion.tr;

const sortOptions = [
  { label: "Top movers", value: "movers" },
  { label: "Most active", value: "volume" },
  { label: "Price high to low", value: "price-desc" },
  { label: "Symbol A-Z", value: "symbol" },
];

export function MarketPulseHeader({ indices, marketSummary }) {
  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[radial-gradient(circle_at_12%_0%,rgba(16,185,129,0.16),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(2,6,23,0.96))] p-5 shadow-2xl shadow-black/25 lg:p-6">
      <div className="pointer-events-none absolute -right-24 top-2 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="relative grid gap-5 xl:grid-cols-[0.76fr_1.24fr]">
        <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/[0.055] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={marketSummary.status === "OPEN" ? "positive" : "warning"}>{marketSummary.status === "OPEN" ? "Market Open" : "Market Closed"}</Badge>
                <span className="text-xs text-muted-foreground">{marketSummary.updatedAt}</span>
              </div>
              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white">Trade Terminal</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {(marketSummary.sessionLabel || marketSummary.session)}. Discover market movers, inspect symbols, and route selected names into the order ticket.
              </p>
            </div>
            <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
              <span className="absolute h-3 w-3 animate-ping rounded-full bg-emerald-300/40" />
              <Signal className="relative h-5 w-5" aria-hidden="true" />
            </span>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <PulseStat icon={Clock3} label={marketSummary.countdownLabel} value={marketSummary.countdownValue} />
            <PulseStat icon={Activity} label="Session" value={marketSummary.sessionLabel || marketSummary.session} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {indices.map((index, itemIndex) => (
            <MotionDiv
              className="group overflow-hidden rounded-2xl border border-white/10 bg-slate-950/45 p-4 transition-colors hover:border-emerald-400/25 hover:bg-slate-950/65"
              initial={{ opacity: 0, y: 14 }}
              key={index.id}
              transition={{ delay: itemIndex * 0.04, duration: 0.35 }}
              whileHover={{ scale: 1.01, y: -3 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{index.label}</p>
                  <p className="mt-2 text-2xl font-semibold">{formatMarketValue(index.value)}</p>
                  <FreshnessBadge freshness={index.freshness} />
                </div>
                <ChangePill value={index.changePercent} />
              </div>
              <MiniBars positive={index.changePercent >= 0} seed={itemIndex} />
            </MotionDiv>
          ))}
        </div>
      </div>
    </section>
  );
}

export function MarketMovers({ gainers, losers, mostActive }) {
  return (
    <Card className="rounded-[1.5rem]">
      <CardContent>
        <WidgetHeader eyebrow="Market Movers" icon={Flame} subtitle="Opportunity radar from the supported stock universe." title="Live action board" />
        <div className="mt-5 grid gap-4 lg:grid-cols-3 xl:grid-cols-1">
          <MoverGroup icon={TrendingUp} items={gainers} title="Top Gainers" tone="positive" />
          <MoverGroup icon={TrendingDown} items={losers} title="Top Losers" tone="negative" />
          <MoverGroup icon={Activity} items={mostActive} title="Most Active" tone="info" />
        </div>
      </CardContent>
    </Card>
  );
}

export function WatchlistPanel({ stocks, onSelect, selectedSymbol }) {
  return (
    <Card className="rounded-[1.5rem]">
      <CardContent>
        <WidgetHeader eyebrow="Watchlist" icon={Star} subtitle="Fast-access symbols for the next order decision." title="Focus list" />
        <div className="mt-5 space-y-3">
          {stocks.length ? (
            stocks.map((stock) => (
              <button
                className={cn(
                  "flex w-full items-center justify-between gap-4 rounded-2xl border bg-slate-950/45 p-3 text-left transition hover:-translate-y-0.5 hover:border-emerald-400/25",
                  selectedSymbol === stock.symbol ? "border-emerald-400/35 bg-emerald-500/[0.055]" : "border-white/10",
                )}
                key={stock.symbol}
                onClick={() => onSelect(stock)}
                type="button"
              >
                <div className="min-w-0">
                  <p className="font-semibold">{stock.symbol}</p>
                  <p className="truncate text-xs text-muted-foreground">{stock.company}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(stock.price)}</p>
                  <FreshnessBadge freshness={stock.freshness} />
                  <ChangePill compact value={stock.changePercent} />
                </div>
              </button>
            ))
          ) : (
            <EmptyState
              description="Saved symbols will appear here after you add them to a watchlist."
              title="Watchlist is empty"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function SelectedStockPanel({ onTrade, stock }) {
  if (!stock) {
    return null;
  }

  return (
    <Card className="overflow-hidden rounded-[1.5rem] border-emerald-400/20 bg-[radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.16),transparent_34%),rgba(15,23,42,0.78)]">
      <CardContent className="p-0">
        <div className="border-b border-white/10 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">Selected Stock</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-tight text-white">{stock.symbol}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{stock.company}</p>
            </div>
            <span className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-300">
              <CandlestickChart className="h-5 w-5" aria-hidden="true" />
            </span>
          </div>

          <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Price</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <p className="text-3xl font-semibold">{formatCurrency(stock.price)}</p>
                <FreshnessBadge freshness={stock.freshness} />
              </div>
            </div>
            <ChangePill value={stock.changePercent} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px bg-white/10">
          <StockDetailStat label="Volume" value={formatCompactNumber(stock.volume)} />
          <StockDetailStat label="Sector" value={stock.sector} />
          <StockDetailStat label="Primary Index" value={stock.indices[0]} />
          <StockDetailStat label="Universe" value={String(stock.indices.length) + " indexes"} />
        </div>

        <div className="p-5">
          <Button className="h-12 w-full rounded-xl shadow-lg shadow-emerald-500/10" onClick={() => onTrade(stock)} size="lg">
            <ShoppingCart className="mr-2 h-4 w-4" aria-hidden="true" />
            Trade Now
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">Routes into the Buy/Sell order-entry page.</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function StockExplorer({
  filters,
  indexOptions,
  onFilterChange,
  onSelect,
  onTrade,
  rows,
  sectorOptions,
  selectedSymbol,
  totalCount,
}) {
  return (
    <Card className="overflow-hidden rounded-[1.5rem]">
      <CardContent className="p-0">
        <div className="border-b border-white/10 p-5">
          <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:justify-between">
            <WidgetHeader
              eyebrow="Stock Explorer"
              icon={LineChart}
              subtitle={"Showing " + rows.length + " of " + totalCount + " symbols from the supported US universe."}
              title="Market universe"
            />
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <label className="relative sm:col-span-2 xl:col-span-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  className="h-11 rounded-xl pl-9"
                  onChange={(event) => onFilterChange("search", event.target.value)}
                  placeholder="Search symbol or company"
                  value={filters.search}
                />
              </label>
              <FilterSelect label="Index" onChange={(value) => onFilterChange("index", value)} options={indexOptions} value={filters.index} />
              <FilterSelect label="Sector" onChange={(value) => onFilterChange("sector", value)} options={sectorOptions} value={filters.sector} />
              <FilterSelect label="Sort" onChange={(value) => onFilterChange("sort", value)} options={sortOptions} value={filters.sort} />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-slate-950/70 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-4 text-left">Symbol</th>
                <th className="px-5 py-4 text-left">Company</th>
                <th className="px-5 py-4 text-left">Sector</th>
                <th className="px-5 py-4 text-left">Index</th>
                <th className="px-5 py-4 text-right">Price</th>
                <th className="px-5 py-4 text-right">Change</th>
                <th className="px-5 py-4 text-right">Volume</th>
                <th className="sticky right-0 bg-slate-950/95 px-5 py-4 text-right shadow-[-18px_0_24px_rgba(2,6,23,0.82)]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {rows.map((stock, index) => (
                <StockRow
                  index={index}
                  key={stock.symbol}
                  onSelect={onSelect}
                  onTrade={onTrade}
                  selected={selectedSymbol === stock.symbol}
                  stock={stock}
                />
              ))}
            </tbody>
          </table>
        </div>

        {rows.length === 0 ? (
          <div className="p-5">
            <EmptyState
              description="Adjust search, index, sector, or sort controls to browse the market universe."
              title="No symbols match"
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function StockRow({ index, onSelect, onTrade, selected, stock }) {
  return (
    <MotionTr
      className={cn("cursor-pointer transition-colors hover:bg-white/[0.04]", selected && "bg-emerald-500/[0.055]")}
      initial={{ opacity: 0, y: 8 }}
      onClick={() => onSelect(stock)}
      transition={{ delay: Math.min(index, 12) * 0.025, duration: 0.25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <span className={cn("h-2.5 w-2.5 rounded-full", stock.changePercent >= 0 ? "bg-emerald-300" : "bg-red-300")} />
          <div>
            <p className="font-semibold text-white">{stock.symbol}</p>
            <p className="text-xs text-muted-foreground">{stock.indices[0]}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-4 text-muted-foreground">{stock.company}</td>
      <td className="px-5 py-4">
        <Badge className="normal-case tracking-normal" variant="neutral">{stock.sector}</Badge>
      </td>
      <td className="px-5 py-4">
        <div className="flex flex-wrap gap-1">
          {stock.indices.slice(0, 2).map((indexName) => (
            <Badge className="px-2 py-0.5 normal-case tracking-normal" key={indexName} variant="neutral">
              {indexName}
            </Badge>
          ))}
        </div>
      </td>
      <td className="px-5 py-4 text-right">
        <div className="flex flex-col items-end gap-1">
          <span className="font-semibold">{formatCurrency(stock.price)}</span>
          <FreshnessBadge freshness={stock.freshness} />
        </div>
      </td>
      <td className="px-5 py-4 text-right">
        <ChangePill value={stock.changePercent} />
      </td>
      <td className="px-5 py-4 text-right text-muted-foreground">{formatCompactNumber(stock.volume)}</td>
      <td className="sticky right-0 bg-slate-950/95 px-5 py-4 text-right shadow-[-18px_0_24px_rgba(2,6,23,0.78)]">
        <Button
          onClick={(event) => {
            event.stopPropagation();
            onTrade(stock);
          }}
          size="sm"
        >
          Trade Now
        </Button>
      </td>
    </MotionTr>
  );
}

function MoverGroup({ icon, items, title, tone }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
      <div className="mb-4 flex items-center gap-2">
        <span className={cn("rounded-xl p-2", toneClass(tone))}>
          {createElement(icon, { className: "h-4 w-4", "aria-hidden": "true" })}
        </span>
        <p className="text-sm font-semibold">{title}</p>
      </div>
      <div className="space-y-3">
        {items.length ? (
          items.map((stock) => (
            <div className="flex items-center justify-between gap-3" key={stock.symbol}>
              <div>
                <p className="font-semibold">{stock.symbol}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <p className="text-xs text-muted-foreground">{formatCurrency(stock.price)}</p>
                  <FreshnessBadge freshness={stock.freshness} />
                </div>
              </div>
              <ChangePill value={stock.changePercent} />
            </div>
          ))
        ) : (
          <EmptyState
            description="Market mover lists will populate when matching symbols exist."
            title="No movers found"
          />
        )}
      </div>
    </div>
  );
}

function PulseStat({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
      <div className="flex items-center gap-2">
        {createElement(icon, { className: "h-4 w-4 text-emerald-300", "aria-hidden": "true" })}
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      </div>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}

function StockDetailStat({ label, value }) {
  return (
    <div className="bg-slate-950/45 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
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

function FreshnessBadge({ freshness = "OFFLINE" }) {
  const variantMap = {
    DELAYED: "warning",
    LIVE: "positive",
    OFFLINE: "negative",
    STALE: "warning",
  };

  return (
    <Badge className="px-2 py-0.5 text-[10px]" variant={variantMap[freshness] || "neutral"}>
      {freshness}
    </Badge>
  );
}

function MiniBars({ positive, seed }) {
  const bars = [34, 48, 42, 66, 56, 78].map((height) => height + seed * 2);

  return (
    <div className="mt-5 flex h-10 items-end gap-1.5">
      {bars.map((height, index) => (
        <span
          className={cn("flex-1 rounded-t-full", positive ? "bg-emerald-400/25 group-hover:bg-emerald-300/40" : "bg-red-400/25 group-hover:bg-red-300/40")}
          key={String(height) + index}
          style={{ height: String(Math.min(height, 92)) + "%" }}
        />
      ))}
    </div>
  );
}

function toneClass(tone) {
  const classes = {
    info: "bg-sky-500/10 text-sky-300",
    negative: "bg-red-500/10 text-red-300",
    positive: "bg-emerald-500/10 text-emerald-300",
  };

  return classes[tone] || classes.positive;
}

function formatMarketValue(value) {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}
