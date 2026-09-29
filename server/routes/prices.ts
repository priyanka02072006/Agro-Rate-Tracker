import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { AgroPrice } from '../types.js';

export const pricesRouter = Router();

// GET /api/prices/freshness
pricesRouter.get('/freshness', (req: Request, res: Response) => {
  return res.json({
    latestArrivalDate: db.latestArrivalDate,
    lastSyncAt: db.lastSyncAt,
    lastSyncStatus: db.lastSyncStatus,
    totalRecords: db.agroPrices.length,
    sourceLabel: 'Near-real-time: updated daily from Agmarknet',
  });
});

// GET /api/prices/filter-options
// Provides cascading values: states, districts given state, markets given district, crops
pricesRouter.get('/filter-options', (req: Request, res: Response) => {
  const { state, district, crop } = req.query;

  const crops = Array.from(new Set(db.agroPrices.map((p) => p.crop))).sort();
  const states = Array.from(new Set(db.agroPrices.map((p) => p.state))).sort();

  let filtered = db.agroPrices;
  if (state) {
    filtered = filtered.filter((p) => p.state.toLowerCase() === String(state).toLowerCase());
  }

  const districts = Array.from(new Set(filtered.map((p) => p.district))).sort();

  if (district) {
    filtered = filtered.filter((p) => p.district.toLowerCase() === String(district).toLowerCase());
  }

  const markets = Array.from(new Set(filtered.map((p) => p.market))).sort();
  const varieties = Array.from(new Set(filtered.map((p) => p.variety))).sort();
  const grades = Array.from(new Set(filtered.map((p) => p.grade))).sort();

  return res.json({
    crops,
    states,
    districts,
    markets,
    varieties,
    grades,
  });
});

// GET /api/prices
// Server-side filtered, searched, sorted, and paginated
pricesRouter.get('/', (req: Request, res: Response) => {
  const {
    crop,
    state,
    district,
    market,
    variety,
    grade,
    search,
    dateFrom,
    dateTo,
    minPrice,
    maxPrice,
    sortBy = 'arrival_date',
    sortOrder = 'desc',
    page = '1',
    limit = '25',
  } = req.query;

  let results = db.agroPrices;

  // Global search
  if (search && String(search).trim() !== '') {
    const q = String(search).trim().toLowerCase();
    results = results.filter(
      (p) =>
        p.crop.toLowerCase().includes(q) ||
        p.state.toLowerCase().includes(q) ||
        p.district.toLowerCase().includes(q) ||
        p.market.toLowerCase().includes(q) ||
        p.variety.toLowerCase().includes(q)
    );
  }

  // Exact filters
  if (crop) {
    results = results.filter((p) => p.crop.toLowerCase() === String(crop).toLowerCase());
  }
  if (state) {
    results = results.filter((p) => p.state.toLowerCase() === String(state).toLowerCase());
  }
  if (district) {
    results = results.filter((p) => p.district.toLowerCase() === String(district).toLowerCase());
  }
  if (market) {
    results = results.filter((p) => p.market.toLowerCase() === String(market).toLowerCase());
  }
  if (variety) {
    results = results.filter((p) => p.variety.toLowerCase() === String(variety).toLowerCase());
  }
  if (grade) {
    results = results.filter((p) => p.grade.toLowerCase() === String(grade).toLowerCase());
  }
  if (dateFrom) {
    results = results.filter((p) => p.arrival_date >= String(dateFrom));
  }
  if (dateTo) {
    results = results.filter((p) => p.arrival_date <= String(dateTo));
  }
  if (minPrice) {
    const min = Number(minPrice);
    if (!isNaN(min)) results = results.filter((p) => p.modal_price >= min);
  }
  if (maxPrice) {
    const max = Number(maxPrice);
    if (!isNaN(max)) results = results.filter((p) => p.modal_price <= max);
  }

  // Sorting
  const order = sortOrder === 'asc' ? 1 : -1;
  const sortKey = String(sortBy);

  results = [...results].sort((a: any, b: any) => {
    let valA = a[sortKey];
    let valB = b[sortKey];

    if (valA === undefined) valA = '';
    if (valB === undefined) valB = '';

    if (typeof valA === 'number' && typeof valB === 'number') {
      return (valA - valB) * order;
    }
    return String(valA).localeCompare(String(valB)) * order;
  });

  const total = results.length;
  const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
  const pageSize = Math.min(100, Math.max(10, parseInt(String(limit), 10) || 25));
  const totalPages = Math.ceil(total / pageSize);
  const offset = (pageNum - 1) * pageSize;
  const paginated = results.slice(offset, offset + pageSize);

  return res.json({
    data: paginated,
    pagination: {
      total,
      page: pageNum,
      pageSize,
      totalPages,
    },
  });
});

