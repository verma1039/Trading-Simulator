import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import LoadingState from "@/components/common/LoadingState";
import { GuestOnly, RequireAdmin, RequireUser } from "@/router/guards";

const AppLayout = lazy(() => import("@/layout/AppLayout"));
const AdminPage = lazy(() => import("@/pages/Admin"));
const BuySellPage = lazy(() => import("@/pages/BuySell"));
const DashboardPage = lazy(() => import("@/pages/Dashboard"));
const LoginPage = lazy(() => import("@/pages/Login"));
const PortfolioPage = lazy(() => import("@/pages/Portfolio"));
const SettingsPage = lazy(() => import("@/pages/Settings"));
const SignupPage = lazy(() => import("@/pages/Signup"));
const TradePage = lazy(() => import("@/pages/Trade"));
const TransactionsPage = lazy(() => import("@/pages/Transactions"));

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingState label="Loading workspace" />}>
        <Routes>
          <Route index element={<Navigate replace to="/login" />} />
          <Route element={<GuestOnly />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<SignupPage />} />
          </Route>

          <Route element={<RequireUser />}>
            <Route element={<AppLayout />}>
              <Route path="user" element={<DashboardPage />} />
              <Route path="user/trade" element={<TradePage />} />
              <Route path="user/portfolio" element={<PortfolioPage />} />
              <Route path="user/buy-sell" element={<BuySellPage />} />
              <Route path="user/transactions" element={<TransactionsPage />} />
              <Route path="user/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          <Route element={<RequireAdmin />}>
            <Route element={<AppLayout />}>
              <Route path="admin" element={<AdminPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate replace to="/login" />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
