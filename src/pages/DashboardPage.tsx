import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { AgroPriceRecord } from '../types/client.js';
import {
  TrendingUp,
  TrendingDown,
  Layers,
  MapPin,
  Store,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Wheat,
  ShoppingBag,
  Truck,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { formatPrice, user, switchDemoRole } = useAuth();

  const [selectedCrop, setSelectedCrop] = useState<string>('Tomato');
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedMarket, setSelectedMarket] = useState<string>('');

  const [filterOptions, setFilterOptions] = useState<{
    crops: string[];
    states: string[];
    markets: string[];
  }>({ crops: [], states: [], markets: [] });

  const [stats, setStats] = useState<any>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [topMovers, setTopMovers] = useState<any>(null);
  const [recentRecords, setRecentRecords] = useState<AgroPriceRecord[]>([]);
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getFilterOptions().then((res) => {
      setFilterOptions({
        crops: res.crops,
        states: res.states,
        markets: res.markets,
      });
    });
    api.getTopMovers('1D').then(setTopMovers).catch(() => {});
    if (user) {
      api.getWatchlist().then((res) => setWatchlist(res.items)).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (selectedCrop) params.crop = selectedCrop;
    if (selectedState) params.state = selectedState;
    if (selectedMarket) params.market = selectedMarket;

    Promise.all([
      api.getDashboardStats(params),
      api.getTrends({ ...params, range: '30D' }),
      api.getPrices({ ...params, limit: 6, sortBy: 'arrival_date', sortOrder: 'desc' }),
    ])
      .then(([statsRes, trendsRes, pricesRes]) => {
        setStats(statsRes);
        setTrendData(trendsRes.series || []);
        setRecentRecords(pricesRes.data || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedCrop, selectedState, selectedMarket]);

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Hero Banner Section */}
      <div className="relative rounded-2xl overflow-hidden border border-emerald-900/10 shadow-sm bg-emerald-950 text-white min-h-[170px] md:min-h-[200px] flex items-center">
        <img
          src="/src/assets/images/agro_market_mandi_banner_1790600006016.jpg"
          alt="Indian Agricultural Mandi"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-overlay"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        <div className="relative z-10 px-5 md:px-8 py-6 w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 mb-1">
                <span>Near-real-time Agmarknet Feed</span>
                <span>·</span>
                <span>Direct Farmer Marketplace</span>
              </div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight text-white">
                Agro Rate Tracker
              </h1>
              <p className="text-xs md:text-sm text-emerald-100/90 mt-1 max-w-2xl leading-relaxed">
                Empowering Indian farmers, wholesale buyers, and traders with factual mandi prices,
                Holt-Winters forecasting, anomaly detection, and direct deal matching.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Link
                to="/find-produce"
                className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs rounded-lg shadow-sm transition flex items-center gap-1.5"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Find Produce</span>
              </Link>
              <Link
                to="/farmer-hub"
                className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg border border-emerald-600 transition flex items-center gap-1.5"
              >
                <Wheat className="w-3.5 h-3.5" />
                <span>List Harvest</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Global Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
            Scope Data:
          </span>

          {/* Crop Selector */}
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="text-xs font-semibold bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-neutral-800 focus:outline-emerald-700"
          >
            <option value="">{t('labels.all_crops')}</option>
            {filterOptions.crops.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* State Selector */}
          <select
            value={selectedState}
            onChange={(e) => {
              setSelectedState(e.target.value);
              setSelectedMarket('');
            }}
            className="text-xs font-medium bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-neutral-800 focus:outline-emerald-700"
          >
            <option value="">{t('labels.all_states')}</option>
            {filterOptions.states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Market Selector */}
          <select
            value={selectedMarket}
            onChange={(e) => setSelectedMarket(e.target.value)}
            className="text-xs font-medium bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-neutral-800 focus:outline-emerald-700"
          >
            <option value="">{t('labels.all_markets')}</option>
            {filterOptions.markets.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {(selectedCrop !== 'Tomato' || selectedState || selectedMarket) && (
            <button
              onClick={() => {
                setSelectedCrop('Tomato');
                setSelectedState('');
                setSelectedMarket('');
              }}
              className="text-xs text-neutral-500 hover:text-neutral-800 underline ml-1"
            >
              Reset
            </button>
          )}
        </div>

        <div className="text-[11px] text-neutral-500 font-medium">
          Showing metrics for: <span className="font-semibold text-emerald-900">{selectedCrop || 'All Commodities'}</span>
          {selectedState && <span> · {selectedState}</span>}
          {selectedMarket && <span> · {selectedMarket}</span>}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-xs">
          <div className="text-[11px] font-medium text-neutral-500">Total Price Records</div>
          <div className="text-xl font-bold text-neutral-900 mt-1 font-mono tabular-nums">
            {stats ? stats.totalRecords.toLocaleString('en-IN') : '...'}
          </div>
          <div className="text-[10px] text-neutral-400 mt-0.5">Historical mandi points</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-xs">
          <div className="text-[11px] font-medium text-neutral-500">Average Modal Price</div>
          <div className="text-xl font-bold text-emerald-800 mt-1 font-mono tabular-nums">
            {stats ? formatPrice(stats.avgModal).formatted : '...'}
          </div>
          <div className="text-[10px] text-neutral-400 mt-0.5">{formatPrice(stats?.avgModal || 0).unitLabel}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-xs">
          <div className="text-[11px] font-medium text-neutral-500">Lowest Recorded</div>
          <div className="text-xl font-bold text-neutral-800 mt-1 font-mono tabular-nums">
            {stats ? formatPrice(stats.lowestRecorded).formatted : '...'}
          </div>
          <div className="text-[10px] text-neutral-400 mt-0.5">Floor rate in window</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-xs">
          <div className="text-[11px] font-medium text-neutral-500">Highest Recorded</div>
          <div className="text-xl font-bold text-neutral-800 mt-1 font-mono tabular-nums">
            {stats ? formatPrice(stats.highestRecorded).formatted : '...'}
          </div>
          <div className="text-[10px] text-neutral-400 mt-0.5">Peak rate in window</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-xs">
          <div className="text-[11px] font-medium text-neutral-500">Coverage Mandis</div>
          <div className="text-xl font-bold text-neutral-900 mt-1 font-mono tabular-nums">
            {stats ? stats.markets : '...'}
          </div>
          <div className="text-[10px] text-neutral-400 mt-0.5">Across {stats?.states || 10} states</div>
        </div>

        <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 shadow-xs">
          <div className="text-[11px] font-semibold text-emerald-900">Active Deals</div>
          <div className="text-xl font-bold text-emerald-900 mt-1 font-mono tabular-nums">
            {stats ? stats.activeListings + stats.dealsInProgress : '...'}
          </div>
          <div className="text-[10px] text-emerald-700 mt-0.5">Marketplace proposals</div>
        </div>
      </div>

      {/* Main Content: Trend Chart (Left 2/3) + Top Movers / Watchlist (Right 1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Price Trend Preview Card */}
        <div className="lg:col-span-2 bg-white p-4 md:p-5 rounded-xl border border-neutral-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-neutral-900">
                30-Day Modal Price Trend: {selectedCrop || 'Tomato'}
              </h2>
              <p className="text-xs text-neutral-500">
                Daily Agmarknet modal price average across reporting mandis
              </p>
            </div>
            <Link
              to={`/trends?crop=${encodeURIComponent(selectedCrop || 'Tomato')}`}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
            >
              <span>Full Analytics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-64 w-full pt-2">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#6B7280' }}
                    tickFormatter={(d) => d.slice(5)}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#6B7280' }}
                    tickFormatter={(v) => (formatPrice(v).raw).toString()}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      borderRadius: '8px',
                      color: '#F8FAFC',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [formatPrice(val).formatted, 'Modal Price']}
                    labelFormatter={(label) => `Arrival Date: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="modal_price"
                    stroke="#166534"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, fill: '#166534' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-neutral-400">
                Loading price trend...
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-neutral-500 pt-2 border-t border-neutral-100">
            <span>Formula: Modal price = Most common price transacted in daily lot arrivals</span>
            <span className="font-semibold text-neutral-700">Units: {formatPrice(100).unitLabel}</span>
          </div>
        </div>

        {/* Right Column: Top Movers & Watchlist */}
        <div className="space-y-4">
          {/* Top Movers Card */}
          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <span className="text-xs font-bold text-neutral-900">24-Hour Top Mandi Movers</span>
              <Link to="/movers" className="text-[11px] text-emerald-700 font-semibold hover:underline">
                View all
              </Link>
            </div>
            <div className="divide-y divide-neutral-100 mt-1">
              {topMovers?.gainers?.slice(0, 3).map((g: any, i: number) => (
                <div key={i} className="py-2 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-neutral-900">{g.crop}</span>
                    <span className="text-[11px] text-neutral-500 block">
                      {g.market}, {g.state}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-neutral-900">
                      {formatPrice(g.current_modal).formatted}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center justify-end gap-0.5">
                      <TrendingUp className="w-3 h-3" />
                      +{g.change_pct}%
                    </span>
                  </div>
                </div>
              ))}
              {topMovers?.decliners?.slice(0, 2).map((d: any, i: number) => (
                <div key={i} className="py-2 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-neutral-900">{d.crop}</span>
                    <span className="text-[11px] text-neutral-500 block">
                      {d.market}, {d.state}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-neutral-900">
                      {formatPrice(d.current_modal).formatted}
                    </span>
                    <span className="text-[11px] font-bold text-rose-600 flex items-center justify-end gap-0.5">
                      <TrendingDown className="w-3 h-3" />
                      {d.change_pct}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Watchlist Card */}
          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <span className="text-xs font-bold text-neutral-900">Tracked Commodities</span>
              <Link to="/alerts" className="text-[11px] text-emerald-700 font-semibold hover:underline">
                Manage
              </Link>
            </div>
            <div className="divide-y divide-neutral-100 mt-1">
              {watchlist.length === 0 ? (
                <p className="text-xs text-neutral-400 py-3 text-center">
                  Add commodities from Market Prices to monitor daily movements.
                </p>
              ) : (
                watchlist.slice(0, 3).map((w, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-neutral-900">{w.crop}</span>
                      <span className="text-[11px] text-neutral-500 block">
                        {w.market || w.state || 'National average'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-neutral-900">
                        {w.current_modal_price ? formatPrice(w.current_modal_price).formatted : '—'}
                      </span>
                      <span
                        className={`text-[10px] font-semibold block ${
                          (w.change_pct || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {(w.change_pct || 0) >= 0 ? `+${w.change_pct}%` : `${w.change_pct}%`}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Arrival Mandi Records Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs p-4 md:p-5">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div>
            <h2 className="text-sm font-bold text-neutral-900">Recent Mandi Arrivals Feed</h2>
            <p className="text-xs text-neutral-500">
              Latest daily modal and price bands ingested across APMC centers
            </p>
          </div>
          <Link
            to="/prices"
            className="text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded border border-emerald-200 transition"
          >
            Explore All 2,700+ Mandi Prices
          </Link>
        </div>

        <div className="overflow-x-auto mt-3">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-2 px-3">Commodity</th>
                <th className="py-2 px-3">State & District</th>
                <th className="py-2 px-3">Mandi Market</th>
                <th className="py-2 px-3">Arrival Date</th>
                <th className="py-2 px-3 text-right">Min Price</th>
                <th className="py-2 px-3 text-right">Max Price</th>
                <th className="py-2 px-3 text-right">Modal Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {recentRecords.map((r) => (
                <tr key={r.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-neutral-900">{r.crop}</td>
                  <td className="py-2.5 px-3 text-neutral-600">
                    {r.state}, {r.district}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-neutral-800">{r.market}</td>
                  <td className="py-2.5 px-3 text-neutral-500 font-mono text-[11px]">
                    {r.arrival_date}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-neutral-600">
                    {formatPrice(r.min_price).formatted}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-neutral-600">
                    {formatPrice(r.max_price).formatted}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">
                    {formatPrice(r.modal_price).formatted}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
