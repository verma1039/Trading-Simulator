import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import api from "../api/axios";

const PAGE_SIZE = 10;

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadUsers() {
      try {
        setError(null);
        const res = await api.get("/admin/users");
        if (active) setUsers(res.data || []);
      } catch (err) {
        if (active) setError(err.response?.data?.detail || "Failed to load admin users");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadUsers();
    return () => {
      active = false;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;

    return users.filter((user) => (
      user.email?.toLowerCase().includes(q)
      || user.id?.toLowerCase().includes(q)
      || user.role?.toLowerCase().includes(q)
      || user.status?.toLowerCase().includes(q)
    ));
  }, [search, users]);

  const totalPages = Math.max(Math.ceil(filteredUsers.length / PAGE_SIZE), 1);
  const currentPage = Math.min(page, totalPages);
  const visibleUsers = filteredUsers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function handleSearch(value) {
    setSearch(value);
    setPage(1);
  }

  if (loading) {
    return (
      <div className="card">
        <h2>Admin Users</h2>
        <p className="muted">Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <h2>Admin Users</h2>
        <p className="error">{error}</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="admin-header">
        <div>
          <span className="eyebrow">Admin</span>
          <h2 className="card-title">Users</h2>
        </div>
        <Link className="nav-link admin-link-button" to="/admin">
          Dashboard
        </Link>
      </div>

      <div className="admin-toolbar">
        <input
          type="search"
          placeholder="Search by email, id, role, or status"
          value={search}
          onChange={(event) => handleSearch(event.target.value)}
        />
        <span className="muted">
          {filteredUsers.length} user{filteredUsers.length === 1 ? "" : "s"}
        </span>
      </div>

      {visibleUsers.length === 0 ? (
        <p className="muted">No users found.</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Wallet Balance</th>
                <th>Created</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.email || "-"}</td>
                  <td>{user.role}</td>
                  <td>
                    <span className={"status-pill " + statusClass(user.status)}>
                      {user.status}
                    </span>
                  </td>
                  <td>{formatMoney(user.walletBalance)}</td>
                  <td className="muted">{formatDate(user.created_at)}</td>
                  <td>
                    <Link to={"/admin/users/" + user.id}>View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="admin-pagination">
        <button
          type="button"
          onClick={() => setPage((value) => Math.max(value - 1, 1))}
          disabled={currentPage <= 1}
        >
          Previous
        </button>
        <span className="muted">
          Page {currentPage} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => setPage((value) => Math.min(value + 1, totalPages))}
          disabled={currentPage >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function statusClass(status) {
  if (status === "ACTIVE") return "online";
  if (status === "SUSPENDED") return "closed";
  if (status === "BANNED") return "offline";
  return "stale";
}

function formatMoney(value) {
  return "Rs " + Number(value || 0).toFixed(2);
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : "-";
}
