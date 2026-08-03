import { useState, useEffect, useCallback } from 'react';
import { gameCPWS } from '../services/ws';
import { getServerHealth } from '../services/api';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // Initial HTTP fetch fallback
    getServerHealth()
      .then(initialData => setStatus(initialData))
      .catch(() => {});

    // Connect WS
    gameCPWS.connect();

    const unsubscribeConn = gameCPWS.onConnectionChange((connected) => {
      setIsConnected(connected);
    });

    const unsubscribeStatus = gameCPWS.onStatus((newStatus) => {
      console.log("\[FRONTEND STATUS\]", JSON.stringify(newStatus, null, 2));

      setStatus(newStatus);
    });

    const unsubscribeConsole = gameCPWS.onConsole((line) => {
      setLogs((prev) => {
        const next = [...prev, line];
        return next.length > 2000 ? next.slice(next.length - 2000) : next;
      });
    });

    return () => {
      unsubscribeConn();
      unsubscribeStatus();
      unsubscribeConsole();
    };
  }, []);

  const sendCommand = useCallback((cmd) => {
    return gameCPWS.sendCommand(cmd);
  }, []);

  const sendPower = useCallback((action) => {
    return gameCPWS.sendPower(action);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return {
    isConnected,
    status,
    logs,
    sendCommand,
    sendPower,
    clearLogs,
  };
}
