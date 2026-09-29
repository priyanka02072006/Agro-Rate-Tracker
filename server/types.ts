export type Role = 'farmer' | 'customer' | 'trader' | 'admin';

export interface AgroPrice {
  id: string;
  crop: string;
  state: string;
  district: string;
  market: string;
  variety: string;
  grade: string;
  arrival_date: string; // YYYY-MM-DD
  min_price: number; // Rs per quintal
  max_price: number; // Rs per quintal
  modal_price: number; // Rs per quintal
  source: 'agmarknet_api' | 'csv_seed';
  ingested_at: string; // ISO
}

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  password_hash: string;
  role: Role;
  state: string;
  district: string;
  latitude: number;
  longitude: number;
  phone?: string;
  language: 'en' | 'hi' | 'ta';
  created_at: string;
}

export interface DistrictCentroid {
  state: string;
  district: string;
  latitude: number;
  longitude: number;
}

export type UnitType = 'kg' | 'quintal' | 'tonne';
export type ListingStatus = 'active' | 'paused' | 'sold_out';

export interface FarmerListing {
  id: string;
  farmer_id: string;
  farmer_name: string;
  crop: string;
  variety: string;
  grade: string;
  quantity_available: number;
  initial_quantity?: number;
  unit: UnitType;
  asking_price_per_unit: number; // In Rs per unit
  state: string;
  district: string;
  latitude: number;
  longitude: number;
  available_from: string; // YYYY-MM-DD
  available_until: string; // YYYY-MM-DD
  status: ListingStatus;
  is_demo: boolean;
  created_at: string;
}

export type RequirementStatus = 'open' | 'matched' | 'no_match' | 'closed';

export interface CustomerRequirement {
  id: string;
  customer_id: string;
  customer_name: string;
  crop: string;
  quantity: number;
  unit: UnitType;
  delivery_state: string;
  delivery_district: string;
  latitude: number;
  longitude: number;
  required_by_date: string; // YYYY-MM-DD
  max_budget_per_unit?: number;
  preferred_farmer_id?: string;
  status: RequirementStatus;
  rejected_farmer_ids?: string[];
  created_at: string;
}

export type DealStatus = 'proposed' | 'accepted' | 'rejected' | 'expired' | 'cancelled';

export interface ScoreBreakdown {
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
  unit: UnitType;
  price_per_unit: number;
  distance_km: number;
  delivery_cost_estimate: number;
  total_cost: number;
  match_score: number;
  score_breakdown: ScoreBreakdown;
  is_alternative: boolean;
  forecast_trend_note: string;
  status: DealStatus;
  expires_at: string;
  created_at: string;
}

export type OrderStatus =
  | 'confirmed'
  | 'packed'
  | 'dispatched'
  | 'in_transit'
  | 'delivered'
  | 'completed'
  | 'cancelled';

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
  unit: UnitType;
  price_per_unit: number;
  delivery_cost: number;
  total_amount: number;
  status: OrderStatus;
  expected_delivery_date: string;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderEvent {
  id: string;
  order_id: string;
  status: OrderStatus;
  note: string;
  actor_role: Role;
  created_at: string;
}

export interface Notification {
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
  created_at?: string;
  added_at?: string;
}

export interface IngestionLog {
  id: string;
  source: 'agmarknet_api' | 'csv_seed';
  run_at: string;
  total_rows: number;
  accepted: number;
  rejected: number;
  reason_summary: Record<string, number>;
  rejected_samples?: Array<{ row: any; reason: string }>;
  status: 'success' | 'partial' | 'failed';
  duration_ms: number;
}

export interface AppSettings {
  weight_price: number;
  weight_distance: number;
  weight_quantity: number;
  weight_availability: number;
  weight_feasibility: number;
  delivery_base_fee: number;
  delivery_per_km_tonne: number;
  proposal_expiry_hours: number;
  scheduled_sync_time: string; // e.g. "16:00" IST
}
