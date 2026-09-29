import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { AnomalyReport } from '../types/client.js';
import {
  AlertTriangle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Info,
} from 'lucide-react';

export const AnomaliesPage: React.FC = () => {
  const { t } = useTranslation();
  const { formatPrice } = useAuth();

  const [selectedCrop, setSelectedCrop] = useState('');
  const [cropsList, setCropsList] = useState<string[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyReport[]>([]);
  const [insufficientCrops, setInsufficientCrops] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHowToRead, setShowHowToRead] = useState(false);

  useEffect(() => {
    api.getFilterOptions().then((res) => setCropsList(res.crops));
  }, []);

  useEffect(() => {
    setLoading(true);
    api
      .getAnomalies(selectedCrop || undefined)
      .then((res) => {
        setAnomalies(res.anomalies);
        setInsufficientCrops(res.insufficientDataCrops);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedCrop]);

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900">
              {t('nav.anomalies')}
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
              IQR Statistical Fences
            </span>
          </div>
          <p className="text-xs text-neutral-500">
            Automated detection of unusual price movements using robust non-parametric quantile statistics
          </p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
            Filter Commodity:
          </label>
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="text-xs font-semibold bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5 focus:outline-emerald-700"
          >
            <option value="">All Commodities</option>
            {cropsList.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setShowHowToRead(!showHowToRead)}
          className="text-xs font-medium text-emerald-800 hover:text-emerald-900 flex items-center gap-1"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>How anomalies are determined</span>
          {showHowToRead ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {showHowToRead && (
        <div className="bg-white border border-neutral-200 rounded-xl p-4 text-xs text-neutral-700 space-y-2 leading-relaxed">
          <div className="font-bold text-neutral-900">Statistical Framework:</div>
          <p>
            • <strong>IQR Fencing:</strong> Evaluates quartiles (Q1 = 25th percentile, Q3 = 75th percentile). Any modal price falling below <em>Q1 - 1.5×IQR</em> or above <em>Q3 + 1.5×IQR</em> is flagged as an anomaly.
          </p>
          <p>
            • <strong>Severity Grading:</strong> Deviation &gt; 35% is rated <strong>High</strong>; between 15% and 35% is rated <strong>Medium</strong>; below 15% is rated <strong>Low</strong>.
          </p>
          <p className="text-neutral-500">
            • <strong>Minimum Sample Requirement:</strong> Requires at least 8 recorded trading dates for the mandi series. If sample size is insufficient, the system reports "Not enough data to assess this crop."
          </p>
        </div>
      )}

      {/* Insufficient Data Warning (if any) */}
      {insufficientCrops.length > 0 && (
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs text-neutral-600 flex items-center gap-2">
          <Info className="w-4 h-4 text-neutral-400 shrink-0" />
          <span>
            Not enough data to assess crops with &lt; 8 historical records ({insufficientCrops.join(', ')}).
          </span>
        </div>
      )}

      {/* Anomalies List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white p-12 text-center text-xs text-neutral-400 rounded-xl border border-neutral-200">
            Calculating IQR fences across mandi series...
          </div>
        ) : anomalies.length === 0 ? (
          <div className="bg-white p-12 text-center text-xs text-neutral-500 rounded-xl border border-neutral-200 space-y-1">
            <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto mb-1" />
            <div className="font-bold text-neutral-800">No Statistical Anomalies Detected</div>
            <p className="text-neutral-400">All recent modal prices lie within normal interquartile ranges.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {anomalies.map((anom) => {
              const isHigh = anom.severity === 'High';
              const isMed = anom.severity === 'Medium';
              const isAbove = anom.direction === 'Above';

              return (
                <div
                  key={anom.id}
                  className="bg-white rounded-xl border border-neutral-200 shadow-xs p-4 space-y-3 hover:border-amber-300 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-neutral-900 text-sm">{anom.crop}</h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            isHigh
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : isMed
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-neutral-100 text-neutral-700'
                          }`}
                        >
                          {anom.severity} Severity
                        </span>
                      </div>
                      <div className="text-xs text-neutral-500 mt-0.5">
                        {anom.market} Mandi · {anom.state}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono text-neutral-400 block">
                        {anom.arrival_date}
                      </span>
                      <span
                        className={`text-xs font-bold flex items-center justify-end gap-1 mt-0.5 ${
                          isAbove ? 'text-amber-700' : 'text-rose-700'
                        }`}
                      >
                        {isAbove ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        <span>{isAbove ? `+${anom.deviation_pct}%` : `-${anom.deviation_pct}%`}</span>
                      </span>
                    </div>
                  </div>

                  {/* Anomaly Notice Text */}
                  <div className="bg-amber-50/70 p-2.5 rounded-lg border border-amber-200/80 text-xs text-amber-950 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Unusual price movement detected:</span> Recorded modal rate of{' '}
                      <strong className="font-mono font-bold text-neutral-900">
                        {formatPrice(anom.recorded_price).formatted}
                      </strong>{' '}
                      is significantly {isAbove ? 'higher' : 'lower'} than typical IQR fence range.
                    </div>
                  </div>

                  {/* Metrics Table */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-neutral-50 p-2 rounded border border-neutral-100">
                      <span className="text-[10px] text-neutral-400 block">Recorded Price</span>
                      <span className="font-mono font-bold text-neutral-900 mt-0.5 block">
                        {formatPrice(anom.recorded_price).formatted}
                      </span>
                    </div>
                    <div className="bg-neutral-50 p-2 rounded border border-neutral-100">
                      <span className="text-[10px] text-neutral-400 block">Typical Range</span>
                      <span className="font-mono text-neutral-700 mt-0.5 block">
                        {formatPrice(anom.typical_min).formatted} – {formatPrice(anom.typical_max).formatted}
                      </span>
                    </div>
                    <div className="bg-neutral-50 p-2 rounded border border-neutral-100">
                      <span className="text-[10px] text-neutral-400 block">Mandi Median</span>
                      <span className="font-mono text-neutral-700 mt-0.5 block">
                        {formatPrice(anom.median).formatted}
                      </span>
                    </div>
                  </div>

                  <div className="text-[10px] text-neutral-400 text-right">
                    Calculated over {anom.sample_size} historical arrival sessions.
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
