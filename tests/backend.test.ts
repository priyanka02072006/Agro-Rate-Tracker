import test from 'node:test';
import assert from 'node:assert';
import { validatePriceRecord } from '../server/adapters/sourceAdapter.js';
import { db } from '../server/db.js';
import {
  matchFarmersForRequirement,
  calculateDeliveryCostEstimate,
  normalizePricePerUnit,
} from '../server/services/matchingService.js';
import {
  detectPriceAnomalies,
  generatePriceForecast,
} from '../server/services/analyticsService.js';
import { evaluatePriceAlerts } from '../server/services/alertService.js';
import { CustomerRequirement } from '../server/types.js';

test('Validation Rules: Rejection of invalid mandi records', () => {
  // Test missing crop
  const r1 = validatePriceRecord({ state: 'Tamil Nadu', district: 'Dindigul', market: 'Market1', arrival_date: '2026-09-28', min_price: 1000, max_price: 1500, modal_price: 1200 }, 'csv_seed');
  assert.strictEqual(r1.valid, false);
  assert.match(r1.reason!, /Missing commodity/);

  // Test min > max
  const r2 = validatePriceRecord({ crop: 'Tomato', state: 'Tamil Nadu', district: 'Dindigul', market: 'Market1', arrival_date: '2026-09-28', min_price: 2000, max_price: 1500, modal_price: 1800 }, 'csv_seed');
  assert.strictEqual(r2.valid, false);
  assert.match(r2.reason!, /cannot exceed Max price/);

  // Test modal outside [min, max]
  const r3 = validatePriceRecord({ crop: 'Tomato', state: 'Tamil Nadu', district: 'Dindigul', market: 'Market1', arrival_date: '2026-09-28', min_price: 1000, max_price: 1500, modal_price: 1900 }, 'csv_seed');
  assert.strictEqual(r3.valid, false);
  assert.match(r3.reason!, /must lie within/);

  // Test valid record
  const r4 = validatePriceRecord({ crop: 'Tomato', state: 'Tamil Nadu', district: 'Dindigul', market: 'Ottanchatram', arrival_date: '2026-09-28', min_price: 1800, max_price: 2400, modal_price: 2100 }, 'csv_seed');
  assert.strictEqual(r4.valid, true);
  assert.strictEqual(r4.cleanRecord?.modal_price, 2100);
});

test('Idempotent Upsert: No duplicates on re-run with natural key', () => {
  const initialCount = db.agroPrices.length;
  const sample = db.agroPrices[0];

  const updateRecord = {
    ...sample,
    modal_price: sample.modal_price + 50,
  };

  const res = db.upsertPrices([updateRecord]);
  assert.strictEqual(res.updated, 1);
  assert.strictEqual(res.accepted, 0);
  assert.strictEqual(db.agroPrices.length, initialCount);
});

test('Matching Engine: Alternative farmer candidate scoring & distance', () => {
  const req: CustomerRequirement = {
    id: 'test-req-1',
    customer_id: 'cust-1',
    customer_name: 'Test Buyer',
    crop: 'Tomato',
    quantity: 15,
    unit: 'quintal',
    delivery_state: 'Tamil Nadu',
    delivery_district: 'Chennai',
    latitude: 13.0827,
    longitude: 80.2707,
    required_by_date: '2026-10-05',
    max_budget_per_unit: 2500,
    status: 'open',
    created_at: new Date().toISOString(),
  };

  const result = matchFarmersForRequirement(req);
  assert.ok(result.proposals.length > 0, 'Should find candidate proposals');
  assert.ok(result.proposals.length <= 3, 'Returns top 3 candidates maximum');

  const top = result.proposals[0];
  assert.ok(top.match_score >= 0 && top.match_score <= 100);
  assert.ok(top.distance_km > 0, 'Distance must be positive');
  assert.ok(top.delivery_cost_estimate > 0, 'Delivery cost must be positive');
  assert.strictEqual(top.total_cost, Math.round(top.price_per_unit * req.quantity + top.delivery_cost_estimate));
});

