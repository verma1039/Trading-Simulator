import useLivePortfolio from "../hooks/useLivePortfolio";

export default function Portfolio() {
  const portfolio = useLivePortfolio();

  if (!portfolio) {
    return (
      <div className="card">
        <h2>Portfolio</h2>
        <p className="muted">Loading portfolio...</p>
      </div>
    );
  }

  return (
    <>
      {/* -------- Summary Card -------- */}
      <div className="card">
        <h2 className="card-title">💼 Portfolio Summary</h2>

        <div className="summary-grid">
          <div>
            <span className="label">Cash Balance</span>
            <div className="value">
              ₹ {portfolio.balance?.toFixed(2)}
            </div>
          </div>

          <div>
            <span className="label">Total Invested</span>
            <div className="value">
              ₹ {portfolio.totalInvested?.toFixed(2)}
            </div>
          </div>

          <div>
            <span className="label">Unrealized P&L</span>
            <div
              className={
                portfolio.totalUnrealizedPnL >= 0
                  ? "value buy"
                  : "value sell"
              }
            >
              ₹ {portfolio.totalUnrealizedPnL?.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* -------- Holdings Table -------- */}
      <div className="card">
        <h3 className="card-title">📊 Holdings</h3>

        {portfolio.holdings.length === 0 ? (
          <p className="muted">No holdings yet</p>
        ) : (
          <div className="table-wrapper">
            <table className="market-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Qty</th>
                  <th>Avg Price</th>
                  <th>Live Price</th>
                  <th>P&L</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.holdings.map(h => (
                  <tr key={h.symbol}>
                    <td className="symbol">{h.symbol}</td>
                    <td>{h.quantity}</td>
                    <td>{h.avgPrice.toFixed(2)}</td>
                    <td>{h.livePrice.toFixed(2)}</td>
                    <td
                      className={
                        h.unrealizedPnL >= 0
                          ? "price-live buy"
                          : "price-live sell"
                      }
                    >
                      {h.unrealizedPnL.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* -------- Reset Section -------- */}
      <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end" }}>
        <button
          className="btn-sell"
          style={{ padding: "0.8rem 1.5rem", fontSize: "1rem" }}
          onClick={async () => {
            if (window.confirm("Are you sure you want to reset your portfolio? This action cannot be undone.")) {
              try {
                const res = await fetch("http://localhost:8000/api/v1/reset", {
                  method: "POST",
                });
                if (res.ok) {
                  window.location.reload();
                } else {
                  alert("Failed to reset portfolio");
                }
              } catch (err) {
                console.error(err);
                alert("Error resetting portfolio");
              }
            }
          }}
        >
          ⚠️ Reset Account
        </button>
      </div>
    </>
  );
}
