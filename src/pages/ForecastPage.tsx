import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { ForecastData } from '../types/client.js';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  LineChart as LineChartIcon,
  AlertCircle,
  HelpCircle,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const ForecastPage: React.FC = () => {
  const { t } = useTranslation();
  const { formatPrice } = useAuth();

  const [crop, setCrop] = useState('Tomato');
  const [state, setState] = useState('');
  const [market, setMarket] = useState('');
  const [cropsList, setCropsList] = useState<string[]>([]);
  const [statesList, setStatesList] = useState<string[]>([]);
  const [marketsList, setMarketsList] = useState<string[]>([]);

  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHowToRead, setShowHowToRead] = useState(false);

  useEffect(() => {
    api.getFilterOptions().then((res) => {
      setCropsList(res.crops);
      setStatesList(res.states);
      setMarketsList(res.markets);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    setErrorMessage(null);

    api
      .getForecast(crop, state || undefined, market || undefined)
      .then(setForecast)
      .catch((err) => {
        setForecast(null);
        setErrorMessage(
          err.message ||
            'Prediction is unavailable because insufficient historical data is available.'
        );
      })
      .finally(() => setLoading(false));
  }, [crop, state, market]);

  // Merge historical recent and forecast points for smooth chart rendering
  const chartData: any[] = [];
  if (forecast) {
    for (const h of forecast.historical_recent) {
      chartData.push({
        date: h.date,
        historical: formatPrice(h.modal_price).raw,
        forecast: null,
        lower: null,
        upper: null,
      });
    }
    // Connect historical last point to forecast
    if (forecast.historical_recent.length > 0 && forecast.points.length > 0) {
      const lastHist = forecast.historical_recent[forecast.historical_recent.length - 1];
      chartData[chartData.length - 1].forecast = formatPrice(lastHist.modal_price).raw;
    }
    for (const p of forecast.points) {
      chartData.push({
        date: p.date,
        historical: null,
        forecast: formatPrice(p.predicted_modal).raw,
        lower: formatPrice(p.confidence_lower).raw,
        upper: formatPrice(p.confidence_upper).raw,
      });
    }
  }

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900">
              {t('nav.forecast')}
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
              Estimate Only
            </span>
          </div>
          <p className="text-xs text-neutral-500">
            7-Day time-series extrapolation using Holt-Winters exponential smoothing and historical arrivals
          </p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Crop */}
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

          {/* State */}
          <div>
            <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
              Filter State (Optional)
            </label>
            <select
              value={state}
              onChange={(e) => {
                setState(e.target.value);
                setMarket('');
              }}
              className="text-xs bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5 focus:outline-emerald-700"
            >
              <option value="">National Aggregate</option>
              {statesList.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Market */}
          <div>
            <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
              Specific Mandi (Optional)
            </label>
            <select
              value={market}
              onChange={(e) => setMarket(e.target.value)}
              className="text-xs bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5 focus:outline-emerald-700"
            >
              <option value="">All Mandis in selection</option>
              {marketsList.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={() => setShowHowToRead(!showHowToRead)}
          className="text-xs font-medium text-emerald-800 hover:text-emerald-900 flex items-center gap-1"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Understanding Forecasting Models</span>
          {showHowToRead ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Mandatory Honesty Notice Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-amber-900">
        <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-semibold">Important Transparency Notice:</strong>{' '}
          {forecast?.disclaimer ||
            'Forecasts are algorithmic estimates based on past Agmarknet trading data. They are not guaranteed prices and do not account for unforeseen weather disasters or sudden transportation strikes.'}
        </div>
      </div>

      {showHowToRead && (
        <div className="bg-white border border-neutral-200 rounded-xl p-4 text-xs text-neutral-700 space-y-2 leading-relaxed">
          <div className="font-bold text-neutral-900">Forecast Pipeline Architecture:</div>
          <p>
            • <strong>&ge; 30 daily points:</strong> Holt-Winters double exponential smoothing with day-of-week seasonality dampening.
          </p>
          <p>
            • <strong>10–29 daily points:</strong> Holt linear trend smoothing without seasonality.
          </p>
          <p>
            • <strong>&lt; 10 daily points:</strong> Algorithmic prediction is suppressed; no fabricated values are presented.
          </p>
          <p>
            • <strong>Backtest Error (MAPE):</strong> Mean Absolute Percentage Error measured over a 5-day holdout testing window.
          </p>
        </div>
      )}

      {/* Model Parameters & Meta Cards */}
      {forecast && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-xs">
            <span className="text-[10px] text-neutral-400 uppercase font-bold">Model Engine</span>
            <div className="text-xs font-bold text-neutral-900 mt-1 leading-snug">
              {forecast.model_name}
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-xs">
            <span className="text-[10px] text-neutral-400 uppercase font-bold">Training Data Window</span>
            <div className="text-xs font-mono font-semibold text-neutral-800 mt-1">
              {forecast.training_window}
            </div>
            <span className="text-[10px] text-neutral-400 font-mono">({forecast.points_used} daily points)</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-xs">
            <span className="text-[10px] text-neutral-400 uppercase font-bold">Backtest Accuracy (MAPE)</span>
            <div className="text-base font-bold font-mono text-emerald-800 mt-0.5">
              {forecast.mape_backtest_pct}% Error
            </div>
            <span className="text-[10px] text-neutral-400">Mean absolute percentage error</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-xs">
            <span className="text-[10px] text-neutral-400 uppercase font-bold">7-Day Projected Range</span>
            <div className="text-base font-bold font-mono text-neutral-900 mt-0.5">
              {formatPrice(forecast.points[forecast.points.length - 1].confidence_lower).formatted} –{' '}
              {formatPrice(forecast.points[forecast.points.length - 1].confidence_upper).formatted}
            </div>
            <span className="text-[10px] text-neutral-400">95% statistical confidence interval</span>
          </div>
        </div>
      )}

      {/* Main Chart Card */}
      <div className="bg-white p-4 md:p-5 rounded-xl border border-neutral-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-neutral-900">
            {crop} Price Forecast Projection with 95% Confidence Band
          </h2>
          <span className="text-xs text-neutral-400">Units: {formatPrice(100).unitLabel}</span>
        </div>

        <div className="h-80 w-full pt-2">
          {loading ? (
            <div className="h-full flex items-center justify-center text-xs text-neutral-400">
              Running Holt-Winters time-series forecast...
            </div>
          ) : errorMessage ? (
            <div className="h-full flex flex-col items-center justify-center text-xs text-neutral-500 space-y-1">
              <AlertCircle className="w-6 h-6 text-amber-600 mb-1" />
              <span className="font-semibold text-neutral-700">{errorMessage}</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    val !== null ? `₹${val}` : '—',
                    name === 'historical'
                      ? 'Recorded Historical Modal'
                      : name === 'forecast'
                      ? 'Estimated Prediction'
                      : name === 'upper'
                      ? 'Upper 95% Bound'
                      : 'Lower 95% Bound',
                  ]}
                  labelFormatter={(l) => `Date: ${l}`}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area
                  type="monotone"
                  dataKey="upper"
                  stroke="#FDE68A"
                  fill="#FEF3C7"
                  name="Confidence Band"
                  opacity={0.5}
                />
                <Line
                  type="monotone"
                  dataKey="historical"
                  stroke="#166534"
                  strokeWidth={2.5}
                  name="Historical Recorded Modal"
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="#D97706"
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  name="Forecasted Modal (Estimate)"
                  dot={{ r: 4, stroke: '#D97706' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Projection Table */}
      {forecast && (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
          <div className="p-3.5 border-b border-neutral-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
              Day-by-Day Forecast Schedule (Next 7 Days)
            </h3>
            <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Estimate, not guaranteed
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-500 font-semibold uppercase text-[10px] tracking-wider border-b border-neutral-200">
                <tr>
                  <th className="py-2.5 px-4">Estimated Date</th>
                  <th className="py-2.5 px-3 text-right">Predicted Modal Price</th>
                  <th className="py-2.5 px-3 text-right">95% Lower Bound</th>
                  <th className="py-2.5 px-3 text-right">95% Upper Bound</th>
                  <th className="py-2.5 px-3 text-right">Uncertainty Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {forecast.points.map((p, idx) => {
                  const spread = p.confidence_upper - p.confidence_lower;
                  return (
                    <tr key={idx} className="hover:bg-neutral-50">
                      <td className="py-3 px-4 font-mono font-medium text-neutral-800">{p.date}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-amber-700">
                        {formatPrice(p.predicted_modal).formatted}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-neutral-600">
                        {formatPrice(p.confidence_lower).formatted}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-neutral-600">
                        {formatPrice(p.confidence_upper).formatted}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-neutral-500">
                        ±{formatPrice(Math.round(spread / 2)).formatted}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
