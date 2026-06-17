import { useEffect, useRef, useState } from "react";
import { WS_BASE_URL } from "../config";

export default function useLivePrices() {
  const [prices, setPrices] = useState({});
  const [symbols, setSymbols] = useState({});
  const [market, setMarket] = useState(null);
  const wsRef = useRef(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    const ws = new WebSocket(WS_BASE_URL + "/ws/prices");
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const rows = Array.isArray(data) ? data : data.prices || [];
      const map = {};

      for (const p of rows) {
        map[p.symbol] = p.price;
      }

      setPrices(map);
      setSymbols(Object.fromEntries(rows.map(row => [row.symbol, row])));
      if (!Array.isArray(data) && data.market) {
        setMarket(data.market);
      }
    };

    ws.onerror = () => {
      console.warn("Prices WebSocket error");
    };

    return () => {};
  }, []);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  return { prices, symbols, market };
}
