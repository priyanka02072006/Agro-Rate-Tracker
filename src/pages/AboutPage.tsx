import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
  Database,
  Cpu,
  RefreshCw,
  TrendingUp,
  Truck,
  Scale,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900">
          {t('nav.about')}
        </h1>
        <p className="text-xs text-neutral-500">
          System architecture, mathematical models, official government data sources, and transparency declarations
        </p>
      </div>

      {/* Purpose & Overview */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs space-y-3 text-xs leading-relaxed text-neutral-700">
        <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-800" />
          <span>Purpose of Agro Rate Tracker</span>
        </h2>
        <p>
          <strong>Agro Rate Tracker</strong> is a unified agricultural market-intelligence platform AND
          farmer-to-customer deal marketplace for India. It addresses the systemic information asymmetry
          in Indian mandis by providing daily factual market rates, multi-factor transparent deal matching,
          and robust statistical forecasting.
        </p>
        <p>
          The system operates on two interconnected layers:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200">
            <strong className="text-emerald-900 block mb-1">(A) Market Intelligence Layer</strong>
            Near-real-time daily mandi prices with debounced multi-field search, cascading state-district-mandi
            filters, price spread comparisons, Holt-Winters price forecasting with confidence bands, IQR anomaly
            detection, and threshold alerts.
          </div>
          <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200">
            <strong className="text-emerald-900 block mb-1">(B) Deal Marketplace Layer</strong>
            Direct farmer harvest listings, buyer requirement matching with transparent scoring, atomic
            inventory reservations with mutex row-locking, and milestone logistics tracking.
          </div>
        </div>
      </div>

      {/* Data Ingestion Pipeline & Government Sources */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs space-y-3 text-xs leading-relaxed text-neutral-700">
        <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-800" />
          <span>Official Data Sources & Cadence</span>
        </h2>
        <p>
          <strong>Primary Live Source:</strong> Ministry of Agriculture & Farmers Welfare, Directorate of
          Marketing & Inspection (DMI) via Government of India Open Data API (data.gov.in).
        </p>
        <p>
          <strong>Update Cadence:</strong> Updated <em>daily</em> (default 16:00 IST) as APMC mandis report
          daily arrivals. The feed is strictly labeled everywhere as <strong>Near-real-time: updated daily from Agmarknet</strong>.
          It is never misrepresented as instantaneous tick-by-tick financial market data.
        </p>
        <p>
          <strong>Validation Pipeline:</strong> Every record is checked for missing commodity/state fields, valid
          ISO dates, non-negative numerical prices, and logical invariants (min &le; modal &le; max). Rows violating
          validation are rejected and logged in the ingestion audit trail.
        </p>
      </div>

      {/* Algorithms: Matching, Forecasting, Anomaly Detection */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs space-y-4 text-xs leading-relaxed text-neutral-700">
        <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-emerald-800" />
          <span>Algorithms & Methodologies</span>
        </h2>

        <div className="space-y-3">
          <div className="border-l-2 border-emerald-800 pl-3">
            <h3 className="font-bold text-neutral-900">1. Transparent Multi-Factor Matching Algorithm</h3>
            <p className="mt-0.5">
              Evaluates candidates using normalized weights: Price (30%), Proximity (25%), Quantity fit (15%),
              Availability window (15%), and Delivery feasibility (15%). Distance is computed via the Haversine
              formula between district centroids. Landed cost is transparently calculated as:
              <br />
              <code className="bg-neutral-100 px-1 py-0.5 rounded text-[11px] font-mono mt-1 inline-block">
                Total Landed Cost = (Quantity × Unit Price) + [Base Fee + (Per-km-per-tonne Rate × Distance × Tonnes)]
              </code>
            </p>
          </div>

          <div className="border-l-2 border-emerald-800 pl-3">
            <h3 className="font-bold text-neutral-900">2. Holt-Winters Price Forecasting</h3>
            <p className="mt-0.5">
              Evaluates series length dynamically: &ge; 30 daily points triggers Holt-Winters exponential smoothing
              with day-of-week seasonality; 10–29 points triggers single exponential smoothing; &lt; 10 points
              suppresses prediction with an explanatory notice. Outputs 7-day projection, 95% confidence bounds,
              and backtest MAPE error.
            </p>
          </div>

          <div className="border-l-2 border-emerald-800 pl-3">
            <h3 className="font-bold text-neutral-900">3. IQR Statistical Anomaly Detection</h3>
            <p className="mt-0.5">
              Non-parametric IQR fences detect price spikes or collapses outside [Q1 - 1.5×IQR, Q3 + 1.5×IQR]
              across mandi series with at least 8 recorded sessions. Classifies anomalies into Low, Medium, and High
              severity without speculating on underlying causes.
            </p>
          </div>
        </div>
      </div>

      {/* Honest Declarations & System Limitations */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs space-y-3 text-xs leading-relaxed text-neutral-700">
        <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-700" />
          <span>Honesty Declarations & Prototype Limitations</span>
        </h2>
        <ul className="list-disc pl-4 space-y-1.5 text-neutral-600">
          <li>
            <strong>Daily Cadence:</strong> Government mandi arrivals update once per day; prices do not fluctuate second-by-second.
          </li>
          <li>
            <strong>Forecasts are Estimates:</strong> Price projections are mathematical trends based on past arrivals and are explicitly labeled as estimates, not guaranteed prices.
          </li>
          <li>
            <strong>Approximate Distances:</strong> Distances and logistics estimates are based on district centroid Haversine calculations.
          </li>
          <li>
            <strong>Demo Data Identification:</strong> All seed marketplace farmers and orders are clearly marked with a "Demo data" badge.
          </li>
          <li>
            <strong>No In-App Payment Gateway:</strong> Real payment processing (UPI/Escrow) is omitted from this prototype; deals lock stock and track physical delivery milestones directly.
          </li>
        </ul>
      </div>
    </div>
  );
};
