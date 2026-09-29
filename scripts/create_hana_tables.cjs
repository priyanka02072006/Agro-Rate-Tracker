const hana = require('@sap/hana-client');
require('dotenv').config();

const conn = hana.createConnection();
// In SAP HANA Cloud, the user has CREATE ANY privilege on their user schema
const targetSchema = process.env.HANA_USER; 

const connParams = {
  serverNode: `${process.env.HANA_HOST}:${process.env.HANA_PORT}`,
  uid: process.env.HANA_USER,
  pwd: process.env.HANA_PASSWORD,
  currentSchema: targetSchema,
  encrypt: true,
  sslValidateCertificate: false,
  sslCryptoProvider: 'openssl',
};

const tables = [
  {
    name: 'AGRO_PRICES',
    sql: `CREATE COLUMN TABLE "${targetSchema}"."AGRO_PRICES" (
      "ID" NVARCHAR(64) PRIMARY KEY,
      "COMMODITY" NVARCHAR(100) NOT NULL,
      "STATE" NVARCHAR(100) NOT NULL,
      "DISTRICT" NVARCHAR(100) NOT NULL,
      "MARKET" NVARCHAR(100) NOT NULL,
      "VARIETY" NVARCHAR(100),
      "GRADE" NVARCHAR(50),
      "ARRIVAL_DATE" DATE NOT NULL,
      "MIN_PRICE" DECIMAL(12,2) NOT NULL,
      "MAX_PRICE" DECIMAL(12,2) NOT NULL,
      "MODAL_PRICE" DECIMAL(12,2) NOT NULL,
      "SOURCE" NVARCHAR(50) DEFAULT 'agmarknet_api',
      "INGESTED_AT" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  },
  {
    name: 'USER_PROFILES',
    sql: `CREATE COLUMN TABLE "${targetSchema}"."USER_PROFILES" (
      "ID" NVARCHAR(64) PRIMARY KEY,
      "USER_ID" NVARCHAR(64) NOT NULL,
      "NAME" NVARCHAR(150) NOT NULL,
      "EMAIL" NVARCHAR(150) UNIQUE,
      "PHONE" NVARCHAR(50),
      "ROLE" NVARCHAR(30) NOT NULL,
      "STATE" NVARCHAR(100) NOT NULL,
      "DISTRICT" NVARCHAR(100) NOT NULL,
      "LATITUDE" DOUBLE,
      "LONGITUDE" DOUBLE,
      "LANGUAGE" NVARCHAR(10) DEFAULT 'en',
      "EDGE_STORAGE_ENABLED" BOOLEAN DEFAULT FALSE,
      "CREATED_AT" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  },
  {
    name: 'FARMER_LISTINGS',
    sql: `CREATE COLUMN TABLE "${targetSchema}"."FARMER_LISTINGS" (
      "ID" NVARCHAR(64) PRIMARY KEY,
      "FARMER_ID" NVARCHAR(64) NOT NULL,
      "FARMER_NAME" NVARCHAR(150) NOT NULL,
      "CROP" NVARCHAR(100) NOT NULL,
      "VARIETY" NVARCHAR(100),
      "GRADE" NVARCHAR(50) DEFAULT 'FAQ',
      "QUANTITY_AVAILABLE" DECIMAL(12,2) NOT NULL,
      "INITIAL_QUANTITY" DECIMAL(12,2),
      "UNIT" NVARCHAR(20) DEFAULT 'quintal',
      "ASKING_PRICE_PER_UNIT" DECIMAL(12,2) NOT NULL,
      "STATE" NVARCHAR(100) NOT NULL,
      "DISTRICT" NVARCHAR(100) NOT NULL,
      "LATITUDE" DOUBLE,
      "LONGITUDE" DOUBLE,
      "AVAILABLE_FROM" DATE,
      "AVAILABLE_UNTIL" DATE,
      "STATUS" NVARCHAR(20) DEFAULT 'active',
      "CREATED_AT" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  },
  {
    name: 'CUSTOMER_REQUIREMENTS',
    sql: `CREATE COLUMN TABLE "${targetSchema}"."CUSTOMER_REQUIREMENTS" (
      "ID" NVARCHAR(64) PRIMARY KEY,
      "CUSTOMER_ID" NVARCHAR(64) NOT NULL,
      "CUSTOMER_NAME" NVARCHAR(150) NOT NULL,
      "CROP" NVARCHAR(100) NOT NULL,
      "QUANTITY" DECIMAL(12,2) NOT NULL,
      "UNIT" NVARCHAR(20) DEFAULT 'quintal',
      "MAX_BUDGET_PER_UNIT" DECIMAL(12,2) NOT NULL,
      "DELIVERY_STATE" NVARCHAR(100) NOT NULL,
      "DELIVERY_DISTRICT" NVARCHAR(100) NOT NULL,
      "LATITUDE" DOUBLE,
      "LONGITUDE" DOUBLE,
      "REQUIRED_BY_DATE" DATE NOT NULL,
      "STATUS" NVARCHAR(20) DEFAULT 'open',
      "CREATED_AT" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  },
  {
    name: 'DEAL_PROPOSALS',
    sql: `CREATE COLUMN TABLE "${targetSchema}"."DEAL_PROPOSALS" (
      "ID" NVARCHAR(64) PRIMARY KEY,
      "REQUIREMENT_ID" NVARCHAR(64) NOT NULL,
      "LISTING_ID" NVARCHAR(64) NOT NULL,
      "FARMER_ID" NVARCHAR(64) NOT NULL,
      "FARMER_NAME" NVARCHAR(150) NOT NULL,
      "CUSTOMER_ID" NVARCHAR(64) NOT NULL,
      "CUSTOMER_NAME" NVARCHAR(150) NOT NULL,
      "CROP" NVARCHAR(100) NOT NULL,
      "QUANTITY" DECIMAL(12,2) NOT NULL,
      "UNIT" NVARCHAR(20) DEFAULT 'quintal',
      "PRICE_PER_UNIT" DECIMAL(12,2) NOT NULL,
      "DISTANCE_KM" DECIMAL(10,2) NOT NULL,
      "DELIVERY_COST_ESTIMATE" DECIMAL(12,2) NOT NULL,
      "TOTAL_COST" DECIMAL(14,2) NOT NULL,
      "MATCH_SCORE" DECIMAL(5,2) NOT NULL,
      "IS_ALTERNATIVE" BOOLEAN DEFAULT FALSE,
      "STATUS" NVARCHAR(20) DEFAULT 'pending',
      "EXPIRES_AT" TIMESTAMP NOT NULL,
      "CREATED_AT" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  },
  {
    name: 'ORDERS',
    sql: `CREATE COLUMN TABLE "${targetSchema}"."ORDERS" (
      "ID" NVARCHAR(64) PRIMARY KEY,
      "DEAL_ID" NVARCHAR(64) NOT NULL,
      "CUSTOMER_ID" NVARCHAR(64) NOT NULL,
      "CUSTOMER_NAME" NVARCHAR(150) NOT NULL,
      "FARMER_ID" NVARCHAR(64) NOT NULL,
      "FARMER_NAME" NVARCHAR(150) NOT NULL,
      "CROP" NVARCHAR(100) NOT NULL,
      "VARIETY" NVARCHAR(100),
      "GRADE" NVARCHAR(50),
      "QUANTITY" DECIMAL(12,2) NOT NULL,
      "UNIT" NVARCHAR(20) DEFAULT 'quintal',
      "PRICE_PER_UNIT" DECIMAL(12,2) NOT NULL,
      "DELIVERY_COST" DECIMAL(12,2) NOT NULL,
      "TOTAL_AMOUNT" DECIMAL(14,2) NOT NULL,
      "STATUS" NVARCHAR(30) DEFAULT 'confirmed',
      "EXPECTED_DELIVERY_DATE" DATE NOT NULL,
      "IS_DEMO" BOOLEAN DEFAULT FALSE,
      "CREATED_AT" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "UPDATED_AT" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  },
  {
    name: 'ORDER_EVENTS',
    sql: `CREATE COLUMN TABLE "${targetSchema}"."ORDER_EVENTS" (
      "ID" NVARCHAR(64) PRIMARY KEY,
      "ORDER_ID" NVARCHAR(64) NOT NULL,
      "STATUS" NVARCHAR(30) NOT NULL,
      "NOTE" NVARCHAR(500),
      "ACTOR_ROLE" NVARCHAR(30) NOT NULL,
      "CREATED_AT" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  },
  {
    name: 'PRICE_FORECASTS',
    sql: `CREATE COLUMN TABLE "${targetSchema}"."PRICE_FORECASTS" (
      "ID" NVARCHAR(64) PRIMARY KEY,
      "CROP" NVARCHAR(100) NOT NULL,
      "MARKET" NVARCHAR(100),
      "STATE" NVARCHAR(100),
      "TARGET_DATE" DATE NOT NULL,
      "PREDICTED_MODAL" DECIMAL(12,2) NOT NULL,
      "CONFIDENCE_LOWER" DECIMAL(12,2) NOT NULL,
      "CONFIDENCE_UPPER" DECIMAL(12,2) NOT NULL,
      "TREND_DIRECTION" NVARCHAR(20),
      "MAPE_BACKTEST_PCT" DECIMAL(5,2),
      "MODEL_NAME" NVARCHAR(50) DEFAULT 'ExponentialSmoothing-HoltWinters',
      "GENERATED_AT" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  },
  {
    name: 'PRICE_ANOMALIES',
    sql: `CREATE COLUMN TABLE "${targetSchema}"."PRICE_ANOMALIES" (
      "ID" NVARCHAR(64) PRIMARY KEY,
      "CROP" NVARCHAR(100) NOT NULL,
      "MARKET" NVARCHAR(100) NOT NULL,
      "STATE" NVARCHAR(100) NOT NULL,
      "RECORDED_MODAL" DECIMAL(12,2) NOT NULL,
      "BENCHMARK_MODAL" DECIMAL(12,2) NOT NULL,
      "DEVIATION_PCT" DECIMAL(6,2) NOT NULL,
      "DIRECTION" NVARCHAR(10) NOT NULL,
      "SEVERITY" NVARCHAR(10) NOT NULL,
      "Z_SCORE" DECIMAL(6,2),
      "DETECTED_AT" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  },
  {
    name: 'PRICE_ALERTS',
    sql: `CREATE COLUMN TABLE "${targetSchema}"."PRICE_ALERTS" (
      "ID" NVARCHAR(64) PRIMARY KEY,
      "USER_ID" NVARCHAR(64) NOT NULL,
      "CROP" NVARCHAR(100) NOT NULL,
      "STATE" NVARCHAR(100),
      "TARGET_PRICE" DECIMAL(12,2) NOT NULL,
      "CONDITION" NVARCHAR(20) NOT NULL,
      "ACTIVE" BOOLEAN DEFAULT TRUE,
      "LAST_TRIGGERED_AT" TIMESTAMP,
      "CREATED_AT" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  },
  {
    name: 'USER_NOTIFICATIONS',
    sql: `CREATE COLUMN TABLE "${targetSchema}"."USER_NOTIFICATIONS" (
      "ID" NVARCHAR(64) PRIMARY KEY,
      "USER_ID" NVARCHAR(64) NOT NULL,
      "TYPE" NVARCHAR(30) NOT NULL,
      "TITLE" NVARCHAR(200) NOT NULL,
      "MESSAGE" NVARCHAR(1000) NOT NULL,
      "READ" BOOLEAN DEFAULT FALSE,
      "LINK" NVARCHAR(250),
      "CREATED_AT" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  },
  {
    name: 'INGESTION_LOGS',
    sql: `CREATE COLUMN TABLE "${targetSchema}"."INGESTION_LOGS" (
      "ID" NVARCHAR(64) PRIMARY KEY,
      "RUN_AT" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "SOURCE" NVARCHAR(50) NOT NULL,
      "FETCHED" INTEGER NOT NULL,
      "ACCEPTED" INTEGER NOT NULL,
      "REJECTED" INTEGER NOT NULL,
      "MESSAGE" NVARCHAR(500)
    )`
  },
  {
    name: 'APP_SETTINGS',
    sql: `CREATE COLUMN TABLE "${targetSchema}"."APP_SETTINGS" (
      "KEY" NVARCHAR(50) PRIMARY KEY,
      "VALUE_NUM" DECIMAL(12,2),
      "VALUE_STR" NVARCHAR(250),
      "UPDATED_AT" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  }
];

function executeSql(sql) {
  return new Promise((resolve, reject) => {
    conn.exec(sql, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

async function runMigration() {
  console.log(`Connecting to SAP HANA Cloud (Schema: ${targetSchema})...`);
  await new Promise((resolve, reject) => {
    conn.connect(connParams, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  const existingTablesResult = await executeSql(
    `SELECT TABLE_NAME FROM SYS.TABLES WHERE SCHEMA_NAME = '${targetSchema}'`
  );
  const existingTableNames = new Set(existingTablesResult.map(r => r.TABLE_NAME));
  console.log('Existing tables currently in schema:', Array.from(existingTableNames));

  for (const tbl of tables) {
    if (existingTableNames.has(tbl.name)) {
      console.log(`✓ Table "${tbl.name}" already exists.`);
    } else {
      console.log(`Creating Table "${tbl.name}"...`);
      try {
        await executeSql(tbl.sql);
        console.log(`✓ Created Table "${tbl.name}" successfully!`);
      } catch (err) {
        console.error(`Error creating table "${tbl.name}":`, err.message);
      }
    }
  }

  // Populate AGRO_PRICES with top commodities
  console.log('Populating sample mandi price records into AGRO_PRICES...');
  const samplePrices = [
    ['price-tm-1', 'Tomato', 'Tamil Nadu', 'Krishnagiri', 'Rayakottai', 'Hybrid', 'FAQ', '2026-09-28', 2100, 3100, 2600, 'agmarknet_api'],
    ['price-tm-2', 'Tomato', 'Tamil Nadu', 'Dindigul', 'Ottanchatram', 'Deshi', 'FAQ', '2026-09-28', 1800, 2400, 2100, 'agmarknet_api'],
    ['price-tm-3', 'Tomato', 'Tamil Nadu', 'Chennai', 'Koyambedu', 'Local', 'FAQ', '2026-09-28', 2200, 2900, 2550, 'agmarknet_api'],
    ['price-on-1', 'Onion', 'Maharashtra', 'Nashik', 'Lasalgaon', 'Red Onion', 'FAQ', '2026-09-28', 2400, 3400, 2850, 'agmarknet_api'],
    ['price-on-2', 'Onion', 'Maharashtra', 'Mumbai', 'Vashi (Mumbai)', 'Puna', 'FAQ', '2026-09-28', 2800, 3700, 3200, 'agmarknet_api'],
    ['price-pt-1', 'Potato', 'Uttar Pradesh', 'Agra', 'Agra APMC', 'Jyoti', 'FAQ', '2026-09-28', 1400, 1900, 1650, 'agmarknet_api']
  ];

  for (const p of samplePrices) {
    try {
      await executeSql(`UPSERT "${targetSchema}"."AGRO_PRICES" VALUES ('${p[0]}', '${p[1]}', '${p[2]}', '${p[3]}', '${p[4]}', '${p[5]}', '${p[6]}', '${p[7]}', ${p[8]}, ${p[9]}, ${p[10]}, '${p[11]}', CURRENT_TIMESTAMP) WITH PRIMARY KEY`);
    } catch (e) {
      console.warn('Upsert price note:', e.message);
    }
  }

  // Populate User Profiles
  console.log('Populating initial User Profiles (Farmer, Buyer, Trader, Admin)...');
  try {
    await executeSql(`UPSERT "${targetSchema}"."USER_PROFILES" VALUES ('user-admin-1', 'user-admin-1', 'Mandi Admin (Govt Directorate)', 'admin@agrorate.gov.in', '+91-11-2338-0001', 'admin', 'NCT of Delhi', 'Delhi', 28.7041, 77.1025, 'en', FALSE, CURRENT_TIMESTAMP) WITH PRIMARY KEY`);
    await executeSql(`UPSERT "${targetSchema}"."USER_PROFILES" VALUES ('farmer-1', 'farmer-1', 'Ramesh Kumar (Krishnagiri Farm)', 'farmer.ramesh@agrorate.in', '+91-94431-12345', 'farmer', 'Tamil Nadu', 'Krishnagiri', 12.5266, 78.2146, 'ta', TRUE, CURRENT_TIMESTAMP) WITH PRIMARY KEY`);
    await executeSql(`UPSERT "${targetSchema}"."USER_PROFILES" VALUES ('user-customer-1', 'user-customer-1', 'Priya Sharma (GreenGrocer Co.)', 'customer.priya@agrorate.in', '+91-98401-23456', 'customer', 'Tamil Nadu', 'Chennai', 13.0827, 80.2707, 'en', FALSE, CURRENT_TIMESTAMP) WITH PRIMARY KEY`);
    await executeSql(`UPSERT "${targetSchema}"."USER_PROFILES" VALUES ('user-trader-1', 'user-trader-1', 'Anand Agrico Mandi Traders', 'trader.anand@agrorate.in', '+91-98200-98765', 'trader', 'Maharashtra', 'Mumbai', 19.0760, 72.8777, 'en', FALSE, CURRENT_TIMESTAMP) WITH PRIMARY KEY`);
    console.log('✓ User profiles seeded.');
  } catch (seedErr) {
    console.warn('Seed profiles note:', seedErr.message);
  }

  // Populate Farmer Listings
  console.log('Populating Farmer Listings...');
  try {
    await executeSql(`UPSERT "${targetSchema}"."FARMER_LISTINGS" VALUES ('list-1', 'farmer-1', 'Ramesh Kumar', 'Tomato', 'Deshi / Hybrid', 'FAQ', 50.0, 50.0, 'quintal', 2200.0, 'Tamil Nadu', 'Krishnagiri', 12.52, 78.21, '2026-09-28', '2026-10-15', 'active', CURRENT_TIMESTAMP) WITH PRIMARY KEY`);
    await executeSql(`UPSERT "${targetSchema}"."FARMER_LISTINGS" VALUES ('list-2', 'farmer-1', 'Ramesh Kumar', 'Onion', 'Bellary Red', 'FAQ', 80.0, 80.0, 'quintal', 2700.0, 'Tamil Nadu', 'Krishnagiri', 12.52, 78.21, '2026-09-28', '2026-10-20', 'active', CURRENT_TIMESTAMP) WITH PRIMARY KEY`);
    console.log('✓ Farmer listings seeded.');
  } catch (e) {
    console.warn('Listing seed note:', e.message);
  }

  // Populate Customer Requirements
  console.log('Populating Customer Requirements...');
  try {
    await executeSql(`UPSERT "${targetSchema}"."CUSTOMER_REQUIREMENTS" VALUES ('req-1', 'user-customer-1', 'Priya Sharma (GreenGrocer Co.)', 'Tomato', 25.0, 'quintal', 2500.0, 'Tamil Nadu', 'Chennai', 13.08, 80.27, '2026-10-05', 'open', CURRENT_TIMESTAMP) WITH PRIMARY KEY`);
    console.log('✓ Requirements seeded.');
  } catch (e) {
    console.warn('Req seed note:', e.message);
  }

  // Populate System Settings
  console.log('Populating System Settings...');
  try {
    await executeSql(`UPSERT "${targetSchema}"."APP_SETTINGS" VALUES ('weight_price', 30.0, 'Price competitiveness weight', CURRENT_TIMESTAMP) WITH PRIMARY KEY`);
    await executeSql(`UPSERT "${targetSchema}"."APP_SETTINGS" VALUES ('weight_distance', 25.0, 'Haulage distance weight', CURRENT_TIMESTAMP) WITH PRIMARY KEY`);
    await executeSql(`UPSERT "${targetSchema}"."APP_SETTINGS" VALUES ('delivery_base_fee', 300.0, 'Base delivery fee INR', CURRENT_TIMESTAMP) WITH PRIMARY KEY`);
    await executeSql(`UPSERT "${targetSchema}"."APP_SETTINGS" VALUES ('delivery_per_km_tonne', 3.5, 'Haulage rate per km tonne', CURRENT_TIMESTAMP) WITH PRIMARY KEY`);
    console.log('✓ App settings seeded.');
  } catch (e) {
    console.warn('Settings seed note:', e.message);
  }

  // Create Analytical Views
  console.log('Creating SAP HANA Analytical Views...');
  const views = [
    {
      name: 'V_DASHBOARD_COMMODITY_METRICS',
      sql: `CREATE OR REPLACE VIEW "${targetSchema}"."V_DASHBOARD_COMMODITY_METRICS" AS
        SELECT 
          "COMMODITY",
          COUNT(DISTINCT "MARKET") AS "ACTIVE_MANDIS_COUNT",
          COUNT(DISTINCT "STATE") AS "STATES_REPORTING",
          ROUND(AVG("MODAL_PRICE"), 2) AS "AVG_MODAL_PRICE_QTL",
          ROUND(AVG("MODAL_PRICE") / 100.0, 2) AS "AVG_MODAL_PRICE_KG",
          MIN("MIN_PRICE") AS "LOWEST_MANDI_PRICE",
          MAX("MAX_PRICE") AS "HIGHEST_MANDI_PRICE",
          ROUND(MAX("MAX_PRICE") - MIN("MIN_PRICE"), 2) AS "NATIONAL_SPREAD",
          MAX("ARRIVAL_DATE") AS "LATEST_DATA_DATE"
        FROM "${targetSchema}"."AGRO_PRICES"
        GROUP BY "COMMODITY"`
    },
    {
      name: 'V_MARKET_PRICES_EXPLORER',
      sql: `CREATE OR REPLACE VIEW "${targetSchema}"."V_MARKET_PRICES_EXPLORER" AS
        SELECT
          p."ID",
          p."COMMODITY",
          p."STATE",
          p."DISTRICT",
          p."MARKET",
          p."VARIETY",
          p."GRADE",
          p."ARRIVAL_DATE",
          p."MIN_PRICE" AS "MIN_PRICE_QTL",
          p."MAX_PRICE" AS "MAX_PRICE_QTL",
          p."MODAL_PRICE" AS "MODAL_PRICE_QTL",
          ROUND(p."MODAL_PRICE" / 100.0, 2) AS "MODAL_PRICE_KG",
          ROUND(p."MAX_PRICE" - p."MIN_PRICE", 2) AS "DAILY_MANDI_SPREAD",
          p."SOURCE"
        FROM "${targetSchema}"."AGRO_PRICES" p`
    },
    {
      name: 'V_FARMER_HUB_INVENTORY',
      sql: `CREATE OR REPLACE VIEW "${targetSchema}"."V_FARMER_HUB_INVENTORY" AS
        SELECT
          l."ID" AS "LISTING_ID",
          l."FARMER_ID",
          l."FARMER_NAME",
          l."CROP",
          l."VARIETY",
          l."GRADE",
          l."QUANTITY_AVAILABLE",
          l."UNIT",
          l."ASKING_PRICE_PER_UNIT",
          l."STATE",
          l."DISTRICT",
          l."STATUS",
          l."CREATED_AT"
        FROM "${targetSchema}"."FARMER_LISTINGS" l`
    },
    {
      name: 'V_ADMIN_SYSTEM_METRICS',
      sql: `CREATE OR REPLACE VIEW "${targetSchema}"."V_ADMIN_SYSTEM_METRICS" AS
        SELECT
          (SELECT COUNT(*) FROM "${targetSchema}"."USER_PROFILES") AS "TOTAL_USERS",
          (SELECT COUNT(*) FROM "${targetSchema}"."USER_PROFILES" WHERE "ROLE" = 'farmer') AS "FARMER_USERS",
          (SELECT COUNT(*) FROM "${targetSchema}"."USER_PROFILES" WHERE "ROLE" = 'customer') AS "BUYER_USERS",
          (SELECT COUNT(*) FROM "${targetSchema}"."USER_PROFILES" WHERE "ROLE" = 'trader') AS "TRADER_USERS",
          (SELECT COUNT(*) FROM "${targetSchema}"."USER_PROFILES" WHERE "EDGE_STORAGE_ENABLED" = TRUE) AS "EDGE_PERSISTENT_FARMERS",
          (SELECT COUNT(*) FROM "${targetSchema}"."AGRO_PRICES") AS "TOTAL_MANDI_PRICE_RECORDS",
          (SELECT COUNT(*) FROM "${targetSchema}"."FARMER_LISTINGS" WHERE "STATUS" = 'active') AS "ACTIVE_FARMER_LISTINGS",
          (SELECT COUNT(*) FROM "${targetSchema}"."CUSTOMER_REQUIREMENTS" WHERE "STATUS" = 'open') AS "OPEN_BUYER_REQUIREMENTS",
          (SELECT COUNT(*) FROM "${targetSchema}"."ORDERS") AS "TOTAL_ORDERS_PLACED",
          (SELECT COALESCE(SUM("TOTAL_AMOUNT"), 0) FROM "${targetSchema}"."ORDERS") AS "TOTAL_TRANSACTION_VALUE_INR"
        FROM DUMMY`
    }
  ];

  for (const v of views) {
    try {
      await executeSql(v.sql);
      console.log(`✓ Created/Replaced View "${v.name}"`);
    } catch (viewErr) {
      console.error(`View "${v.name}" creation error:`, viewErr.message);
    }
  }

  // Final verification query from SAP HANA Cloud catalog
  const finalTables = await executeSql(
    `SELECT TABLE_NAME, RECORD_COUNT FROM SYS.M_TABLES WHERE SCHEMA_NAME = '${targetSchema}' ORDER BY TABLE_NAME`
  );
  console.log('\n=============================================================');
  console.log(`SAP HANA CLOUD TABLES VERIFIED IN SCHEMA "${targetSchema}":`);
  console.log('=============================================================');
  console.table(finalTables);

  const finalViews = await executeSql(
    `SELECT VIEW_NAME FROM SYS.VIEWS WHERE SCHEMA_NAME = '${targetSchema}' ORDER BY VIEW_NAME`
  );
  console.log('\n=============================================================');
  console.log(`SAP HANA CLOUD ANALYTICAL VIEWS VERIFIED:`);
  console.log('=============================================================');
  console.table(finalViews);

  conn.disconnect();
  console.log('\n🎉 ALL TABLES AND VIEWS CREATED SUCCESSFULLY IN SAP HANA CLOUD!');
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
