import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { PriceAlert, WatchlistItem, NotificationItem } from '../types/client.js';
import {
  Bell,
  Trash2,
  PlusCircle,
  Clock,
  Bookmark,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, formatPrice } = useAuth();

  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [cropsList, setCropsList] = useState<string[]>([]);
  const [marketsList, setMarketsList] = useState<string[]>([]);

  // Alert Form State
  const [showAddAlert, setShowAddAlert] = useState(false);
  const [newCrop, setNewCrop] = useState('Tomato');
  const [newMarket, setNewMarket] = useState('');
  const [newCondition, setNewCondition] = useState<'above' | 'below' | 'change_pct'>('above');
  const [newThreshold, setNewThreshold] = useState('2400');
  const [message, setMessage] = useState<string | null>(null);

  const loadAll = () => {
    if (!user) return;
    Promise.all([
      api.getAlerts(),
      api.getWatchlist(),
      api.getNotifications(),
      api.getFilterOptions(),
    ]).then(([aRes, wRes, nRes, fRes]) => {
      setAlerts(aRes.alerts);
      setWatchlist(wRes.items);
      setNotifications(nRes.notifications);
      setCropsList(fRes.crops);
      setMarketsList(fRes.markets);
    });
  };

  useEffect(() => {
    loadAll();
  }, [user]);

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAlert({
        crop: newCrop,
        market: newMarket || undefined,
        condition: newCondition,
        threshold: Number(newThreshold),
      });
      setMessage('Price alert set successfully! Evaluated on daily Agmarknet sync.');
      setShowAddAlert(false);
      loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteAlert = async (id: string) => {
    await api.deleteAlert(id);
    loadAll();
  };

  const handleRemoveWatchlist = async (id: string) => {
    await api.removeFromWatchlist(id);
    loadAll();
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900">
            {t('nav.alerts')}
          </h1>
          <p className="text-xs text-neutral-500">
            Monitor daily mandi rate shifts, configure threshold alerts, and manage watchlist commodities
          </p>
        </div>

        <button
          onClick={() => setShowAddAlert(!showAddAlert)}
          className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{showAddAlert ? 'Close Form' : 'Set New Price Alert'}</span>
        </button>
      </div>

      {/* Cadence Note */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 flex items-start gap-2">
        <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <strong>Evaluation Cadence Notice:</strong> Mandi price alerts fire automatically during the scheduled daily Agmarknet sync (16:00 IST), not continuously like stock tickers. In-app notifications are delivered immediately upon each daily feed refresh.
        </div>
      </div>

      {message && (
        <div className="bg-emerald-100 text-emerald-900 p-3 rounded-lg text-xs font-semibold flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="font-bold">
            ×
          </button>
        </div>
      )}

      {/* Add Alert Form */}
      {showAddAlert && (
        <form
          onSubmit={handleCreateAlert}
          className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs space-y-3"
        >
          <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
            Configure Mandi Threshold Trigger
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">
                Commodity
              </label>
              <select
                value={newCrop}
                onChange={(e) => setNewCrop(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-2 font-semibold"
              >
                {cropsList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">
                Mandi Market (Optional)
              </label>
              <select
                value={newMarket}
                onChange={(e) => setNewMarket(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-2"
              >
                <option value="">Any Mandi Center</option>
                {marketsList.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">
                Trigger Condition
              </label>
              <select
                value={newCondition}
                onChange={(e) => setNewCondition(e.target.value as any)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-2 font-medium"
              >
                <option value="above">Price Rises Above (₹/Qtl)</option>
                <option value="below">Price Drops Below (₹/Qtl)</option>
                <option value="change_pct">Daily Change Exceeds (%)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">
                Threshold Value ({newCondition === 'change_pct' ? '%' : '₹/Qtl'})
              </label>
              <input
                type="number"
                value={newThreshold}
                onChange={(e) => setNewThreshold(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-2 font-mono font-bold"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
            <button
              type="button"
              onClick={() => setShowAddAlert(false)}
              className="px-3 py-1.5 border border-neutral-200 text-neutral-600 rounded-lg text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-800 text-white rounded-lg text-xs font-semibold"
            >
              Save Alert
            </button>
          </div>
        </form>
      )}

      {/* Grid: Active Alerts & Watchlist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Price Alerts */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-800" />
              <h2 className="text-sm font-bold text-neutral-900">Your Configured Alerts ({alerts.length})</h2>
            </div>
          </div>

          {alerts.length === 0 ? (
            <p className="text-xs text-neutral-400 py-6 text-center">
              No alerts configured. Click 'Set New Price Alert' above to monitor target prices.
            </p>
          ) : (
            <div className="divide-y divide-neutral-100">
              {alerts.map((a) => (
                <div key={a.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-neutral-900">{a.crop}</span>
                    <span className="text-[11px] text-neutral-500 block">
                      {a.market ? `${a.market} Mandi` : 'Any National Mandi'} ·{' '}
                      <span className="font-semibold capitalize text-emerald-900">
                        {a.condition === 'above'
                          ? `Above ₹${a.threshold}/qtl`
                          : a.condition === 'below'
                          ? `Below ₹${a.threshold}/qtl`
                          : `Shift > ${a.threshold}%`}
                      </span>
                    </span>
                    {a.last_triggered_at && (
                      <span className="text-[10px] text-neutral-400 font-mono">
                        Triggered: {new Date(a.last_triggered_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteAlert(a.id)}
                    className="p-1.5 text-neutral-400 hover:text-rose-600 rounded"
                    title="Delete Alert"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Watchlist */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-emerald-800" />
              <h2 className="text-sm font-bold text-neutral-900">Watchlist Commodities ({watchlist.length})</h2>
            </div>
          </div>

          {watchlist.length === 0 ? (
            <p className="text-xs text-neutral-400 py-6 text-center">
              Watchlist is empty. Click 'Watchlist' on any price record in the Market Prices table to pin here.
            </p>
          ) : (
            <div className="divide-y divide-neutral-100">
              {watchlist.map((w) => (
                <div key={w.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-neutral-900">{w.crop}</span>
                    <span className="text-[11px] text-neutral-500 block">
                      {w.market ? `${w.market} Mandi` : 'National aggregate'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="font-mono font-bold text-neutral-900 block">
                        {w.current_modal_price ? formatPrice(w.current_modal_price).formatted : '—'}
                      </span>
                      <span
                        className={`text-[10px] font-bold ${
                          (w.change_pct || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {(w.change_pct || 0) >= 0 ? `+${w.change_pct}%` : `${w.change_pct}%`}
                      </span>
                    </div>

                    <button
                      onClick={() => handleRemoveWatchlist(w.id)}
                      className="p-1.5 text-neutral-400 hover:text-rose-600 rounded"
                      title="Remove from Watchlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
