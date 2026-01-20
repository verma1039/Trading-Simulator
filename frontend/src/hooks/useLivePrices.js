import { useEffect, useRef, useState } from "react";

export default function useLivePrices() {
  const [prices, setPrices] = useState({});
  const wsRef = useRef(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    // prevent React 18 strict-mode double connect
    if (mountedRef.current) return;
    mountedRef.current = true;

    const ws = new WebSocket("ws://127.0.0.1:8000/ws/prices");
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const map = {};

      for (const p of data) {
        map[p.symbol] = p.price;
      }

      setPrices(map);
    };

    ws.onerror = () => {
      console.warn("Prices WebSocket error");
    };

    // IMPORTANT: do NOT close during strict-mode cleanup
    return () => {};
  }, []);

  // real cleanup only when page unloads
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  return prices;
}
