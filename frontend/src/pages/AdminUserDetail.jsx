import { Link, useParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";

import api from "../api/axios";

export default function AdminUserDetail() {
  const { userId } = useParams();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const loadDetail = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get("/admin/users/" + userId);
      setDetail(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load user detail");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  async function runAction(actionName, request) {
    setActionLoading(true);
    setMessage(null);
    setError(null);

    try {
      await request();
      setMessage(actionName + " completed.");
      await loadDetail();
    } catch (err) {
      setError(err.response?.data?.detail || actionName + " failed");
    } finally {
      setActionLoading(false);
    }
  }

  function activateUser() {
    runAction("Activate", () => api.post("/admin/users/" + userId + "/activate"));
  }

  function suspendUser() {
    if (!window.confirm("Suspend this user? They will lose access to trading routes.")) return;
    runAction("Suspend", () => api.post("/admin/users/" + userId + "/suspend"));
  }

  function banUser() {
    if (!window.confirm("Ban this user? This is a destructive account status change.")) return;
    runAction("Ban", () => api.post("/admin/users/" + userId + "/ban"));
  }

  function depositFunds() {
    const amount = window.prompt("Deposit amount");
    if (!amount) return;
    const reason = window.prompt("Reason for deposit");
    if (!reason) return;

    runAction("Deposit", () => api.post("/admin/users/" + userId + "/deposit", {
      amount: Number(amount),
      reason,
    }));
  }

  function withdrawFunds() {
    const amount = window.prompt("Withdraw amount");
    if (!amount) return;
    const reason = window.prompt("Reason for withdrawal");
    if (!reason) return;
    if (!window.confirm("Withdraw Rs " + Number(amount).toFixed(2) + " from this user?")) return;

    runAction("Withdraw", () => api.post("/admin/users/" + userId + "/withdraw", {
      amount: Number(amount),
      reason,
    }));
  }

  if (loading) {
    return (
      <div className="card">
        <h2>User Detail</h2>
        <p className="muted">Loading user detail...</p>
      </div>
    );
  }

  if (error && !detail) {
    return (
      <div className="card">
        <h2>User Detail</h2>
        <p className="error">{error}</p>
      </div>
    );
  }

  const profile = detail?.profile;
  const wallet = detail?.wallet;
  const holdings = detail?.holdings || [];
  const orders = detail?.orders || [];
  const trades = detail?.trades || [];
  const ledger = detail?.ledgerEntries || [];
  const adminActions = detail?.adminActions || [];

  return (
    <>
      <div className="card">
        <div className="admin-header">
          <div>
            <span className="eyebrow">Admin</span>
            <h2 className="card-title">User Detail</h2>
          </div>
          <Link className="nav-link admin-link-button" to="/admin/users">
            Back to Users
          </Link>
        </div>

        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}

        <div className="summary-grid admin-summary-grid">
          <Metric label="Email" value={profile?.email || "-"} />
          <Metric label="Role" value={profile?.role || "-"} />
          <Metric label="Status" value={profile?.status || "-"} />
          <Metric label="Wallet Balance" value={formatMoney(wallet?.balance)} />
        </div>

        <div className="admin-actions">
          <button type="button" className="btn-buy" onClick={activateUser} disabled={actionLoading}>
            Activate
          </button>
          <button type="button" onClick={suspendUser} disabled={actionLoading}>
            Suspend
          </button>
          <button type="button" className="btn-sell" onClick={banUser} disabled={actionLoading}>
            Ban
          </button>
          <button type="button" className="btn-buy" onClick={depositFunds} disabled={actionLoading}>
            Deposit
          </button>
          <button type="button" className="btn-sell" onClick={withdrawFunds} disabled={actionLoading}>
            Withdraw
          </button>
        </div>
      </div>

      <DataTable title="Holdings" empty="No holdings." columns={["Symbol", "Quantity", "Avg Price"]}>
        {holdings.map((item) => (
          <tr key={item.id}>
            <td className="symbol">{item.symbol}</td>
            <td>{item.quantity}</td>
            <td>{formatMoney(item.avg_price)}</td>
          </tr>
        ))}
      </DataTable>

      <DataTable title="Orders" empty="No orders." columns={["Time", "Symbol", "Side", "Qty", "Status", "Executed Price"]}>
        {orders.map((item) => (
          <tr key={item.id}>
            <td className="muted">{formatDateTime(item.created_at)}</td>
            <td className="symbol">{item.symbol}</td>
            <td className={item.side === "BUY" ? "buy" : "sell"}>{item.side}</td>
            <td>{item.quantity}</td>
            <td>{item.status}</td>
            <td>{item.executed_price === null ? "-" : formatMoney(item.executed_price)}</td>
          </tr>
        ))}
      </DataTable>

      <DataTable title="Trades" empty="No trades." columns={["Time", "Symbol", "Side", "Qty", "Price", "P&L"]}>
        {trades.map((item) => (
          <tr key={item.id}>
            <td className="muted">{formatDateTime(item.created_at)}</td>
            <td className="symbol">{item.symbol}</td>
            <td className={item.side === "BUY" ? "buy" : "sell"}>{item.side}</td>
            <td>{item.quantity}</td>
            <td>{formatMoney(item.price)}</td>
            <td>{formatMoney(item.realized_pnl)}</td>
          </tr>
        ))}
      </DataTable>

      <DataTable title="Ledger" empty="No ledger entries." columns={["Time", "Type", "Symbol", "Amount", "Balance"]}>
        {ledger.map((item) => (
          <tr key={item.id}>
            <td className="muted">{formatDateTime(item.created_at)}</td>
            <td>{item.type}</td>
            <td>{item.symbol || "-"}</td>
            <td>{formatMoney(item.amount)}</td>
            <td>{formatMoney(item.balance)}</td>
          </tr>
        ))}
      </DataTable>

      <DataTable title="Admin Action History" empty="No admin actions." columns={["Time", "Action", "Admin", "Reason"]}>
        {adminActions.map((item) => (
          <tr key={item.id}>
            <td className="muted">{formatDateTime(item.created_at)}</td>
            <td>{item.action}</td>
            <td>{item.admin_user_id || "-"}</td>
            <td>{item.reason || "-"}</td>
          </tr>
        ))}
      </DataTable>
    </>
  );
}

function Metric({ label, value }) {
  return (
    <div>
      <span className="label">{label}</span>
      <div className="value">{value}</div>
    </div>
  );
}

function DataTable({ title, empty, columns, children }) {
  const rows = Array.isArray(children) ? children.filter(Boolean) : children;
  const isEmpty = Array.isArray(rows) ? rows.length === 0 : !rows;

  return (
    <div className="card">
      <h3 className="card-title">{title}</h3>
      {isEmpty ? (
        <p className="muted">{empty}</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>{rows}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatMoney(value) {
  return "Rs " + Number(value || 0).toFixed(2);
}

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString() : "-";
}
