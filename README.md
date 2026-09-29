# 🌾 Agro Rate Tracker

> **Agricultural Market-Intelligence Platform & Farmer-to-Customer Deal Marketplace for India**  
> Powered by near-real-time daily Agmarknet mandi arrivals from the Government of India Open Data API.

---

## 🌟 Key Capabilities

### Layer A: Market Intelligence
- **Mandi Prices Explorer:** 2,700+ daily Agmarknet records across 10+ states and 30+ mandis with debounced server-side search, cascading State $\to$ District $\to$ Mandi filters, sortable columns, CSV export, and detail drawers with 10-day mini trends.
- **Multilingual Support & Voice Search:** Native English, Hindi (हिन्दी), and Tamil (தமிழ்) translations with browser Web Speech API voice search.
- **Price Comparison & Spreads:** Multi-entity bar charts comparing mandis, districts, or states against group averages.
- **Price Trends:** Multi-period line charts with min/max shaded bands across 7D, 30D, 90D, and All-Time horizons.
- **Top Movers:** 24-Hour and 7-Day top percentage gainers and decliners.
- **Holt-Winters Price Forecasting:** 7-day estimated price trends with 95% confidence bands and backtest MAPE accuracy metrics (labeled as *Estimate, not guaranteed*).
- **Statistical Anomaly Detection:** Non-parametric IQR fences detecting price shocks with High, Medium, and Low severity grading.
- **Threshold Price Alerts & Watchlist:** Daily evaluation alerts and unread notifications.
- **Installable PWA:** Full offline caching with service workers and visible offline banner.

### Layer B: Deal Marketplace
- **Farmer Produce Hub:** Produce listing wizard with real-time Agmarknet modal benchmark chips, stock status toggles (active/paused), and milestone logistics status management.
- **Customer Produce Finder:** Submit requirements (crop, quantity, destination, deadline) $\to$ automatic multi-factor candidate matching $\to$ top 3 candidate deal proposals.
- **Transparent Landed Cost:** Quantity $\times$ Price + Delivery Cost Estimate (Base fee + per-km-per-tonne formula) with distance calculated via Haversine.
- **Score Breakdown:** Transparent "Why this match?" breakdown (Price 30%, Proximity 25%, Quantity 15%, Availability 15%, Feasibility 15%).
- **Atomic Concurrency Protection:** Mutex row-locking on farmer listing stock prevents overselling when multiple buyers attempt to accept simultaneous deals.
- **Milestone Order Logistics:** 6-stage tracking timeline (*Confirmed $\to$ Packed $\to$ Dispatched $\to$ In Transit $\to$ Delivered $\to$ Completed*) with notes and customer delivery receipt confirmations.

---

## 📊 Summary: What is Real, Demo, and Estimated

| Layer / Feature | Classification | Details |
| :--- | :--- | :--- |
| **Mandi Price Feed** | **Real / Near-Real-Time** | Sourced daily from Agmarknet via data.gov.in (resource: Current Daily Price of Various Commodities from Various Markets). Daily cadence. |
| **Marketplace Farmers & Orders** | **Demo Data** | 15+ demo farmer profiles, listings, and orders to test the transactional workflow without impacting live commercial contracts. Clearly badged as `Demo data`. |
| **Price Forecasting** | **Statistical Estimate** | 7-day projection derived from Holt-Winters exponential smoothing. Clearly labeled as `Estimate, not guaranteed`. |
| **Distances & Logistics** | **Approximate Estimate** | Calculated using Haversine distance between official district centroids. |
| **Payments** | **Prototype Notice** | Real payments omitted; order confirmation atomically secures physical stock. |

---

## 🚀 Quickstart & Setup

### Option 1: Native Local Run
```bash
# 1. Install dependencies
npm install

# 2. Configure environment (add SUPABASE_URL, SUPABASE_ANON_KEY, and optional DATA_GOV_IN_API_KEY)
cp .env.example .env

# 3. Start development server (serves on port 3000)
npm run dev

# 4. Run automated test suite
npm test
```

