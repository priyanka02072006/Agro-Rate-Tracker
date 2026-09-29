import { AgroPrice } from '../types.js';

interface CropBaseConfig {
  crop: string;
  variety: string;
  grade: string;
  baseMin: number;
  baseMax: number;
  baseModal: number;
  volatility: number;
  markets: Array<{
    state: string;
    district: string;
    market: string;
    priceOffsetPct: number;
  }>;
}

const CROP_CONFIGS: CropBaseConfig[] = [
  {
    crop: 'Tomato',
    variety: 'Hybrid / Deshi',
    grade: 'FAQ',
    baseMin: 1800,
    baseMax: 2600,
    baseModal: 2200,
    volatility: 0.12,
    markets: [
      { state: 'Tamil Nadu', district: 'Dindigul', market: 'Ottanchatram', priceOffsetPct: -0.04 },
      { state: 'Tamil Nadu', district: 'Krishnagiri', market: 'Rayakottai', priceOffsetPct: -0.02 },
      { state: 'Tamil Nadu', district: 'Chennai', market: 'Koyambedu', priceOffsetPct: 0.15 },
      { state: 'Tamil Nadu', district: 'Salem', market: 'Salem Market', priceOffsetPct: 0.02 },
      { state: 'Tamil Nadu', district: 'Coimbatore', market: 'Mettupalayam', priceOffsetPct: 0.05 },
      { state: 'Karnataka', district: 'Kolar', market: 'Kolar Mandi', priceOffsetPct: -0.06 },
      { state: 'Karnataka', district: 'Bangalore Urban', market: 'Yeshwanthpur', priceOffsetPct: 0.10 },
      { state: 'Maharashtra', district: 'Nashik', market: 'Pimpalgaon', priceOffsetPct: -0.03 },
      { state: 'Maharashtra', district: 'Pune', market: 'Gultekdi Pune', priceOffsetPct: 0.08 },
      { state: 'NCT of Delhi', district: 'Delhi', market: 'Azadpur', priceOffsetPct: 0.20 },
    ],
  },
  {
    crop: 'Onion',
    variety: 'Nasik Red / Medium',
    grade: 'FAQ',
    baseMin: 2200,
    baseMax: 3100,
    baseModal: 2650,
    volatility: 0.08,
    markets: [
      { state: 'Maharashtra', district: 'Nashik', market: 'Lasalgaon', priceOffsetPct: -0.08 },
      { state: 'Maharashtra', district: 'Ahmednagar', market: 'Rahata', priceOffsetPct: -0.05 },
      { state: 'Maharashtra', district: 'Pune', market: 'Gultekdi Pune', priceOffsetPct: 0.05 },
      { state: 'Maharashtra', district: 'Mumbai', market: 'Vashi APMC', priceOffsetPct: 0.14 },
      { state: 'Karnataka', district: 'Hubballi-Dharwad', market: 'Hubli APMC', priceOffsetPct: 0.02 },
      { state: 'Tamil Nadu', district: 'Dindigul', market: 'Dindigul Mandi', priceOffsetPct: 0.09 },
      { state: 'Tamil Nadu', district: 'Chennai', market: 'Koyambedu', priceOffsetPct: 0.18 },
      { state: 'Gujarat', district: 'Mehsana', market: 'Mehsana Mandi', priceOffsetPct: -0.02 },
      { state: 'NCT of Delhi', district: 'Delhi', market: 'Azadpur', priceOffsetPct: 0.16 },
    ],
  },
  {
    crop: 'Potato',
    variety: 'Jyoti / Chipsona',
    grade: 'FAQ',
    baseMin: 1400,
    baseMax: 1950,
    baseModal: 1680,
    volatility: 0.04,
    markets: [
      { state: 'Uttar Pradesh', district: 'Agra', market: 'Agra Mandi', priceOffsetPct: -0.09 },
      { state: 'Uttar Pradesh', district: 'Kanpur', market: 'Kanpur Grain', priceOffsetPct: -0.04 },
      { state: 'Punjab', district: 'Jalandhar', market: 'Jalandhar City', priceOffsetPct: -0.06 },
      { state: 'West Bengal', district: 'Hooghly', market: 'Sheoraphuli', priceOffsetPct: -0.05 },
      { state: 'NCT of Delhi', district: 'Delhi', market: 'Azadpur', priceOffsetPct: 0.12 },
      { state: 'Maharashtra', district: 'Mumbai', market: 'Vashi APMC', priceOffsetPct: 0.15 },
      { state: 'Tamil Nadu', district: 'Chennai', market: 'Koyambedu', priceOffsetPct: 0.22 },
      { state: 'Karnataka', district: 'Bangalore Urban', market: 'Yeshwanthpur', priceOffsetPct: 0.14 },
    ],
  },
  {
    crop: 'Wheat',
    variety: 'Sharbati / Lokwan',
    grade: 'FAQ',
    baseMin: 2350,
    baseMax: 2900,
    baseModal: 2600,
    volatility: 0.03,
    markets: [
      { state: 'Madhya Pradesh', district: 'Indore', market: 'Indore APMC', priceOffsetPct: 0.04 },
      { state: 'Madhya Pradesh', district: 'Ujjain', market: 'Ujjain Mandi', priceOffsetPct: 0.01 },
      { state: 'Punjab', district: 'Ludhiana', market: 'Ludhiana Mandi', priceOffsetPct: -0.05 },
      { state: 'Punjab', district: 'Amritsar', market: 'Amritsar Grain', priceOffsetPct: -0.04 },
      { state: 'Haryana', district: 'Karnal', market: 'Karnal Grain', priceOffsetPct: -0.03 },
      { state: 'Rajasthan', district: 'Kota', market: 'Kota Mandi', priceOffsetPct: 0.02 },
      { state: 'Uttar Pradesh', district: 'Bareilly', market: 'Bareilly Mandi', priceOffsetPct: -0.06 },
      { state: 'NCT of Delhi', district: 'Delhi', market: 'Narela Mandi', priceOffsetPct: 0.08 },
    ],
  },
  {
    crop: 'Rice (Paddy)',
    variety: 'Sona Masoori / Basmati / Ponni',
    grade: 'FAQ',
    baseMin: 2200,
    baseMax: 3400,
    baseModal: 2850,
    volatility: 0.03,
    markets: [
      { state: 'Andhra Pradesh', district: 'Guntur', market: 'Guntur APMC', priceOffsetPct: 0.02 },
      { state: 'Andhra Pradesh', district: 'Krishna', market: 'Vijayawada Mandi', priceOffsetPct: 0.04 },
      { state: 'Tamil Nadu', district: 'Thanjavur', market: 'Thanjavur Mandi', priceOffsetPct: -0.03 },
      { state: 'Tamil Nadu', district: 'Tiruchirappalli', market: 'Trichy Market', priceOffsetPct: 0.01 },
      { state: 'Punjab', district: 'Patiala', market: 'Patiala Mandi', priceOffsetPct: 0.12 },
      { state: 'Haryana', district: 'Karnal', market: 'Karnal Basmati', priceOffsetPct: 0.20 },
      { state: 'West Bengal', district: 'Burdwan', market: 'Burdwan Sadar', priceOffsetPct: -0.05 },
    ],
  },
  {
    crop: 'Green Chilli',
    variety: 'G4 / Jwala',
    grade: 'FAQ',
    baseMin: 3200,
    baseMax: 4800,
    baseModal: 4100,
    volatility: 0.15,
    markets: [
      { state: 'Andhra Pradesh', district: 'Guntur', market: 'Guntur Mirchi Yard', priceOffsetPct: -0.10 },
      { state: 'Karnataka', district: 'Haveri', market: 'Byadgi APMC', priceOffsetPct: -0.06 },
      { state: 'Tamil Nadu', district: 'Theni', market: 'Theni Mandi', priceOffsetPct: -0.02 },
      { state: 'Tamil Nadu', district: 'Chennai', market: 'Koyambedu', priceOffsetPct: 0.18 },
      { state: 'Maharashtra', district: 'Nagpur', market: 'Nagpur Cotton & Veg', priceOffsetPct: 0.08 },
    ],
  },
  {
    crop: 'Cotton',
    variety: 'Medium / Long Staple',
    grade: 'FAQ',
    baseMin: 6800,
    baseMax: 7900,
    baseModal: 7400,
    volatility: 0.04,
    markets: [
      { state: 'Gujarat', district: 'Rajkot', market: 'Rajkot APMC', priceOffsetPct: 0.02 },
      { state: 'Maharashtra', district: 'Amravati', market: 'Amravati APMC', priceOffsetPct: -0.01 },
      { state: 'Telangana', district: 'Warangal', market: 'Warangal Enamamula', priceOffsetPct: 0.01 },
      { state: 'Punjab', district: 'Bathinda', market: 'Bathinda Mandi', priceOffsetPct: 0.03 },
    ],
  },
  {
    crop: 'Mustard',
    variety: 'Yellow / Black',
    grade: 'FAQ',
    baseMin: 5100,
    baseMax: 5900,
    baseModal: 5550,
    volatility: 0.03,
    markets: [
      { state: 'Rajasthan', district: 'Jaipur', market: 'Jaipur Grain APMC', priceOffsetPct: 0.02 },
      { state: 'Rajasthan', district: 'Alwar', market: 'Alwar Mandi', priceOffsetPct: -0.02 },
      { state: 'Haryana', district: 'Hisar', market: 'Hisar Mandi', priceOffsetPct: -0.01 },
      { state: 'Madhya Pradesh', district: 'Bhopal', market: 'Karond Mandi', priceOffsetPct: 0.01 },
    ],
  },
  {
    crop: 'Banana',
    variety: 'Robusta / G9',
    grade: 'FAQ',
    baseMin: 1200,
    baseMax: 1850,
    baseModal: 1550,
    volatility: 0.05,
    markets: [
      { state: 'Tamil Nadu', district: 'Tiruchirappalli', market: 'Trichy Central', priceOffsetPct: -0.06 },
      { state: 'Maharashtra', district: 'Jalgaon', market: 'Jalgaon Banana Mandi', priceOffsetPct: -0.08 },
      { state: 'Kerala', district: 'Palakkad', market: 'Palakkad Mandi', priceOffsetPct: 0.08 },
      { state: 'Gujarat', district: 'Surat', market: 'Surat APMC', priceOffsetPct: 0.04 },
    ],
  },
  {
    crop: 'Turmeric',
    variety: 'Finger / Salem / Nizamabad',
    grade: 'FAQ',
    baseMin: 12500,
    baseMax: 15800,
    baseModal: 14200,
    volatility: 0.05,
    markets: [
      { state: 'Tamil Nadu', district: 'Erode', market: 'Erode Turmeric Market', priceOffsetPct: 0.03 },
      { state: 'Tamil Nadu', district: 'Salem', market: 'Salem APMC', priceOffsetPct: 0.02 },
      { state: 'Telangana', district: 'Nizamabad', market: 'Nizamabad Mandi', priceOffsetPct: -0.02 },
      { state: 'Maharashtra', district: 'Sangli', market: 'Sangli Turmeric Yard', priceOffsetPct: 0.01 },
    ],
  },
];

