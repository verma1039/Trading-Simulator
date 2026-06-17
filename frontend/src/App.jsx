import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";

import Instruments from "./pages/Instruments";
import Portfolio from "./pages/Portfolio";
import Trades from "./pages/Trades";
import PlaceOrder from "./pages/PlaceOrder";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminUserDetail from "./pages/AdminUserDetail";
import AdminRoute from "./auth/AdminRoute";
import useAuth from "./auth/useAuth";

export default function App() {
  const { isAuthenticated, loading, logout, user } = useAuth();

  return (
    <BrowserRouter>
      <div className="app">
        {/* NAVBAR */}
        <nav className="navbar">
          <div className="nav-left">
            <h1 className="logo">📊 Trading Simulator</h1>
          </div>

          <div className="nav-links">
            <NavLink to="/" end className="nav-link">
              Market
            </NavLink>

            <NavLink to="/portfolio" className="nav-link">
              Portfolio
            </NavLink>

            <NavLink to="/trades" className="nav-link">
              Trades
            </NavLink>

            <NavLink to="/order" className="nav-link">
              Buy / Sell
            </NavLink>

            {!loading && user?.role === "admin" && (
              <NavLink to="/admin" className="nav-link">
                Admin
              </NavLink>
            )}

            {!loading && !isAuthenticated && (
              <>
                <NavLink to="/login" className="nav-link">
                  Login
                </NavLink>

                <NavLink to="/signup" className="nav-link">
                  Sign Up
                </NavLink>
              </>
            )}

            {!loading && isAuthenticated && (
              <button className="nav-link auth-button" onClick={logout} type="button">
                Logout {user?.email ? `(${user.email})` : ""}
              </button>
            )}
          </div>
        </nav>

        {/* MAIN CONTENT */}
        <main className="container">
          <Routes>
            <Route path="/" element={<Instruments />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/trades" element={<Trades />} />
            <Route path="/order" element={<PlaceOrder />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/admin"
              element={(
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              )}
            />
            <Route
              path="/admin/users"
              element={(
                <AdminRoute>
                  <AdminUsers />
                </AdminRoute>
              )}
            />
            <Route
              path="/admin/users/:userId"
              element={(
                <AdminRoute>
                  <AdminUserDetail />
                </AdminRoute>
              )}
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
