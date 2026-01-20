import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";

import Instruments from "./pages/Instruments";
import Portfolio from "./pages/Portfolio";
import Trades from "./pages/Trades";
import Wallet from "./pages/Wallet";

export default function App() {
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

            <NavLink to="/wallet" className="nav-link">
              Wallet
            </NavLink>
          </div>
        </nav>

        {/* MAIN CONTENT */}
        <main className="container">
          <Routes>
            <Route path="/" element={<Instruments />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/trades" element={<Trades />} />
            <Route path="/wallet" element={<Wallet />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
