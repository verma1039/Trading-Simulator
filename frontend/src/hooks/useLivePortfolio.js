import { useEffect, useRef, useState } from "react";

export default function useLivePortfolio() {
  const [portfolio, setPortfolio] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    if (wsRef.current) return;

    const ws = new WebSocket("ws://127.0.0.1:8000/ws/portfolio");
    wsRef.current = ws;

    ws.onmessage = (e) => {
      setPortfolio(JSON.parse(e.data));
    };

    ws.onerror = () => {
      console.warn("Portfolio WS error");
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, []);

  return portfolio;
}
