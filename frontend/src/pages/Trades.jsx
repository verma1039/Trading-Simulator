import { useEffect, useState } from "react";
import api from "../api/axios";

export default function Trades() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/trades")
      .then(res => setTrades(res.data.items || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="card">
      <h2 className="card-title">🧾 Trade History</h2>

      {loading ? (
        <p className="muted">Loading trades...</p>
      ) : trades.length === 0 ? (
        <p className="muted">No trades executed yet</p>
      ) : (
        <div className="table-wrapper">
          <table className="market-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Symbol</th>
                <th>Side</th>
                <th>Qty</th>
                <th>Price</th>
                <th>P&L</th>
              </tr>
            </thead>
            <tbody>
              {trades.map(t => (
                <tr key={t.tradeId}>
                  <td className="muted">
                    {new Date(t.timestamp).toLocaleString()}
                  </td>

                  <td className="symbol">{t.symbol}</td>

                  <td className={t.side === "BUY" ? "buy" : "sell"}>
                    {t.side}
                  </td>

                  <td>{t.quantity}</td>

                  <td>{t.price.toFixed(2)}</td>

                  <td
                    className={
                      t.realizedPnL > 0
                        ? "buy"
                        : t.realizedPnL < 0
                        ? "sell"
                        : "muted"
                    }
                  >
                    {t.realizedPnL.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
