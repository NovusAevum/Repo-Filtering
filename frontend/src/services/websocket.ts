import { io, Socket } from 'socket.io-client';
import { apiService } from './api';

import { getWsBaseUrl } from '../config/runtime';
const WS_BASE_URL = getWsBaseUrl();

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'fallback';

export interface ProgressUpdateEvent {
  search_id: string;
  status: string;
  progress: number;
  current_step: string;
  completed_steps: number;
  total_steps: number;
  processed_count: number;
  total_count: number;
}

export interface SearchCompleteEvent {
  search_id: string;
  result_count: number;
}

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();
  private status: ConnectionStatus = 'disconnected';
  private failures = 0;
  private activeSearchId: string | null = null;
  private pollInterval: any = null;

  private setStatus(status: ConnectionStatus) {
    this.status = status;
    this.emit('status_change', status);
  }

  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    this.setStatus('connecting');
    this.socket = io(WS_BASE_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 16000,
      timeout: 8000,
      forceNew: true,
    });

    this.socket.on('connect', () => {
      this.failures = 0;
      this.setStatus('connected');
    });

    this.socket.on('reconnect_attempt', () => {
      this.setStatus('reconnecting');
    });

    this.socket.on('disconnect', () => {
      this.setStatus('disconnected');
    });

    this.socket.on('progress_update', (data: ProgressUpdateEvent) => {
      this.emit('progress_update', data);
    });

    this.socket.on('search_complete', (data: SearchCompleteEvent) => {
      this.emit('search_complete', data);
    });

    this.socket.on('connect_error', () => {
      this.failures += 1;
      if (this.failures >= 5) {
        this.enableFallback();
      }
    });
  }

  private enableFallback() {
    this.setStatus('fallback');
    // Stop socket
    if (this.socket) {
      try { this.socket.disconnect(); } catch {}
      this.socket = null;
    }
    // Start polling if we have an active search
    this.startPolling();
  }

  setActiveSearch(searchId: string | null) {
    this.activeSearchId = searchId;
    if (this.status === 'fallback') {
      this.startPolling();
    }
  }

  private startPolling() {
    if (!this.activeSearchId) return;
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.pollInterval = setInterval(async () => {
      if (!this.activeSearchId) return;
      const res = await apiService.getSearchStatus(this.activeSearchId);
      if (res.data) {
        const d = res.data;
        const mapped: ProgressUpdateEvent = {
          search_id: d.search_id,
          status: d.status,
          progress: d.progress,
          current_step: d.current_step,
          completed_steps: d.completed_steps,
          total_steps: d.total_steps,
          processed_count: d.processed_count,
          total_count: d.total_count,
        };
        this.emit('progress_update', mapped);
        if (d.status === 'completed' || d.status === 'failed' || d.status === 'cancelled') {
          this.emit('search_complete', { search_id: d.search_id, result_count: d.results?.length || 0 });
          clearInterval(this.pollInterval);
          this.pollInterval = null;
        }
      }
    }, 2000);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.listeners.clear();
    this.setStatus('disconnected');
  }

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  private emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  isConnected(): boolean {
    return this.status === 'connected';
  }

  getStatus(): ConnectionStatus { return this.status; }
}

export const wsService = new WebSocketService();
