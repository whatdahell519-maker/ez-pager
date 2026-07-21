import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

interface PageMessage {
  id: string;
  channel: string;
  message: string;
  urgency: 'normal' | 'urgent' | 'emergency';
  tone: 'classic' | 'two-tone' | 'siren' | 'high-frequency' | 'burst';
  senderName: string;
  timestamp: string;
  repeatCount: number;
}

interface SSEClient {
  id: string;
  channel: string;
  res: express.Response;
}

const app = express();
const PORT = 3000;

app.use(express.json());

// Global CORS middleware for multi-device & standalone HTML support
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// In-memory message store per channel (capped at 100 per channel)
const channelHistory = new Map<string, PageMessage[]>();
// Active SSE clients
const clients: SSEClient[] = [];

// Helper to push a message to channel history
function addMessageToHistory(msg: PageMessage) {
  const normChannel = (msg.channel || 'DEFAULT').toUpperCase().trim();
  if (!channelHistory.has(normChannel)) {
    channelHistory.set(normChannel, []);
  }
  const history = channelHistory.get(normChannel)!;
  history.unshift(msg);
  if (history.length > 100) {
    history.pop();
  }
}

// API Route: Send a Page Alert
app.post('/api/page', (req, res) => {
  const { channel, message, urgency, tone, senderName, repeatCount } = req.body || {};

  if (!message || typeof message !== 'string' || message.trim() === '') {
    res.status(400).json({ error: 'Message text is required' });
    return;
  }

  const normChannel = (channel || 'DEFAULT').toString().toUpperCase().trim();
  const pageMsg: PageMessage = {
    id: `page_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    channel: normChannel,
    message: message.trim(),
    urgency: urgency && ['normal', 'urgent', 'emergency'].includes(urgency) ? urgency : 'normal',
    tone: tone && ['classic', 'two-tone', 'siren', 'high-frequency', 'burst'].includes(tone) ? tone : 'classic',
    senderName: (senderName || 'Anonymous').toString().trim(),
    timestamp: new Date().toISOString(),
    repeatCount: Math.min(Math.max(Number(repeatCount) || 1, 1), 10),
  };

  addMessageToHistory(pageMsg);

  // Broadcast to all matching SSE clients
  const payload = `data: ${JSON.stringify(pageMsg)}\n\n`;
  let broadcastCount = 0;

  clients.forEach((client) => {
    if (client.channel === normChannel || client.channel === 'ALL') {
      try {
        client.res.write(payload);
        broadcastCount++;
      } catch (e) {
        // Handle closed client write error quietly
      }
    }
  });

  res.json({
    success: true,
    message: pageMsg,
    recipientsNotified: broadcastCount,
  });
});

// API Route: Real-time SSE Endpoint
app.get('/api/events', (req, res) => {
  const channel = (req.query.channel as string || 'DEFAULT').toUpperCase().trim();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const client: SSEClient = { id: clientId, channel, res };
  clients.push(client);

  // Connection acknowledgement
  res.write(`data: ${JSON.stringify({ type: 'connected', clientId, channel, timestamp: new Date().toISOString() })}\n\n`);

  // Keep-alive heartbeat interval every 15s
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    const index = clients.findIndex((c) => c.id === clientId);
    if (index !== -1) {
      clients.splice(index, 1);
    }
  });
});

// API Route: Fetch History for Channel
app.get('/api/history', (req, res) => {
  const channel = (req.query.channel as string || 'DEFAULT').toUpperCase().trim();
  const history = channelHistory.get(channel) || [];
  res.json({ channel, history });
});

// API Route: Fast Polling Endpoint (Backup to SSE for backgrounded mobile browsers)
app.get('/api/poll', (req, res) => {
  const channel = (req.query.channel as string || 'DEFAULT').toUpperCase().trim();
  const since = req.query.since as string || '';
  const history = channelHistory.get(channel) || [];

  if (!since) {
    res.json({ channel, messages: history.slice(0, 10), activeClients: clients.length });
    return;
  }

  const sinceTime = new Date(since).getTime();
  const newMessages = history.filter((m) => {
    const msgTime = new Date(m.timestamp).getTime();
    return msgTime > sinceTime;
  });

  res.json({ channel, messages: newMessages, activeClients: clients.length });
});

// Health & Server Info check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    activeClients: clients.length,
    channelCount: channelHistory.size,
    timestamp: new Date().toISOString()
  });
});

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Pager Server listening on http://0.0.0.0:${PORT}`);
  });
}

start();
