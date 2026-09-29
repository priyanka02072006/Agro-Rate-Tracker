import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';

export const TopMoversPage: React.FC = () => {
  const { t } = useTranslation();
  const { formatPrice } = useAuth();
  const [period, setPeriod] = useState<'1D' | '7D'>('1D');
  const [moversData, setMoversData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .getTopMovers(period)
      .then(setMoversData)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900">
            {t('nav.top_movers')}
          </h1>
          <p className="text-xs text-neutral-500">
            Factual price changes across Indian mandis where consecutive trading sessions exist
          </p>
        </div>

        {/* Period Toggle */}
        <div className="flex items-center bg-neutral-100 p-0.5 rounded-lg border border-neutral-200 text-xs font-semibold">
          <button
            onClick={() => setPeriod('1D')}
            className={`px-3 py-1.5 rounded transition ${
              period === '1D'
                ? 'bg-white text-emerald-950 font-bold shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            24 Hours (1-Day)
          </button>
          <button
            onClick={() => setPeriod('7D')}
            className={`px-3 py-1.5 rounded transition ${
              period === '7D'
                ? 'bg-white text-emerald-950 font-bold shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            7-Day Period
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Gainers */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900">Top Price Gainers ({period})</h2>
              <p className="text-[11px] text-neutral-400">Largest percentage increases in modal price</p>
            </div>
          </div>

          <div className="divide-y divide-neutral-100">
            {(moversData?.gainers || []).map((item: any, idx: number) => (
              <div key={idx} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-neutral-900 text-sm">{item.crop}</span>
                    <span className="text-[11px] text-neutral-500">{item.market} Mandi</span>
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">{item.state}</div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-bold text-neutral-900 text-sm">
                    {formatPrice(item.current_modal).formatted}
                  </div>
                  <div className="text-[11px] font-bold text-emerald-700 flex items-center justify-end gap-1 mt-0.5">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>+{item.change_pct}%</span>
                    <span className="text-neutral-400 font-mono font-normal">
                      (+{formatPrice(item.change_amount).formatted})
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Decliners */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900">Top Price Decliners ({period})</h2>
              <p className="text-[11px] text-neutral-400">Largest percentage drops in modal price</p>
            </div>
          </div>

          <div className="divide-y divide-neutral-100">
            {(moversData?.decliners || []).map((item: any, idx: number) => (
              <div key={idx} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-neutral-900 text-sm">{item.crop}</span>
                    <span className="text-[11px] text-neutral-500">{item.market} Mandi</span>
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">{item.state}</div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-bold text-neutral-900 text-sm">
                    {formatPrice(item.current_modal).formatted}
                  </div>
                  <div className="text-[11px] font-bold text-rose-700 flex items-center justify-end gap-1 mt-0.5">
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    <span>{item.change_pct}%</span>
                    <span className="text-neutral-400 font-mono font-normal">
                      ({formatPrice(item.change_amount).formatted})
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
