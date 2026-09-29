import { Router, Request, Response } from 'express';
import { detectPriceAnomalies, generatePriceForecast } from '../services/analyticsService.js';

export const analyticsRouter = Router();

// GET /api/analytics/anomalies
analyticsRouter.get('/anomalies', (req: Request, res: Response) => {
  const { crop } = req.query;
  const result = detectPriceAnomalies(crop ? String(crop) : undefined);
  return res.json(result);
});

// GET /api/analytics/forecast
analyticsRouter.get('/forecast', (req: Request, res: Response) => {
  const { crop = 'Tomato', state, market } = req.query;
  const result = generatePriceForecast(
    String(crop),
    state ? String(state) : undefined,
    market ? String(market) : undefined
  );
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }
  return res.json(result.data);
});
