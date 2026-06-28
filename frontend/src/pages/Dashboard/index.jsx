import { useCallback, useEffect, useState } from "react";

import {
  ActivityTimeline,
  DashboardHero,
  MarketNewsWidget,
  MarketOverviewStrip,
  PortfolioPerformanceArea,
  TopMoversWidget,
  WatchlistWidget,
} from "@/components/dashboard/DashboardWidgets";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import LoadingState from "@/components/common/LoadingState";
import { MotionItem, MotionPage } from "@/components/motion/MotionPage";
import { getDashboard } from "@/services/dashboardService";

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setError("");
    setIsLoading(true);

    try {
      setDashboard(await getDashboard());
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (isLoading) {
    return <LoadingState label="Loading dashboard command center" />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadDashboard} title="Dashboard unavailable" />;
  }

  if (!dashboard) {
    return (
      <EmptyState
        description="Dashboard data will appear after your account and market payloads load successfully."
        title="No dashboard data"
      />
    );
  }

  const firstName = dashboard.user.name.split(" ")[0];
  const activityTimeline = [...dashboard.recentActivity, ...dashboard.timelineExtras];

  return (
    <MotionPage className="space-y-6">
      <MotionItem>
        <DashboardHero
          attentionItems={dashboard.attentionItems}
          greeting={getGreeting()}
          marketSummary={dashboard.marketSummary}
          name={firstName}
          snapshot={dashboard.dashboardSnapshot}
          summary={dashboard.portfolioSummary}
        />
      </MotionItem>

      <MotionItem>
        <MarketOverviewStrip indices={dashboard.marketIndices} />
      </MotionItem>

      <MotionItem className="grid gap-6 2xl:grid-cols-[1.55fr_0.9fr]">
        <PortfolioPerformanceArea
          growth={dashboard.portfolioGrowth}
          ranges={dashboard.dashboardTimeRanges}
          snapshot={dashboard.dashboardSnapshot}
          summary={dashboard.portfolioSummary}
        />
        <div className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-1">
          <TopMoversWidget gainers={dashboard.topGainers} losers={dashboard.topLosers} />
          <WatchlistWidget stocks={dashboard.watchlist} />
        </div>
      </MotionItem>

      <MotionItem className="grid gap-6 2xl:grid-cols-[0.95fr_1.05fr]">
        <MarketNewsWidget news={dashboard.marketNews} />
        <ActivityTimeline items={activityTimeline} />
      </MotionItem>
    </MotionPage>
  );
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good Morning";
  }

  if (hour < 17) {
    return "Good Afternoon";
  }

  return "Good Evening";
}
