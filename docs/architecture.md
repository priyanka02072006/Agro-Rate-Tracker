# Agro Rate Tracker — Architecture, Engineering & Methodology Specification

## 1. Abstract
**Agro Rate Tracker** is a full-stack agricultural market intelligence system and direct farmer-to-customer deal marketplace engineered for India. Powered by a daily-refreshed Agmarknet mandi price feed from the Government of India Open Data API (data.gov.in), the platform delivers dual capabilities: (A) transparent, near-real-time price transparency with statistical anomaly detection and Holt-Winters price forecasting, and (B) a direct deal marketplace connecting farmers to buyers with multi-factor candidate matching, atomic transaction reservations, and milestone logistics tracking.

---

## 2. Problem Statement & Existing vs Proposed System
### Existing System
- **Severe Information Asymmetry:** Smallholder farmers rely on verbal quotes from local commission agents and middlemen, capturing as little as 25–40% of consumer spend.
- **Fragmented Data Access:** Agmarknet data is scattered across legacy portals without localized search, forecasting, anomaly alerts, or mobile optimization.
- **Disconnected Markets:** No direct transactional bridge exists between price discovery and trade execution; buyers and farmers cannot execute transparent, weight-based deals.

### Proposed System
- **Unified Intelligence & Marketplace:** Near-real-time mandi arrivals directly feed a direct-sale marketplace where buyers can submit requirements and lock deals with verified local growers.
- **Algorithmic Honesty:** Factual statistical indicators replace speculative guarantees. Price forecasts include 95% confidence intervals and backtest MAPE accuracy; distances and delivery costs are transparently estimated.
- **Multilingual PWA:** Full offline accessibility for low-bandwidth rural connectivity with English, Hindi, and Tamil support, voice search, and progressive caching.

---

## 3. System Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                            CLIENT TIER (PWA / React 19)                            |
|  - Offline Shell & Service Worker Cache (vite-plugin-pwa)                         |
|  - Responsive Dashboards & Tabular Numerals (Tailwind CSS, Lucide, Recharts)      |
|  - Trilingual i18n (EN / HI / TA) + Web Speech API Voice Search                   |
|  - Role-Guarded Hubs: Farmer Hub, Find Produce, Trader Analytics, Admin Panel     |
+-----------------------------------------------------------------------------------+
                                         │  HTTP / REST (JSON)
                                         ▼
+-----------------------------------------------------------------------------------+
|                        APPLICATION SERVER (Node.js / Express)                     |
|  ├── Ingestion Engine (Scheduled 16:00 IST Cron + Manual Trigger)                  |
|  ├── Pluggable Source Adapters: AgmarknetApiAdapter & CsvAdapter                  |
|  ├── Data Validation Pipeline: Logical Invariants & ISO Normalization             |
|  ├── Multi-Factor Matching Algorithm (Haversine Distance + Normalized Weights)    |
|  ├── Time-Series Forecasting (Holt-Winters Double Exponential Smoothing)          |
|  ├── Anomaly Detection (Non-parametric IQR Fences & Deviation Severity)           |
|  └── Transactional Mutex Manager (Atomic Row-Locking on Listing Stock)            |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                             DATA LAYER (ACID JSON Store)                          |
|  - Agro Prices (Natural key indexed: crop|state|district|market|variety|date)    |
|  - District Centroids (Geographic lookup for Indian agricultural districts)       |
|  - Profiles, Farmer Listings, Customer Requirements, Deal Proposals               |
|  - Purchase Orders, Order Events Timeline, Price Alerts, Ingestion Audit Logs     |
+-----------------------------------------------------------------------------------+
```

---

## 4. Database Design (Entity Relationships)

```
 [Profile] (1) ───────────< (N) [FarmerListing]
     │                                │ (1)
     │ (1)                            │
     │                                ▼ (N)
     ├───< (N) [CustomerRequirement] ──> [DealProposal] (N) ───> (1) [Order]
     │                                                                  │ (1)
     ├───< (N) [PriceAlert]                                             ▼ (N)
     ├───< (N) [WatchlistItem]                                     [OrderEvent]
     └───< (N) [Notification]

 [AgroPrice]  (Natural Key: crop + state + district + market + variety + grade + arrival_date)
 [DistrictCentroid] (state, district, latitude, longitude)
 [IngestionLog] (run_at, total_rows, accepted, rejected, status, duration_ms)
