import { Navigate } from "react-router-dom";

import useAuth from "./useAuth";

export default function AdminRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="card">
        <h2>Admin</h2>
        <p className="muted">Checking permissions...</p>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}
