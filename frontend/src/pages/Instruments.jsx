import { useEffect, useState } from "react";
import api from "../api/axios";
import useLivePrices from "../hooks/useLivePrices";

export default function Instruments() {
  const [items, setItems] = useState([]);
  const prices = useLivePrices(); // always called at top

  useEffect(() => {
    api.get("/instruments?limit=50")
      .then(res => setItems(res.data.items))
      .catch(() => setItems([]));
  }, []);

  return (
    <div className="card">
      <h2 className="card-title">📈 Market Watch</h2>

      {items.length === 0 ? (
        <p className="muted">Loading instruments...</p>
      ) : (
        <div className="table-wrapper">
          <table className="market-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Exchange</th>
                <th>Live Price</th>
              </tr>
            </thead>
            <tbody>
              {items.map(inst => {
                const price = prices[inst.symbol];

                return (
                  <tr key={inst.symbol}>
                    <td className="symbol">{inst.symbol}</td>
                    <td className="exchange">{inst.exchange}</td>
                    <td
                      className={
                        price
                          ? "price price-live"
                          : "price price-muted"
                      }
                    >
                      {price ? price.toFixed(2) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