```

---

## 5. Core Algorithms & Methodologies

### 5.1 Multi-Factor Matching Algorithm
When a buyer submits a requirement $(c, q, u, D_{state}, D_{dist}, t_{req}, B_{max})$, candidate farmer listings are filtered by hard constraints:
1. $crop = c$
2. $status = active$
3. $q_{available} \ge q$
4. $avail_{from} \le t_{req} \le avail_{until}$
5. $P_{unit} \le B_{max}$ (if budget specified)
6. $farmer\_id \notin rejected\_farmer\_ids$

Each candidate is then scored from $0$ to $100$ using min-max normalization across eligible candidates:
$$\text{Score} = \frac{w_p \cdot S_{price} + w_d \cdot S_{dist} + w_q \cdot S_{qty} + w_a \cdot S_{avail} + w_f \cdot S_{feas}}{w_p + w_d + w_q + w_a + w_f}$$

Where defaults are:
- $w_p = 30$ (Price competitiveness: lower asking price relative to candidates scores higher)
- $w_d = 25$ (Proximity: Haversine distance between district centroids)
- $w_q = 15$ (Quantity fit: closer stock-to-order ratio minimizes waste)
- $w_a = 15$ (Availability buffer: days before deadline)
- $w_f = 15$ (Transit feasibility: transit time over distance)

Landed delivery cost is estimated using:
$$\text{Delivery Cost} = \text{Base Fee} + (\text{Per-km-per-tonne Rate} \times \text{Distance (km)} \times \text{Tonnes})$$

### 5.2 Holt-Winters Price Forecasting
Evaluates historical series length $N$:
- **$N \ge 30$ daily points:** Holt-Winters double exponential smoothing with day-of-week seasonality dampening:
  $$L_t = \alpha Y_t + (1 - \alpha)(L_{t-1} + T_{t-1})$$
  $$T_t = \beta (L_t - L_{t-1}) + (1 - \beta) T_{t-1}$$
  $$\hat{Y}_{t+h} = L_t + h T_t + S_{dow}$$
- **$10 \le N < 30$ daily points:** Single exponential smoothing with Holt trend.
- **$N < 10$ points:** Forecast suppressed with message: *"Prediction is unavailable because insufficient historical data is available."*
- **Uncertainty Bounds:** $95\%$ confidence interval computed using residual standard error scaled by $\sqrt{h}$.
- **Backtest Validation:** Evaluates Mean Absolute Percentage Error (MAPE) against a 5-day holdout testing set.

### 5.3 Non-Parametric IQR Anomaly Detection
Detects sudden price shocks without assuming normal distribution:
1. Computes First Quartile ($Q_1$), Median, and Third Quartile ($Q_3$).
2. Interquartile Range $IQR = Q_3 - Q_1$.
3. Fences: $\text{Lower} = \max(0, Q_1 - 1.5 \times IQR)$, $\text{Upper} = Q_3 + 1.5 \times IQR$.
4. A record is flagged if $P_{modal} < \text{Lower}$ or $P_{modal} > \text{Upper}$.
5. Severity is assigned by percentage divergence: **High** ($>35\%$), **Medium** ($15\%–35\%$), or **Low** ($<15\%$).

---

## 6. Concurrency & Mutex Locking Strategy
To prevent overselling race conditions when multiple buyers attempt to accept the same farmer's lot:
```typescript
await db.withListingLock(listingId, async () => {
  if (listing.quantity_available < proposal.quantity) {
    throw new Error('Insufficient inventory: another buyer accepted the remaining stock.');
  }
  listing.quantity_available -= proposal.quantity;
  if (listing.quantity_available === 0) listing.status = 'sold_out';
  // create order, update proposal to accepted
});
```

---

## 7. Data Provenance & Honesty Rules
1. **Mandi Prices:** Near-real-time (daily updates from Agmarknet); never described as live ticks.
2. **Forecasts:** Explicitly marked "Estimate, not guaranteed".
3. **Logistics:** Labeled "Approximate distance" and "Delivery cost estimate".
4. **Marketplace:** Seed farmers and mock listings are badged "Demo data".
5. **No Payments:** "Payment integration not included in this prototype" clearly stated.
