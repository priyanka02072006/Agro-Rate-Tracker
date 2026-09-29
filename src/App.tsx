/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import './i18n/i18n.js';
import { Header } from './components/Header.js';
import { Sidebar } from './components/Sidebar.js';
import { OfflineBanner } from './components/OfflineBanner.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { MarketPricesPage } from './pages/MarketPricesPage.js';
import { ComparePage } from './pages/ComparePage.js';
import { TrendsPage } from './pages/TrendsPage.js';
import { TopMoversPage } from './pages/TopMoversPage.js';
import { ForecastPage } from './pages/ForecastPage.js';
import { AnomaliesPage } from './pages/AnomaliesPage.js';
import { FarmerHubPage } from './pages/FarmerHubPage.js';
import { FindProducePage } from './pages/FindProducePage.js';
import { OrdersPage } from './pages/OrdersPage.js';
import { SupplyDemandPage } from './pages/SupplyDemandPage.js';
import { AlertsPage } from './pages/AlertsPage.js';
import { AdminPage } from './pages/AdminPage.js';
import { AboutPage } from './pages/AboutPage.js';
import { LoginPage } from './pages/LoginPage.js';
import {
  LayoutDashboard,
  TableProperties,
  ShoppingBag,
  Bell,
  MoreHorizontal,
  Wheat,
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#FAFAF7] text-neutral-900 flex flex-col font-sans">
      <OfflineBanner />
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 p-3 md:p-6 pb-20 md:pb-8 w-full overflow-x-hidden">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/prices" element={<MarketPricesPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/trends" element={<TrendsPage />} />
            <Route path="/movers" element={<TopMoversPage />} />
            <Route path="/forecast" element={<ForecastPage />} />
            <Route path="/anomalies" element={<AnomaliesPage />} />
            <Route path="/farmer-hub" element={<FarmerHubPage />} />
            <Route path="/find-produce" element={<FindProducePage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/supply-demand" element={<SupplyDemandPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </main>
      </div>

      {/* Mobile Bottom Tab Bar (min 44px tap targets for mobile usability) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-40 flex items-center justify-around h-14 px-2 shadow-lg">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center justify-center min-w-[56px] min-h-[44px] text-[10px] font-semibold transition ${
              isActive ? 'text-emerald-900' : 'text-neutral-500'
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/prices"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center min-w-[56px] min-h-[44px] text-[10px] font-semibold transition ${
              isActive ? 'text-emerald-900' : 'text-neutral-500'
            }`
          }
        >
          <TableProperties className="w-5 h-5 mb-0.5" />
          <span>Prices</span>
        </NavLink>

        <NavLink
          to={user?.role === 'farmer' ? '/farmer-hub' : '/find-produce'}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center min-w-[56px] min-h-[44px] text-[10px] font-semibold transition ${
              isActive ? 'text-emerald-900' : 'text-neutral-500'
            }`
          }
        >
          {user?.role === 'farmer' ? (
            <Wheat className="w-5 h-5 mb-0.5 text-amber-600" />
          ) : (
            <ShoppingBag className="w-5 h-5 mb-0.5 text-emerald-700" />
          )}
          <span>{user?.role === 'farmer' ? 'Produce' : 'Deals'}</span>
        </NavLink>

        <NavLink
          to="/alerts"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center min-w-[56px] min-h-[44px] text-[10px] font-semibold transition ${
              isActive ? 'text-emerald-900' : 'text-neutral-500'
            }`
          }
        >
          <Bell className="w-5 h-5 mb-0.5" />
          <span>Alerts</span>
        </NavLink>

        <button
          onClick={() => setSidebarOpen(true)}
          className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] text-[10px] font-semibold text-neutral-500 hover:text-neutral-900"
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5" />
          <span>Menu</span>
        </button>
      </nav>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}
