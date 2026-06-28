import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import LoadingState from "@/components/common/LoadingState";
import {
  MarketMovers,
  MarketPulseHeader,
  SelectedStockPanel,
  StockExplorer,
  WatchlistPanel,
} from "@/components/trade/TradeTerminal";
import { MotionItem, MotionPage } from "@/components/motion/MotionPage";
import { getMarketIndexes, getMarketStocks } from "@/services/marketService";

export default function TradePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const [market, setMarket] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    index: "All",
    search: searchQuery,
    sector: "All",
    sort: "movers",
  });
  const [selectedStock, setSelectedStock] = useState(null);

  const loadMarket = useCallback(async () => {
    setError("");
    setIsLoading(true);

    try {
      const [indexPayload, stockPayload] = await Promise.all([getMarketIndexes(), getMarketStocks()]);
      setMarket(indexPayload);
      setStocks(stockPayload.stocks);
      setSelectedStock((currentStock) => currentStock || stockPayload.stocks.find((stock) => stock.symbol === "NVDA") || stockPayload.stocks[0]);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMarket();
  }, [loadMarket]);

  useEffect(() => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      search: searchQuery,
    }));
  }, [searchQuery]);

  const sectorOptions = useMemo(() => {
    const sectors = [...new Set(stocks.map((stock) => stock.sector))].sort();

    return [
      { label: "All Sectors", value: "All" },
      ...sectors.map((sector) => ({ label: sector, value: sector })),
    ];
  }, [stocks]);

  const filteredStocks = useMemo(() => {
    const normalizedSearch = filters.search.trim().toLowerCase();

    return stocks
      .filter((stock) => {
        const matchesIndex = filters.index === "All" || stock.indices.includes(filters.index);
        const matchesSector = filters.sector === "All" || stock.sector === filters.sector;
        const matchesSearch =
          normalizedSearch.length === 0 ||
          stock.symbol.toLowerCase().includes(normalizedSearch) ||
          stock.company.toLowerCase().includes(normalizedSearch);

        return matchesIndex && matchesSector && matchesSearch;
      })
      .sort((a, b) => {
        if (filters.sort === "volume") {
          return b.volume - a.volume;
        }

        if (filters.sort === "price-desc") {
          return b.price - a.price;
        }

        if (filters.sort === "symbol") {
          return a.symbol.localeCompare(b.symbol);
        }

        return Math.abs(b.changePercent) - Math.abs(a.changePercent);
      });
  }, [filters, stocks]);

  const sortedByChange = useMemo(() => [...stocks].sort((a, b) => b.changePercent - a.changePercent), [stocks]);
  const topGainers = sortedByChange.filter((stock) => stock.changePercent > 0).slice(0, 3);
  const topLosers = [...stocks]
    .filter((stock) => stock.changePercent < 0)
    .sort((a, b) => a.changePercent - b.changePercent)
    .slice(0, 3);
  const mostActive = [...stocks].sort((a, b) => b.volume - a.volume).slice(0, 3);
  const watchlist = [];

  function handleFilterChange(key, value) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [key]: value,
    }));
  }

  function handleTrade(stock) {
    navigate("/user/buy-sell?symbol=" + stock.symbol, {
      state: { selectedStock: stock },
    });
  }

  if (isLoading) {
    return <LoadingState label="Loading market terminal" />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadMarket} title="Market data unavailable" />;
  }

  if (!market || !stocks.length) {
    return (
      <EmptyState
        description="Live market quotes will appear here when market data is available."
        title="No tradable stocks available"
      />
    );
  }

  return (
    <MotionPage className="space-y-6">
      <MotionItem>
        <MarketPulseHeader indices={market.marketIndices || market.indexes} marketSummary={market.marketSummary} />
      </MotionItem>

      <MotionItem className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <StockExplorer
          filters={filters}
          indexOptions={market.indexOptions}
          onFilterChange={handleFilterChange}
          onSelect={setSelectedStock}
          onTrade={handleTrade}
          rows={filteredStocks}
          sectorOptions={sectorOptions}
          selectedSymbol={selectedStock?.symbol}
          totalCount={stocks.length}
        />

        <aside className="space-y-6">
          <SelectedStockPanel onTrade={handleTrade} stock={selectedStock} />
          <MarketMovers gainers={topGainers} losers={topLosers} mostActive={mostActive} />
          <WatchlistPanel onSelect={setSelectedStock} selectedSymbol={selectedStock?.symbol} stocks={watchlist} />
        </aside>
      </MotionItem>
    </MotionPage>
  );
}
