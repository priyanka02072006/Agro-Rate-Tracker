import { AgroPrice, IngestionLog } from '../types.js';
import { db } from '../db.js';

export interface RawPriceRecord {
  crop?: string;
  state?: string;
  district?: string;
  market?: string;
  variety?: string;
  grade?: string;
  arrival_date?: string;
  min_price?: any;
  max_price?: any;
  modal_price?: any;
}

export interface ValidationResult {
  valid: boolean;
  cleanRecord?: AgroPrice;
  reason?: string;
}

export interface SourceAdapter {
  name: 'agmarknet_api' | 'csv_seed';
  isConfigured(): boolean;
  fetchData(): Promise<RawPriceRecord[]>;
}

export class AgmarknetApiAdapter implements SourceAdapter {
  name = 'agmarknet_api' as const;

  isConfigured(): boolean {
    return Boolean(process.env.DATA_GOV_IN_API_KEY && process.env.DATA_GOV_IN_API_KEY.trim() !== '');
  }

  async fetchData(): Promise<RawPriceRecord[]> {
    if (!this.isConfigured()) {
      throw new Error('DATA_GOV_IN_API_KEY is not configured in server environment.');
    }

    const apiKey = process.env.DATA_GOV_IN_API_KEY!;
    const resourceId =
      process.env.DATA_GOV_IN_RESOURCE_ID || '9ef84268-d588-465a-a308-a864a43d0070';
    const limit = 200;
    const url = `https://api.data.gov.in/resource/${resourceId}?api-key=${encodeURIComponent(apiKey)}&format=json&limit=${limit}`;

    // Retry with backoff
    let attempts = 0;
    const maxAttempts = 3;
    let delay = 1000;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        const res = await fetch(url, { headers: { 'User-Agent': 'AgroRateTracker/1.0' } });
        if (!res.ok) {
          throw new Error(`data.gov.in responded with HTTP ${res.status}: ${res.statusText}`);
        }
        const json = await res.json();
        const records = json.records || [];
        return records.map((r: any) => ({
          crop: r.commodity || r.Commodity,
          state: r.state || r.State,
          district: r.district || r.District,
          market: r.market || r.Market,
          variety: r.variety || r.Variety || 'FAQ',
          grade: r.grade || r.Grade || 'FAQ',
          arrival_date: r.arrival_date || r.Arrival_Date,
          min_price: r.min_price || r.Min_Price,
          max_price: r.max_price || r.Max_Price,
          modal_price: r.modal_price || r.Modal_Price,
        }));
      } catch (err: any) {
        if (attempts >= maxAttempts) throw err;
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
      }
    }

    return [];
  }
}

export class CsvAdapter implements SourceAdapter {
  name = 'csv_seed' as const;

  isConfigured(): boolean {
    return true;
  }

  async fetchData(): Promise<RawPriceRecord[]> {
    // For CSV sync or re-import, we generate/read the standard 2,700+ record Agmarknet feed
    // Returns fresh daily simulated feed for demonstration
    const now = new Date('2026-09-28T05:00:00Z');
    const todayStr = now.toISOString().split('T')[0];

    const currentPrices = db.agroPrices.filter((p) => p.arrival_date === todayStr);
    if (currentPrices.length > 0) {
      return currentPrices.map((p) => ({
        crop: p.crop,
        state: p.state,
        district: p.district,
        market: p.market,
        variety: p.variety,
        grade: p.grade,
        arrival_date: p.arrival_date,
        min_price: p.min_price,
        max_price: p.max_price,
        modal_price: p.modal_price,
      }));
    }

    // Default sample records if empty
    return [
      {
        crop: 'Tomato',
        state: 'Tamil Nadu',
        district: 'Dindigul',
        market: 'Ottanchatram',
        variety: 'Hybrid / Deshi',
        grade: 'FAQ',
        arrival_date: todayStr,
        min_price: 2000,
        max_price: 2400,
        modal_price: 2200,
      },
      {
        crop: 'Onion',
        state: 'Maharashtra',
        district: 'Nashik',
        market: 'Lasalgaon',
        variety: 'Nasik Red / Medium',
        grade: 'FAQ',
        arrival_date: todayStr,
        min_price: 2300,
        max_price: 2900,
        modal_price: 2600,
      },
    ];
  }
}

