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
import { BarChart3, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

export const ComparePage: React.FC = () => {
  const { t } = useTranslation();
  const { formatPrice } = useAuth();

  const [crop, setCrop] = useState('Tomato');
  const [dimension, setDimension] = useState<'markets' | 'districts' | 'states'>('markets');
  const [stateFilter, setStateFilter] = useState('');
  const [cropsList, setCropsList] = useState<string[]>([]);
  const [statesList, setStatesList] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showHowToRead, setShowHowToRead] = useState(false);

  useEffect(() => {
    api.getFilterOptions().then((res) => {
      setCropsList(res.crops);
      setStatesList(res.states);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    api
      .getComparison(crop, dimension, stateFilter || undefined)
      .then(setComparisonData)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [crop, dimension, stateFilter]);

  const chartItems = (comparisonData?.items || []).slice(0, 8).map((item: any) => ({
    entity: item.entity.length > 14 ? `${item.entity.slice(0, 12)}...` : item.entity,
    fullEntity: item.entity,
    avgModal: formatPrice(item.avg_modal_price).raw,
    minPrice: formatPrice(item.min_price).raw,
    maxPrice: formatPrice(item.max_price).raw,
  }));

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900">
            {t('nav.compare')}
          </h1>
          <p className="text-xs text-neutral-500">
            Factual price variance and modal comparisons across Indian markets, districts, and states
          </p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Crop Selector */}
          <div>
            <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
              Select Crop
            </label>
            <select
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
              className="text-xs font-semibold bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5 focus:outline-emerald-700"
            >
              {cropsList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Dimension Selector */}
          <div>
            <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
              Compare Dimension
            </label>
            <div className="flex items-center bg-neutral-100 p-0.5 rounded-lg border border-neutral-200 text-xs font-medium">
              {(['markets', 'districts', 'states'] as const).map((dim) => (
                <button
                  key={dim}
                  onClick={() => setDimension(dim)}
                  className={`px-3 py-1 rounded-md capitalize transition ${
                    dimension === dim
                      ? 'bg-white text-emerald-950 font-semibold shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {dim}
                </button>
              ))}
            </div>
          </div>

          {/* State Filter (if comparing markets or districts) */}
          {dimension !== 'states' && (
            <div>
              <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                Filter State (Optional)
              </label>
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="text-xs bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5 focus:outline-emerald-700"
              >
                <option value="">All Reporting States</option>
                {statesList.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowHowToRead(!showHowToRead)}
          className="text-xs font-medium text-emerald-800 hover:text-emerald-900 flex items-center gap-1"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>How to read this comparison</span>
          {showHowToRead ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* How to Read Collapsible */}
      {showHowToRead && (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-950 space-y-1.5 leading-relaxed">
          <div className="font-bold">Objective & Factual Interpretation Principles:</div>
          <p>
            • Mandi price variations reflect local supply arrivals, transportation costs, and regional demand dynamics.
          </p>
          <p>
            • The <strong>Difference vs Group Average</strong> indicates strictly how far a specific mandi diverges from the national/state mean.
          </p>
          <p className="text-emerald-800">
            • <em>Honesty rule</em>: Higher or lower modal rates are factual historical trading records and must never be labeled as "best" or "guaranteed profit".
          </p>
        </div>
      )}

      {/* Grouped Bar Chart */}
      <div className="bg-white p-4 md:p-5 rounded-xl border border-neutral-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-neutral-900">
            Modal vs Price Spread Comparison ({crop})
          </h2>
          <span className="text-xs text-neutral-500">
            Group Average Modal:{' '}
            <strong className="text-emerald-900 font-mono">
              {comparisonData ? formatPrice(comparisonData.overallAvgModal).formatted : '...'}
            </strong>{' '}
            {formatPrice(100).unitLabel}
          </span>
        </div>

        <div className="h-72 w-full pt-2">
          {chartItems.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartItems} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="entity" tick={{ fontSize: 10, fill: '#4B5563' }} />
                <YAxis tick={{ fontSize: 10, fill: '#4B5563' }} />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    `₹${val}`,
                    name === 'avgModal' ? 'Average Modal' : name === 'minPrice' ? 'Min' : 'Max',
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="avgModal" fill="#166534" name="Average Modal Price" radius={[4, 4, 0, 0]} />
                <Bar dataKey="minPrice" fill="#93C5FD" name="Recorded Min" radius={[4, 4, 0, 0]} />
                <Bar dataKey="maxPrice" fill="#FCD34D" name="Recorded Max" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-neutral-400">
              No comparison records found for this crop.
            </div>
          )}
        </div>
      </div>

      {/* Comparison Data Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
            Detailed Price Variance Breakdown
          </h3>
          <span className="text-[11px] text-neutral-400">
            Total Entities: {comparisonData?.items?.length || 0}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-500 font-semibold uppercase text-[10px] tracking-wider border-b border-neutral-200">
              <tr>
                <th className="py-2.5 px-4">Entity ({dimension})</th>
                {dimension === 'markets' && <th className="py-2.5 px-3">State</th>}
                <th className="py-2.5 px-3 text-right">Avg Modal Price</th>
                <th className="py-2.5 px-3 text-right">Min Recorded</th>
                <th className="py-2.5 px-3 text-right">Max Recorded</th>
                <th className="py-2.5 px-3 text-right">Diff vs Group Mean</th>
                <th className="py-2.5 px-3 text-right">Sample Records</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {(comparisonData?.items || []).map((row: any, idx: number) => {
                const isAbove = row.diff_vs_group_avg >= 0;
                return (
                  <tr key={idx} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-neutral-900">{row.entity}</td>
                    {dimension === 'markets' && <td className="py-3 px-3 text-neutral-600">{row.state}</td>}
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-900">
                      {formatPrice(row.avg_modal_price).formatted}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-neutral-600">
                      {formatPrice(row.min_price).formatted}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-neutral-600">
                      {formatPrice(row.max_price).formatted}
                    </td>
                    <td
                      className={`py-3 px-3 text-right font-mono font-semibold ${
                        isAbove ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {isAbove ? `+₹${row.diff_vs_group_avg}` : `-₹${Math.abs(row.diff_vs_group_avg)}`} (
                      {isAbove ? `+${row.diff_pct}%` : `${row.diff_pct}%`})
                    </td>
                    <td className="py-3 px-3 text-right text-neutral-500 font-mono text-[11px]">
                      {row.record_count}
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
