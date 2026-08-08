import { useState, useEffect, useCallback } from 'react';
import { gameCPWS } from '../services/ws';
import { sendServerPower } from '../services/api';
import { getServerHealth } from '../services/api';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState(null);
  const [logs, setLogs] = useState([]);
  const [worldChat, setWorldChat] = useState([]);

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

    const unsubscribeWorldChat = gameCPWS.onWorldChat((chat) => {
      setWorldChat((prev) => {
        const next = [...prev, chat];
        return next.length > 500
          ? next.slice(next.length - 500)
          : next;
      });
    });

    return () => {
      unsubscribeConn();
      unsubscribeStatus();
      unsubscribeConsole();
      unsubscribeWorldChat();
    };
  }, []);

  const sendCommand = useCallback((cmd) => {
    return gameCPWS.sendCommand(cmd);
  }, []);

  const sendWorldChat = useCallback((message) => {
    const text = String(message ?? '').trim();

    if (!text) return false;

    return gameCPWS.sendCommand(`say ${text}`);
  }, []);

  const sendPower = useCallback(async (action) => {
    try {
      return await sendServerPower(action);
    } catch (err) {
      console.error('[Power] Failed:', action, err);
      throw err;
    }
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const clearWorldChat = useCallback(() => {
    setWorldChat([]);
  }, []);

  return {
    isConnected,
    status,
    logs,
    worldChat,
    sendCommand,
    sendWorldChat,
    sendPower,
    clearLogs,
    clearWorldChat,
  };
}