export function validatePriceRecord(raw: RawPriceRecord, source: 'agmarknet_api' | 'csv_seed'): ValidationResult {
  // Check missing crop or state
  if (!raw.crop || typeof raw.crop !== 'string' || raw.crop.trim() === '') {
    return { valid: false, reason: 'Missing commodity/crop name' };
  }
  if (!raw.state || typeof raw.state !== 'string' || raw.state.trim() === '') {
    return { valid: false, reason: 'Missing state name' };
  }
  if (!raw.district || typeof raw.district !== 'string' || raw.district.trim() === '') {
    return { valid: false, reason: 'Missing district name' };
  }
  if (!raw.market || typeof raw.market !== 'string' || raw.market.trim() === '') {
    return { valid: false, reason: 'Missing market name' };
  }

  // Arrival Date validation
  if (!raw.arrival_date || typeof raw.arrival_date !== 'string') {
    return { valid: false, reason: 'Missing arrival date' };
  }

  let formattedDate = raw.arrival_date.trim();
  // Handle DD/MM/YYYY or DD-MM-YYYY or YYYY-MM-DD
  if (/^\d{2}[/-]\d{2}[/-]\d{4}$/.test(formattedDate)) {
    const parts = formattedDate.split(/[/-]/);
    formattedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(formattedDate)) {
    return { valid: false, reason: `Invalid date format: ${raw.arrival_date}` };
  }

  const d = new Date(formattedDate);
  if (isNaN(d.getTime())) {
    return { valid: false, reason: `Unparseable date: ${raw.arrival_date}` };
  }

  // Price validation
  const min = Number(raw.min_price);
  const max = Number(raw.max_price);
  const modal = Number(raw.modal_price);

  if (isNaN(min) || isNaN(max) || isNaN(modal)) {
    return { valid: false, reason: 'Non-numeric price values provided' };
  }
  if (min < 0 || max < 0 || modal < 0) {
    return { valid: false, reason: 'Negative price values are prohibited' };
  }
  if (min > max) {
    return { valid: false, reason: `Min price (${min}) cannot exceed Max price (${max})` };
  }
  if (modal < min || modal > max) {
    return { valid: false, reason: `Modal price (${modal}) must lie within [min: ${min}, max: ${max}]` };
  }

  const cleanRecord: AgroPrice = {
    id: `AGRO-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    crop: raw.crop.trim(),
    state: raw.state.trim(),
    district: raw.district.trim(),
    market: raw.market.trim(),
    variety: (raw.variety || 'FAQ').trim(),
    grade: (raw.grade || 'FAQ').trim(),
    arrival_date: formattedDate,
    min_price: Math.round(min),
    max_price: Math.round(max),
    modal_price: Math.round(modal),
    source,
    ingested_at: new Date().toISOString(),
  };

  return { valid: true, cleanRecord };
}

export class IngestionService {
  private apiAdapter = new AgmarknetApiAdapter();
  private csvAdapter = new CsvAdapter();

  async runSync(requestedSource?: 'agmarknet_api' | 'csv_seed'): Promise<IngestionLog> {
    const startTime = Date.now();
    const source: 'agmarknet_api' | 'csv_seed' =
      requestedSource || (this.apiAdapter.isConfigured() ? 'agmarknet_api' : 'csv_seed');

    const adapter = source === 'agmarknet_api' ? this.apiAdapter : this.csvAdapter;

    let rawRecords: RawPriceRecord[] = [];
    const reasonSummary: Record<string, number> = {};
    const rejectedSamples: Array<{ row: any; reason: string }> = [];

    try {
      rawRecords = await adapter.fetchData();
    } catch (err: any) {
      const duration_ms = Date.now() - startTime;
      db.lastSyncStatus = 'failed';
      const failedLog: IngestionLog = {
        id: `log-${Date.now()}`,
        source,
        run_at: new Date().toISOString(),
        total_rows: 0,
        accepted: 0,
        rejected: 0,
        reason_summary: { [err.message || 'Fetch failed']: 1 },
        status: 'failed',
        duration_ms,
      };
      db.ingestionLogs.unshift(failedLog);
      db.persist();
      return failedLog;
    }

    const validRecords: AgroPrice[] = [];
    let rejectedCount = 0;

    for (const raw of rawRecords) {
      const res = validatePriceRecord(raw, source);
      if (res.valid && res.cleanRecord) {
        validRecords.push(res.cleanRecord);
      } else {
        rejectedCount++;
        const r = res.reason || 'Unknown validation failure';
        reasonSummary[r] = (reasonSummary[r] || 0) + 1;
        if (rejectedSamples.length < 5) {
          rejectedSamples.push({ row: raw, reason: r });
        }
      }
    }

    const { accepted, updated } = db.upsertPrices(validRecords);
    const duration_ms = Date.now() - startTime;

    db.lastSyncAt = new Date().toISOString();
    db.lastSyncStatus = 'synced';

    const log: IngestionLog = {
      id: `log-${Date.now()}`,
      source,
      run_at: db.lastSyncAt,
      total_rows: rawRecords.length,
      accepted: accepted + updated,
      rejected: rejectedCount,
      reason_summary: reasonSummary,
      rejected_samples: rejectedSamples,
      status: rejectedCount === 0 ? 'success' : 'partial',
      duration_ms,
    };

    db.ingestionLogs.unshift(log);
    // Keep last 30 logs
    if (db.ingestionLogs.length > 30) {
      db.ingestionLogs = db.ingestionLogs.slice(0, 30);
    }
    db.persist();

    return log;
  }
}

export const ingestionService = new IngestionService();
