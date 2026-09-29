import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { FreshnessInfo, NotificationItem } from '../types/client.js';
import { changeLanguage } from '../i18n/i18n.js';
import { PWAInstallButton } from './PWAInstallButton.js';
import {
  Bell,
  RefreshCw,
  ShieldCheck,
  User,
  CheckCircle2,
  AlertTriangle,
  Menu,
  ChevronDown,
} from 'lucide-react';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { t, i18n } = useTranslation();
  const {
    user,
    unitMode,
    setUnitMode,
    switchDemoRole,
    savedFarmer,
    quickFarmerLogin,
    logout,
  } = useAuth();
  const [freshness, setFreshness] = useState<FreshnessInfo | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  useEffect(() => {
    api.getFreshness().then(setFreshness).catch(() => {});
    if (user) {
      api.getNotifications().then((res) => setNotifications(res.notifications)).catch(() => {});
    }
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    for (const n of notifications.filter((x) => !x.read)) {
      await api.markNotificationRead(n.id);
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-40">
      <div className="flex items-center justify-between px-3 md:px-6 py-2.5 gap-2 md:gap-4 max-w-7xl mx-auto">
        {/* Left: Mobile Menu Toggle & Brand Wordmark */}
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-1.5 text-neutral-600 hover:text-neutral-900 rounded hover:bg-neutral-100"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <a href="/" className="flex items-center gap-2 group">
            <span className="w-7 h-7 rounded bg-emerald-800 flex items-center justify-center text-amber-300 font-bold text-sm tracking-tight shadow-xs">
              🌾
            </span>
            <span className="text-base md:text-lg font-bold tracking-tight text-emerald-950 group-hover:text-emerald-800 transition">
              Agro Rate Tracker
            </span>
          </a>
        </div>

        {/* Middle: Freshness Banner */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-neutral-600 bg-neutral-50 px-3 py-1.5 rounded border border-neutral-200">
          <span className="flex items-center gap-1 font-medium text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {t('labels.near_realtime_notice')}
          </span>
          <span className="text-neutral-300">|</span>
          <span>
            {t('labels.data_freshness')}:{' '}
            <strong className="font-semibold text-neutral-900 font-mono">
              {freshness?.latestArrivalDate || '2026-09-28'}
            </strong>
          </span>
          <span className="text-neutral-300">|</span>
          <span className="capitalize">
            Status:{' '}
            <span
              className={`font-medium ${
                freshness?.lastSyncStatus === 'synced'
                  ? 'text-emerald-700'
                  : 'text-amber-700'
              }`}
            >
              {freshness?.lastSyncStatus === 'synced' ? 'Active' : 'Seed Fallback'}
            </span>
          </span>
        </div>

        {/* Right Actions: Unit Toggle, Language, Notifs, PWA, User */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Per-Quintal / Per-Kg Toggle */}
          <div className="flex items-center bg-neutral-100 p-0.5 rounded border border-neutral-200 text-xs font-semibold">
            <button
              onClick={() => setUnitMode('quintal')}
              className={`px-2 py-1 rounded transition ${
                unitMode === 'quintal'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
              title="Show prices per quintal (100 kg)"
            >
              ₹/Qtl
            </button>
            <button
              onClick={() => setUnitMode('kg')}
              className={`px-2 py-1 rounded transition ${
                unitMode === 'kg'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
              title="Show prices per kilogram"
            >
              ₹/kg
            </button>
          </div>

          {/* Language Switcher */}
          <select
            value={i18n.language}
            onChange={(e) => changeLanguage(e.target.value as any)}
            className="text-xs bg-white border border-neutral-200 rounded px-2 py-1 font-medium text-neutral-700 focus:outline-emerald-700"
            aria-label="Select Language"
          >
            <option value="en">English</option>
            <option value="hi">हिन्दी (Hindi)</option>
            <option value="ta">தமிழ் (Tamil)</option>
          </select>

          {/* PWA Install */}
          <PWAInstallButton />

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="p-1.5 text-neutral-600 hover:text-neutral-900 rounded hover:bg-neutral-100 relative"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center font-mono">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-neutral-200 rounded-lg shadow-lg p-3 z-50">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                  <span className="text-xs font-semibold text-neutral-900">
                    Notifications ({notifications.length})
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-emerald-700 hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="mt-2 max-h-64 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-neutral-500 py-3 text-center">
                      No notifications yet.
                    </p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-2 rounded text-xs ${
                          n.read ? 'bg-neutral-50' : 'bg-emerald-50/60 border border-emerald-100'
                        }`}
                      >
                        <div className="font-semibold text-neutral-900">{n.title}</div>
                        <div className="text-neutral-600 mt-0.5 leading-snug">{n.message}</div>
                        <div className="text-[10px] text-neutral-400 mt-1 font-mono">
                          {new Date(n.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Farmer Quick Return badge (if another role is active or saved in local storage) */}
          {savedFarmer && user?.role !== 'farmer' && (
            <button
              onClick={() => quickFarmerLogin()}
              className="hidden sm:flex items-center gap-1.5 px-2 py-1 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded shadow-xs transition"
              title="1-Tap return to saved Farmer account"
            >
              <span>🌾</span>
              <span className="truncate max-w-[100px]">{savedFarmer.name.split(' ')[0]}</span>
              <span className="text-[10px] text-amber-700 bg-white/70 px-1 rounded">Edge</span>
            </button>
          )}

          {/* User Profile / Quick Role Switcher */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className={`flex items-center gap-1.5 pl-2 pr-1.5 py-1 text-xs font-semibold rounded border transition ${
                  user.role === 'farmer'
                    ? 'text-emerald-950 bg-emerald-100/70 hover:bg-emerald-200/70 border-emerald-300'
                    : 'text-neutral-900 bg-neutral-100 hover:bg-neutral-200 border-neutral-300'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    user.role === 'farmer'
                      ? 'bg-amber-500 ring-2 ring-emerald-500'
                      : 'bg-emerald-600'
                  }`}
                />
                <span className="capitalize">{user.role}</span>
                {user.role === 'farmer' && (
                  <span className="text-[9px] bg-emerald-800 text-white px-1 rounded font-mono">Edge</span>
                )}
                <ChevronDown className="w-3 h-3 text-neutral-500" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-60 bg-white border border-neutral-200 rounded-xl shadow-xl p-2.5 z-50">
                  <div className="px-2 py-1 text-xs border-b border-neutral-100 mb-1.5">
                    <div className="font-bold text-neutral-900 truncate">{user.name}</div>
                    <div className="text-[11px] text-neutral-500 truncate">{user.email || user.phone}</div>
                    {user.role === 'farmer' && (
                      <div className="mt-1 text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <span>✓</span>
                        <span>Saved in Microsoft Edge (Auto-login)</span>
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] uppercase font-bold text-neutral-400 px-2 py-1">
                    Quick Role Personas
                  </div>
                  {(['customer', 'farmer', 'trader', 'admin'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        switchDemoRole(r);
                        setShowRoleMenu(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 text-xs rounded-lg flex items-center justify-between ${
                        user.role === r
                          ? 'bg-emerald-50 text-emerald-900 font-semibold'
                          : 'text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      <span className="capitalize">{r}</span>
                      {user.role === r && <span className="text-[10px] text-emerald-700">Active</span>}
                    </button>
                  ))}

                  <div className="border-t border-neutral-100 mt-2 pt-1.5 space-y-1">
                    <a
                      href="/login"
                      onClick={() => setShowRoleMenu(false)}
                      className="block px-2 py-1.5 text-xs text-neutral-700 hover:bg-neutral-100 rounded-lg font-medium"
                    >
                      🔑 Switch Account / Register Role
                    </a>
                    <button
                      onClick={() => {
                        logout(false);
                        setShowRoleMenu(false);
                      }}
                      className="w-full text-left px-2 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg font-medium"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <a
              href="/login"
              className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition"
            >
              Sign In / Register
            </a>
          )}
        </div>
      </div>
    </header>
  );
};
