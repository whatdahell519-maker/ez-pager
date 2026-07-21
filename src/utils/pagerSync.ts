import { PageMessage, PagerTone, PagerUrgency } from '../types';

type MessageCallback = (msg: PageMessage) => void;
type ConnectionCallback = (connected: boolean, activeClients?: number) => void;

class PagerSyncService {
  private currentChannel: string = 'DEFAULT';
  private customServerUrl: string = '';
  private sseSource: EventSource | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private messageListeners: Set<MessageCallback> = new Set();
  private connectionListeners: Set<ConnectionCallback> = new Set();
  private processedMessageIds: Set<string> = new Set();
  private isConnected: boolean = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pollIntervalTimer: ReturnType<typeof setInterval> | null = null;
  private lastPollTimestamp: string = new Date(Date.now() - 300000).toISOString();
  private activeClientsCount: number = 1;

  constructor() {
    this.setupStorageListener();
  }

  public getApiBase(): string {
    if (this.customServerUrl) {
      return this.customServerUrl.replace(/\/+$/, '');
    }
    if (typeof window !== 'undefined' && window.location && window.location.protocol.startsWith('http')) {
      return window.location.origin;
    }
    // Fallback default hosted endpoint for standalone local .html execution
    return 'https://ais-dev-tifamfyshhqwtzxbj74wp3-121100319385.europe-west2.run.app';
  }

  public setServerUrl(url: string) {
    this.customServerUrl = url.trim();
    this.connect(this.currentChannel);
  }

  public getServerUrl(): string {
    return this.getApiBase();
  }

  /**
   * Connect or switch to a specified Pager channel
   */
  public connect(channelId: string) {
    const normChannel = (channelId || 'DEFAULT').toUpperCase().trim();
    this.currentChannel = normChannel;
    this.cleanupCurrentConnection();

    // 1. Initialize BroadcastChannel for instant local cross-tab sync
    try {
      this.broadcastChannel = new BroadcastChannel(`pager_channel_${normChannel}`);
      this.broadcastChannel.onmessage = (event) => {
        if (event.data && event.data.id) {
          this.handleIncomingMessage(event.data);
        }
      };
    } catch (err) {
      console.warn('BroadcastChannel not supported or failed:', err);
    }

    // 2. Initialize ntfy.sh Global Relay for instant multi-device / cross-origin sync
    this.initNtfyRelay(normChannel);

    // 3. Initialize SSE connection to local server if hosted on HTTP
    if (typeof window !== 'undefined' && window.location && window.location.protocol.startsWith('http')) {
      this.initSSE(normChannel);
      this.initPolling(normChannel);
    }
  }

