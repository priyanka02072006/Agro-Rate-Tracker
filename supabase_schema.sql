-- ==============================================================================
-- Agro Rate Tracker — Supabase PostgreSQL Schema & Security Policies
-- ==============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. AGRO PRICES (Near-Real-Time Government Mandi Price Feed)
CREATE TABLE IF NOT EXISTS agro_prices (
  id TEXT PRIMARY KEY,
  crop TEXT NOT NULL,
  state TEXT NOT NULL,
  district TEXT NOT NULL,
  market TEXT NOT NULL,
  variety TEXT NOT NULL,
  grade TEXT NOT NULL,
  arrival_date DATE NOT NULL,
  min_price NUMERIC NOT NULL CHECK (min_price >= 0),
  max_price NUMERIC NOT NULL CHECK (max_price >= min_price),
  modal_price NUMERIC NOT NULL CHECK (modal_price >= min_price AND modal_price <= max_price),
  source TEXT NOT NULL DEFAULT 'agmarknet_api',
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_agro_price_natural_key UNIQUE (crop, state, district, market, variety, grade, arrival_date)
);

CREATE INDEX IF NOT EXISTS idx_agro_prices_crop ON agro_prices(crop);
CREATE INDEX IF NOT EXISTS idx_agro_prices_state_district ON agro_prices(state, district);
CREATE INDEX IF NOT EXISTS idx_agro_prices_market ON agro_prices(market);
CREATE INDEX IF NOT EXISTS idx_agro_prices_arrival_date ON agro_prices(arrival_date DESC);
CREATE INDEX IF NOT EXISTS idx_agro_prices_crop_date ON agro_prices(crop, arrival_date DESC);

-- 2. USER PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('farmer', 'customer', 'trader', 'admin')),
  state TEXT NOT NULL,
  district TEXT NOT NULL,
  latitude NUMERIC,
  longitude NUMERIC,
  phone TEXT,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. FARMER PRODUCE LISTINGS
CREATE TABLE IF NOT EXISTS farmer_listings (
  id TEXT PRIMARY KEY,
  farmer_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  farmer_name TEXT NOT NULL,
  crop TEXT NOT NULL,
  variety TEXT NOT NULL,
  grade TEXT NOT NULL,
  quantity_available NUMERIC NOT NULL CHECK (quantity_available >= 0),
  unit TEXT NOT NULL CHECK (unit IN ('kg', 'quintal', 'tonne')),
  asking_price_per_unit NUMERIC NOT NULL CHECK (asking_price_per_unit > 0),
  state TEXT NOT NULL,
  district TEXT NOT NULL,
  latitude NUMERIC,
  longitude NUMERIC,
  available_from DATE NOT NULL,
  available_until DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'sold_out')),
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_farmer_listings_crop_status ON farmer_listings(crop, status);

-- 4. CUSTOMER REQUIREMENTS
CREATE TABLE IF NOT EXISTS customer_requirements (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  crop TEXT NOT NULL,
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL CHECK (unit IN ('kg', 'quintal', 'tonne')),
  delivery_state TEXT NOT NULL,
  delivery_district TEXT NOT NULL,
  latitude NUMERIC,
  longitude NUMERIC,
  required_by_date DATE NOT NULL,
  max_budget_per_unit NUMERIC,
  preferred_farmer_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('open', 'matched', 'no_match', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. DEAL PROPOSALS
CREATE TABLE IF NOT EXISTS deal_proposals (
  id TEXT PRIMARY KEY,
  requirement_id TEXT NOT NULL REFERENCES customer_requirements(id) ON DELETE CASCADE,
  listing_id TEXT NOT NULL REFERENCES farmer_listings(id) ON DELETE CASCADE,
  farmer_id TEXT NOT NULL REFERENCES profiles(id),
  customer_id TEXT NOT NULL REFERENCES profiles(id),
  quantity NUMERIC NOT NULL,
  price_per_unit NUMERIC NOT NULL,
  distance_km NUMERIC NOT NULL,
  delivery_cost_estimate NUMERIC NOT NULL,
  total_cost NUMERIC NOT NULL,
  match_score NUMERIC NOT NULL,
  score_breakdown JSONB,
  is_alternative BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL CHECK (status IN ('proposed', 'accepted', 'rejected', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. ORDERS & FULFILLMENT
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  deal_id TEXT NOT NULL REFERENCES deal_proposals(id),
  farmer_id TEXT NOT NULL REFERENCES profiles(id),
  customer_id TEXT NOT NULL REFERENCES profiles(id),
  farmer_name TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  crop TEXT NOT NULL,
  variety TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  price_per_unit NUMERIC NOT NULL,
  total_cost NUMERIC NOT NULL,
  delivery_state TEXT NOT NULL,
  delivery_district TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('confirmed', 'packed', 'dispatched', 'in_transit', 'delivered', 'completed', 'cancelled')),
  expected_delivery_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. ORDER EVENTS (TRACKING TIMELINE)
CREATE TABLE IF NOT EXISTS order_events (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. PRICE ALERTS
CREATE TABLE IF NOT EXISTS price_alerts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  crop TEXT NOT NULL,
  state TEXT NOT NULL,
  market TEXT NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('above', 'below', 'change_pct')),
  threshold NUMERIC NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. WATCHLIST
CREATE TABLE IF NOT EXISTS watchlist (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  crop TEXT NOT NULL,
  state TEXT NOT NULL,
  market TEXT NOT NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_watchlist_user_item UNIQUE (user_id, crop, state, market)
);

-- 11. INGESTION LOGS
CREATE TABLE IF NOT EXISTS ingestion_logs (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_rows INT NOT NULL,
  accepted INT NOT NULL,
  rejected INT NOT NULL,
  reason_summary JSONB,
  status TEXT NOT NULL,
  duration_ms INT NOT NULL
);

-- 12. APP SETTINGS
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE agro_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmer_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

-- Mandi price data is public/read-only for all users
CREATE POLICY "Allow public read access to mandi prices" ON agro_prices
  FOR SELECT USING (true);

-- Active farmer listings are viewable by everyone
CREATE POLICY "Allow public read access to active listings" ON farmer_listings
  FOR SELECT USING (status = 'active');