### Supabase Cloud Database Configuration
1. In the **Secrets panel** of your Google AI Studio workspace or in your `.env` file, configure:
   - `SUPABASE_URL`: Your Supabase project URL (e.g. `https://xyzcompany.supabase.co`)
   - `SUPABASE_ANON_KEY`: Your Supabase anonymous public key (`eyJhbGciOi...`)
2. Run the provided `supabase_schema.sql` in your Supabase project's **SQL Editor** to create all tables (`agro_prices`, `profiles`, `farmer_listings`, `customer_requirements`, `deal_proposals`, `orders`, `notifications`, `price_alerts`) with Row Level Security (RLS) enabled.
3. Open the **Admin Console** in the web app and click **"Sync to Supabase"** to populate your cloud database with the current mandi prices and demo marketplace records.

### Option 2: Docker Containerization
```bash
# Build and run with Docker Compose
docker compose up --build
```
Open **http://localhost:3000** in your browser.

---

## 🧪 Demo Verification Walkthrough (Step-by-Step)

1. **Open App:** Launch the app at `http://localhost:3000`. The header displays the **Near-real-time Agmarknet** freshness pill and last sync timestamp.
2. **Explore Mandi Prices:** Click **Market Prices** in the sidebar. Search for "Tomato", filter State to "Tamil Nadu" and District to "Dindigul". Sort by modal price or click a row to view the 10-day mini trend drawer and click **Set Price Alert**.
3. **Voice Search:** Click the microphone icon in the search box to search by voice (English, Hindi, or Tamil).
4. **Compare Markets:** Click **Price Compare** to view grouped bar charts of Tomato prices across Ottanchatram, Rayakottai, and Koyambedu.
5. **Switch Language:** Select **தமிழ் (Tamil)** or **हिन्दी (Hindi)** in the top right header to inspect localized UI labels.
6. **Price Forecasting:** Navigate to **Price Forecast** for Tomato. View the projected 7-day trend with 95% confidence bands and backtest MAPE error.
7. **Detect Anomalies:** Visit **Price Anomalies** to inspect statistical IQR outlier alerts (such as the Rayakottai monsoon price surge).
8. **Find Produce (Buyer Workflow):**
   - Click **Find Produce**.
   - Submit requirement: Crop = `Tomato`, Quantity = `10 quintal`, State = `Tamil Nadu`, District = `Chennai`, Date = `2026-10-04`.
   - The matching engine finds candidate farmers. Examine the **Match Score** and click **Why this match?** to inspect the score breakdown.
   - Click **Decline** to trigger alternative farmer matching.
   - Click **Accept & Lock Deal** on the preferred candidate. Notice how inventory is atomically reserved and an order is confirmed.
9. **Logistics Tracking & Farmer Workflow:**
   - Switch persona to **Farmer: Ramesh Kumar** via the Quick Test Role switcher in the sidebar.
   - Under **Orders & Logistics**, view the confirmed order. Click **Update Logistics** to advance transit status to `Packed` or `Dispatched`.
   - Switch back to **Buyer: Priya Sharma** and view the updated tracking timeline in real-time. Click **Confirm Produce Receipt & Complete**.
10. **Admin Console & Ingestion Sync:**
    - Switch role to **Govt Mandi Admin** and open **Admin Console**.
    - View ingestion status, trigger manual **Sync Now**, adjust matching weights sliders, or configure delivery cost formulas.

---

## 🔒 Security & Concurrency Verification
- **ACID Inventory Mutex:** Verified via unit tests (`tests/backend.test.ts`). Concurrent acceptance attempts for the same limited stock result in exactly one successful order; the competing buyer is safely notified of insufficient remaining inventory.
- **Validation Pipeline:** Invalid dates, negative values, and non-conforming prices ($min > max$) are automatically rejected and recorded in the ingestion audit log.
