import {
  UserProfile,
  AgroPriceRecord,
  Pagination,
  FreshnessInfo,
  FarmerListing,
  DealProposal,
  Order,
  OrderEvent,
  NotificationItem,
  PriceAlert,
  WatchlistItem,
  AnomalyReport,
  ForecastData,
} from '../types/client.js';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('agro_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    return data;
  } catch (err: any) {
    // If network fails, check if we have cached response in localStorage
    if (options.method === 'GET' || !options.method) {
      const cacheKey = `cache_${endpoint}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          return JSON.parse(cached) as T;
        } catch {
          // fall through
        }
      }
    }
    throw err;
  }
}

// Caching wrapper for GET requests
async function cachedGet<T>(endpoint: string): Promise<T> {
  try {
    const data = await request<T>(endpoint);
    try {
      localStorage.setItem(`cache_${endpoint}`, JSON.stringify(data));
    } catch {
      // ignore quota errors
    }
    return data;
  } catch (err) {
    const cached = localStorage.getItem(`cache_${endpoint}`);
    if (cached) {
      return JSON.parse(cached) as T;
    }
    throw err;
  }
}

export const api = {
  // Freshness
  getFreshness: () => cachedGet<FreshnessInfo>('/prices/freshness'),

  // Prices
  getFilterOptions: (params: { state?: string; district?: string; crop?: string } = {}) => {
    const q = new URLSearchParams(params as any).toString();
    return cachedGet<{
      crops: string[];
      states: string[];
      districts: string[];
      markets: string[];
      varieties: string[];
      grades: string[];
    }>(`/prices/filter-options${q ? `?${q}` : ''}`);
  },

  getPrices: (query: Record<string, any>) => {
    const cleanParams: Record<string, string> = {};
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') {
        cleanParams[k] = String(v);
      }
    }
    const q = new URLSearchParams(cleanParams).toString();
    return request<{ data: AgroPriceRecord[]; pagination: Pagination }>(
      `/prices${q ? `?${q}` : ''}`
    );
  },

  getPriceDetail: (id: string) =>
    request<{
      record: AgroPriceRecord & { price_range: number };
      mini_trend: Array<{ date: string; modal_price: number; min_price: number; max_price: number }>;
    }>(`/prices/detail/${id}`),

  getComparison: (crop: string, dimension: string, state?: string) => {
    const params = new URLSearchParams({ crop, dimension });
    if (state) params.set('state', state);
    return cachedGet<{
      crop: string;
      dimension: string;
      overallAvgModal: number;
      items: Array<{
        entity: string;
        avg_modal_price: number;
        min_price: number;
        max_price: number;
        diff_vs_group_avg: number;
        diff_pct: number;
        record_count: number;
        sample_market: string;
        state: string;
      }>;
    }>(`/prices/compare?${params.toString()}`);
  },

  getTrends: (params: Record<string, any>) => {
    const cleanParams: Record<string, string> = {};
    for (const [k, v] of Object.entries(params)) {
      if (v) cleanParams[k] = String(v);
    }
    const q = new URLSearchParams(cleanParams).toString();
    return cachedGet<{
      hasEnoughData: boolean;
      message?: string;
      series: Array<{ date: string; modal_price: number; min_price: number; max_price: number }>;
      stats: {
        startDate: string;
        endDate: string;
        startPrice: number;
        endPrice: number;
        changePct: number;
        high: number;
        low: number;
        avg: number;
      } | null;
    }>(`/prices/trends?${q}`);
  },

  getTopMovers: (period: '1D' | '7D' = '1D') =>
    cachedGet<{
      period: string;
      gainers: Array<{
        crop: string;
        market: string;
        state: string;
        current_modal: number;
        prev_modal: number;
        change_amount: number;
        change_pct: number;
      }>;
      decliners: Array<{
        crop: string;
        market: string;
        state: string;
        current_modal: number;
        prev_modal: number;
        change_amount: number;
        change_pct: number;
      }>;
    }>(`/prices/top-movers?period=${period}`),

  getDashboardStats: (params: Record<string, any> = {}) => {
    const q = new URLSearchParams(params).toString();
    return cachedGet<{
      totalRecords: number;
      crops: number;
      states: number;
      markets: number;
      avgModal: number;
      lowestRecorded: number;
      highestRecorded: number;
      activeListings: number;
      openRequirements: number;
      dealsInProgress: number;
      completedOrders: number;
    }>(`/prices/dashboard-stats${q ? `?${q}` : ''}`);
  },

  // Marketplace
  getMarketReference: (crop: string, state: string) =>
    cachedGet<{
      crop: string;
      state: string;
      latestModal: number;
      avg7dModal: number;
      unit: string;
      note: string;
    }>(`/marketplace/market-reference?crop=${encodeURIComponent(crop)}&state=${encodeURIComponent(state)}`),

  getListings: (params: { crop?: string; farmerId?: string; all?: boolean } = {}) => {
    const q = new URLSearchParams(params as any).toString();
    return request<{ listings: FarmerListing[] }>(`/marketplace/listings${q ? `?${q}` : ''}`);
  },

  createListing: (data: any) =>
    request<{ listing: FarmerListing; message: string }>('/marketplace/listings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateListingStatus: (id: string, status: string) =>
    request<{ listing: FarmerListing; message: string }>(`/marketplace/listings/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  submitRequirement: (data: any) =>
    request<{
      requirement: any;
      proposals: DealProposal[];
      preferredMatchFound: boolean;
      note?: string;
    }>('/marketplace/requirements', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMyRequirements: () =>
    request<{ requirements: any[] }>('/marketplace/requirements/my'),

  acceptProposal: (id: string) =>
    request<{ success: boolean; message: string; order: Order }>(
      `/marketplace/proposals/${id}/accept`,
      { method: 'POST' }
    ),

  rejectProposal: (id: string) =>
    request<{
      message: string;
      hasAlternatives: boolean;
      nextProposals: DealProposal[];
    }>(`/marketplace/proposals/${id}/reject`, { method: 'POST' }),

  getOrders: () => request<{ orders: Order[] }>('/marketplace/orders'),

  getOrderDetail: (id: string) =>
    request<{ order: Order; events: OrderEvent[] }>(`/marketplace/orders/${id}`),

  updateOrderStatus: (id: string, status: string, note?: string) =>
    request<{ order: Order; event: OrderEvent; message: string }>(
      `/marketplace/orders/${id}/update-status`,
      { method: 'POST', body: JSON.stringify({ status, note }) }
    ),

  confirmReceipt: (id: string) =>
    request<{ order: Order; message: string }>(`/marketplace/orders/${id}/confirm-receipt`, {
      method: 'POST',
    }),

  getSupplyDemand: () =>
    cachedGet<{ data: any[]; includes_demo_data: boolean }>('/marketplace/supply-demand'),

  getSalesAnalytics: () => cachedGet<any>('/marketplace/sales-analytics'),

  // Analytics
  getAnomalies: (crop?: string) =>
    cachedGet<{ anomalies: AnomalyReport[]; insufficientDataCrops: string[] }>(
      `/analytics/anomalies${crop ? `?crop=${encodeURIComponent(crop)}` : ''}`
    ),

  getForecast: (crop: string, state?: string, market?: string) => {
    const params = new URLSearchParams({ crop });
    if (state) params.set('state', state);
    if (market) params.set('market', market);
    return cachedGet<ForecastData>(`/analytics/forecast?${params.toString()}`);
  },

  // Alerts & Watchlist
  getAlerts: () => request<{ alerts: PriceAlert[] }>('/alerts'),
  createAlert: (data: any) =>
    request<{ alert: PriceAlert; message: string }>('/alerts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteAlert: (id: string) => request<{ success: boolean }>(`/alerts/${id}`, { method: 'DELETE' }),

  getWatchlist: () => request<{ items: WatchlistItem[] }>('/alerts/watchlist'),
  addToWatchlist: (data: any) =>
    request<{ item: WatchlistItem; message: string }>('/alerts/watchlist', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  removeFromWatchlist: (id: string) =>
    request<{ success: boolean }>(`/alerts/watchlist/${id}`, { method: 'DELETE' }),

  getNotifications: () => request<{ notifications: NotificationItem[] }>('/alerts/notifications'),
  markNotificationRead: (id: string) =>
    request<{ success: boolean }>(`/alerts/notifications/${id}/read`, { method: 'PUT' }),

  // Admin
  getSyncStatus: () => request<any>('/admin/sync-status'),
  syncNow: () => request<any>('/admin/sync-now', { method: 'POST' }),
  getSettings: () => request<{ settings: any }>('/admin/settings'),
  updateSettings: (settings: any) =>
    request<{ settings: any; message: string }>('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
  getAdminUsers: () => request<{ users: UserProfile[] }>('/admin/users'),
  updateUserRole: (id: string, role: string) =>
    request<{ user: UserProfile; message: string }>(`/admin/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),
  getRejectedRows: () => request<{ rejects: any[] }>('/admin/rejected-rows'),
  getSupabaseStatus: () => request<{ config: any; connection: any; syncStatus: any }>('/admin/supabase-status'),
  syncSupabase: () => request<{ success: boolean; pricesCount: number; profilesCount: number; listingsCount: number; message: string }>('/admin/supabase-sync', { method: 'POST' }),
  getSupabaseSchema: () => request<{ sql: string }>('/admin/supabase-schema'),

  // SAP HANA Cloud & MCP Integration
  getHanaStatus: () => request<{ config: any; connection: any; totalDatasets: number }>('/admin/hana-status'),
  getHanaSchema: () => request<{ sql: string; schema: string }>('/admin/hana-schema'),
  getHanaDatasets: () => request<{ datasets: any[]; totalDatasets: number; schema: string }>('/admin/hana-datasets'),
  getHanaExportDump: () => request<{ sql: string }>('/admin/hana-export-dump'),
  testHanaConnection: () => request<{ success: boolean; latencyMs?: number; message: string }>('/admin/hana-test-connection', { method: 'POST' }),
  getHanaLiveTables: () => request<{ tables: Array<{ name: string; recordCount: number }>; views: string[] }>('/admin/hana-live-tables'),
  syncHana: () => request<{ success: boolean; message: string; tablesSynced: number; recordsSynced: number }>('/admin/hana-sync', { method: 'POST' }),
};

