import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.js';
import {
  LayoutDashboard,
  TableProperties,
  BarChart3,
  TrendingUp,
  Activity,
  LineChart,
  AlertTriangle,
  Wheat,
  ShoppingBag,
  Truck,
  Scale,
  Bell,
  Settings,
  Info,
  X,
  UserCheck,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { user, switchDemoRole } = useAuth();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-3 py-2 text-xs md:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
      isActive
        ? 'bg-emerald-900 text-white font-semibold shadow-xs'
        : 'text-neutral-600 hover:text-emerald-950 hover:bg-emerald-50/60'
    }`;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-xs"
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 z-50 md:z-30 h-screen w-64 bg-white border-r border-neutral-200 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto p-4">
          {/* Mobile Header */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-neutral-100 md:hidden">
            <span className="font-bold text-emerald-900 text-sm">Agro Rate Tracker</span>
            <button
              onClick={onClose}
              className="p-1 text-neutral-500 hover:text-neutral-900"
              aria-label="Close Navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Section: Market Intelligence */}
          <div className="mb-4">
            <div className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 px-3 py-1">
              Market Intelligence
            </div>
            <nav className="space-y-0.5 mt-1">
              <NavLink to="/" end className={navLinkClass} onClick={onClose}>
                <LayoutDashboard className="w-4 h-4 shrink-0 text-emerald-700" />
                <span>{t('nav.dashboard')}</span>
              </NavLink>
              <NavLink to="/prices" className={navLinkClass} onClick={onClose}>
                <TableProperties className="w-4 h-4 shrink-0 text-emerald-700" />
                <span>{t('nav.market_prices')}</span>
              </NavLink>
              <NavLink to="/compare" className={navLinkClass} onClick={onClose}>
                <BarChart3 className="w-4 h-4 shrink-0 text-emerald-700" />
                <span>{t('nav.compare')}</span>
              </NavLink>
              <NavLink to="/trends" className={navLinkClass} onClick={onClose}>
                <TrendingUp className="w-4 h-4 shrink-0 text-emerald-700" />
                <span>{t('nav.trends')}</span>
              </NavLink>
              <NavLink to="/movers" className={navLinkClass} onClick={onClose}>
                <Activity className="w-4 h-4 shrink-0 text-emerald-700" />
                <span>{t('nav.top_movers')}</span>
              </NavLink>
              <NavLink to="/forecast" className={navLinkClass} onClick={onClose}>
                <LineChart className="w-4 h-4 shrink-0 text-emerald-700" />
                <span>{t('nav.forecast')}</span>
              </NavLink>
              <NavLink to="/anomalies" className={navLinkClass} onClick={onClose}>
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>{t('nav.anomalies')}</span>
              </NavLink>
            </nav>
          </div>

          {/* Section: Deal Marketplace */}
          <div className="mb-4">
            <div className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 px-3 py-1">
              Deal Marketplace
            </div>
            <nav className="space-y-0.5 mt-1">
              {(user?.role === 'farmer' || user?.role === 'admin') && (
                <NavLink to="/farmer-hub" className={navLinkClass} onClick={onClose}>
                  <Wheat className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>{t('nav.farmer_hub')}</span>
                </NavLink>
              )}
              {(user?.role === 'customer' || user?.role === 'admin') && (
                <NavLink to="/find-produce" className={navLinkClass} onClick={onClose}>
                  <ShoppingBag className="w-4 h-4 shrink-0 text-emerald-700" />
                  <span>{t('nav.find_produce')}</span>
                </NavLink>
              )}
              <NavLink to="/orders" className={navLinkClass} onClick={onClose}>
                <Truck className="w-4 h-4 shrink-0 text-emerald-700" />
                <span>{t('nav.my_orders')}</span>
              </NavLink>
              <NavLink to="/supply-demand" className={navLinkClass} onClick={onClose}>
                <Scale className="w-4 h-4 shrink-0 text-emerald-700" />
                <span>{t('nav.supply_demand')}</span>
              </NavLink>
            </nav>
          </div>

          {/* Section: Platform Tools */}
          <div className="mb-4">
            <div className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 px-3 py-1">
              Tools & System
            </div>
            <nav className="space-y-0.5 mt-1">
              <NavLink to="/alerts" className={navLinkClass} onClick={onClose}>
                <Bell className="w-4 h-4 shrink-0 text-emerald-700" />
                <span>{t('nav.alerts')}</span>
              </NavLink>
              {user?.role === 'admin' && (
                <NavLink to="/admin" className={navLinkClass} onClick={onClose}>
                  <Settings className="w-4 h-4 shrink-0 text-emerald-700" />
                  <span>{t('nav.admin')}</span>
                </NavLink>
              )}
              <NavLink to="/about" className={navLinkClass} onClick={onClose}>
                <Info className="w-4 h-4 shrink-0 text-emerald-700" />
                <span>{t('nav.about')}</span>
              </NavLink>
              <NavLink to="/login" className={navLinkClass} onClick={onClose}>
                <UserCheck className="w-4 h-4 shrink-0 text-emerald-700" />
                <span>Sign In / Register</span>
              </NavLink>
            </nav>
          </div>

          {/* Bottom Quick Test Persona Switcher */}
          <div className="mt-auto pt-3 border-t border-neutral-100">
            <div className="text-[10px] uppercase font-bold text-neutral-400 mb-1 flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-emerald-700" />
              <span>Quick Test Role</span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[11px]">
              {(['customer', 'farmer', 'trader', 'admin'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => switchDemoRole(r)}
                  className={`py-1 px-1.5 rounded font-medium text-center capitalize transition border ${
                    user?.role === r
                      ? 'bg-emerald-800 text-white border-emerald-800 font-semibold'
                      : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
