import { useEffect, useRef, useState } from "react";
import { WS_BASE_URL } from "../config";
import useAuth from "../auth/useAuth";

export default function useLivePortfolio() {
  const [portfolio, setPortfolio] = useState(null);
  const wsRef = useRef(null);
  const { accessToken } = useAuth();

  useEffect(() => {
    if (!accessToken) {
      setPortfolio(null);
      return undefined;
    }

    if (wsRef.current) return;

    const ws = new WebSocket(
      WS_BASE_URL + "/ws/portfolio?access_token=" + encodeURIComponent(accessToken),
    );
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
  }, [accessToken]);

  return portfolio;
}
