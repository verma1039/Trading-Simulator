import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import api from "../api/axios";

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        setError(null);
        const [dashboardRes, activityRes] = await Promise.all([
          api.get("/admin/dashboard"),
          api.get("/admin/activity?limit=5&offset=0"),
        ]);

        if (!active) return;
        setDashboard(dashboardRes.data);
        setActivity(activityRes.data.actions || []);
      } catch (err) {
        if (!active) return;
        setError(err.response?.data?.detail || "Failed to load admin dashboard");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="card">
        <h2>Admin Dashboard</h2>
        <p className="muted">Loading admin dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <h2>Admin Dashboard</h2>
        <p className="error">{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="card">
        <div className="admin-header">
          <div>
            <span className="eyebrow">Admin</span>
            <h2 className="card-title">Dashboard</h2>
          </div>
          <Link className="nav-link admin-link-button" to="/admin/users">
            Manage Users
          </Link>
        </div>

        <div className="summary-grid admin-summary-grid">
          <Metric label="Total Users" value={dashboard.total_users} />
          <Metric label="Active Users" value={dashboard.active_users} />
          <Metric label="Suspended Users" value={dashboard.suspended_users} />
          <Metric label="Banned Users" value={dashboard.banned_users} />
          <Metric label="Total Wallet Balance" value={formatMoney(dashboard.total_wallet_balance)} />
          <Metric label="Orders Today" value={dashboard.orders_today} />
          <Metric label="Trades Today" value={dashboard.trades_today} />
        </div>
      </div>

      <div className="card">
        <div className="admin-header">
          <h3 className="card-title">Recent Admin Activity</h3>
          <Link className="nav-link admin-link-button" to="/admin/users">
            Users
          </Link>
        </div>

        {activity.length === 0 ? (
          <p className="muted">No admin actions yet.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Action</th>
                  <th>Target User</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {activity.map((item) => (
                  <tr key={item.id}>
                    <td className="muted">{formatDate(item.created_at)}</td>
                    <td>{item.action}</td>
                    <td>{item.target_user_id}</td>
                    <td>{item.reason || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
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

function formatMoney(value) {
  return "Rs " + Number(value || 0).toFixed(2);
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : "-";
}
