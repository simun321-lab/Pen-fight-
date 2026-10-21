/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

type MessageListener = (data: Record<string, unknown>) => void;

class SocketService {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<MessageListener>> = new Map();
  private reconnectTimer: number | null = null;
  private token: string | null = null;
  private userId: string | null = null;
  public status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' = 'disconnected';

  public connect(token: string | null, userId: string | null) {
    this.token = token;
    this.userId = userId;

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.status = this.status === 'disconnected' ? 'connecting' : 'reconnecting';
    this.emitEvent('status_change', { status: this.status });

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.status = 'connected';
        this.emitEvent('status_change', { status: 'connected' });
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }

        // Send auth handshake
        if (this.token || this.userId) {
          this.send('auth:init', { token: this.token, userId: this.userId });
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const type = payload.type;
          if (type) {
            this.emitEvent(type, payload);
          }
        } catch (e) {
          console.error('Socket message parse error', e);
        }
      };

      this.ws.onclose = () => {
        this.status = 'reconnecting';
        this.emitEvent('status_change', { status: 'reconnecting' });
        this.ws = null;
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        // Handled by onclose
      };
    } catch (err) {
      console.error('Failed to initiate WS connection', err);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      if (this.status !== 'connected') {
        this.connect(this.token, this.userId);
      }
    }, 2500);
  }

  public send(type: string, data: Record<string, unknown> = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, ...data }));
    } else {
      console.warn('Socket not connected, dropping message', type);
    }
  }

  public on(event: string, callback: MessageListener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  public off(event: string, callback: MessageListener) {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(callback);
    }
  }

  private emitEvent(event: string, data: Record<string, unknown>) {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach(cb => {
        try {
          cb(data);
        } catch (err) {
          console.error(`Error in socket listener for ${event}`, err);
        }
      });
    }
  }

  public disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.status = 'disconnected';
    this.emitEvent('status_change', { status: 'disconnected' });
  }
}

export const socket = new SocketService();
