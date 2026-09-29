import tls from 'tls';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { db } from './db.js';

const require = createRequire(import.meta.url);

export interface HanaConfigStatus {
  isConfigured: boolean;
  host: string | null;
  port: number | null;
  schema: string;
  userMasked: string | null;
  hasPassword: boolean;
  ssl: boolean;
  validateCert: boolean;
  mcpServerName: string;
}

export interface DashboardDatasetInfo {
  dashboardId: string;
  dashboardName: string;
  route: string;
  primaryTable: string;
  hanaViewName: string;
  description: string;
  columns: Array<{ name: string; type: string; description: string }>;
  sampleData: any[];
}

export function getHanaConfigStatus(): HanaConfigStatus {
  const host = process.env.HANA_HOST || 'ec7fe24b-6072-4ecf-8ef2-1c4675a544fc.hana.prod-ap21.hanacloud.ondemand.com';
  const port = Number(process.env.HANA_PORT || 443);
  const user = process.env.HANA_USER || '07083DD5224243A8B73B330781FE33B6_847HZDGM0TBWSQYB0KH9O3B61_DT';
  const password = process.env.HANA_PASSWORD || '';
  // The user schema is where the MCP user has CREATE ANY table permissions
  const schema = process.env.HANA_USER || '07083DD5224243A8B73B330781FE33B6_847HZDGM0TBWSQYB0KH9O3B61_DT';
  const ssl = process.env.HANA_SSL !== 'false';
  const validateCert = process.env.HANA_SSL_VALIDATE_CERTIFICATE === 'true';

  const isConfigured = Boolean(host && user && password);

  let userMasked: string | null = null;
  if (user) {
    userMasked = user.length > 12 ? `${user.substring(0, 8)}...${user.substring(user.length - 4)}` : user;
  }

  return {
    isConfigured,
    host,
    port,
    schema,
    userMasked,
    hasPassword: Boolean(password),
    ssl,
    validateCert,
    mcpServerName: 'hana-mcp-server',
  };
}

/**
 * Tests network & TLS handshake connectivity to SAP HANA Cloud host and port
 */
export async function testHanaConnection(): Promise<{ success: boolean; message: string; latencyMs?: number }> {
  const config = getHanaConfigStatus();
  if (!config.host || !config.port) {
    return { success: false, message: 'SAP HANA Cloud host and port are not configured.' };
  }

  const startTime = Date.now();

  return new Promise((resolve) => {
    const socket = tls.connect(
      {
        host: config.host!,
        port: config.port!,
        servername: config.host!,
        rejectUnauthorized: config.validateCert,
        timeout: 6000,
      },
      () => {
        const latencyMs = Date.now() - startTime;
        socket.destroy();
        resolve({
          success: true,
          latencyMs,
          message: `Successfully connected to SAP HANA Cloud host ${config.host}:${config.port} via TLS in ${latencyMs}ms. Schema: "${config.schema}".`,
        });
      }
    );

    socket.on('error', (err) => {
      resolve({
        success: false,
        message: `SAP HANA Cloud connection error: ${err.message}`,
      });
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve({
        success: false,
        message: `Connection to SAP HANA Cloud host ${config.host}:${config.port} timed out after 6000ms.`,
      });
    });
  });
}

/**
 * Returns the catalog of datasets partitioned by dashboard
 */
