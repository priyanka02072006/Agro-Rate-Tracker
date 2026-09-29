import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { authRouter } from './server/routes/auth.js';
import { pricesRouter } from './server/routes/prices.js';
import { marketplaceRouter } from './server/routes/marketplace.js';
import { analyticsRouter } from './server/routes/analytics.js';
import { alertsRouter } from './server/routes/alerts.js';
import { adminRouter } from './server/routes/admin.js';
import { ingestionService } from './server/adapters/sourceAdapter.js';
import { evaluatePriceAlerts } from './server/services/alertService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// CORS & Security headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-User-Id');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/prices', pricesRouter);
app.use('/api/marketplace', marketplaceRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/admin', adminRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Agro Rate Tracker API', timestamp: new Date().toISOString() });
});

// Daily Scheduled Ingestion Task (Runs check every 15 minutes; fires once daily at 16:00 IST / 10:30 UTC)
let lastScheduledRunDate = '';
setInterval(async () => {
  const now = new Date();
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const dateStr = now.toISOString().split('T')[0];

  // 16:00 IST is 10:30 UTC
  if (utcHours === 10 && utcMinutes >= 30 && utcMinutes <= 45 && lastScheduledRunDate !== dateStr) {
    lastScheduledRunDate = dateStr;
    console.log(`[Scheduled Sync] Running scheduled daily mandi ingestion at ${now.toISOString()}...`);
    try {
      const log = await ingestionService.runSync();
      const alerts = evaluatePriceAlerts();
      console.log(`[Scheduled Sync] Finished. Accepted: ${log.accepted}, Alerts: ${alerts}`);
    } catch (e) {
      console.error('[Scheduled Sync] Failed:', e);
    }
  }
}, 15 * 60 * 1000);

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware mounted in development mode.');
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌾 Agro Rate Tracker server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup error:', err);
  process.exit(1);
});
