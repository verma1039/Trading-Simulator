import { useEffect, useState } from "react";
import api from "../api/axios";
import useLivePrices from "../hooks/useLivePrices";

export default function Instruments() {
  const [items, setItems] = useState([]);
  const { prices, symbols, market } = useLivePrices();

  useEffect(() => {
    api.get("/instruments?limit=50")
      .then(res => setItems(res.data.items))
      .catch(() => setItems([]));
  }, []);

  return (
    <>
      <div className="market-overview">
        <div className="card status-card dashboard-widget">
          <div className="widget-header">
            <div>
              <span className="eyebrow">Yahoo Finance</span>
              <h2 className="card-title">Market Data</h2>
            </div>
            <span className={market?.market_status === "ONLINE" ? "status-pill online" : "status-pill offline"}>
              {market?.market_status === "ONLINE" ? "Online" : "Offline"}
            </span>
          </div>

          <div className="metric-grid">
            <div className="metric-tile metric-tile-featured">
              <span className="label">Data Freshness</span>
              <span className={"freshness-pill " + getFreshnessClass(market?.freshness_status || "OFFLINE")}>
                {formatFreshness(market?.freshness_status || "OFFLINE")}
              </span>
            </div>

            <div className="metric-tile">
              <span className="label">Last Update</span>
              <span className="metric-value">{formatTimestamp(market?.last_global_update || market?.last_successful_update)}</span>
            </div>

            <div className="metric-tile">
              <span className="label">Connectivity Age</span>
              <span className="metric-value">{formatDataAge(market?.seconds_since_last_global_update)}</span>
            </div>

            <div className="metric-tile">
              <span className="label">Data Source</span>
              <span className="metric-value">{market?.data_source || "Yahoo Finance"}</span>
            </div>
          </div>

          {market?.market_status === "OFFLINE" && (
            <p className="warning-text">Live market data unavailable. Last known real prices are shown when available.</p>
          )}
        </div>

        <div className="card status-card dashboard-widget">
          <div className="widget-header">
            <div>
              <span className="eyebrow">NYSE / NASDAQ</span>
              <h2 className="card-title">Market Timings</h2>
            </div>
            <span className={market?.market_open ? "market-state-chip open" : "market-state-chip closed"}>
              {market?.market_open ? "Open" : "Closed"}
            </span>
          </div>

          <div className="metric-grid">
            <div className="metric-tile metric-tile-featured">
              <span className="label">Market Hours</span>
              <span className="metric-value">{formatMarketHours(market)}</span>
            </div>

            <div className="metric-tile">
              <span className="label">Open Time</span>
              <span className="metric-value">{formatTimeWithFallback(market?.market_open_time)}</span>
            </div>

            <div className="metric-tile">
              <span className="label">Close Time</span>
              <span className="metric-value">{formatTimeWithFallback(market?.market_close_time)}</span>
            </div>

            <div className="metric-tile">
              <span className="label">Next Open</span>
              <span className="metric-value">{formatTimestamp(market?.next_open_time)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Market Watch</h2>

        {items.length === 0 ? (
          <p className="muted">Loading instruments...</p>
        ) : (
          <div className="table-wrapper">
            <table className="market-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Price</th>
                  <th>Freshness</th>
                </tr>
              </thead>
              <tbody>
                {items.map(inst => {
                  const symbolData = symbols[inst.symbol] || inst;
                  const price = prices[inst.symbol] ?? symbolData.price ?? inst.lastTradedPrice;
                  const freshness = symbolData.freshness_status || "OFFLINE";

                  return (
                    <tr key={inst.symbol}>
                      <td className="symbol">{inst.symbol}</td>
                      <td className={price ? "price price-live" : "price price-muted"}>
                        {price ? price.toFixed(2) : "Unavailable"}
                      </td>
                      <td className="freshness-cell">
                        <span className={"status-pill " + getFreshnessClass(freshness)}>
                          {formatFreshness(freshness)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function formatTimestamp(value) {
  if (!value) return "No successful update yet";
  return new Date(value).toLocaleString();
}

function formatDataAge(ageSeconds) {
  if (ageSeconds === null || ageSeconds === undefined) {
    return "No successful update yet";
  }

  if (ageSeconds < 60) {
    return ageSeconds + " seconds ago";
  }

  const minutes = Math.floor(ageSeconds / 60);
  const seconds = ageSeconds % 60;
  return minutes + "m " + seconds + "s ago";
}

function formatFreshness(value) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function getFreshnessClass(value) {
  return value.toLowerCase();
}

function formatMarketHours(market) {
  if (!market?.market_open_time || !market?.market_close_time) {
    return "9:30 AM-4:00 PM ET";
  }

  return formatTime(market.market_open_time) + "-" + formatTime(market.market_close_time) + " ET";
}

function formatTimeWithFallback(value) {
  if (!value) return "--";
  return formatTime(value) + " ET";
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}
