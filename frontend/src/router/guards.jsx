import { Navigate, Outlet, useLocation } from "react-router-dom";

import LoadingState from "@/components/common/LoadingState";
import { useAuth } from "@/context/useAuth";

export function RequireUser() {
  const location = useLocation();
  const { isAuthenticated, isLoading, session } = useAuth();

  if (isLoading) {
    return <LoadingState label="Restoring user session" />;
  }

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  if (!["USER", "ADMIN"].includes(session.role)) {
    return <Navigate replace to="/login" />;
  }

  return <Outlet />;
}

export function RequireAdmin() {
  const location = useLocation();
  const { isAdmin, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState label="Checking admin access" />;
  }

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  if (!isAdmin) {
    return <Navigate replace to="/user" />;
  }

  return <Outlet />;
}

export function GuestOnly() {
  const { isAdmin, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState label="Checking session" />;
  }

  if (isAuthenticated) {
    return <Navigate replace to={isAdmin ? "/admin" : "/user"} />;
  }

  return <Outlet />;
}
