import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { BadgeDollarSign, Coins, Layers3, TrendingUp } from "lucide-react";

import DataTable from "@/components/common/DataTable";
import ErrorState from "@/components/common/ErrorState";
import LoadingState from "@/components/common/LoadingState";
import MetricCard from "@/components/common/MetricCard";
import PageShell from "@/components/common/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { useToast } from "@/context/useToast";
import { getMarketStatus, getMarketStocks } from "@/services/marketService";
import { buyOrder, sellOrder } from "@/services/ordersService";
import { getPortfolio } from "@/services/portfolioService";

export default function BuySellPage() {
  const location = useLocation();
  const { notify } = useToast();
  const [searchParams] = useSearchParams();
  const requestedSymbol = searchParams.get("symbol") || location.state?.selectedStock?.symbol || "AAPL";
  const [mode, setMode] = useState("BUY");
  const [quantity, setQuantity] = useState(5);
  const [stocks, setStocks] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [marketStatus, setMarketStatus] = useState(null);
  const [selectedSymbol, setSelectedSymbol] = useState(requestedSymbol);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState("");

  const loadTicket = useCallback(async () => {
    setError("");
    setIsLoading(true);

    try {
      const [statusPayload, stockPayload, portfolioPayload] = await Promise.all([getMarketStatus(), getMarketStocks(), getPortfolio()]);
      setMarketStatus(statusPayload);
      setStocks(stockPayload.stocks);
      setPortfolio(portfolioPayload);
      setSelectedSymbol((currentSymbol) => {
        const hasCurrent = stockPayload.stocks.some((stock) => stock.symbol === currentSymbol);
        return hasCurrent ? currentSymbol : stockPayload.stocks[0]?.symbol;
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  const selectedStock = useMemo(
    () => stocks.find((stock) => stock.symbol === selectedSymbol) || location.state?.selectedStock || stocks[0],
    [location.state?.selectedStock, selectedSymbol, stocks],
  );

  const position = useMemo(
    () => portfolio?.holdings.find((holding) => holding.symbol === selectedStock?.symbol) || {
      avgPrice: 0,
      quantity: 0,
    },
    [portfolio?.holdings, selectedStock?.symbol],
  );

  const estimatedValue = selectedStock ? selectedStock.price * quantity : 0;
  const cashAfterBuy = (portfolio?.summary.cashAvailable || 0) - estimatedValue;
  const sellableQuantity = Math.min(quantity, position.quantity || 0);
  const selectorRows = stocks.slice(0, 10);
  const isMarketClosed = marketStatus?.status !== "OPEN";
  const marketClosedMessage = isMarketClosed && marketStatus
    ? "Trading will reopen in " + formatCountdown(marketStatus.countdownSeconds) + "."
    : "";

  const selectorColumns = [
    { header: "Symbol", key: "symbol", render: (row) => <span className="font-semibold">{row.symbol}</span> },
    { header: "Company", key: "company" },
    { header: "Price", key: "price", render: (row) => formatCurrency(row.price) },
    {
      header: "Change",
      key: "changePercent",
      render: (row) => (
        <span className={row.changePercent >= 0 ? "text-emerald-300" : "text-red-300"}>
          {formatPercent(row.changePercent)}
        </span>
      ),
    },
    {
      header: "Action",
      key: "action",
      render: (row) => (
        <Button onClick={() => setSelectedSymbol(row.symbol)} size="xs" variant={row.symbol === selectedStock?.symbol ? "success" : "outline"}>
          Select
        </Button>
      ),
    },
  ];

  async function handleOrder() {
    if (!selectedStock) {
      return;
    }

    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      if (isMarketClosed) {
        throw new Error("Market is currently closed.");
      }

      const request = { quantity: Number(quantity), symbol: selectedStock.symbol };
      const response = mode === "BUY" ? await buyOrder(request) : await sellOrder(request);
      setPortfolio(response.portfolio);
      const actionLabel = mode === "BUY" ? "Stock purchased" : "Stock sold";
      const executionPrice = response.order?.price || selectedStock.price;
      const description =
        String(quantity) + " shares of " + selectedStock.symbol + " at " + formatCurrency(executionPrice) + ".";
      setSuccess(actionLabel + ": " + description);
      notify({
        description,
        title: actionLabel,
        variant: "success",
      });
    } catch (requestError) {
      setError(requestError.message);
      notify({
        description: requestError.message,
        title: mode === "BUY" ? "Buy order failed" : "Sell order failed",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <LoadingState label="Loading order ticket" />;
  }

  if (!selectedStock || !portfolio) {
    return <ErrorState message={error || "No tradable stock universe returned."} onRetry={loadTicket} title="Order ticket unavailable" />;
  }

  return (
    <PageShell
      eyebrow="Buy/Sell"
      subtitle="Order entry submits simulated trades for the selected account."
      title="Order entry"
    >
      <div className="grid gap-4 2xl:grid-cols-[1fr_0.85fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stock Selector</CardTitle>
              <CardDescription>Current selection: {selectedStock.company}.</CardDescription>
            </CardHeader>
            <CardContent>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Symbol</span>
                <Input
                  onChange={(event) => setSelectedSymbol(event.target.value.toUpperCase())}
                  placeholder="Search symbol"
                  value={selectedSymbol}
                />
              </label>
              <div className="mt-4">
                <DataTable columns={selectorColumns} rows={selectorRows} />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              accent="emerald"
              icon={TrendingUp}
              label="Current Price"
              meta={selectedStock.company}
              trend={formatPercent(selectedStock.changePercent)}
              value={formatCurrency(selectedStock.price)}
            />
            <MetricCard accent="sky" icon={Coins} label="Available Cash" meta="Available buying power" value={formatCurrency(portfolio.summary.cashAvailable)} />
            <MetricCard
              accent="violet"
              icon={Layers3}
              label="Owned Shares"
              meta={position.avgPrice ? "Avg " + formatCurrency(position.avgPrice) : "No current position"}
              value={String(position.quantity || 0)}
            />
          </div>
        </div>

        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Order Form</CardTitle>
                <CardDescription>Orders update cash, holdings, and transaction history.</CardDescription>
              </div>
              <Badge variant={isMarketClosed ? "warning" : "positive"}>
                {isMarketClosed ? "Market Closed" : "Market Open"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-5 grid grid-cols-2 rounded-xl border border-white/10 bg-slate-950/70 p-1">
              <Button disabled={isMarketClosed} onClick={() => setMode("BUY")} type="button" variant={mode === "BUY" ? "success" : "ghost"}>Buy</Button>
              <Button disabled={isMarketClosed} onClick={() => setMode("SELL")} type="button" variant={mode === "SELL" ? "danger" : "ghost"}>Sell</Button>
            </div>

            {marketClosedMessage ? (
              <div className="mb-5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                <p className="font-semibold">Market Closed.</p>
                <p className="mt-1 text-amber-100/80">{marketClosedMessage}</p>
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Symbol" value={selectedStock.symbol} />
              <Field label="Company" value={selectedStock.company} />
              <Field label="Order Type" value="Market" />
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quantity</span>
                <Input min="1" onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))} type="number" value={quantity} />
              </label>
              <Field label="Current Price" value={formatCurrency(selectedStock.price)} />
              <Field label={mode === "BUY" ? "Estimated Cost" : "Estimated Credit"} value={formatCurrency(estimatedValue)} />
            </div>

            <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <div className="flex items-start gap-3">
                <BadgeDollarSign className="mt-0.5 h-5 w-5 text-emerald-300" aria-hidden="true" />
                <div>
                  <p className="font-semibold">{mode === "BUY" ? "Buying power after order" : "Sell order summary"}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {mode === "BUY"
                      ? formatCurrency(cashAfterBuy) + " remaining after this buy order."
                      : "Selling " + sellableQuantity + " shares would credit " + formatCurrency(selectedStock.price * sellableQuantity) + "."}
                  </p>
                </div>
              </div>
            </div>

            {error ? <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p> : null}
            {success ? <p className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">{success}</p> : null}

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <Button disabled={isSubmitting || isMarketClosed} onClick={handleOrder} size="lg">
                {isSubmitting ? "Submitting..." : mode === "BUY" ? "Place Buy Order" : "Place Sell Order"}
              </Button>
              <Button onClick={loadTicket} size="lg" type="button" variant="outline">Refresh Ticket</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

function Field({ label, value }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <Input readOnly value={value} />
    </label>
  );
}

function formatCountdown(seconds = 0) {
  const totalMinutes = Math.max(Math.floor(seconds / 60), 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return String(hours).padStart(2, "0") + "h " + String(minutes).padStart(2, "0") + "m";
}
