import fs from 'fs';
import path from 'path';
import {
  AgroPrice,
  Profile,
  FarmerListing,
  CustomerRequirement,
  DealProposal,
  Order,
  OrderEvent,
  Notification,
  PriceAlert,
  WatchlistItem,
  IngestionLog,
  AppSettings,
} from './types.js';
import { generateSeedData } from './data/seedGenerator.js';
import {
  DEMO_PROFILES,
  DEMO_LISTINGS,
  DEMO_REQUIREMENTS,
  DEMO_ORDERS,
  DEMO_ORDER_EVENTS,
} from './data/demoMarketplace.js';

import { supabase, isSupabaseConfigured, getSupabaseConfigStatus, testSupabaseConnection } from './supabase.js';

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'agro_db.json');

const DEFAULT_SETTINGS: AppSettings = {
  weight_price: 30,
  weight_distance: 25,
  weight_quantity: 15,
  weight_availability: 15,
  weight_feasibility: 15,
  delivery_base_fee: 300, // base fee Rs 300
  delivery_per_km_tonne: 3.5, // Rs 3.5 per km per tonne
  proposal_expiry_hours: 24,
  scheduled_sync_time: '16:00',
};

class Database {
  agroPrices: AgroPrice[] = [];
  profiles: Profile[] = [];
  farmerListings: FarmerListing[] = [];
  customerRequirements: CustomerRequirement[] = [];
  dealProposals: DealProposal[] = [];
  orders: Order[] = [];
  orderEvents: OrderEvent[] = [];
  notifications: Notification[] = [];
  priceAlerts: PriceAlert[] = [];
  watchlist: WatchlistItem[] = [];
  ingestionLogs: IngestionLog[] = [];
  settings: AppSettings = { ...DEFAULT_SETTINGS };

  // Sync / Freshness metadata
  lastSyncAt: string | null = null;
  lastSyncStatus: 'synced' | 'not_configured' | 'failed' = 'not_configured';
  latestArrivalDate: string = '2026-09-28';

  // Supabase cloud sync status
  supabaseSync = {
    isConfigured: isSupabaseConfigured,
    lastAttemptAt: null as string | null,
    lastSuccessAt: null as string | null,
    status: isSupabaseConfigured ? 'connected' : 'awaiting_secrets',
    message: isSupabaseConfigured
      ? 'Supabase credentials loaded from environment variables.'
      : 'Awaiting SUPABASE_URL and SUPABASE_ANON_KEY in environment secrets.',
  };

  // Natural key index for idempotent upsert
  private priceNaturalKeyIndex = new Map<string, number>();

  // Mutex locks per listing id for transaction safety
  private listingLocks = new Map<string, Promise<void>>();

  constructor() {
    this.init();
  }

  private init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const data = JSON.parse(raw);
        this.agroPrices = data.agroPrices || [];
        this.profiles = data.profiles || [];
        this.farmerListings = data.farmerListings || [];
        this.customerRequirements = data.customerRequirements || [];
        this.dealProposals = data.dealProposals || [];
        this.orders = data.orders || [];
        this.orderEvents = data.orderEvents || [];
        this.notifications = data.notifications || [];
        this.priceAlerts = data.priceAlerts || [];
        this.watchlist = data.watchlist || [];
        this.ingestionLogs = data.ingestionLogs || [];
        this.settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
        this.lastSyncAt = data.lastSyncAt || '2026-09-28T05:00:00.000Z';
        this.lastSyncStatus = data.lastSyncStatus || 'synced';
        this.latestArrivalDate = data.latestArrivalDate || '2026-09-28';