  private initNtfyRelay(normChannel: string) {
    const topic = `pager_applet_v2_${normChannel.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    const ntfyUrl = `https://ntfy.sh/${topic}/sse`;

    try {
      const source = new EventSource(ntfyUrl);

      source.onopen = () => {
        this.isConnected = true;
        this.notifyConnectionStatus(true, this.activeClientsCount);
      };

      source.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.message) {
            let parsed: PageMessage | null = null;
            try {
              parsed = JSON.parse(data.message);
            } catch {
              // Ignore non-JSON
            }
            if (parsed && parsed.id && parsed.message) {
              this.handleIncomingMessage(parsed);
            }
          }
        } catch {
          // Heartbeat or non-JSON
        }
      };

      source.onerror = () => {
        // Fallback polling for ntfy
      };

      // Also set a periodic poll on ntfy as backup
      const pollNtfy = async () => {
        try {
          const res = await fetch(`https://ntfy.sh/${topic}/json?poll=1&since=30s`);
          if (res.ok) {
            const text = await res.text();
            const lines = text.trim().split('\n');
            lines.forEach((line) => {
              if (!line.trim()) return;
              try {
                const item = JSON.parse(line);
                if (item && item.message) {
                  const parsed = JSON.parse(item.message);
                  if (parsed && parsed.id) {
                    this.handleIncomingMessage(parsed);
                  }
                }
              } catch {
                // Ignore parse errors
              }
            });
          }
        } catch {
          // Ignore fetch errors
        }
      };

      pollNtfy();
      const ntfyInterval = setInterval(pollNtfy, 2000);

      // Store in reconnectTimer cleanup
      const originalCleanup = this.cleanupCurrentConnection;
      this.cleanupCurrentConnection = () => {
        source.close();
        clearInterval(ntfyInterval);
        originalCleanup.call(this);
      };
    } catch (err) {
      console.warn('ntfy relay connection failed:', err);
    }
  }

  private initSSE(normChannel: string) {
    if (this.sseSource) {
      this.sseSource.close();
    }

    const apiBase = this.getApiBase();
    const sseUrl = `${apiBase}/api/events?channel=${encodeURIComponent(normChannel)}`;

    try {
      const source = new EventSource(sseUrl);

      source.onopen = () => {
        this.isConnected = true;
        this.notifyConnectionStatus(true, this.activeClientsCount);
      };

      source.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.id && data.message) {
            this.handleIncomingMessage(data as PageMessage);
          }
        } catch {
          // Heartbeats or non-JSON messages
        }
      };

      source.onerror = () => {
        this.isConnected = false;
        this.notifyConnectionStatus(false, this.activeClientsCount);
        source.close();

        // Attempt SSE reconnection after 3 seconds
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
          if (this.currentChannel === normChannel) {
            this.initSSE(normChannel);
          }
        }, 3000);
      };

      this.sseSource = source;
    } catch (err) {
      console.warn('SSE Connection failed, relying on HTTP polling:', err);
      this.notifyConnectionStatus(false, this.activeClientsCount);
    }
  }

  private initPolling(normChannel: string) {
    if (this.pollIntervalTimer) {
      clearInterval(this.pollIntervalTimer);
    }

    // Poll immediately and then every 1500ms
    this.pollServer(normChannel);
    this.pollIntervalTimer = setInterval(() => {
      this.pollServer(normChannel);
    }, 1500);
  }

  private async pollServer(normChannel: string) {
    const apiBase = this.getApiBase();
    const pollUrl = `${apiBase}/api/poll?channel=${encodeURIComponent(normChannel)}&since=${encodeURIComponent(this.lastPollTimestamp)}`;

    try {
      const response = await fetch(pollUrl, { credentials: 'omit' });
      if (response.ok) {
        const data = await response.json();
        if (typeof data.activeClients === 'number') {
          this.activeClientsCount = data.activeClients;
        }

        if (Array.isArray(data.messages) && data.messages.length > 0) {
          data.messages.forEach((msg: PageMessage) => {
            this.handleIncomingMessage(msg);
            if (msg.timestamp && new Date(msg.timestamp) > new Date(this.lastPollTimestamp)) {
              this.lastPollTimestamp = msg.timestamp;
            }
          });
        }

        if (!this.isConnected) {
          this.isConnected = true;
          this.notifyConnectionStatus(true, this.activeClientsCount);
        }
      }
    } catch (err) {
      // Offline or network error
    }
  }

  private setupStorageListener() {
    window.addEventListener('storage', (e) => {
      if (e.key === 'pager_sync_event' && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          if (data && data.channel === this.currentChannel && data.id) {
            this.handleIncomingMessage(data);
          }
        } catch {
          // Ignore parse errors
        }
      }
    });
  }

  private handleIncomingMessage(msg: PageMessage) {
    if (this.processedMessageIds.has(msg.id)) {
      return; // Deduplicate
    }
    this.processedMessageIds.add(msg.id);

    // Limit set size memory
    if (this.processedMessageIds.size > 500) {
      const oldestId = Array.from(this.processedMessageIds)[0];
      this.processedMessageIds.delete(oldestId);
    }

    this.messageListeners.forEach((cb) => cb(msg));
  }

  private cleanupCurrentConnection() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.pollIntervalTimer) {
      clearInterval(this.pollIntervalTimer);
      this.pollIntervalTimer = null;
    }
    if (this.sseSource) {
      this.sseSource.close();
      this.sseSource = null;
    }
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
    this.isConnected = false;
  }

  /**
   * Subscribe to incoming page alerts
   */
  public onMessage(callback: MessageCallback): () => void {
    this.messageListeners.add(callback);
    return () => this.messageListeners.delete(callback);
  }

  /**
   * Subscribe to connection status changes
   */
  public onConnectionChange(callback: ConnectionCallback): () => void {
    this.connectionListeners.add(callback);
    callback(this.isConnected, this.activeClientsCount);
    return () => this.connectionListeners.delete(callback);
  }

  private notifyConnectionStatus(status: boolean, clientsCount?: number) {
    this.connectionListeners.forEach((cb) => cb(status, clientsCount));
  }

  /**
   * Send a Page Alert to the current channel across ALL devices
   */
  public async sendPage(params: {
    message: string;
    urgency?: PagerUrgency;
    tone?: PagerTone;
    senderName?: string;
    repeatCount?: number;
    channel?: string;
  }): Promise<{ success: boolean; message?: PageMessage; error?: string }> {
    const targetChannel = (params.channel || this.currentChannel).toUpperCase().trim();

    const payload = {
      channel: targetChannel,
      message: params.message,
      urgency: params.urgency || 'normal',
      tone: params.tone || 'classic',
      senderName: params.senderName || 'Anonymous',
      repeatCount: params.repeatCount || 1,
    };

    // 1. Instant local broadcast to other tabs via BroadcastChannel & LocalStorage
    const localMsg: PageMessage = {
      id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      channel: targetChannel,
      message: params.message,
      urgency: params.urgency || 'normal',
      tone: params.tone || 'classic',
      senderName: params.senderName || 'Anonymous',
      timestamp: new Date().toISOString(),
      repeatCount: params.repeatCount || 1,
    };

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(localMsg);
      } catch {
        // BroadcastChannel optional fallback
      }
    }

    try {
      localStorage.setItem('pager_sync_event', JSON.stringify({ ...localMsg, _ts: Date.now() }));
    } catch {
      // LocalStorage optional fallback
    }

    // 2. Transmit to ntfy.sh Global Cloud Relay for instant cross-device notification on ANY phone/PC
    const topic = `pager_applet_v2_${targetChannel.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    try {
      fetch(`https://ntfy.sh/${topic}`, {
        method: 'POST',
        body: JSON.stringify(localMsg),
        headers: { 'Content-Type': 'text/plain' },
      }).catch(() => {});
    } catch {
      // Optional ntfy relay fallback
    }

    // 3. Post to API server if available
    const apiBase = this.getApiBase();
    if (typeof window !== 'undefined' && window.location && window.location.protocol.startsWith('http')) {
      try {
        const response = await fetch(`${apiBase}/api/page`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.message) {
            this.handleIncomingMessage(data.message);
          }
          return { success: true, message: data.message };
        }
      } catch (err) {
        console.warn('API POST failed, used global relay fallback:', err);
      }
    }

    this.handleIncomingMessage(localMsg);
    return { success: true, message: localMsg };
  }

  /**
   * Fetch historical pages for current channel
   */
  public async fetchHistory(channelId?: string): Promise<PageMessage[]> {
    const normChannel = (channelId || this.currentChannel).toUpperCase().trim();
    const apiBase = this.getApiBase();
    try {
      const response = await fetch(`${apiBase}/api/history?channel=${encodeURIComponent(normChannel)}`);
      if (response.ok) {
        const data = await response.json();
        return data.history || [];
      }
    } catch {
      // Fail gracefully
    }
    return [];
  }
}

export const pagerSync = new PagerSyncService();
