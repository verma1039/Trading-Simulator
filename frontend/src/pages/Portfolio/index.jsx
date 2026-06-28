import { useCallback, useEffect, useMemo, useState } from "react";

import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import LoadingState from "@/components/common/LoadingState";
import { MotionItem, MotionPage } from "@/components/motion/MotionPage";
import {
  AllocationAnalysis,
  HoldingsExperience,
  PerformanceCenterpiece,
  PortfolioActivityTimeline,
  PortfolioHero,
  PositionDetailPanel,
  WinnersLosersWidget,
} from "@/components/portfolio/PortfolioWorkspace";
import { getPortfolio } from "@/services/portfolioService";

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState(null);
  const [selectedHolding, setSelectedHolding] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadPortfolio = useCallback(async () => {
    setError("");
    setIsLoading(true);

    try {
      const payload = await getPortfolio();
      setPortfolio(payload);
      setSelectedHolding((currentHolding) => {
        if (!payload.holdings.length) {
          return null;
        }

        return payload.holdings.find((holding) => holding.symbol === currentHolding?.symbol) || payload.holdings[0];
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPortfolio();
  }, [loadPortfolio]);

  const holdings = useMemo(() => portfolio?.holdings || [], [portfolio]);

  const winners = useMemo(
    () => [...holdings].sort((first, second) => second.pnlPercent - first.pnlPercent).slice(0, 3),
    [holdings],
  );

  const losers = useMemo(
    () => [...holdings].sort((first, second) => first.pnlPercent - second.pnlPercent).slice(0, 3),
    [holdings],
  );

  if (isLoading) {
    return <LoadingState label="Loading portfolio workspace" />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadPortfolio} title="Portfolio unavailable" />;
  }

  if (!portfolio) {
    return (
      <EmptyState
        description="Portfolio data will appear after account activity is available."
        title="No portfolio data"
      />
    );
  }

  return (
    <MotionPage className="max-w-full space-y-6 overflow-x-hidden">
      <MotionItem>
        <PortfolioHero attentionItems={portfolio.attention} summary={portfolio.summary} />
      </MotionItem>

      <MotionItem className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <PerformanceCenterpiece growth={portfolio.growth} ranges={portfolio.ranges} summary={portfolio.summary} />
          <AllocationAnalysis sectorAllocation={portfolio.allocationData} stockAllocation={portfolio.stockAllocationData} />
          <HoldingsExperience holdings={holdings} onSelect={setSelectedHolding} selectedHolding={selectedHolding} />
        </div>
        <div className="space-y-6">
          <WinnersLosersWidget losers={losers} winners={winners} />
          <PositionDetailPanel holding={selectedHolding} />
          <PortfolioActivityTimeline events={portfolio.events} />
        </div>
      </MotionItem>
    </MotionPage>
  );
}
