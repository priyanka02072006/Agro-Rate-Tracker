import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Scale, TrendingUp, CheckCircle, PackageCheck, AlertCircle } from 'lucide-react';

export const SupplyDemandPage: React.FC = () => {
  const { t } = useTranslation();
  const { formatPrice } = useAuth();

  const [supplyDemandData, setSupplyDemandData] = useState<any[]>([]);
  const [salesAnalytics, setSalesAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getSupplyDemand(), api.getSalesAnalytics()])
      .then(([sdRes, saRes]) => {
        setSupplyDemandData(sdRes.data || []);
        setSalesAnalytics(saRes);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const chartData = supplyDemandData.map((item) => ({
    crop: item.crop,
    Supply: item.supply_tonnes,
    Demand: item.demand_tonnes,
  }));

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900">
              {t('nav.supply_demand')}
            </h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
              Includes Demo Marketplace Data
            </span>
          </div>
          <p className="text-xs text-neutral-500">
            Marketplace liquidity overview comparing available farm stock against buyer demand volumes
          </p>
        </div>
      </div>

      {/* KPI Sales & Liquidity Cards */}
      {salesAnalytics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
          <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-xs">
            <span className="text-[10px] text-neutral-400 uppercase font-bold">Total Sales Value</span>
            <div className="text-lg font-bold font-mono text-emerald-950 mt-1">
              ₹{salesAnalytics.total_sales_value.toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-neutral-400">Direct farm transactions</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-xs">
            <span className="text-[10px] text-neutral-400 uppercase font-bold">Volume Transacted</span>
            <div className="text-lg font-bold font-mono text-neutral-900 mt-1">
              {salesAnalytics.total_volume_tonnes} Tonnes
            </div>
            <span className="text-[10px] text-neutral-400">Completed & in transit</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-xs">
            <span className="text-[10px] text-neutral-400 uppercase font-bold">Match Success Rate</span>
            <div className="text-lg font-bold font-mono text-emerald-700 mt-1">
              {salesAnalytics.match_success_rate_pct}%
            </div>
            <span className="text-[10px] text-neutral-400">Proposal acceptance ratio</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-xs">
            <span className="text-[10px] text-neutral-400 uppercase font-bold">Avg Days to Delivery</span>
            <div className="text-lg font-bold font-mono text-neutral-900 mt-1">
              {salesAnalytics.avg_days_to_delivery} Days
            </div>
            <span className="text-[10px] text-neutral-400">Farm gate to buyer transit</span>
          </div>

          <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 shadow-xs">
            <span className="text-[10px] text-emerald-800 uppercase font-bold">Avg Deal vs Mandi Modal</span>
            <div className="text-lg font-bold font-mono text-emerald-900 mt-1">
              {salesAnalytics.avg_deal_price_vs_modal_pct}%
            </div>
            <span className="text-[10px] text-emerald-700">Fair farmer premium captured</span>
          </div>
        </div>
      )}

      {/* Supply vs Demand Bar Chart */}
      <div className="bg-white p-4 md:p-5 rounded-xl border border-neutral-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-neutral-900">
              Supply (Available Stock) vs Demand (Open Requirements) by Commodity
            </h2>
            <p className="text-xs text-neutral-500">
              Aggregated across all registered farmer listings and open buyer requests (Metric Tonnes)
            </p>
          </div>
          <span className="text-xs text-neutral-400 font-mono">Unit: Metric Tonnes (1,000 kg)</span>
        </div>

        <div className="h-72 w-full pt-2">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="crop" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: any, name: any) => [`${v} Tonnes`, name]} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Supply" fill="#166534" name="Farm Supply Available" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Demand" fill="#F59E0B" name="Buyer Demand Required" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-neutral-400">
              Loading market liquidity analytics...
            </div>
          )}
        </div>
      </div>

      {/* Commodity-wise Breakdown Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
            Commodity Liquidity & Asking vs Mandi Modal Averages
          </h3>
          <span className="text-[11px] text-amber-700 font-medium">Includes demo data</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-500 font-semibold uppercase text-[10px] tracking-wider border-b border-neutral-200">
              <tr>
                <th className="py-2.5 px-4">Commodity</th>
                <th className="py-2.5 px-3 text-right">Available Supply</th>
                <th className="py-2.5 px-3 text-right">Open Demand</th>
                <th className="py-2.5 px-3 text-right">Avg Farmer Asking</th>
                <th className="py-2.5 px-3 text-right">Mandi Modal Benchmark</th>
                <th className="py-2.5 px-3 text-right">Liquidity Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {supplyDemandData.map((row, idx) => {
                const isDeficit = row.demand_tonnes > row.supply_tonnes;
                return (
                  <tr key={idx} className="hover:bg-neutral-50">
                    <td className="py-3 px-4 font-bold text-neutral-900">{row.crop}</td>
                    <td className="py-3 px-3 text-right font-mono text-neutral-800">
                      {row.supply_tonnes} T ({row.active_listings_count} lots)
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-neutral-800">
                      {row.demand_tonnes} T ({row.open_requirements_count} reqs)
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-900">
                      {row.avg_asking_price_quintal > 0
                        ? formatPrice(row.avg_asking_price_quintal).formatted
                        : '—'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-neutral-600">
                      {formatPrice(row.market_modal_avg).formatted}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                          isDeficit
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isDeficit ? 'High Demand' : 'Adequate Supply'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