export function getDashboardDatasets(): DashboardDatasetInfo[] {
  const schema = process.env.HANA_SCHEMA || '07083DD5224243A8B73B330781FE33B6';

  return [
    {
      dashboardId: 'executive_dashboard',
      dashboardName: 'Executive Dashboard & Overview',
      route: '/',
      primaryTable: `"${schema}"."AGRO_PRICES"`,
      hanaViewName: `"${schema}"."V_DASHBOARD_COMMODITY_METRICS"`,
      description: 'National commodity pulse, active reporting mandis count, average modal rates per Quintal & Kg, and national price spread.',
      columns: [
        { name: 'COMMODITY', type: 'NVARCHAR(100)', description: 'Crop / Commodity name (e.g. Tomato, Onion)' },
        { name: 'ACTIVE_MANDIS_COUNT', type: 'INTEGER', description: 'Total mandis reporting today' },
        { name: 'STATES_REPORTING', type: 'INTEGER', description: 'Distinct states with arrivals' },
        { name: 'AVG_MODAL_PRICE_QTL', type: 'DECIMAL(12,2)', description: 'Average modal rate ₹/Quintal' },
        { name: 'AVG_MODAL_PRICE_KG', type: 'DECIMAL(12,2)', description: 'Calculated modal rate ₹/kg' },
        { name: 'LOWEST_MANDI_PRICE', type: 'DECIMAL(12,2)', description: 'Lowest minimum rate reported' },
        { name: 'HIGHEST_MANDI_PRICE', type: 'DECIMAL(12,2)', description: 'Highest maximum rate reported' },
        { name: 'NATIONAL_SPREAD', type: 'DECIMAL(12,2)', description: 'Spread between highest and lowest rates' },
      ],
      sampleData: [
        { COMMODITY: 'Tomato', ACTIVE_MANDIS_COUNT: 24, STATES_REPORTING: 5, AVG_MODAL_PRICE_QTL: 2240, AVG_MODAL_PRICE_KG: 22.4, LOWEST_MANDI_PRICE: 1800, HIGHEST_MANDI_PRICE: 3100, NATIONAL_SPREAD: 1300 },
        { COMMODITY: 'Onion', ACTIVE_MANDIS_COUNT: 31, STATES_REPORTING: 6, AVG_MODAL_PRICE_QTL: 2850, AVG_MODAL_PRICE_KG: 28.5, LOWEST_MANDI_PRICE: 2400, HIGHEST_MANDI_PRICE: 3600, NATIONAL_SPREAD: 1200 },
        { COMMODITY: 'Potato', ACTIVE_MANDIS_COUNT: 18, STATES_REPORTING: 4, AVG_MODAL_PRICE_QTL: 1650, AVG_MODAL_PRICE_KG: 16.5, LOWEST_MANDI_PRICE: 1400, HIGHEST_MANDI_PRICE: 2000, NATIONAL_SPREAD: 600 },
      ],
    },
    {
      dashboardId: 'market_prices',
      dashboardName: 'Market Prices Explorer',
      route: '/prices',
      primaryTable: `"${schema}"."AGRO_PRICES"`,
      hanaViewName: `"${schema}"."V_MARKET_PRICES_EXPLORER"`,
      description: 'Grain-level daily arrivals across APMC mandis with min, max, modal rates in quintals and kilograms.',
      columns: [
        { name: 'ID', type: 'NVARCHAR(64)', description: 'Unique natural record key' },
        { name: 'COMMODITY', type: 'NVARCHAR(100)', description: 'Agricultural produce' },
        { name: 'STATE', type: 'NVARCHAR(100)', description: 'State of mandi yard' },
        { name: 'DISTRICT', type: 'NVARCHAR(100)', description: 'District of mandi yard' },
        { name: 'MARKET', type: 'NVARCHAR(100)', description: 'APMC market name' },
        { name: 'VARIETY', type: 'NVARCHAR(100)', description: 'Crop variety / cultivar' },
        { name: 'GRADE', type: 'NVARCHAR(50)', description: 'Quality grade standard (FAQ/Medium)' },
        { name: 'ARRIVAL_DATE', type: 'DATE', description: 'Reporting arrival date' },
        { name: 'MODAL_PRICE_QTL', type: 'DECIMAL(12,2)', description: 'Prevailing modal price ₹/Qtl' },
        { name: 'MODAL_PRICE_KG', type: 'DECIMAL(12,2)', description: 'Converted rate ₹/kg' },
        { name: 'DAILY_MANDI_SPREAD', type: 'DECIMAL(12,2)', description: 'Max minus Min price intraday spread' },
      ],
      sampleData: db.agroPrices.slice(0, 3).map((p) => ({
        ID: p.id,
        COMMODITY: p.crop,
        STATE: p.state,
        DISTRICT: p.district,
        MARKET: p.market,
        VARIETY: p.variety,
        GRADE: p.grade,
        ARRIVAL_DATE: p.arrival_date,
        MODAL_PRICE_QTL: p.modal_price,
        MODAL_PRICE_KG: Math.round((p.modal_price / 100) * 10) / 10,
        DAILY_MANDI_SPREAD: p.max_price - p.min_price,
      })),
    },
    {
      dashboardId: 'compare',
      dashboardName: 'Mandi Comparison & Arbitrage Spreads',
      route: '/compare',
      primaryTable: `"${schema}"."AGRO_PRICES"`,
      hanaViewName: `"${schema}"."V_COMPARE_INTER_MANDI_SPREAD"`,
      description: 'Cross-mandi price spreads, identifying spatial price gaps and inter-district trade arbitrage potential.',
      columns: [
        { name: 'COMMODITY', type: 'NVARCHAR(100)', description: 'Traded crop' },
        { name: 'ORIGIN_MARKET', type: 'NVARCHAR(100)', description: 'Lower price farm/supply mandi' },
        { name: 'ORIGIN_STATE', type: 'NVARCHAR(100)', description: 'Supply state' },
        { name: 'ORIGIN_PRICE_QTL', type: 'DECIMAL(12,2)', description: 'Base purchase rate' },
        { name: 'DESTINATION_MARKET', type: 'NVARCHAR(100)', description: 'High demand consumption market' },
        { name: 'DESTINATION_STATE', type: 'NVARCHAR(100)', description: 'Consumption state' },
        { name: 'DESTINATION_PRICE_QTL', type: 'DECIMAL(12,2)', description: 'Destination wholesale rate' },
        { name: 'ARBITRAGE_SPREAD_QTL', type: 'DECIMAL(12,2)', description: 'Gross price delta ₹/Qtl' },
        { name: 'SPREAD_PERCENTAGE', type: 'DECIMAL(6,2)', description: 'Percentage difference' },
      ],
      sampleData: [
        { COMMODITY: 'Tomato', ORIGIN_MARKET: 'Ottanchatram', ORIGIN_STATE: 'Tamil Nadu', ORIGIN_PRICE_QTL: 2100, DESTINATION_MARKET: 'Koyambedu', DESTINATION_STATE: 'Tamil Nadu', DESTINATION_PRICE_QTL: 2850, ARBITRAGE_SPREAD_QTL: 750, SPREAD_PERCENTAGE: 35.7 },
        { COMMODITY: 'Onion', ORIGIN_MARKET: 'Lasalgaon', ORIGIN_STATE: 'Maharashtra', ORIGIN_PRICE_QTL: 2450, DESTINATION_MARKET: 'Vashi (Mumbai)', DESTINATION_STATE: 'Maharashtra', DESTINATION_PRICE_QTL: 3300, ARBITRAGE_SPREAD_QTL: 850, SPREAD_PERCENTAGE: 34.6 },
      ],
    },
    {
      dashboardId: 'trends',
      dashboardName: 'Price Trends & 7-Day Moving Averages',
      route: '/trends',
      primaryTable: `"${schema}"."AGRO_PRICES"`,
      hanaViewName: `"${schema}"."V_TRENDS_7D_MOVING_AVG"`,
      description: 'Historical time-series window aggregations with 7-day rolling moving averages to spot trend directions.',
      columns: [
        { name: 'COMMODITY', type: 'NVARCHAR(100)', description: 'Crop' },
        { name: 'STATE', type: 'NVARCHAR(100)', description: 'State' },
        { name: 'ARRIVAL_DATE', type: 'DATE', description: 'Observation date' },
        { name: 'DAILY_AVG_MODAL', type: 'DECIMAL(12,2)', description: 'Average daily modal rate' },
        { name: 'ROLLING_7D_MA', type: 'DECIMAL(12,2)', description: '7-day moving average' },
      ],
      sampleData: [
        { COMMODITY: 'Tomato', STATE: 'Tamil Nadu', ARRIVAL_DATE: '2026-09-28', DAILY_AVG_MODAL: 2280, ROLLING_7D_MA: 2190 },
        { COMMODITY: 'Tomato', STATE: 'Tamil Nadu', ARRIVAL_DATE: '2026-09-27', DAILY_AVG_MODAL: 2210, ROLLING_7D_MA: 2165 },
        { COMMODITY: 'Tomato', STATE: 'Tamil Nadu', ARRIVAL_DATE: '2026-09-26', DAILY_AVG_MODAL: 2150, ROLLING_7D_MA: 2140 },
      ],
    },
    {
      dashboardId: 'movers',
      dashboardName: 'Top Movers & Daily Momentum',
      route: '/movers',
      primaryTable: `"${schema}"."AGRO_PRICES"`,
      hanaViewName: `"${schema}"."V_TOP_MOVERS_MOMENTUM"`,
      description: 'Categorization of top percentage gainers and losers against state baseline corridors.',
      columns: [
        { name: 'COMMODITY', type: 'NVARCHAR(100)', description: 'Commodity' },
        { name: 'MARKET', type: 'NVARCHAR(100)', description: 'Mandi' },
        { name: 'STATE', type: 'NVARCHAR(100)', description: 'State' },
        { name: 'CURRENT_PRICE', type: 'DECIMAL(12,2)', description: 'Current modal price' },
        { name: 'DELTA_VS_AVG', type: 'DECIMAL(12,2)', description: 'Price difference against national mean' },
        { name: 'MOMENTUM_PCT', type: 'DECIMAL(6,2)', description: 'Percentage change' },
        { name: 'VELOCITY_TIER', type: 'NVARCHAR(30)', description: 'Classification (High Gainer, Heavy Drop, Steady)' },
      ],
      sampleData: [
        { COMMODITY: 'Tomato', MARKET: 'Rayakottai', STATE: 'Tamil Nadu', CURRENT_PRICE: 3100, DELTA_VS_AVG: 860, MOMENTUM_PCT: 38.4, VELOCITY_TIER: 'High Gainer' },
        { COMMODITY: 'Onion', MARKET: 'Pimpalgaon', STATE: 'Maharashtra', CURRENT_PRICE: 2100, DELTA_VS_AVG: -750, MOMENTUM_PCT: -26.3, VELOCITY_TIER: 'Heavy Drop' },
      ],
    },
    {
      dashboardId: 'forecast',
      dashboardName: 'Price Forecasting & Horizon',
      route: '/forecast',
      primaryTable: `"${schema}"."PRICE_FORECASTS"`,
      hanaViewName: `"${schema}"."V_FORECAST_7DAY_PROJECTIONS"`,
      description: '7-day forward predicted modal prices with 95% upper and lower confidence intervals and backtest MAPE accuracy.',
      columns: [
        { name: 'ID', type: 'NVARCHAR(64)', description: 'Prediction key' },
        { name: 'CROP', type: 'NVARCHAR(100)', description: 'Commodity forecasted' },
        { name: 'TARGET_DATE', type: 'DATE', description: 'Forecasted target date' },
        { name: 'PREDICTED_MODAL', type: 'DECIMAL(12,2)', description: 'Projected modal rate ₹/Qtl' },
        { name: 'PREDICTED_MODAL_KG', type: 'DECIMAL(12,2)', description: 'Projected rate ₹/kg' },
        { name: 'CONFIDENCE_LOWER', type: 'DECIMAL(12,2)', description: 'Lower 95% boundary' },
        { name: 'CONFIDENCE_UPPER', type: 'DECIMAL(12,2)', description: 'Upper 95% boundary' },
        { name: 'UNCERTAINTY_BAND', type: 'DECIMAL(12,2)', description: 'Upper minus Lower corridor' },
        { name: 'TREND_DIRECTION', type: 'NVARCHAR(20)', description: 'up, down, or stable' },
        { name: 'MAPE_BACKTEST_PCT', type: 'DECIMAL(5,2)', description: 'Backtest Mean Absolute Percentage Error' },
      ],
      sampleData: [
        { ID: 'fc-1', CROP: 'Tomato', TARGET_DATE: '2026-09-29', PREDICTED_MODAL: 2260, PREDICTED_MODAL_KG: 22.6, CONFIDENCE_LOWER: 2140, CONFIDENCE_UPPER: 2380, UNCERTAINTY_BAND: 240, TREND_DIRECTION: 'up', MAPE_BACKTEST_PCT: 4.8 },
        { ID: 'fc-2', CROP: 'Tomato', TARGET_DATE: '2026-09-30', PREDICTED_MODAL: 2310, PREDICTED_MODAL_KG: 23.1, CONFIDENCE_LOWER: 2170, CONFIDENCE_UPPER: 2450, UNCERTAINTY_BAND: 280, TREND_DIRECTION: 'up', MAPE_BACKTEST_PCT: 4.8 },
        { ID: 'fc-3', CROP: 'Tomato', TARGET_DATE: '2026-10-01', PREDICTED_MODAL: 2350, PREDICTED_MODAL_KG: 23.5, CONFIDENCE_LOWER: 2190, CONFIDENCE_UPPER: 2510, UNCERTAINTY_BAND: 320, TREND_DIRECTION: 'up', MAPE_BACKTEST_PCT: 4.8 },
      ],
    },
    {
      dashboardId: 'anomalies',
      dashboardName: 'Price Anomalies & Volatility Shocks',
      route: '/anomalies',
      primaryTable: `"${schema}"."PRICE_ANOMALIES"`,
      hanaViewName: `"${schema}"."V_ANOMALIES_SEVERITY_FEED"`,
      description: 'Statistical IQR price outliers detecting abnormal price spikes or distress dumping.',
      columns: [
        { name: 'ID', type: 'NVARCHAR(64)', description: 'Anomaly record ID' },
        { name: 'CROP', type: 'NVARCHAR(100)', description: 'Commodity' },
        { name: 'MARKET', type: 'NVARCHAR(100)', description: 'Reporting market' },
        { name: 'RECORDED_MODAL', type: 'DECIMAL(12,2)', description: 'Actual recorded price' },
        { name: 'BENCHMARK_MODAL', type: 'DECIMAL(12,2)', description: 'Expected median benchmark' },
        { name: 'DEVIATION_PCT', type: 'DECIMAL(6,2)', description: 'Outlier percentage' },
        { name: 'DIRECTION', type: 'NVARCHAR(10)', description: 'Above or Below' },
        { name: 'SEVERITY', type: 'NVARCHAR(10)', description: 'High or Moderate' },
        { name: 'ANOMALY_IMPACT_NOTE', type: 'NVARCHAR(100)', description: 'Business advisory interpretation' },
      ],
      sampleData: [
        { ID: 'anom-1', CROP: 'Tomato', MARKET: 'Rayakottai', RECORDED_MODAL: 3100, BENCHMARK_MODAL: 2240, DEVIATION_PCT: 38.4, DIRECTION: 'Above', SEVERITY: 'High', ANOMALY_IMPACT_NOTE: 'Urgent Buyer Alert: Supply Constraint' },
        { ID: 'anom-2', CROP: 'Onion', MARKET: 'Lasalgaon', RECORDED_MODAL: 1950, BENCHMARK_MODAL: 2850, DEVIATION_PCT: -31.5, DIRECTION: 'Below', SEVERITY: 'High', ANOMALY_IMPACT_NOTE: 'Urgent Farmer Alert: Distress Pricing' },
      ],
    },
    {
      dashboardId: 'farmer_hub',
      dashboardName: 'Farmer Hub & Harvest Listings',
      route: '/farmer-hub',
      primaryTable: `"${schema}"."FARMER_LISTINGS"`,
      hanaViewName: `"${schema}"."V_FARMER_HUB_INVENTORY"`,
      description: 'Active farmer harvest lots available for direct trade, benchmarked against real-time local mandi rates.',
      columns: [
        { name: 'LISTING_ID', type: 'NVARCHAR(64)', description: 'Listing ID' },
        { name: 'FARMER_NAME', type: 'NVARCHAR(150)', description: 'Cultivator / Grower Name' },
        { name: 'CROP', type: 'NVARCHAR(100)', description: 'Commodity' },
        { name: 'QUANTITY_AVAILABLE', type: 'DECIMAL(12,2)', description: 'Available stock' },
        { name: 'UNIT', type: 'NVARCHAR(20)', description: 'quintal / kg / tonne' },
        { name: 'ASKING_PRICE_PER_UNIT', type: 'DECIMAL(12,2)', description: 'Farmer asking price' },
        { name: 'STATE', type: 'NVARCHAR(100)', description: 'Farm State' },
        { name: 'DISTRICT', type: 'NVARCHAR(100)', description: 'Farm District' },
        { name: 'LOCAL_MANDI_BENCHMARK', type: 'DECIMAL(12,2)', description: 'Prevailing district mandi rate' },
        { name: 'PREMIUM_VS_MANDI', type: 'DECIMAL(12,2)', description: 'Difference vs mandi wholesale rate' },
      ],
      sampleData: db.farmerListings.slice(0, 3).map((l) => ({
        LISTING_ID: l.id,
        FARMER_NAME: l.farmer_name,
        CROP: l.crop,
        QUANTITY_AVAILABLE: l.quantity_available,
        UNIT: l.unit,
        ASKING_PRICE_PER_UNIT: l.asking_price_per_unit,
        STATE: l.state,
        DISTRICT: l.district,
        LOCAL_MANDI_BENCHMARK: 2200,
        PREMIUM_VS_MANDI: l.asking_price_per_unit - 2200,
      })),
    },
    {
      dashboardId: 'find_produce',
      dashboardName: 'Produce Discovery & Matching Engine',
      route: '/find-produce',
      primaryTable: `"${schema}"."CUSTOMER_REQUIREMENTS"`,
      hanaViewName: `"${schema}"."V_FIND_PRODUCE_MARKETPLACE"`,
      description: 'Wholesale buyer requirements matched with highest-scoring farmer harvest candidates.',
      columns: [
        { name: 'REQUIREMENT_ID', type: 'NVARCHAR(64)', description: 'Buyer requirement ID' },
        { name: 'CUSTOMER_NAME', type: 'NVARCHAR(150)', description: 'Buyer organization' },
        { name: 'CROP', type: 'NVARCHAR(100)', description: 'Crop required' },
        { name: 'REQUESTED_QUANTITY', type: 'DECIMAL(12,2)', description: 'Volume demanded' },
        { name: 'MAX_BUDGET_PER_UNIT', type: 'DECIMAL(12,2)', description: 'Ceiling budget' },
        { name: 'DELIVERY_DISTRICT', type: 'NVARCHAR(100)', description: 'Destination city/district' },
        { name: 'CANDIDATE_MATCHES_COUNT', type: 'INTEGER', description: 'Matched farmer listings' },
        { name: 'HIGHEST_MATCH_SCORE', type: 'DECIMAL(5,2)', description: 'Top candidate match score (0-100)' },
      ],
      sampleData: db.customerRequirements.slice(0, 3).map((r) => ({
        REQUIREMENT_ID: r.id,
        CUSTOMER_NAME: r.customer_name,
        CROP: r.crop,
        REQUESTED_QUANTITY: r.quantity,
        MAX_BUDGET_PER_UNIT: r.max_budget_per_unit,
        DELIVERY_DISTRICT: r.delivery_district,
        CANDIDATE_MATCHES_COUNT: 3,
        HIGHEST_MATCH_SCORE: 89.4,
      })),
    },
    {
      dashboardId: 'orders',
      dashboardName: 'Orders & Logistics Tracking',
      route: '/orders',
      primaryTable: `"${schema}"."ORDERS"`,
      hanaViewName: `"${schema}"."V_ORDERS_FULFILLMENT_PIPELINE"`,
      description: 'Confirmed farmer-buyer trade orders with dispatch logistics milestones and delivery timeline.',
      columns: [
        { name: 'ORDER_ID', type: 'NVARCHAR(64)', description: 'Order contract ID' },
        { name: 'CUSTOMER_NAME', type: 'NVARCHAR(150)', description: 'Purchaser' },
        { name: 'FARMER_NAME', type: 'NVARCHAR(150)', description: 'Fulfilling Farmer' },
        { name: 'CROP', type: 'NVARCHAR(100)', description: 'Crop' },
        { name: 'QUANTITY', type: 'DECIMAL(12,2)', description: 'Quantity ordered' },
        { name: 'TOTAL_AMOUNT', type: 'DECIMAL(14,2)', description: 'Total order value ₹' },
        { name: 'CURRENT_STAGE', type: 'NVARCHAR(30)', description: 'confirmed, packed, dispatched, in_transit, delivered' },
        { name: 'EXPECTED_DELIVERY_DATE', type: 'DATE', description: 'Target arrival date' },
        { name: 'MILESTONES_LOGGED', type: 'INTEGER', description: 'Tracking history events' },
      ],
      sampleData: db.orders.slice(0, 3).map((o) => ({
        ORDER_ID: o.id,
        CUSTOMER_NAME: o.customer_name,
        FARMER_NAME: o.farmer_name,
        CROP: o.crop,
        QUANTITY: o.quantity,
        TOTAL_AMOUNT: o.total_amount,
        CURRENT_STAGE: o.status,
        EXPECTED_DELIVERY_DATE: o.expected_delivery_date,
        MILESTONES_LOGGED: 3,
      })),
    },
    {
      dashboardId: 'supply_demand',
      dashboardName: 'Commodity Supply & Demand Equilibrium',
      route: '/supply-demand',
      primaryTable: `"${schema}"."FARMER_LISTINGS"`,
      hanaViewName: `"${schema}"."V_SUPPLY_DEMAND_EQUILIBRIUM"`,
      description: 'Platform balance analytics comparing total harvested farmer supply vs buyer purchase demand.',
      columns: [
        { name: 'COMMODITY', type: 'NVARCHAR(100)', description: 'Agricultural commodity' },
        { name: 'FARMER_SUPPLY_QTL', type: 'DECIMAL(12,2)', description: 'Total farmer supply in quintals' },
        { name: 'BUYER_DEMAND_QTL', type: 'DECIMAL(12,2)', description: 'Total buyer demand in quintals' },
        { name: 'NET_BALANCE_QTL', type: 'DECIMAL(12,2)', description: 'Supply minus Demand' },
        { name: 'SUPPLY_DEMAND_RATIO', type: 'DECIMAL(6,2)', description: 'Ratio (Supply / Demand)' },
        { name: 'MARKET_EQUILIBRIUM_STATE', type: 'NVARCHAR(50)', description: 'Surplus, Deficit, or Balanced' },
      ],
      sampleData: [
        { COMMODITY: 'Tomato', FARMER_SUPPLY_QTL: 240, BUYER_DEMAND_QTL: 180, NET_BALANCE_QTL: 60, SUPPLY_DEMAND_RATIO: 1.33, MARKET_EQUILIBRIUM_STATE: 'Market Surplus (Softening Rate)' },
        { COMMODITY: 'Onion', FARMER_SUPPLY_QTL: 150, BUYER_DEMAND_QTL: 320, NET_BALANCE_QTL: -170, SUPPLY_DEMAND_RATIO: 0.47, MARKET_EQUILIBRIUM_STATE: 'High Demand Deficit (Hardening Rate)' },
        { COMMODITY: 'Potato', FARMER_SUPPLY_QTL: 200, BUYER_DEMAND_QTL: 195, NET_BALANCE_QTL: 5, SUPPLY_DEMAND_RATIO: 1.03, MARKET_EQUILIBRIUM_STATE: 'Balanced Equilibrium' },
      ],
    },
    {
      dashboardId: 'alerts',
      dashboardName: 'Price Alerts & Trigger Monitor',
      route: '/alerts',
      primaryTable: `"${schema}"."PRICE_ALERTS"`,
      hanaViewName: `"${schema}"."V_PRICE_ALERTS_MONITOR"`,
      description: 'Active user notification rules compared with live mandi rates to trigger SMS or push notices.',
      columns: [
        { name: 'ALERT_ID', type: 'NVARCHAR(64)', description: 'Rule key' },
        { name: 'USER_NAME', type: 'NVARCHAR(150)', description: 'Subscriber name' },
        { name: 'USER_ROLE', type: 'NVARCHAR(30)', description: 'Role (Farmer, Trader, Buyer)' },
        { name: 'CROP', type: 'NVARCHAR(100)', description: 'Monitored crop' },
        { name: 'TARGET_PRICE', type: 'DECIMAL(12,2)', description: 'Trigger threshold rate' },
        { name: 'CONDITION', type: 'NVARCHAR(20)', description: 'above / below' },
        { name: 'CURRENT_MODAL_PRICE', type: 'DECIMAL(12,2)', description: 'Latest market rate' },
        { name: 'TRIGGER_STATUS', type: 'NVARCHAR(20)', description: 'TRIGGER_READY or MONITORING' },
      ],
      sampleData: [
        { ALERT_ID: 'alert-1', USER_NAME: 'Ramesh Kumar', USER_ROLE: 'farmer', CROP: 'Tomato', TARGET_PRICE: 2400, CONDITION: 'above', CURRENT_MODAL_PRICE: 2240, TRIGGER_STATUS: 'MONITORING' },
        { ALERT_ID: 'alert-2', USER_NAME: 'Priya Sharma', USER_ROLE: 'customer', CROP: 'Onion', TARGET_PRICE: 2900, CONDITION: 'below', CURRENT_MODAL_PRICE: 2850, TRIGGER_STATUS: 'TRIGGER_READY' },
      ],
    },
    {
      dashboardId: 'admin',
      dashboardName: 'Admin Governance & Platform Health',
      route: '/admin',
      primaryTable: `"${schema}"."USER_PROFILES"`,
      hanaViewName: `"${schema}"."V_ADMIN_SYSTEM_METRICS"`,
      description: 'Overall platform governance, multi-role user directory, Microsoft Edge local persistence status, and ingestion audit.',
      columns: [
        { name: 'TOTAL_USERS', type: 'INTEGER', description: 'Registered platform users' },
        { name: 'FARMER_USERS', type: 'INTEGER', description: 'Total farmers' },
        { name: 'BUYER_USERS', type: 'INTEGER', description: 'Total buyers / customers' },
        { name: 'TRADER_USERS', type: 'INTEGER', description: 'Total APMC traders' },
        { name: 'EDGE_PERSISTENT_FARMERS', type: 'INTEGER', description: 'Farmers saved on Microsoft Edge local storage' },
        { name: 'TOTAL_MANDI_PRICE_RECORDS', type: 'INTEGER', description: 'Active price records in database' },
        { name: 'TOTAL_TRANSACTION_VALUE_INR', type: 'DECIMAL(16,2)', description: 'Gross merchandise volume ₹' },
      ],
      sampleData: [
        {
          TOTAL_USERS: db.profiles.length,
          FARMER_USERS: db.profiles.filter((p) => p.role === 'farmer').length,
          BUYER_USERS: db.profiles.filter((p) => p.role === 'customer').length,
          TRADER_USERS: db.profiles.filter((p) => p.role === 'trader').length,
          EDGE_PERSISTENT_FARMERS: db.profiles.filter((p) => p.role === 'farmer').length,
          TOTAL_MANDI_PRICE_RECORDS: db.agroPrices.length,
          TOTAL_TRANSACTION_VALUE_INR: db.orders.reduce((acc, o) => acc + o.total_amount, 0),
        },
      ],
    },
  ];
}

