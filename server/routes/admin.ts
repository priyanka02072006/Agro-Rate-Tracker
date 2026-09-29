import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { getAuthenticatedUser } from './auth.js';
import { ingestionService } from '../adapters/sourceAdapter.js';
import { evaluatePriceAlerts } from '../services/alertService.js';
import { Role } from '../types.js';

import fs from 'fs';
import path from 'path';
import { getSupabaseConfigStatus, testSupabaseConnection } from '../supabase.js';
import {
  getHanaConfigStatus,
  testHanaConnection,
  getHanaSchemaSql,
  getDashboardDatasets,
  exportHanaFullDump,
} from '../hana.js';

export const adminRouter = Router();

// ==============================================================================
// SAP HANA CLOUD & MCP INTEGRATION ENDPOINTS
// ==============================================================================

// GET /api/admin/hana-status
adminRouter.get('/hana-status', async (req: Request, res: Response) => {
  const config = getHanaConfigStatus();
  let connTest = { success: false, message: 'Not tested' };
  try {
    connTest = await testHanaConnection();
  } catch (err: any) {
    connTest = { success: false, message: err.message };
  }

  return res.json({
    config,
    connection: connTest,
    totalDatasets: getDashboardDatasets().length,
  });
});

// GET /api/admin/hana-schema
adminRouter.get('/hana-schema', (req: Request, res: Response) => {
  try {
    const sql = getHanaSchemaSql();
    return res.json({ sql, schema: '07083DD5224243A8B73B330781FE33B6' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/hana-datasets
adminRouter.get('/hana-datasets', (req: Request, res: Response) => {
  try {
    const datasets = getDashboardDatasets();
    return res.json({
      datasets,
      totalDatasets: datasets.length,
      schema: '07083DD5224243A8B73B330781FE33B6',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/hana-export-dump
adminRouter.get('/hana-export-dump', (req: Request, res: Response) => {
  try {
    const sql = exportHanaFullDump();
    return res.json({ sql });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/hana-test-connection
adminRouter.post('/hana-test-connection', async (req: Request, res: Response) => {
  try {
    const result = await testHanaConnection();
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/hana-live-tables
adminRouter.get('/hana-live-tables', async (req: Request, res: Response) => {
  try {
    const { getHanaLiveTables } = await import('../hana.js');
    const result = await getHanaLiveTables();
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/hana-sync
adminRouter.post('/hana-sync', async (req: Request, res: Response) => {
  try {
    const { syncAllToHana } = await import('../hana.js');
    const result = await syncAllToHana();
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/supabase-status
adminRouter.get('/supabase-status', async (req: Request, res: Response) => {
  const config = getSupabaseConfigStatus();
  let connTest = { connected: false, message: 'Supabase credentials not configured in environment.' };

  if (config.isConfigured) {
    connTest = await testSupabaseConnection();
  }

  return res.json({
    config,
    connection: connTest,
    syncStatus: db.supabaseSync,
  });
});

// POST /api/admin/supabase-sync
adminRouter.post('/supabase-sync', async (req: Request, res: Response) => {
  try {
    const result = await db.syncAllToSupabase();
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Supabase sync failed.' });
  }
});

// GET /api/admin/supabase-schema
adminRouter.get('/supabase-schema', (req: Request, res: Response) => {
  try {
    const schemaPath = path.resolve(process.cwd(), 'supabase_schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf-8');
      return res.json({ sql });
    }
    return res.status(404).json({ error: 'Schema file not found' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/sync-status
adminRouter.get('/sync-status', (req: Request, res: Response) => {
  const hasApiKey = Boolean(process.env.DATA_GOV_IN_API_KEY && process.env.DATA_GOV_IN_API_KEY.trim() !== '');

  return res.json({
    hasApiKey,
    sourceAdapter: hasApiKey ? 'AgmarknetApiAdapter (data.gov.in)' : 'CsvAdapter (Seed Fallback)',
    syncStatusLabel: hasApiKey ? 'Live Gov Feed Ready' : 'Live sync not configured',
    lastSyncAt: db.lastSyncAt,
    lastSyncStatus: db.lastSyncStatus,
    latestArrivalDate: db.latestArrivalDate,
    totalRecords: db.agroPrices.length,
    recentLogs: db.ingestionLogs.slice(0, 10),
  });
});

// POST /api/admin/sync-now
// Trigger scheduled/manual sync immediately
adminRouter.post('/sync-now', async (req: Request, res: Response) => {
  try {
    const log = await ingestionService.runSync();
    // After ingestion, evaluate price alerts
    const alertsTriggered = evaluatePriceAlerts();

    return res.json({
      success: true,
      log,
      alertsTriggered,
      message: `Sync completed: ${log.accepted} records accepted, ${log.rejected} rejected. ${alertsTriggered} price alerts triggered.`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Sync failed.' });
  }
});

// GET /api/admin/settings
adminRouter.get('/settings', (req: Request, res: Response) => {
  return res.json({ settings: db.settings });
});

// PUT /api/admin/settings
adminRouter.put('/settings', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrators can update system settings.' });
  }

  const {
    weight_price,
    weight_distance,
    weight_quantity,
    weight_availability,
    weight_feasibility,
    delivery_base_fee,
    delivery_per_km_tonne,
    proposal_expiry_hours,
  } = req.body;

  if (weight_price !== undefined) db.settings.weight_price = Number(weight_price);
  if (weight_distance !== undefined) db.settings.weight_distance = Number(weight_distance);
  if (weight_quantity !== undefined) db.settings.weight_quantity = Number(weight_quantity);
  if (weight_availability !== undefined) db.settings.weight_availability = Number(weight_availability);
  if (weight_feasibility !== undefined) db.settings.weight_feasibility = Number(weight_feasibility);
  if (delivery_base_fee !== undefined) db.settings.delivery_base_fee = Number(delivery_base_fee);
  if (delivery_per_km_tonne !== undefined) db.settings.delivery_per_km_tonne = Number(delivery_per_km_tonne);
  if (proposal_expiry_hours !== undefined) db.settings.proposal_expiry_hours = Number(proposal_expiry_hours);

  db.persist();
  return res.json({ settings: db.settings, message: 'Settings saved successfully.' });
});

// GET /api/admin/users
adminRouter.get('/users', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }

  const safeUsers = db.profiles.map(({ password_hash, ...u }) => u);
  return res.json({ users: safeUsers });
});

// PUT /api/admin/users/:id/role
adminRouter.put('/users/:id/role', (req: Request, res: Response) => {
  const adminUser = getAuthenticatedUser(req);
  if (!adminUser || adminUser.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }

  const target = db.profiles.find((p) => p.id === req.params.id);
  if (!target) return res.status(404).json({ error: 'User not found.' });

  const { role } = req.body;
  if (!['farmer', 'customer', 'trader', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role.' });
  }

  target.role = role as Role;
  db.persist();
  const { password_hash, ...safeTarget } = target;
  return res.json({ user: safeTarget, message: `User role updated to ${role}.` });
});

// GET /api/admin/rejected-rows
adminRouter.get('/rejected-rows', (req: Request, res: Response) => {
  const allRejects: Array<{ logId: string; runAt: string; row: any; reason: string }> = [];

  for (const log of db.ingestionLogs) {
    if (log.rejected_samples) {
      for (const sample of log.rejected_samples) {
        allRejects.push({
          logId: log.id,
          runAt: log.run_at,
          row: sample.row,
          reason: sample.reason,
        });
      }
    }
  }

  return res.json({ rejects: allRejects });
});
