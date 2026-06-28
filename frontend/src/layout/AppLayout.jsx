import { useState } from "react";
import {
  Bell,
  CandlestickChart,
  ChevronDown,
  CircleDollarSign,
  LayoutDashboard,
  LogOut,
  ReceiptText,
  Settings,
  ShieldCheck,
  UserCircle,
  WalletCards,
} from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import SearchInput from "@/components/common/SearchInput";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/useAuth";
import { useToast } from "@/context/useToast";
import { cn } from "@/lib/utils";

const userNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/user" },
  { icon: CandlestickChart, label: "Trade", to: "/user/trade" },
  { icon: WalletCards, label: "Portfolio", to: "/user/portfolio" },
  { icon: CircleDollarSign, label: "Buy/Sell", to: "/user/buy-sell" },
  { icon: ReceiptText, label: "Transactions", to: "/user/transactions" },
  { icon: Settings, label: "Settings", to: "/user/settings" },
];

const adminNavItems = [
  { icon: ShieldCheck, label: "Admin", to: "/admin" },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, logout, session } = useAuth();
  const { notify } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const homePath = isAdmin ? "/admin" : "/user";
  const visibleNavItems = isAdmin ? [...userNavItems, ...adminNavItems] : userNavItems;

  async function handleLogout() {
    await logout();
    notify({
      description: "Your session has been cleared.",
      title: "Logout successful",
      variant: "success",
    });
    setMenuOpen(false);
    navigate("/login");
  }

  function handleProfileNavigation() {
    setMenuOpen(false);
    navigate("/user/settings");
  }

  function handleGlobalSearch(query) {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      notify({
        description: isAdmin ? "Search by user name, email, phone, status, or deposit detail." : "Search by symbol or company name.",
        title: "Enter a search term",
        variant: "info",
      });
      return;
    }

    if (isAdmin && location.pathname.startsWith("/admin")) {
      navigate("/admin?search=" + encodeURIComponent(normalizedQuery));
      notify({
        description: "Filtering admin users and deposit requests for \"" + normalizedQuery + "\".",
        title: "Admin search applied",
        variant: "success",
      });
      return;
    }

    navigate("/user/trade?search=" + encodeURIComponent(normalizedQuery));
    notify({
      description: "Opening market search for \"" + normalizedQuery + "\".",
      title: "Market search applied",
      variant: "success",
    });
  }

  function handleNotificationAction(path) {
    setNotificationsOpen(false);
    navigate(path);
  }

  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-white/10 bg-slate-950/95 xl:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-white/10 p-5">
            <NavLink className="flex items-center gap-3" to={homePath}>
              <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-300">
                <CandlestickChart className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <p className="font-semibold tracking-tight">Trading Simulator</p>
                <p className="text-xs text-muted-foreground">Paper trading workspace</p>
              </div>
            </NavLink>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            {visibleNavItems.map((item) => (
              <SidebarLink item={item} key={item.to} />
            ))}
          </nav>

          <div className="space-y-3 border-t border-white/10 p-4">
            <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Experience</p>
                <Badge variant={isAdmin ? "info" : session.isLoggedIn ? "positive" : "neutral"}>
                  {isAdmin ? "admin" : session.isLoggedIn ? "user" : "guest"}
                </Badge>
              </div>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                Navigation reflects account access.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-sm font-semibold">{session.name}</p>
              <p className="mt-1 truncate text-xs text-muted-foreground">{session.email}</p>
              <p className="mt-3 text-xs text-muted-foreground">Account {session.accountId}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0 xl:pl-72">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-background/90 backdrop-blur">
          <div className="flex min-h-16 flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between lg:px-8">
            <div className="flex items-center gap-3">
              <NavLink className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold xl:hidden" to={homePath}>
                <CandlestickChart className="h-4 w-4 text-emerald-300" aria-hidden="true" />
                TradeSim
              </NavLink>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">Market Console</p>
                <p className="text-sm text-muted-foreground">Portfolio, markets, and account activity</p>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-3 md:max-w-3xl md:flex-row md:items-center md:justify-end">
              <div className="hidden sm:block">
                <SearchInput
                  ariaLabel={isAdmin && location.pathname.startsWith("/admin") ? "Search admin users" : "Search market symbols"}
                  onChange={setSearchValue}
                  onSubmit={handleGlobalSearch}
                  placeholder={isAdmin && location.pathname.startsWith("/admin") ? "Search users or deposits" : "Search symbols"}
                  value={searchValue}
                />
              </div>
              <div className="flex items-center justify-between gap-2 md:justify-end">
                <Badge variant="positive">Market Open</Badge>
                <div className="relative">
                  <Button
                    aria-expanded={notificationsOpen}
                    aria-label="Open notifications"
                    onClick={() => {
                      setMenuOpen(false);
                      setNotificationsOpen((isOpen) => !isOpen);
                    }}
                    size="xs"
                    variant="outline"
                  >
                    <Bell className="h-4 w-4" aria-hidden="true" />
                    <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-emerald-300 ring-2 ring-background" />
                  </Button>
                  {notificationsOpen ? (
                    <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-xl border border-white/10 bg-slate-950 p-2 shadow-2xl shadow-black/40">
                      <div className="border-b border-white/10 px-3 py-2">
                        <p className="text-sm font-semibold">Notifications</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {isAdmin ? "Admin operational shortcuts." : "Account and market shortcuts."}
                        </p>
                      </div>
                      {isAdmin ? (
                        <>
                          <NotificationButton
                            description="Open the deposit approval queue and user controls."
                            label="Review admin operations"
                            onClick={() => handleNotificationAction("/admin")}
                          />
                          <NotificationButton
                            description="Search or inspect user account details."
                            label="Open user management"
                            onClick={() => handleNotificationAction("/admin")}
                          />
                        </>
                      ) : (
                        <>
                          <NotificationButton
                            description="Check portfolio value, holdings, and performance."
                            label="Review portfolio"
                            onClick={() => handleNotificationAction("/user/portfolio")}
                          />
                          <NotificationButton
                            description="View deposit requests and recent account activity."
                            label="Open transactions"
                            onClick={() => handleNotificationAction("/user/transactions")}
                          />
                        </>
                      )}
                    </div>
                  ) : null}
                </div>
                <div className="relative">
                  <Button
                    className="gap-2"
                    onClick={() => {
                      setNotificationsOpen(false);
                      setMenuOpen((isOpen) => !isOpen);
                    }}
                    size="sm"
                    variant="outline"
                  >
                    <UserCircle className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden sm:inline">{session.isLoggedIn ? session.name : "Visitor"}</span>
                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  {menuOpen ? (
                    <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-slate-950 p-2 shadow-2xl shadow-black/40">
                      <div className="border-b border-white/10 px-3 py-2">
                        <p className="text-sm font-semibold">{session.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{session.email}</p>
                      </div>
                      {!isAdmin ? (
                        <>
                          <button className="menu-item" onClick={handleProfileNavigation} type="button">
                            Profile
                          </button>
                          <button className="menu-item" onClick={handleProfileNavigation} type="button">
                            Settings
                          </button>
                        </>
                      ) : null}
                      <button className="menu-item text-red-300 hover:text-red-200" onClick={handleLogout} type="button">
                        <LogOut className="h-4 w-4" aria-hidden="true" />
                        Logout
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto border-t border-white/10 px-4 py-2 xl:hidden">
            {visibleNavItems.map((item) => (
              <TopNavLink item={item} key={item.to} />
            ))}
          </nav>
        </header>

        <main className="min-w-0 px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NotificationButton({ description, label, onClick }) {
  return (
    <button
      className="mt-1 w-full rounded-lg px-3 py-2 text-left transition hover:bg-white/5"
      onClick={onClick}
      type="button"
    >
      <span className="block text-sm font-semibold text-foreground">{label}</span>
      <span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span>
    </button>
  );
}

function SidebarLink({ item }) {
  const Icon = item.icon;

  return (
    <NavLink
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-white/5 hover:text-foreground",
          isActive && "bg-emerald-500/10 text-emerald-200 ring-1 ring-emerald-500/20",
        )
      }
      end={item.to === "/user" || item.to === "/admin"}
      to={item.to}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {item.label}
    </NavLink>
  );
}

function TopNavLink({ item }) {
  const Icon = item.icon;

  return (
    <NavLink
      className={({ isActive }) =>
        cn(
          "inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground",
          isActive && "bg-emerald-500/10 text-emerald-200",
        )
      }
      end={item.to === "/user" || item.to === "/admin"}
      to={item.to}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {item.label}
    </NavLink>
  );
}
