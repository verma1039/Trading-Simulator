import { useEffect, useState } from "react";
import api from "../api/axios";

export default function Wallet() {
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get("/wallet/ledger")
      .then((res) => {
        setLedger(res.data);
      })
      .catch(() => {
        setError("Failed to load wallet ledger");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading wallet...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!ledger) return null;

  const items = ledger.items ?? [];

  return (
    <div className="card">
      <h2>Wallet</h2>

      <p className="balance">
        Available Balance: ₹{Number(ledger.balance).toFixed(2)}
      </p>

      <h3>Ledger</h3>

      {items.length === 0 ? (
        <p>No transactions yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Symbol</th>
              <th>Amount</th>
              <th>Balance</th>
              <th>Time</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>

                <td
                  className={
                    item.type?.includes("BUY")
                      ? "buy"
                      : item.type?.includes("SELL")
                      ? "sell"
                      : ""
                  }
                >
                  {item.type}
                </td>

                <td>{item.symbol || "-"}</td>

                <td>
                  {item.amount !== undefined
                    ? Number(item.amount).toFixed(2)
                    : "-"}
                </td>

                <td>
                  {item.balance !== undefined
                    ? Number(item.balance).toFixed(2)
                    : "-"}
                </td>

                <td>
                  {item.timestamp
                    ? new Date(item.timestamp).toLocaleString()
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