        this.rebuildIndex();
        return;
      } catch (err) {
        console.warn('Failed to load DB file, reseeding initial data:', err);
      }
    }

    // Seed freshly
    this.seed();
  }

  private seed() {
    console.log('Seeding initial agricultural mandi prices and demo marketplace data...');
    this.agroPrices = generateSeedData();
    this.profiles = [...DEMO_PROFILES];
    this.farmerListings = [...DEMO_LISTINGS];
    this.customerRequirements = [...DEMO_REQUIREMENTS];
    this.orders = [...DEMO_ORDERS];
    this.orderEvents = [...DEMO_ORDER_EVENTS];
    this.notifications = [
      {
        id: 'notif-welcome',
        user_id: 'user-customer-1',
        type: 'system',
        title: 'Welcome to Agro Rate Tracker',
        message: 'Daily Agmarknet mandi price feed updated. Check Tomato and Onion modal prices in Tamil Nadu.',
        read: false,
        created_at: new Date().toISOString(),
      },
      {
        id: 'notif-order-demo',
        user_id: 'user-customer-1',
        type: 'order',
        title: 'Order ORD-DEMO-1001 In Transit',
        message: 'Your 10 quintals of Tomato from Krishnagiri are currently in transit.',
        read: false,
        created_at: new Date().toISOString(),
      },
    ];
    this.priceAlerts = [
      {
        id: 'alert-1',
        user_id: 'user-customer-1',
        crop: 'Tomato',
        state: 'Tamil Nadu',
        market: 'Ottanchatram',
        condition: 'above',
        threshold: 2500,
        active: true,
        created_at: '2026-09-20T10:00:00Z',
      },
      {
        id: 'alert-2',
        user_id: 'user-customer-1',
        crop: 'Onion',
        state: 'Maharashtra',
        market: 'Lasalgaon',
        condition: 'below',
        threshold: 2400,
        active: true,
        created_at: '2026-09-20T10:00:00Z',
      },
    ];
    this.watchlist = [
      {
        id: 'watch-1',
        user_id: 'user-customer-1',
        crop: 'Tomato',
        state: 'Tamil Nadu',
        market: 'Koyambedu',
        added_at: '2026-09-25T08:00:00Z',
      },
      {
        id: 'watch-2',
        user_id: 'user-customer-1',
        crop: 'Onion',
        state: 'Maharashtra',
        market: 'Lasalgaon',
        added_at: '2026-09-25T08:00:00Z',
      },
    ];

    this.lastSyncAt = '2026-09-28T05:00:00.000Z';
    this.lastSyncStatus = 'synced';
    this.latestArrivalDate = '2026-09-28';

    this.ingestionLogs = [
      {
        id: 'log-seed-1',
        source: 'csv_seed',
        run_at: '2026-09-28T05:00:00.000Z',
        total_rows: this.agroPrices.length,
        accepted: this.agroPrices.length,
        rejected: 0,
        reason_summary: {},
        status: 'success',
        duration_ms: 142,
      },
    ];

    this.rebuildIndex();
    this.persist();
  }

  private rebuildIndex() {
    this.priceNaturalKeyIndex.clear();
    let maxDate = '2026-09-28';
    for (let i = 0; i < this.agroPrices.length; i++) {
      const p = this.agroPrices[i];
      const key = this.getNaturalKey(p);
      this.priceNaturalKeyIndex.set(key, i);
      if (p.arrival_date > maxDate) {
        maxDate = p.arrival_date;
      }
    }
    this.latestArrivalDate = maxDate;
  }

  getNaturalKey(p: {
    crop: string;
    state: string;
    district: string;
    market: string;
    variety: string;
    grade: string;
    arrival_date: string;
  }): string {
    return `${p.crop.trim().toLowerCase()}|${p.state.trim().toLowerCase()}|${p.district.trim().toLowerCase()}|${p.market.trim().toLowerCase()}|${p.variety.trim().toLowerCase()}|${p.grade.trim().toLowerCase()}|${p.arrival_date.trim()}`;
  }

  persist() {
    try {
      const payload = {
        agroPrices: this.agroPrices,
        profiles: this.profiles,
        farmerListings: this.farmerListings,
        customerRequirements: this.customerRequirements,
        dealProposals: this.dealProposals,
        orders: this.orders,
        orderEvents: this.orderEvents,
        notifications: this.notifications,
        priceAlerts: this.priceAlerts,
        watchlist: this.watchlist,
        ingestionLogs: this.ingestionLogs,
        settings: this.settings,
        lastSyncAt: this.lastSyncAt,
        lastSyncStatus: this.lastSyncStatus,
        latestArrivalDate: this.latestArrivalDate,
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(payload, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist agro_db:', err);
    }
  }

  // Idempotent upsert of agro price records
  upsertPrices(records: AgroPrice[]): { accepted: number; rejected: number; updated: number } {
    let accepted = 0;
    let updated = 0;
    let rejected = 0;

    for (const record of records) {
      const key = this.getNaturalKey(record);
      const existingIdx = this.priceNaturalKeyIndex.get(key);

      if (existingIdx !== undefined) {
        // Update existing record
        this.agroPrices[existingIdx] = {
          ...this.agroPrices[existingIdx],
          min_price: record.min_price,
          max_price: record.max_price,
          modal_price: record.modal_price,
          source: record.source,
          ingested_at: record.ingested_at,
        };
        updated++;
      } else {
        // Insert new record
        const newIdx = this.agroPrices.length;
        this.agroPrices.push(record);
        this.priceNaturalKeyIndex.set(key, newIdx);
        accepted++;
      }

      if (record.arrival_date > this.latestArrivalDate) {
        this.latestArrivalDate = record.arrival_date;
      }
    }

    this.persist();

    // Asynchronous background sync to Supabase if configured
    if (isSupabaseConfigured && supabase) {
      this.pushPricesToSupabase(records.slice(0, 500)).catch((err) => {
        console.warn('[Supabase Sync] Background upsert error:', err.message);
      });
    }

    return { accepted, rejected, updated };
  }

  // Push prices in batches to Supabase
  async pushPricesToSupabase(records: AgroPrice[]): Promise<{ count: number; error?: string }> {
    if (!supabase || !isSupabaseConfigured) {
      return { count: 0, error: 'Supabase credentials not configured.' };
    }

    try {
      this.supabaseSync.lastAttemptAt = new Date().toISOString();
      const BATCH_SIZE = 100;
      let totalSynced = 0;

      for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE).map((r) => ({
          id: r.id,
          crop: r.crop,
          state: r.state,
          district: r.district,
          market: r.market,
          variety: r.variety,
          grade: r.grade,
          arrival_date: r.arrival_date,
          min_price: r.min_price,
          max_price: r.max_price,
          modal_price: r.modal_price,
          source: r.source,
          ingested_at: r.ingested_at,
        }));

        const { error } = await supabase.from('agro_prices').upsert(batch, {
          onConflict: 'crop,state,district,market,variety,grade,arrival_date',
        });

        if (error) {
          console.warn(`[Supabase Sync] Upsert batch error: ${error.message}`);
          this.supabaseSync.status = 'sync_error';
          this.supabaseSync.message = `Supabase sync error: ${error.message}`;
          return { count: totalSynced, error: error.message };
        }
        totalSynced += batch.length;
      }

      this.supabaseSync.lastSuccessAt = new Date().toISOString();
      this.supabaseSync.status = 'connected';
      this.supabaseSync.message = `Successfully synchronized ${totalSynced} records to Supabase.`;
      return { count: totalSynced };
    } catch (err: any) {
      console.warn('[Supabase Sync] Unexpected exception:', err.message);
      this.supabaseSync.status = 'sync_error';
      this.supabaseSync.message = err.message || 'Unknown error';
      return { count: 0, error: err.message };
    }
  }

  // Sync entire initial database to Supabase on user command
  async syncAllToSupabase(): Promise<{
    success: boolean;
    pricesCount: number;
    profilesCount: number;
    listingsCount: number;
    message: string;
  }> {
    if (!supabase || !isSupabaseConfigured) {
      return {
        success: false,
        pricesCount: 0,
        profilesCount: 0,
        listingsCount: 0,
        message: 'Supabase credentials (SUPABASE_URL and SUPABASE_ANON_KEY) are not configured in environment secrets.',
      };
    }

    try {
      this.supabaseSync.lastAttemptAt = new Date().toISOString();

      // 1. Sync Profiles
      const safeProfiles = this.profiles.map((p) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        role: p.role,
        state: p.state,
        district: p.district,
        latitude: p.latitude || null,
        longitude: p.longitude || null,
        phone: p.phone || null,
        language: p.language || 'en',
      }));

      const { error: profError } = await supabase.from('profiles').upsert(safeProfiles);
      if (profError) {
        throw new Error(`Failed to sync profiles: ${profError.message}`);
      }

      // 2. Sync Farmer Listings
      const listingsPayload = this.farmerListings.map((l) => ({
        id: l.id,
        farmer_id: l.farmer_id,
        farmer_name: l.farmer_name,
        crop: l.crop,
        variety: l.variety,
        grade: l.grade,
        quantity_available: l.quantity_available,
        unit: l.unit,
        asking_price_per_unit: l.asking_price_per_unit,
        state: l.state,
        district: l.district,
        latitude: l.latitude || null,
        longitude: l.longitude || null,
        available_from: l.available_from,
        available_until: l.available_until,
        status: l.status,
        is_demo: l.is_demo,
      }));

      const { error: listError } = await supabase.from('farmer_listings').upsert(listingsPayload);
      if (listError) {
        throw new Error(`Failed to sync listings: ${listError.message}`);
      }

      // 3. Sync Agro Prices (first 1000 or all)
      const priceSyncResult = await this.pushPricesToSupabase(this.agroPrices);
      if (priceSyncResult.error) {
        throw new Error(`Failed to sync prices: ${priceSyncResult.error}`);
      }

      this.supabaseSync.lastSuccessAt = new Date().toISOString();
      this.supabaseSync.status = 'connected';
      this.supabaseSync.message = `Full sync completed: ${priceSyncResult.count} prices, ${safeProfiles.length} profiles, ${listingsPayload.length} listings.`;

      return {
        success: true,
        pricesCount: priceSyncResult.count,
        profilesCount: safeProfiles.length,
        listingsCount: listingsPayload.length,
        message: this.supabaseSync.message,
      };
    } catch (err: any) {
      this.supabaseSync.status = 'sync_error';
      this.supabaseSync.message = err.message || 'Sync failed';
      return {
        success: false,
        pricesCount: 0,
        profilesCount: 0,
        listingsCount: 0,
        message: err.message,
      };
    }
  }

  // Hydrate data from Supabase if table has records
  async hydrateFromSupabase(): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured) return false;
    try {
      const { data: prices, error } = await supabase
        .from('agro_prices')
        .select('*')
        .order('arrival_date', { ascending: false })
        .limit(3500);

      if (!error && prices && prices.length > 0) {
        console.log(`[Supabase Hydrate] Successfully loaded ${prices.length} prices from Supabase.`);
        this.agroPrices = prices.map((p) => ({
          ...p,
          min_price: Number(p.min_price),
          max_price: Number(p.max_price),
          modal_price: Number(p.modal_price),
        }));
        this.rebuildIndex();
        this.persist();
        return true;
      }
    } catch (err: any) {
      console.warn('[Supabase Hydrate] Cloud table hydration skipped:', err.message);
    }
    return false;
  }

  // Background sync helpers for single entities
  async syncProfileToSupabase(profile: Profile): Promise<void> {
    if (!supabase || !isSupabaseConfigured) return;
    try {
      await supabase.from('profiles').upsert({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        state: profile.state,
        district: profile.district,
        latitude: profile.latitude || null,
        longitude: profile.longitude || null,
        phone: profile.phone || null,
        language: profile.language || 'en',
      });
    } catch (err: any) {
      console.warn('[Supabase Sync Profile]:', err.message);
    }
  }

  async syncListingToSupabase(listing: FarmerListing): Promise<void> {
    if (!supabase || !isSupabaseConfigured) return;
    try {
      await supabase.from('farmer_listings').upsert({
        id: listing.id,
        farmer_id: listing.farmer_id,
        farmer_name: listing.farmer_name,
        crop: listing.crop,
        variety: listing.variety,
        grade: listing.grade,
        quantity_available: listing.quantity_available,
        unit: listing.unit,
        asking_price_per_unit: listing.asking_price_per_unit,
        state: listing.state,
        district: listing.district,
        latitude: listing.latitude || null,
        longitude: listing.longitude || null,
        available_from: listing.available_from,
        available_until: listing.available_until,
        status: listing.status,
        is_demo: listing.is_demo,
      });
    } catch (err: any) {
      console.warn('[Supabase Sync Listing]:', err.message);
    }
  }

  async syncRequirementToSupabase(req: CustomerRequirement): Promise<void> {
    if (!supabase || !isSupabaseConfigured) return;
    try {
      await supabase.from('customer_requirements').upsert({
        id: req.id,
        customer_id: req.customer_id,
        customer_name: req.customer_name,
        crop: req.crop,
        quantity: req.quantity,
        unit: req.unit,
        delivery_state: req.delivery_state,
        delivery_district: req.delivery_district,
        latitude: req.latitude || null,
        longitude: req.longitude || null,
        required_by_date: req.required_by_date,
        max_budget_per_unit: req.max_budget_per_unit || null,
        preferred_farmer_id: req.preferred_farmer_id || null,
        status: req.status,
      });
    } catch (err: any) {
      console.warn('[Supabase Sync Requirement]:', err.message);
    }
  }

  async syncOrderToSupabase(order: Order): Promise<void> {
    if (!supabase || !isSupabaseConfigured) return;
    try {
      await supabase.from('orders').upsert({
        id: order.id,
        deal_id: order.deal_id,
        farmer_id: order.farmer_id,
        farmer_name: order.farmer_name,
        customer_id: order.customer_id,
        customer_name: order.customer_name,
        crop: order.crop,
        variety: order.variety,
        grade: order.grade,
        quantity: order.quantity,
        unit: order.unit,
        price_per_unit: order.price_per_unit,
        delivery_cost: order.delivery_cost,
        total_amount: order.total_amount,
        status: order.status,
      });
    } catch (err: any) {
      console.warn('[Supabase Sync Order]:', err.message);
    }
  }

  // Transaction with lock for listing inventory (concurrent accept safe)
  async withListingLock<T>(listingId: string, action: () => Promise<T> | T): Promise<T> {
    while (this.listingLocks.has(listingId)) {
      await this.listingLocks.get(listingId);
    }

    let releaseLock: () => void = () => {};
    const lockPromise = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    this.listingLocks.set(listingId, lockPromise);
    try {
      return await action();
    } finally {
      this.listingLocks.delete(listingId);
      releaseLock();
    }
  }
}

export const db = new Database();