// GET /api/prices/export-csv
// CSV download of currently filtered prices
pricesRouter.get('/export-csv', (req: Request, res: Response) => {
  const { crop, state, district, market, dateFrom, dateTo } = req.query;

  let results = db.agroPrices;
  if (crop) results = results.filter((p) => p.crop.toLowerCase() === String(crop).toLowerCase());
  if (state) results = results.filter((p) => p.state.toLowerCase() === String(state).toLowerCase());
  if (district) results = results.filter((p) => p.district.toLowerCase() === String(district).toLowerCase());
  if (market) results = results.filter((p) => p.market.toLowerCase() === String(market).toLowerCase());
  if (dateFrom) results = results.filter((p) => p.arrival_date >= String(dateFrom));
  if (dateTo) results = results.filter((p) => p.arrival_date <= String(dateTo));

  const headers = [
    'ID',
    'Crop',
    'State',
    'District',
    'Market',
    'Variety',
    'Grade',
    'Arrival Date',
    'Min Price (Rs/Quintal)',
    'Max Price (Rs/Quintal)',
    'Modal Price (Rs/Quintal)',
    'Source',
  ];

  const rows = results.map((p) => [
    p.id,
    `"${p.crop}"`,
    `"${p.state}"`,
    `"${p.district}"`,
    `"${p.market}"`,
    `"${p.variety}"`,
    `"${p.grade}"`,
    p.arrival_date,
    p.min_price,
    p.max_price,
    p.modal_price,
    p.source,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=agro_mandi_prices.csv');
  return res.send(csvContent);
});

// GET /api/prices/detail/:id
// Details drawer + mini trend
pricesRouter.get('/detail/:id', (req: Request, res: Response) => {
  const record = db.agroPrices.find((p) => p.id === req.params.id);
  if (!record) {
    return res.status(404).json({ error: 'Mandi price record not found.' });
  }

  // Mini trend for same crop and market
  const history = db.agroPrices
    .filter(
      (p) =>
        p.crop.toLowerCase() === record.crop.toLowerCase() &&
        p.market.toLowerCase() === record.market.toLowerCase()
    )
    .sort((a, b) => a.arrival_date.localeCompare(b.arrival_date))
    .slice(-10)
    .map((p) => ({
      date: p.arrival_date,
      modal_price: p.modal_price,
      min_price: p.min_price,
      max_price: p.max_price,
    }));

  return res.json({
    record: {
      ...record,
      price_range: record.max_price - record.min_price,
    },
    mini_trend: history,
  });
});

// GET /api/prices/compare
// Pick a crop, then compare across states, districts, markets, or dates
pricesRouter.get('/compare', (req: Request, res: Response) => {
  const { crop = 'Tomato', dimension = 'markets', state } = req.query;

  let subset = db.agroPrices.filter(
    (p) => p.crop.toLowerCase() === String(crop).trim().toLowerCase()
  );

  if (state) {
    subset = subset.filter((p) => p.state.toLowerCase() === String(state).toLowerCase());
  }

  if (subset.length === 0) {
    return res.json({ crop, dimension, items: [], overallAvgModal: 0 });
  }

  const dimKey =
    dimension === 'states'
      ? 'state'
      : dimension === 'districts'
      ? 'district'
      : dimension === 'dates'
      ? 'arrival_date'
      : 'market';

  const groups = new Map<string, AgroPrice[]>();
  for (const p of subset) {
    const key = (p as any)[dimKey] || 'Unknown';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }

  const overallAvgModal = Math.round(
    subset.reduce((a, b) => a + b.modal_price, 0) / subset.length
  );

  const items = Array.from(groups.entries()).map(([entity, list]) => {
    const modals = list.map((l) => l.modal_price);
    const avgModal = Math.round(modals.reduce((a, b) => a + b, 0) / modals.length);
    const minRecorded = Math.min(...list.map((l) => l.min_price));
    const maxRecorded = Math.max(...list.map((l) => l.max_price));
    const diffVsAvg = avgModal - overallAvgModal;

    return {
      entity,
      avg_modal_price: avgModal,
      min_price: minRecorded,
      max_price: maxRecorded,
      diff_vs_group_avg: diffVsAvg,
      diff_pct: Math.round((diffVsAvg / overallAvgModal) * 100),
      record_count: list.length,
      sample_market: list[0].market,
      state: list[0].state,
    };
  });

  items.sort((a, b) => b.avg_modal_price - a.avg_modal_price);

  return res.json({
    crop,
    dimension,
    overallAvgModal,
    items,
  });
});

// GET /api/prices/trends
// Time-series trend for a crop + optional filters
pricesRouter.get('/trends', (req: Request, res: Response) => {
  const { crop = 'Tomato', state, district, market, variety, range = '30D' } = req.query;

  let subset = db.agroPrices.filter(
    (p) => p.crop.toLowerCase() === String(crop).trim().toLowerCase()
  );

  if (state) subset = subset.filter((p) => p.state.toLowerCase() === String(state).toLowerCase());
  if (district) subset = subset.filter((p) => p.district.toLowerCase() === String(district).toLowerCase());
  if (market) subset = subset.filter((p) => p.market.toLowerCase() === String(market).toLowerCase());
  if (variety) subset = subset.filter((p) => p.variety.toLowerCase() === String(variety).toLowerCase());

  // Group by arrival date
  const dateMap = new Map<string, { modals: number[]; mins: number[]; maxs: number[] }>();
  for (const p of subset) {
    if (!dateMap.has(p.arrival_date)) {
      dateMap.set(p.arrival_date, { modals: [], mins: [], maxs: [] });
    }
    const entry = dateMap.get(p.arrival_date)!;
    entry.modals.push(p.modal_price);
    entry.mins.push(p.min_price);
    entry.maxs.push(p.max_price);
  }

  let series = Array.from(dateMap.entries())
    .map(([date, data]) => ({
      date,
      modal_price: Math.round(data.modals.reduce((a, b) => a + b, 0) / data.modals.length),
      min_price: Math.min(...data.mins),
      max_price: Math.max(...data.maxs),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Date range preset slicing
  if (range === '7D') {
    series = series.slice(-7);
  } else if (range === '30D') {
    series = series.slice(-30);
  } else if (range === '90D') {
    series = series.slice(-90);
  }

  if (series.length < 3) {
    return res.json({
      hasEnoughData: false,
      message: 'Not enough historical data for this selection to show a trend.',
      series: [],
      stats: null,
    });
  }

  const startPrice = series[0].modal_price;
  const endPrice = series[series.length - 1].modal_price;
  const changePct = Math.round(((endPrice - startPrice) / startPrice) * 100 * 10) / 10;
  const allModals = series.map((s) => s.modal_price);
  const high = Math.max(...allModals);
  const low = Math.min(...allModals);
  const avg = Math.round(allModals.reduce((a, b) => a + b, 0) / allModals.length);

  return res.json({
    hasEnoughData: true,
    series,
    stats: {
      startDate: series[0].date,
      endDate: series[series.length - 1].date,
      startPrice,
      endPrice,
      changePct,
      high,
      low,
      avg,
    },
  });
});

// GET /api/prices/top-movers
// Top gainers and decliners over 1D and 7D
pricesRouter.get('/top-movers', (req: Request, res: Response) => {
  const period = req.query.period === '1D' ? 1 : 7;

  // Group by crop + market
  const marketMap = new Map<string, AgroPrice[]>();
  for (const p of db.agroPrices) {
    const key = `${p.crop}|${p.market}|${p.state}`;
    if (!marketMap.has(key)) marketMap.set(key, []);
    marketMap.get(key)!.push(p);
  }

  const movers: Array<{
    crop: string;
    market: string;
    state: string;
    current_modal: number;
    prev_modal: number;
    change_amount: number;
    change_pct: number;
  }> = [];

  for (const [key, records] of marketMap.entries()) {
    if (records.length < 2) continue;
    records.sort((a, b) => b.arrival_date.localeCompare(a.arrival_date));

    const latest = records[0];
    const prevIdx = Math.min(period, records.length - 1);
    const prev = records[prevIdx];

    if (!prev || prev.modal_price === 0) continue;

    const diff = latest.modal_price - prev.modal_price;
    const pct = Math.round((diff / prev.modal_price) * 100 * 10) / 10;

    const [crop, market, state] = key.split('|');
    movers.push({
      crop,
      market,
      state,
      current_modal: latest.modal_price,
      prev_modal: prev.modal_price,
      change_amount: diff,
      change_pct: pct,
    });
  }

  const gainers = movers
    .filter((m) => m.change_pct > 0)
    .sort((a, b) => b.change_pct - a.change_pct)
    .slice(0, 5);

  const decliners = movers
    .filter((m) => m.change_pct < 0)
    .sort((a, b) => a.change_pct - b.change_pct)
    .slice(0, 5);

  return res.json({
    period: `${period}D`,
    gainers,
    decliners,
  });
});

// GET /api/prices/dashboard-stats
pricesRouter.get('/dashboard-stats', (req: Request, res: Response) => {
  const { crop, state, market } = req.query;

  let subset = db.agroPrices;
  if (crop) subset = subset.filter((p) => p.crop.toLowerCase() === String(crop).toLowerCase());
  if (state) subset = subset.filter((p) => p.state.toLowerCase() === String(state).toLowerCase());
  if (market) subset = subset.filter((p) => p.market.toLowerCase() === String(market).toLowerCase());

  const totalRecords = subset.length;
  const crops = new Set(subset.map((p) => p.crop)).size;
  const states = new Set(subset.map((p) => p.state)).size;
  const markets = new Set(subset.map((p) => p.market)).size;

  let avgModal = 0;
  let lowestRecorded = 0;
  let highestRecorded = 0;

  if (totalRecords > 0) {
    const modals = subset.map((p) => p.modal_price);
    avgModal = Math.round(modals.reduce((a, b) => a + b, 0) / totalRecords);
    lowestRecorded = Math.min(...subset.map((p) => p.min_price));
    highestRecorded = Math.max(...subset.map((p) => p.max_price));
  }

  // Marketplace counters
  const activeListings = db.farmerListings.filter((l) => l.status === 'active').length;
  const openRequirements = db.customerRequirements.filter(
    (r) => r.status === 'open' || r.status === 'matched'
  ).length;
  const dealsInProgress = db.dealProposals.filter((d) => d.status === 'proposed').length;
  const completedOrders = db.orders.filter(
    (o) => o.status === 'delivered' || o.status === 'completed'
  ).length;

  return res.json({
    totalRecords,
    crops,
    states,
    markets,
    avgModal,
    lowestRecorded,
    highestRecorded,
    activeListings,
    openRequirements,
    dealsInProgress,
    completedOrders,
  });
});
