export type Role = 'farmer' | 'customer' | 'trader' | 'admin';

export interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: Role;
  state: string;
  district: string;
  latitude: number;
  longitude: number;
  phone?: string;
  language: 'en' | 'hi' | 'ta';
  created_at: string;
}

export interface AgroPriceRecord {
  id: string;
  crop: string;
  state: string;
  district: string;
  market: string;
  variety: string;
  grade: string;
  arrival_date: string;
  min_price: number;
  max_price: number;
  modal_price: number;
  source: 'agmarknet_api' | 'csv_seed';
  ingested_at: string;
}

export interface Pagination {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface FreshnessInfo {
  latestArrivalDate: string;
  lastSyncAt: string | null;
  lastSyncStatus: 'synced' | 'not_configured' | 'failed';
  totalRecords: number;
  sourceLabel: string;
}

export interface FarmerListing {
  id: string;
  farmer_id: string;
  farmer_name: string;
  crop: string;
  variety: string;
  grade: string;
  quantity_available: number;
  initial_quantity?: number;
  unit: 'kg' | 'quintal' | 'tonne';
  asking_price_per_unit: number;
  state: string;
  district: string;
  latitude: number;
  longitude: number;
  available_from: string;
  available_until: string;
  status: 'active' | 'paused' | 'sold_out';
  is_demo: boolean;
  created_at: string;
}

export interface DealProposal {
  id: string;
  requirement_id: string;
  listing_id: string;
  farmer_id: string;
  farmer_name: string;
  customer_id: string;
  customer_name: string;
  crop: string;
  variety: string;
  grade: string;
  quantity: number;
  unit: 'kg' | 'quintal' | 'tonne';
  price_per_unit: number;
  distance_km: number;
  delivery_cost_estimate: number;
  total_cost: number;
  match_score: number;
  score_breakdown: {
    priceScore: number;
    distanceScore: number;
    quantityScore: number;
    availabilityScore: number;
    feasibilityScore: number;
    priceWeight: number;
    distanceWeight: number;
    quantityWeight: number;
    availabilityWeight: number;
    feasibilityWeight: number;
    marketModalReference: number;
    priceDeltaVsMarket: number;
  };
  is_alternative: boolean;
  forecast_trend_note: string;
  status: 'proposed' | 'accepted' | 'rejected' | 'expired' | 'cancelled';
  expires_at: string;
  created_at: string;
}

export interface Order {
  id: string;
  deal_id: string;
  customer_id: string;
  customer_name: string;
  farmer_id: string;
  farmer_name: string;
  crop: string;
  variety: string;
  grade: string;
  quantity: number;
  unit: 'kg' | 'quintal' | 'tonne';
  price_per_unit: number;
  delivery_cost: number;
  total_amount: number;
  status: 'confirmed' | 'packed' | 'dispatched' | 'in_transit' | 'delivered' | 'completed' | 'cancelled';
  expected_delivery_date: string;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderEvent {
  id: string;
  order_id: string;
  status: string;
  note: string;
  actor_role: Role;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  type: 'deal' | 'order' | 'price_alert' | 'system';
  title: string;
  message: string;
  read: boolean;
  link?: string;
  created_at: string;
}

export interface PriceAlert {
  id: string;
  user_id: string;
  crop: string;
  state: string;
  market: string;
  condition: 'above' | 'below' | 'change_pct';
  threshold: number;
  active: boolean;
  last_triggered_at?: string;
  created_at: string;
}

export interface WatchlistItem {
  id: string;
  user_id: string;
  crop: string;
  state: string;
  market: string;
  current_modal_price?: number;
  arrival_date?: string;
  change_pct?: number;
  created_at: string;
}

export interface AnomalyReport {
  id: string;
  crop: string;
  market: string;
  state: string;
  arrival_date: string;
  recorded_price: number;
  typical_min: number;
  typical_max: number;
  median: number;
  severity: 'Low' | 'Medium' | 'High';
  direction: 'Above' | 'Below';
  deviation_pct: number;
  sample_size: number;
}

export interface ForecastData {
  crop: string;
  market?: string;
  state?: string;
  model_name: string;
  training_window: string;
  points_used: number;
  mape_backtest_pct: number;
  points: Array<{
    date: string;
    predicted_modal: number;
    confidence_lower: number;
    confidence_upper: number;
  }>;
  historical_recent: Array<{ date: string; modal_price: number }>;
  disclaimer: string;
}
