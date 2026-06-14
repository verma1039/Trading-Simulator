import { useState, useEffect } from "react";
import api from "../api/axios";

export default function PlaceOrder() {
  const [instruments, setInstruments] = useState([]);
  const [symbol, setSymbol] = useState("");
  const [side, setSide] = useState("BUY");
  const [quantity, setQuantity] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [market, setMarket] = useState(null);
  const marketOffline = market?.market_status === "OFFLINE";
  const marketClosed = market && !market.market_open;
  const tradingDisabled = marketOffline || marketClosed;

  useEffect(() => {
    api.get("/instruments?limit=100")
      .then(res => {
        const items = res.data.items || [];
        setInstruments(items);
        if (items.length > 0) {
          setSymbol(items[0].symbol);
        }
      })
      .catch(err => console.error("Failed to fetch instruments", err));

    const loadMarketStatus = () => {
      api.get("/market/status")
        .then(res => setMarket(res.data))
        .catch(() => setMarket({ market_status: "OFFLINE" }));
    };

    loadMarketStatus();
    const timer = setInterval(loadMarketStatus, 5000);
    return () => clearInterval(timer);
  }, []);

  const submitOrder = async (e) => {
    e.preventDefault();

    if (tradingDisabled) {
      setResult({ error: getTradingDisabledReason(market) });
      return;
    }

    if (!symbol || !quantity || Number(quantity) <= 0) {
      setResult({ error: "Invalid order details" });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await api.post("/orders", {
        symbol: symbol.toUpperCase(),
        side,
        quantity: Number(quantity),
      });

      setResult(res.data);
      setQuantity("");
    } catch (err) {
      setResult({
        error: err.response?.data?.detail || "Order execution failed",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="card-title">Buy / Sell</h2>

      {tradingDisabled && (
        <p className="error order-disabled-message">
          {getTradingDisabledReason(market)}
        </p>
      )}

      <form className="order-form" onSubmit={submitOrder}>
        {instruments.length > 0 ? (
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            disabled={tradingDisabled}
          >
            {instruments.map((inst) => (
              <option key={inst.symbol} value={inst.symbol}>
                {inst.symbol}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            placeholder="Symbol (AAPL)"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            autoComplete="off"
            disabled={tradingDisabled}
            required
          />
        )}

        <select
          value={side}
          onChange={(e) => setSide(e.target.value)}
          className={side === "BUY" ? "buy" : "sell"}
          disabled={tradingDisabled}
        >
          <option value="BUY">BUY</option>
          <option value="SELL">SELL</option>
        </select>

        <input
          type="number"
          placeholder="Quantity"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          disabled={tradingDisabled}
          required
        />

        <button
          type="submit"
          disabled={loading || tradingDisabled}
          className={side === "BUY" ? "btn-buy" : "btn-sell"}
        >
          {loading ? "Executing..." : side + " Order"}
        </button>
      </form>

      {result && (
        <div className="order-result">
          {result.error ? (
            <p className="error">{result.error}</p>
          ) : (
            <>
              <p className="success">
                Order Executed - <strong>{result.trade.symbol}</strong>
              </p>

              <p className="muted">
                {result.trade.side} {result.trade.quantity} @{" "}
                {result.trade.price.toFixed(2)}
              </p>

              <p>
                Balance: <strong>Rs {result.balance.toFixed(2)}</strong>
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function getTradingDisabledReason(market) {
  const reasons = [];

  if (market?.market_status === "OFFLINE") {
    reasons.push("Live market data unavailable.");
  }

  if (market && !market.market_open) {
    reasons.push("Market is closed.");
  }

  return reasons.join(" ") || "Trading is temporarily disabled.";
}
