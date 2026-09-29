import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { getAuthenticatedUser } from './auth.js';
import { PriceAlert, WatchlistItem } from '../types.js';

export const alertsRouter = Router();

// GET /api/alerts
alertsRouter.get('/', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Please sign in.' });

  const alerts = db.priceAlerts.filter((a) => a.user_id === user.id);
  return res.json({ alerts });
});

// POST /api/alerts
alertsRouter.post('/', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Please sign in.' });

  const { crop, state, market, condition, threshold } = req.body;
  if (!crop || !condition || threshold === undefined) {
    return res.status(400).json({ error: 'Crop, condition, and price threshold are required.' });
  }

  const alert: PriceAlert = {
    id: `alert-${Date.now()}`,
    user_id: user.id,
    crop: String(crop).trim(),
    state: state ? String(state).trim() : '',
    market: market ? String(market).trim() : '',
    condition: condition as 'above' | 'below' | 'change_pct',
    threshold: Number(threshold),
    active: true,
    created_at: new Date().toISOString(),
  };

  db.priceAlerts.unshift(alert);
  db.persist();

  return res.status(201).json({ alert, message: 'Price alert configured successfully.' });
});

// DELETE /api/alerts/:id
alertsRouter.delete('/:id', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Please sign in.' });

  db.priceAlerts = db.priceAlerts.filter((a) => a.id !== req.params.id);
  db.persist();
  return res.json({ success: true, message: 'Price alert removed.' });
});

// GET /api/alerts/watchlist
alertsRouter.get('/watchlist', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Please sign in.' });

  const items = db.watchlist.filter((w) => w.user_id === user.id);
  // Attach current modal price
  const enriched = items.map((w) => {
    const matched = db.agroPrices
      .filter(
        (p) =>
          p.crop.toLowerCase() === w.crop.toLowerCase() &&
          (!w.market || p.market.toLowerCase() === w.market.toLowerCase())
      )
      .sort((a, b) => b.arrival_date.localeCompare(a.arrival_date));

    const latest = matched[0];
    const prev = matched[1];
    let changePct = 0;
    if (latest && prev && prev.modal_price > 0) {
      changePct = Math.round(((latest.modal_price - prev.modal_price) / prev.modal_price) * 100 * 10) / 10;
    }

    return {
      ...w,
      current_modal_price: latest ? latest.modal_price : null,
      arrival_date: latest ? latest.arrival_date : null,
      change_pct: changePct,
    };
  });

  return res.json({ items: enriched });
});

// POST /api/alerts/watchlist
alertsRouter.post('/watchlist', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Please sign in.' });

  const { crop, state, market } = req.body;
  if (!crop) return res.status(400).json({ error: 'Crop name is required.' });

  const existing = db.watchlist.find(
    (w) =>
      w.user_id === user.id &&
      w.crop.toLowerCase() === String(crop).toLowerCase() &&
      (!market || w.market.toLowerCase() === String(market).toLowerCase())
  );
  if (existing) {
    return res.status(409).json({ error: 'This crop is already in your watchlist.' });
  }

  const item: WatchlistItem = {
    id: `watch-${Date.now()}`,
    user_id: user.id,
    crop: String(crop).trim(),
    state: state ? String(state).trim() : '',
    market: market ? String(market).trim() : '',
    created_at: new Date().toISOString(),
  };

  db.watchlist.unshift(item);
  db.persist();

  return res.status(201).json({ item, message: 'Added to watchlist.' });
});

// DELETE /api/alerts/watchlist/:id
alertsRouter.delete('/watchlist/:id', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Please sign in.' });

  db.watchlist = db.watchlist.filter((w) => w.id !== req.params.id);
  db.persist();
  return res.json({ success: true, message: 'Removed from watchlist.' });
});

// GET /api/alerts/notifications
alertsRouter.get('/notifications', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Please sign in.' });

  const list = db.notifications.filter((n) => n.user_id === user.id);
  return res.json({ notifications: list });
});

// PUT /api/alerts/notifications/:id/read
alertsRouter.put('/notifications/:id/read', (req: Request, res: Response) => {
  const notif = db.notifications.find((n) => n.id === req.params.id);
  if (notif) {
    notif.read = true;
    db.persist();
  }
  return res.json({ success: true });
});
