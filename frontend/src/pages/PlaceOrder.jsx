import { useState } from "react";
import api from "../api/axios";

export default function PlaceOrder() {
  const [symbol, setSymbol] = useState("");
  const [side, setSide] = useState("BUY");
  const [quantity, setQuantity] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const submitOrder = async (e) => {
    e.preventDefault();

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
      setSymbol("");
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
      <h2 className="card-title">📈 Place Order</h2>

      <form className="order-form" onSubmit={submitOrder}>
        <input
          type="text"
          placeholder="Symbol (AAPL)"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          autoComplete="off"
          required
        />

        <select
          value={side}
          onChange={(e) => setSide(e.target.value)}
          className={side === "BUY" ? "buy" : "sell"}
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
          required
        />

        <button
          type="submit"
          disabled={loading}
          className={side === "BUY" ? "btn-buy" : "btn-sell"}
        >
          {loading ? "Executing..." : `${side} Order`}
        </button>
      </form>

      {result && (
        <div className="order-result">
          {result.error ? (
            <p className="error">{result.error}</p>
          ) : (
            <>
              <p className="success">
                ✅ Order Executed — <strong>{result.trade.symbol}</strong>
              </p>

              <p className="muted">
                {result.trade.side} {result.trade.quantity} @{" "}
                {result.trade.price.toFixed(2)}
              </p>

              <p>
                Balance: <strong>₹{result.balance.toFixed(2)}</strong>
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