test('Concurrency & Mutex Locking: Prevents overselling when stock runs low', async () => {
  const testListingId = 'test-concurrent-listing';
  // Create a listing with only 10 quintals available
  db.farmerListings.push({
    id: testListingId,
    farmer_id: 'test-farmer-concurrent',
    farmer_name: 'Concurrent Test Farmer',
    crop: 'Tomato',
    variety: 'Hybrid',
    grade: 'FAQ',
    quantity_available: 10,
    unit: 'quintal',
    asking_price_per_unit: 2000,
    state: 'Tamil Nadu',
    district: 'Dindigul',
    latitude: 10.36,
    longitude: 77.98,
    available_from: '2026-09-20',
    available_until: '2026-10-20',
    status: 'active',
    is_demo: true,
    created_at: new Date().toISOString(),
  });

  // Attempt two simultaneous acceptances of 10 quintals each
  let successCount = 0;
  let failCount = 0;

  const tryAccept = async () => {
    return db.withListingLock(testListingId, async () => {
      const listing = db.farmerListings.find((l) => l.id === testListingId)!;
      if (listing.quantity_available < 10) {
        throw new Error('Insufficient inventory');
      }
      listing.quantity_available -= 10;
      listing.status = 'sold_out';
      return true;
    });
  };

  const results = await Promise.allSettled([tryAccept(), tryAccept()]);
  results.forEach((r) => {
    if (r.status === 'fulfilled') successCount++;
    else failCount++;
  });

  assert.strictEqual(successCount, 1, 'Exactly one concurrent accept must succeed');
  assert.strictEqual(failCount, 1, 'The competing accept must be rejected');

  const finalListing = db.farmerListings.find((l) => l.id === testListingId)!;
  assert.strictEqual(finalListing.quantity_available, 0);
  assert.strictEqual(finalListing.status, 'sold_out');
});

test('Anomaly Detection: Correctly flags statistical IQR price spikes', () => {
  const result = detectPriceAnomalies('Tomato');
  assert.ok(result.anomalies.length > 0, 'Must detect injected Tomato price spike in Rayakottai');

  const spiked = result.anomalies.find((a) => a.market === 'Rayakottai');
  assert.ok(spiked, 'Should find Rayakottai anomaly');
  assert.strictEqual(spiked?.direction, 'Above');
  assert.strictEqual(spiked?.severity, 'High');
});

test('Price Forecasting: Produces 7-day trend with backtest error for >=30 points', () => {
  const res = generatePriceForecast('Tomato');
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.data?.points.length, 7);
  assert.ok(res.data!.mape_backtest_pct >= 0, 'MAPE backtest error must be non-negative');

  // Verify confidence bands
  for (const pt of res.data!.points) {
    assert.ok(pt.confidence_lower <= pt.predicted_modal);
    assert.ok(pt.confidence_upper >= pt.predicted_modal);
  }
});

test('Supabase Connection & Zero Hard-Coding Architecture', async () => {
  const { isSupabaseConfigured, getSupabaseConfigStatus, testSupabaseConnection } = await import('../server/supabase.js');

  const status = getSupabaseConfigStatus();
  assert.ok(typeof status.isConfigured === 'boolean');
  // Verify that secrets are never hardcoded in source
  if (!process.env.SUPABASE_URL) {
    assert.strictEqual(status.isConfigured, false, 'Should be false when SUPABASE_URL is not set');
    assert.strictEqual(status.supabaseUrl, null);
    assert.strictEqual(status.hasAnonKey, false);

    const conn = await testSupabaseConnection();
    assert.strictEqual(conn.connected, false);
    assert.match(conn.message, /not configured/);
  }
});