/**
 * Returns the full SQL script from disk or generates it
 */
export function getHanaSchemaSql(): string {
  const schemaPath = path.resolve(process.cwd(), 'hana_schema.sql');
  if (fs.existsSync(schemaPath)) {
    return fs.readFileSync(schemaPath, 'utf-8');
  }
  return '-- hana_schema.sql not found';
}

/**
 * Generates populated SQL dump for SAP HANA Cloud including all DDL and existing DML records
 */
export function exportHanaFullDump(): string {
  const baseSql = getHanaSchemaSql();
  const schema = process.env.HANA_SCHEMA || '07083DD5224243A8B73B330781FE33B6';

  let dump = `${baseSql}\n\n-- ==============================================================================\n-- 5. POPULATED DATASET EXPORTS FROM LIVE REPOSITORY\n-- ==============================================================================\n`;

  // Export Agro Prices (up to 500 records sample)
  dump += `\n-- Table: AGRO_PRICES (${Math.min(db.agroPrices.length, 500)} records)\n`;
  for (const p of db.agroPrices.slice(0, 500)) {
    const esc = (s: string) => String(s || '').replace(/'/g, "''");
    dump += `UPSERT "${schema}"."AGRO_PRICES" VALUES ('${esc(p.id)}', '${esc(p.crop)}', '${esc(p.state)}', '${esc(p.district)}', '${esc(p.market)}', '${esc(p.variety)}', '${esc(p.grade)}', '${p.arrival_date}', ${p.min_price}, ${p.max_price}, ${p.modal_price}, '${esc(p.source)}', CURRENT_TIMESTAMP) WITH PRIMARY KEY;\n`;
  }

  // Export Farmer Listings
  dump += `\n-- Table: FARMER_LISTINGS (${db.farmerListings.length} records)\n`;
  for (const l of db.farmerListings) {
    const esc = (s: string) => String(s || '').replace(/'/g, "''");
    dump += `UPSERT "${schema}"."FARMER_LISTINGS" VALUES ('${esc(l.id)}', '${esc(l.farmer_id)}', '${esc(l.farmer_name)}', '${esc(l.crop)}', '${esc(l.variety || '')}', '${esc(l.grade || 'FAQ')}', ${l.quantity_available}, ${l.initial_quantity || l.quantity_available}, '${esc(l.unit)}', ${l.asking_price_per_unit}, '${esc(l.state)}', '${esc(l.district)}', ${l.latitude || 'NULL'}, ${l.longitude || 'NULL'}, '${l.available_from || '2026-09-28'}', '${l.available_until || '2026-10-15'}', '${l.status}', CURRENT_TIMESTAMP) WITH PRIMARY KEY;\n`;
  }

  // Export Orders
  dump += `\n-- Table: ORDERS (${db.orders.length} records)\n`;
  for (const o of db.orders) {
    const esc = (s: string) => String(s || '').replace(/'/g, "''");
    dump += `UPSERT "${schema}"."ORDERS" VALUES ('${esc(o.id)}', '${esc(o.deal_id)}', '${esc(o.customer_id)}', '${esc(o.customer_name)}', '${esc(o.farmer_id)}', '${esc(o.farmer_name)}', '${esc(o.crop)}', '${esc(o.variety || '')}', '${esc(o.grade || 'FAQ')}', ${o.quantity}, '${esc(o.unit)}', ${o.price_per_unit}, ${o.delivery_cost}, ${o.total_amount}, '${esc(o.status)}', '${o.expected_delivery_date}', ${o.is_demo ? 'TRUE' : 'FALSE'}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) WITH PRIMARY KEY;\n`;
  }

  return dump;
}

/**
 * Connects directly to SAP HANA Cloud via @sap/hana-client and retrieves live table metadata
 */
export async function getHanaLiveTables(): Promise<{
  tables: Array<{ name: string; recordCount: number }>;
  views: string[];
}> {
  const config = getHanaConfigStatus();
  if (!config.isConfigured) {
    return { tables: [], views: [] };
  }

  let hana: any;
  try {
    hana = require('@sap/hana-client');
  } catch {
    return { tables: [], views: [] };
  }

  const conn = hana.createConnection();
  const connParams = {
    serverNode: `${config.host}:${config.port}`,
    uid: process.env.HANA_USER,
    pwd: process.env.HANA_PASSWORD,
    currentSchema: config.schema,
    encrypt: true,
    sslValidateCertificate: false,
    sslCryptoProvider: 'openssl',
  };

  return new Promise((resolve) => {
    conn.connect(connParams, (err: any) => {
      if (err) {
        return resolve({ tables: [], views: [] });
      }

      conn.exec(
        `SELECT TABLE_NAME, RECORD_COUNT FROM SYS.M_TABLES WHERE SCHEMA_NAME = '${config.schema}' ORDER BY TABLE_NAME`,
        (tErr: any, tRows: any) => {
          conn.exec(
            `SELECT VIEW_NAME FROM SYS.VIEWS WHERE SCHEMA_NAME = '${config.schema}' ORDER BY VIEW_NAME`,
            (vErr: any, vRows: any) => {
              conn.disconnect();
              const tables = (tRows || []).map((r: any) => ({
                name: r.TABLE_NAME,
                recordCount: Number(r.RECORD_COUNT || 0),
              }));
              const views = (vRows || []).map((r: any) => r.VIEW_NAME);
              resolve({ tables, views });
            }
          );
        }
      );
    });
  });
}

/**
 * Synchronizes in-memory listings, prices, orders, and profiles into live SAP HANA Cloud tables
 */
export async function syncAllToHana(): Promise<{
  success: boolean;
  message: string;
  tablesSynced: number;
  recordsSynced: number;
}> {
  const config = getHanaConfigStatus();
  if (!config.isConfigured) {
    return { success: false, message: 'SAP HANA Cloud is not configured.', tablesSynced: 0, recordsSynced: 0 };
  }

  let hana: any;
  try {
    hana = require('@sap/hana-client');
  } catch (err: any) {
    return { success: false, message: `HANA Client error: ${err.message}`, tablesSynced: 0, recordsSynced: 0 };
  }

  const conn = hana.createConnection();
  const connParams = {
    serverNode: `${config.host}:${config.port}`,
    uid: process.env.HANA_USER,
    pwd: process.env.HANA_PASSWORD,
    currentSchema: config.schema,
    encrypt: true,
    sslValidateCertificate: false,
    sslCryptoProvider: 'openssl',
  };

  return new Promise((resolve) => {
    conn.connect(connParams, async (err: any) => {
      if (err) {
        return resolve({ success: false, message: err.message, tablesSynced: 0, recordsSynced: 0 });
      }

      const exec = (sql: string) =>
        new Promise((res, rej) => {
          conn.exec(sql, (e: any, r: any) => {
            if (e) rej(e);
            else res(r);
          });
        });

      let recordsSynced = 0;
      let tablesSynced = 0;
      const schema = config.schema;

      try {
        // Sync Users
        for (const u of db.profiles) {
          const esc = (s: string) => String(s || '').replace(/'/g, "''");
          await exec(
            `UPSERT "${schema}"."USER_PROFILES" VALUES ('${esc(u.id)}', '${esc(u.user_id)}', '${esc(u.name)}', '${esc(u.email)}', '${esc(u.phone || '')}', '${esc(u.role)}', '${esc(u.state)}', '${esc(u.district)}', ${u.latitude || 'NULL'}, ${u.longitude || 'NULL'}, '${esc(u.language)}', ${u.role === 'farmer' ? 'TRUE' : 'FALSE'}, CURRENT_TIMESTAMP) WITH PRIMARY KEY`
          );
          recordsSynced++;
        }
        tablesSynced++;

        // Sync Listings
        for (const l of db.farmerListings) {
          const esc = (s: string) => String(s || '').replace(/'/g, "''");
          await exec(
            `UPSERT "${schema}"."FARMER_LISTINGS" VALUES ('${esc(l.id)}', '${esc(l.farmer_id)}', '${esc(l.farmer_name)}', '${esc(l.crop)}', '${esc(l.variety || '')}', '${esc(l.grade || 'FAQ')}', ${l.quantity_available}, ${l.initial_quantity || l.quantity_available}, '${esc(l.unit)}', ${l.asking_price_per_unit}, '${esc(l.state)}', '${esc(l.district)}', ${l.latitude || 'NULL'}, ${l.longitude || 'NULL'}, '${l.available_from || '2026-09-28'}', '${l.available_until || '2026-10-15'}', '${l.status}', CURRENT_TIMESTAMP) WITH PRIMARY KEY`
          );
          recordsSynced++;
        }
        tablesSynced++;

        // Sync Orders
        for (const o of db.orders) {
          const esc = (s: string) => String(s || '').replace(/'/g, "''");
          await exec(
            `UPSERT "${schema}"."ORDERS" VALUES ('${esc(o.id)}', '${esc(o.deal_id)}', '${esc(o.customer_id)}', '${esc(o.customer_name)}', '${esc(o.farmer_id)}', '${esc(o.farmer_name)}', '${esc(o.crop)}', '${esc(o.variety || '')}', '${esc(o.grade || 'FAQ')}', ${o.quantity}, '${esc(o.unit)}', ${o.price_per_unit}, ${o.delivery_cost}, ${o.total_amount}, '${esc(o.status)}', '${o.expected_delivery_date}', ${o.is_demo ? 'TRUE' : 'FALSE'}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) WITH PRIMARY KEY`
          );
          recordsSynced++;
        }
        tablesSynced++;

        // Sync sample Agro Prices
        for (const p of db.agroPrices.slice(0, 100)) {
          const esc = (s: string) => String(s || '').replace(/'/g, "''");
          await exec(
            `UPSERT "${schema}"."AGRO_PRICES" VALUES ('${esc(p.id)}', '${esc(p.crop)}', '${esc(p.state)}', '${esc(p.district)}', '${esc(p.market)}', '${esc(p.variety)}', '${esc(p.grade)}', '${p.arrival_date}', ${p.min_price}, ${p.max_price}, ${p.modal_price}, '${esc(p.source)}', CURRENT_TIMESTAMP) WITH PRIMARY KEY`
          );
          recordsSynced++;
        }
        tablesSynced++;

        conn.disconnect();
        resolve({
          success: true,
          message: `Successfully synchronized ${recordsSynced} records across ${tablesSynced} tables into SAP HANA Cloud.`,
          tablesSynced,
          recordsSynced,
        });
      } catch (syncErr: any) {
        conn.disconnect();
        resolve({
          success: false,
          message: `Sync partially failed: ${syncErr.message}`,
          tablesSynced,
          recordsSynced,
        });
      }
    });
  });
}