// Generate 40 daily arrival dates ending at current reference date: 2026-09-28
export function generateSeedData(): AgroPrice[] {
  const records: AgroPrice[] = [];
  const baseDate = new Date('2026-09-28T00:00:00Z');
  const DAYS_COUNT = 40;

  let rowId = 1;

  for (const config of CROP_CONFIGS) {
    for (const mkt of config.markets) {
      for (let dayOffset = DAYS_COUNT - 1; dayOffset >= 0; dayOffset--) {
        const currentDate = new Date(baseDate);
        currentDate.setUTCDate(baseDate.getUTCDate() - dayOffset);
        const arrivalDate = currentDate.toISOString().split('T')[0];

        // Wave trend + market offset + day-of-week oscillation
        const dayOfWeek = currentDate.getUTCDay(); // 0 is Sunday
        const weekendFactor = dayOfWeek === 0 ? 0.98 : dayOfWeek === 6 ? 1.02 : 1.0;

        // Progressive 40-day trend with gentle cycles
        const cycleFactor = Math.sin((DAYS_COUNT - dayOffset) * 0.25) * config.volatility;
        const trendSlope = ((DAYS_COUNT - dayOffset) / DAYS_COUNT) * 0.05; // slight 5% upward/seasonal tilt

        let modalPrice = Math.round(
          config.baseModal *
            (1 + mkt.priceOffsetPct) *
            (1 + cycleFactor + trendSlope) *
            weekendFactor
        );

        // Inject intentional real-world anomalies for testing Anomaly Detection:
        // Day 8 before today for Tomato in Rayakottai experienced monsoon surge
        if (config.crop === 'Tomato' && mkt.market === 'Rayakottai' && dayOffset === 6) {
          modalPrice = Math.round(modalPrice * 1.62); // High anomaly spike (+62%)
        }
        // Day 14 before today for Onion in Lasalgaon experienced sudden drop
        if (config.crop === 'Onion' && mkt.market === 'Lasalgaon' && dayOffset === 12) {
          modalPrice = Math.round(modalPrice * 0.72); // Low anomaly drop (-28%)
        }

        const spreadPct = 0.12; // 12% min to max spread around modal
        const minPrice = Math.round(modalPrice * (1 - spreadPct / 2));
        const maxPrice = Math.round(modalPrice * (1 + spreadPct / 2));

        records.push({
          id: `AGRO-${rowId++}`,
          crop: config.crop,
          state: mkt.state,
          district: mkt.district,
          market: mkt.market,
          variety: config.variety,
          grade: config.grade,
          arrival_date: arrivalDate,
          min_price: minPrice,
          max_price: maxPrice,
          modal_price: modalPrice,
          source: 'csv_seed',
          ingested_at: '2026-09-28T05:00:00.000Z',
        });
      }
    }
  }

  return records;
}
