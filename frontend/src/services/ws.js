// GameCP WebSocket Client
// Manages real-time bidirectional connection with Bedrock Agent backend

class GameCPWebSocket {
  constructor() {
    this.ws = null;
    this.statusListeners = new Set();
    this.consoleListeners = new Set();
      this.worldChatListeners = new Set();
    this.connectionListeners = new Set();
    this.reconnectTimer = null;
    this.isConnected = false;
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[WebSocket] Connected to GameCP Agent');
        this.isConnected = true;
        this.notifyConnection(true);
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'status') {
            this.notifyStatus(message.data);
          } else if (message.type === 'console') {
            this.notifyConsole(message.data);
          } else if (message.type === 'world_chat') {
              this.notifyWorldChat(message.data);
            } else if (message.type === 'chat_history') {
              if (Array.isArray(message.data)) {
                message.data.forEach(chat => {
                  this.notifyWorldChat(chat);
                });
              }
            } else if (message.type === 'console_history') {
            if (Array.isArray(message.data)) {
              message.data.forEach(line => this.notifyConsole(line));
            }
          }
        } catch (e) {
          console.warn('[WebSocket] Error parsing message:', e);
        }
      };

      this.ws.onclose = () => {
        if (this.isConnected) {
          console.log('[WebSocket] Connection closed, retrying...');
        }
        this.isConnected = false;
        this.notifyConnection(false);
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.warn('[WebSocket] Connection error:', err);
      };
    } catch (e) {
      console.error('[WebSocket] Initialization failed:', e);
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, 3000);
  }

  onStatus(callback) {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  onConsole(callback) {
    this.consoleListeners.add(callback);
    return () => this.consoleListeners.delete(callback);
  }

  onWorldChat(callback) {
      this.worldChatListeners.add(callback);
      return () => this.worldChatListeners.delete(callback);
    }

    onConnectionChange(callback) {
    this.connectionListeners.add(callback);
    return () => this.connectionListeners.delete(callback);
  }

  notifyStatus(status) {
    for (const listener of this.statusListeners) {
      try {
        listener(status);
      } catch (err) {
        console.warn('[WebSocket] Status listener error:', err);
      }
    }
  }

  notifyConsole(line) {
    for (const listener of this.consoleListeners) {
      try {
        listener(line);
      } catch (err) {
        console.warn('[WebSocket] Console listener error:', err);
      }
    }
  }

  notifyWorldChat(chat) {
      for (const listener of this.worldChatListeners) {
        try {
          listener(chat);
        } catch (err) {
          console.warn('[WebSocket] World chat listener error:', err);
        }
      }
    }

    notifyConnection(state) {
    for (const listener of this.connectionListeners) {
      try {
        listener(state);
      } catch (err) {
        console.warn('[WebSocket] Connection listener error:', err);
      }
    }
  }

  sendCommand(cmd) {
    console.log("[WS] sendCommand:", cmd, "readyState=", this.ws ? this.ws.readyState : "null");


    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'command', data: cmd }));
      return true;
    }
    return false;
  }

  sendPower(action) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'power', action }));
      return true;
    }
    return false;
  }
}

export const gameCPWS = new GameCPWebSocket();