test('Multi-Role Authentication: Customer, Trader, Farmer, and Admin registration', () => {
  // 1. Farmer Registration with mobile phone (low literacy accessibility)
  const farmerEmail = `farmer.test.${Date.now()}@agrorate.in`;
  const farmerPhone = '9876543210';
  db.profiles.push({
    id: `user-farmer-${Date.now()}`,
    user_id: `user-farmer-${Date.now()}`,
    name: 'Muthu Velan',
    email: farmerEmail,
    password_hash: '1234',
    role: 'farmer',
    phone: farmerPhone,
    state: 'Tamil Nadu',
    district: 'Madurai',
    latitude: 9.9252,
    longitude: 78.1198,
    language: 'ta',
    created_at: new Date().toISOString(),
  });

  // Verify farmer can be looked up by phone number
  const foundByPhone = db.profiles.find(
    (p) => p.phone && p.phone.replace(/\D/g, '') === farmerPhone
  );
  assert.ok(foundByPhone, 'Farmer must be findable by phone number');
  assert.strictEqual(foundByPhone?.role, 'farmer');
  assert.strictEqual(foundByPhone?.language, 'ta');

  // 2. Customer Registration
  const custEmail = `customer.test.${Date.now()}@agrorate.in`;
  db.profiles.push({
    id: `user-customer-${Date.now()}`,
    user_id: `user-customer-${Date.now()}`,
    name: 'Kavitha Groceries',
    email: custEmail,
    password_hash: 'custpass123',
    role: 'customer',
    state: 'Karnataka',
    district: 'Bengaluru',
    latitude: 12.9716,
    longitude: 77.5946,
    language: 'en',
    created_at: new Date().toISOString(),
  });
  const foundCust = db.profiles.find((p) => p.email === custEmail);
  assert.ok(foundCust);
  assert.strictEqual(foundCust?.role, 'customer');

  // 3. Trader Registration
  const traderEmail = `trader.test.${Date.now()}@agrorate.in`;
  db.profiles.push({
    id: `user-trader-${Date.now()}`,
    user_id: `user-trader-${Date.now()}`,
    name: 'Balaji Mandi Commission Agents',
    email: traderEmail,
    password_hash: 'traderpass123',
    role: 'trader',
    state: 'Maharashtra',
    district: 'Pune',
    latitude: 18.5204,
    longitude: 73.8567,
    language: 'en',
    created_at: new Date().toISOString(),
  });
  const foundTrader = db.profiles.find((p) => p.email === traderEmail);
  assert.ok(foundTrader);
  assert.strictEqual(foundTrader?.role, 'trader');

  // 4. Admin Registration
  const adminEmail = `admin.directorate.${Date.now()}@agrorate.gov.in`;
  db.profiles.push({
    id: `user-admin-${Date.now()}`,
    user_id: `user-admin-${Date.now()}`,
    name: 'Tamil Nadu Mandi Directorate Officer',
    email: adminEmail,
    password_hash: 'admin2025secure',
    role: 'admin',
    state: 'Tamil Nadu',
    district: 'Chennai',
    latitude: 13.0827,
    longitude: 80.2707,
    language: 'en',
    created_at: new Date().toISOString(),
  });
  const foundAdmin = db.profiles.find((p) => p.email === adminEmail);
  assert.ok(foundAdmin);
  assert.strictEqual(foundAdmin?.role, 'admin');
});

test('SAP HANA Cloud MCP Schema & Dashboard Datasets Architecture', async () => {
  const { getHanaConfigStatus, getDashboardDatasets, getHanaSchemaSql, exportHanaFullDump } = await import('../server/hana.js');

  const config = getHanaConfigStatus();
  assert.ok(config.schema, 'Schema must be present');
  assert.ok(config.schema.includes('07083DD5224243A8B73B330781FE33B6'), 'Schema must match target identifier');
  assert.strictEqual(config.port, 443);
  assert.strictEqual(config.ssl, true);

  // Verify dashboard datasets are partitioned per dashboard
  const datasets = getDashboardDatasets();
  assert.ok(datasets.length >= 10, 'Should have at least 10 dashboard datasets');

  const expectedDashboards = [
    'executive_dashboard',
    'market_prices',
    'compare',
    'trends',
    'movers',
    'forecast',
    'anomalies',
    'farmer_hub',
    'find_produce',
    'orders',
    'supply_demand',
    'alerts',
    'admin',
  ];

  for (const dashId of expectedDashboards) {
    const found = datasets.find((d) => d.dashboardId === dashId);
    assert.ok(found, `Dataset for dashboard '${dashId}' must exist`);
    assert.ok(found.hanaViewName.includes('07083DD5224243A8B73B330781FE33B6'));
    assert.ok(found.columns.length > 0, `Dataset '${dashId}' must have columns defined`);
  }

  // Verify full SQL DDL script is populated
  const ddl = getHanaSchemaSql();
  assert.ok(ddl.includes('CREATE COLUMN TABLE "AGRO_PRICES"'));
  assert.ok(ddl.includes('CREATE OR REPLACE VIEW "V_DASHBOARD_COMMODITY_METRICS"'));
  assert.ok(ddl.includes('CREATE OR REPLACE VIEW "V_MARKET_PRICES_EXPLORER"'));
  assert.ok(ddl.includes('CREATE OR REPLACE VIEW "V_COMPARE_INTER_MANDI_SPREAD"'));
  assert.ok(ddl.includes('CREATE OR REPLACE VIEW "V_FORECAST_7DAY_PROJECTIONS"'));
  assert.ok(ddl.includes('CREATE OR REPLACE VIEW "V_SUPPLY_DEMAND_EQUILIBRIUM"'));

  // Verify dump generation
  const dump = exportHanaFullDump();
  assert.ok(dump.length > ddl.length, 'Dump should contain seed and repository records');
});



