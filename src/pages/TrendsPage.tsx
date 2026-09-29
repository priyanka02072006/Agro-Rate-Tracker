import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  ComposedChart,
  Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

export const TrendsPage: React.FC = () => {
  const { t } = useTranslation();
  const { formatPrice } = useAuth();

  const [crop, setCrop] = useState('Tomato');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [market, setMarket] = useState('');
  const [range, setRange] = useState<'7D' | '30D' | '90D' | 'ALL'>('30D');

  const [filterOptions, setFilterOptions] = useState<{
    crops: string[];
    states: string[];
    districts: string[];
    markets: string[];
  }>({ crops: [], states: [], districts: [], markets: [] });

  const [trendResult, setTrendResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showHowToRead, setShowHowToRead] = useState(false);

  useEffect(() => {
    api.getFilterOptions({ state, district, crop }).then((res) => {
      setFilterOptions({
        crops: res.crops,
        states: res.states,
        districts: res.districts,
        markets: res.markets,
      });
    });
  }, [state, district, crop]);

  useEffect(() => {
    setLoading(true);
    api
      .getTrends({ crop, state, district, market, range })
      .then(setTrendResult)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [crop, state, district, market, range]);

  const series = (trendResult?.series || []).map((s: any) => ({
    date: s.date,
    modal_price: formatPrice(s.modal_price).raw,
    min_price: formatPrice(s.min_price).raw,
    max_price: formatPrice(s.max_price).raw,
  }));

  const stats = trendResult?.stats;

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900">
            {t('nav.trends')}
          </h1>
          <p className="text-xs text-neutral-500">
            Multi-period time series and historical price bands based on Agmarknet daily arrivals
          </p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Crop */}
          <select
            value={crop}
            onChange={(e) => setCrop(e.target.value)}
            className="text-xs font-semibold bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-emerald-700"
          >
            {filterOptions.crops.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* State */}
          <select
            value={state}
            onChange={(e) => {
              setState(e.target.value);
              setDistrict('');
              setMarket('');
            }}
            className="text-xs bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-emerald-700"
          >
            <option value="">All States</option>
            {filterOptions.states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* District */}
          <select
            value={district}
            onChange={(e) => {
              setDistrict(e.target.value);
              setMarket('');
            }}
            className="text-xs bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-emerald-700"
          >
            <option value="">All Districts</option>
            {filterOptions.districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Market */}
          <select
            value={market}
            onChange={(e) => setMarket(e.target.value)}
            className="text-xs bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-emerald-700"
          >
            <option value="">All Markets</option>
            {filterOptions.markets.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {/* Range Presets */}
          <div className="flex items-center bg-neutral-100 p-0.5 rounded-lg border border-neutral-200 text-xs font-medium ml-2">
            {(['7D', '30D', '90D', 'ALL'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-2.5 py-1 rounded transition ${
                  range === r
                    ? 'bg-white text-emerald-950 font-bold shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setShowHowToRead(!showHowToRead)}
          className="text-xs font-medium text-emerald-800 hover:text-emerald-900 flex items-center gap-1"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>How to read trends</span>
          {showHowToRead ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {showHowToRead && (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-950 space-y-1 leading-relaxed">
          <div className="font-bold">Understanding Mandi Price Trends:</div>
          <p>
            • The green line is the daily modal price (the price at which highest arrival volume transacted).
          </p>
          <p>
            • The shaded band encapsulates recorded minimum and maximum prices on that arrival date.
          </p>
          <p>
            • If fewer than 3 dates exist for a given narrow filter, no fake data is generated.
          </p>
        </div>
      )}

      {/* Stats Summary Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-3 rounded-xl border border-neutral-200 shadow-xs">
            <span className="text-[10px] text-neutral-400 uppercase font-medium">Start Price</span>
            <div className="text-base font-bold font-mono text-neutral-800 mt-0.5">
              {formatPrice(stats.startPrice).formatted}
            </div>
            <span className="text-[10px] text-neutral-400 font-mono">{stats.startDate}</span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-neutral-200 shadow-xs">
            <span className="text-[10px] text-neutral-400 uppercase font-medium">End Price</span>
            <div className="text-base font-bold font-mono text-neutral-900 mt-0.5">
              {formatPrice(stats.endPrice).formatted}
            </div>
            <span className="text-[10px] text-neutral-400 font-mono">{stats.endDate}</span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-neutral-200 shadow-xs">
            <span className="text-[10px] text-neutral-400 uppercase font-medium">Net Change</span>
            <div
              className={`text-base font-bold font-mono mt-0.5 flex items-center gap-1 ${
                stats.changePct >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {stats.changePct >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{stats.changePct > 0 ? `+${stats.changePct}%` : `${stats.changePct}%`}</span>
            </div>
            <span className="text-[10px] text-neutral-400">Over {range} window</span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-neutral-200 shadow-xs">
            <span className="text-[10px] text-neutral-400 uppercase font-medium">Window Peak</span>
            <div className="text-base font-bold font-mono text-neutral-900 mt-0.5">
              {formatPrice(stats.high).formatted}
            </div>
            <span className="text-[10px] text-neutral-400">Highest recorded</span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-neutral-200 shadow-xs">
            <span className="text-[10px] text-neutral-400 uppercase font-medium">Window Floor</span>
            <div className="text-base font-bold font-mono text-neutral-900 mt-0.5">
              {formatPrice(stats.low).formatted}
            </div>
            <span className="text-[10px] text-neutral-400">Lowest recorded</span>
          </div>

          <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 shadow-xs">
            <span className="text-[10px] text-emerald-800 uppercase font-bold">Average Modal</span>
            <div className="text-base font-bold font-mono text-emerald-950 mt-0.5">
              {formatPrice(stats.avg).formatted}
            </div>
            <span className="text-[10px] text-emerald-700">{formatPrice(100).unitLabel}</span>
          </div>
        </div>
      )}

      {/* Main Trend Line Chart */}
      <div className="bg-white p-4 md:p-5 rounded-xl border border-neutral-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-neutral-900">
            {crop} Price Movement ({range})
          </h2>
          <span className="text-xs text-neutral-400">Units: {formatPrice(100).unitLabel}</span>
        </div>

        <div className="h-80 w-full pt-2">
          {trendResult?.hasEnoughData ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={series} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    `₹${val}`,
                    name === 'modal_price' ? 'Modal Price' : name === 'min_price' ? 'Min' : 'Max',
                  ]}
                  labelFormatter={(l) => `Date: ${l}`}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area
                  type="monotone"
                  dataKey="max_price"
                  fill="#FEF3C7"
                  stroke="#FBBF24"
                  name="Max Daily Price"
                  opacity={0.4}
                />
                <Area
                  type="monotone"
                  dataKey="min_price"
                  fill="#E0E7FF"
                  stroke="#818CF8"
                  name="Min Daily Price"
                  opacity={0.4}
                />
                <Line
                  type="monotone"
                  dataKey="modal_price"
                  stroke="#166534"
                  strokeWidth={2.5}
                  name="Modal Price (Mandi Trading Rate)"
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-xs text-neutral-500 space-y-1">
              <span>{trendResult?.message || 'Not enough historical data for this selection to show a trend.'}</span>
              <span className="text-neutral-400">Try broadening your state or market filter to view regional trends.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
