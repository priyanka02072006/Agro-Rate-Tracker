import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { AgroPriceRecord, Pagination } from '../types/client.js';
import { VoiceSearchInput } from '../components/VoiceSearchInput.js';
import {
  Download,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  BookmarkPlus,
  BellRing,
  RotateCcw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export const MarketPricesPage: React.FC = () => {
  const { t } = useTranslation();
  const { formatPrice, user } = useAuth();

  // Filters state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedMarket, setSelectedMarket] = useState('');
  const [selectedVariety, setSelectedVariety] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState('arrival_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  // Data & Options
  const [records, setRecords] = useState<AgroPriceRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    pageSize: 25,
    totalPages: 1,
  });
  const [filterOptions, setFilterOptions] = useState<{
    crops: string[];
    states: string[];
    districts: string[];
    markets: string[];
    varieties: string[];
    grades: string[];
  }>({ crops: [], states: [], districts: [], markets: [], varieties: [], grades: [] });

  const [loading, setLoading] = useState(true);
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);

  // Selected row for detail drawer
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<{
    record: AgroPriceRecord & { price_range: number };
    mini_trend: Array<{ date: string; modal_price: number; min_price: number; max_price: number }>;
  } | null>(null);

  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Load cascading filter options
  useEffect(() => {
    api
      .getFilterOptions({
        state: selectedState || undefined,
        district: selectedDistrict || undefined,
        crop: selectedCrop || undefined,
      })
      .then(setFilterOptions)
      .catch((err) => console.error(err));
  }, [selectedState, selectedDistrict, selectedCrop]);

  // Fetch prices
  useEffect(() => {
    setLoading(true);
    api
      .getPrices({
        search: debouncedSearch,
        crop: selectedCrop,
        state: selectedState,
        district: selectedDistrict,
        market: selectedMarket,
        variety: selectedVariety,
        grade: selectedGrade,
        dateFrom,
        dateTo,
        minPrice,
        maxPrice,
        sortBy,
        sortOrder,
        page,
        limit,
      })
      .then((res) => {
        setRecords(res.data);
        setPagination(res.pagination);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [
    debouncedSearch,
    selectedCrop,
    selectedState,
    selectedDistrict,
    selectedMarket,
    selectedVariety,
    selectedGrade,
    dateFrom,
    dateTo,
    minPrice,
    maxPrice,
    sortBy,
    sortOrder,
    page,
    limit,
  ]);

  // Handle Sort
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedCrop('');
    setSelectedState('');
    setSelectedDistrict('');
    setSelectedMarket('');
    setSelectedVariety('');
    setSelectedGrade('');
    setDateFrom('');
    setDateTo('');
    setMinPrice('');
    setMaxPrice('');
    setPage(1);
  };

  // Open detail drawer
  const handleRowClick = (id: string) => {
    setActiveRecordId(id);
    api
      .getPriceDetail(id)
      .then(setDetailData)
      .catch((err) => console.error(err));
  };

  const handleAddToWatchlist = async (crop: string, market: string, state: string) => {
    if (!user) return;
    try {
      await api.addToWatchlist({ crop, market, state });
      setActionMessage(`Added ${crop} (${market}) to Watchlist.`);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      setActionMessage(err.message || 'Already in watchlist.');
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  const handleSetAlert = async (crop: string, market: string, state: string, currentModal: number) => {
    if (!user) return;
    try {
      await api.createAlert({
        crop,
        market,
        state,
        condition: 'above',
        threshold: Math.round(currentModal * 1.1),
      });
      setActionMessage(`Alert set: notify when ${crop} exceeds ₹${Math.round(currentModal * 1.1)}/quintal.`);
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err: any) {
      setActionMessage(err.message || 'Alert setup failed.');
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  // Active filter chips list
  const activeFilters = [
    selectedCrop && { label: `Crop: ${selectedCrop}`, clear: () => setSelectedCrop('') },
    selectedState && {
      label: `State: ${selectedState}`,
      clear: () => {
        setSelectedState('');
        setSelectedDistrict('');
        setSelectedMarket('');
      },
    },
    selectedDistrict && {
      label: `District: ${selectedDistrict}`,
      clear: () => {
        setSelectedDistrict('');
        setSelectedMarket('');
      },
    },
    selectedMarket && { label: `Market: ${selectedMarket}`, clear: () => setSelectedMarket('') },
    selectedVariety && { label: `Variety: ${selectedVariety}`, clear: () => setSelectedVariety('') },
    dateFrom && { label: `From: ${dateFrom}`, clear: () => setDateFrom('') },
    dateTo && { label: `To: ${dateTo}`, clear: () => setDateTo('') },
  ].filter(Boolean) as Array<{ label: string; clear: () => void }>;

  return (
    <div className="space-y-4 pb-12 max-w-7xl mx-auto">
      {/* Title & Top Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900">
            {t('nav.market_prices')}
          </h1>
          <p className="text-xs text-neutral-500">
            Near-real-time daily agricultural mandi rates from Agmarknet across Indian states
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`/api/prices/export-csv?crop=${selectedCrop}&state=${selectedState}&district=${selectedDistrict}&market=${selectedMarket}&dateFrom=${dateFrom}&dateTo=${dateTo}`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-lg shadow-xs transition"
            download
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('labels.export_csv')}</span>
          </a>

          <button
            onClick={() => setShowFiltersDrawer(!showFiltersDrawer)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-800" />
            <span>{t('labels.filter')}</span>
            {activeFilters.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-800 text-white text-[10px] font-bold flex items-center justify-center font-mono">
                {activeFilters.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Global Search & Quick Dropdowns Bar */}
      <div className="bg-white p-3 rounded-xl border border-neutral-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          {/* Voice Search Bar */}
          <div className="md:col-span-2">
            <VoiceSearchInput value={search} onChange={setSearch} />
          </div>

          {/* Quick Crop Selector */}
          <div>
            <select
              value={selectedCrop}
              onChange={(e) => {
                setSelectedCrop(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-2 text-neutral-800 focus:outline-emerald-700"
            >
              <option value="">{t('labels.all_crops')}</option>
              {filterOptions.crops.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Quick State Selector (Cascading) */}
          <div>
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setSelectedDistrict('');
                setSelectedMarket('');
                setPage(1);
              }}
              className="w-full text-xs bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-2 text-neutral-800 focus:outline-emerald-700"
            >
              <option value="">{t('labels.all_states')}</option>
              {filterOptions.states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Collapsible Advanced Filters Drawer */}
        {showFiltersDrawer && (
          <div className="pt-3 border-t border-neutral-100 grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
            {/* District */}
            <div>
              <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                District
              </label>
              <select
                value={selectedDistrict}
                onChange={(e) => {
                  setSelectedDistrict(e.target.value);
                  setSelectedMarket('');
                  setPage(1);
                }}
                className="w-full bg-neutral-50 border border-neutral-200 rounded px-2 py-1.5"
              >
                <option value="">{t('labels.all_districts')}</option>
                {filterOptions.districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Mandi Market */}
            <div>
              <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                Mandi Market
              </label>
              <select
                value={selectedMarket}
                onChange={(e) => {
                  setSelectedMarket(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-neutral-50 border border-neutral-200 rounded px-2 py-1.5"
              >
                <option value="">{t('labels.all_markets')}</option>
                {filterOptions.markets.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Variety */}
            <div>
              <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                Variety
              </label>
              <select
                value={selectedVariety}
                onChange={(e) => {
                  setSelectedVariety(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-neutral-50 border border-neutral-200 rounded px-2 py-1.5"
              >
                <option value="">All Varieties</option>
                {filterOptions.varieties.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                Arrival Date From
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-neutral-50 border border-neutral-200 rounded px-2 py-1.5 font-mono text-xs"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                Arrival Date To
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-neutral-50 border border-neutral-200 rounded px-2 py-1.5 font-mono text-xs"
              />
            </div>
          </div>
        )}

        {/* Filter Chips Bar */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-neutral-100 text-xs">
            <span className="text-[11px] font-semibold text-neutral-400">Active Filters:</span>
            {activeFilters.map((chip, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium text-[11px]"
              >
                {chip.label}
                <button onClick={chip.clear} className="hover:text-emerald-950">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button
              onClick={handleClearFilters}
              className="text-[11px] text-neutral-500 hover:text-neutral-900 underline ml-2"
            >
              {t('labels.clear_filters')}
            </button>
          </div>
        )}
      </div>

      {actionMessage && (
        <div className="bg-emerald-100 text-emerald-900 px-4 py-2 rounded-lg text-xs font-semibold border border-emerald-200">
          {actionMessage}
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-600 font-semibold uppercase text-[10px] tracking-wider sticky top-0 z-10">
              <tr>
                <th
                  onClick={() => handleSort('crop')}
                  className="py-3 px-3.5 cursor-pointer hover:text-neutral-900 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Commodity</span>
                    {sortBy === 'crop' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('state')}
                  className="py-3 px-3.5 cursor-pointer hover:text-neutral-900 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>State</span>
                    {sortBy === 'state' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('district')}
                  className="py-3 px-3.5 cursor-pointer hover:text-neutral-900 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>District</span>
                    {sortBy === 'district' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('market')}
                  className="py-3 px-3.5 cursor-pointer hover:text-neutral-900 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Mandi Market</span>
                    {sortBy === 'market' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                  </div>
                </th>
                <th className="py-3 px-3.5 hidden md:table-cell">Variety / Grade</th>
                <th
                  onClick={() => handleSort('arrival_date')}
                  className="py-3 px-3.5 cursor-pointer hover:text-neutral-900 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Arrival Date</span>
                    {sortBy === 'arrival_date' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('min_price')}
                  className="py-3 px-3.5 text-right cursor-pointer hover:text-neutral-900 select-none"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Min</span>
                    {sortBy === 'min_price' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('max_price')}
                  className="py-3 px-3.5 text-right cursor-pointer hover:text-neutral-900 select-none"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Max</span>
                    {sortBy === 'max_price' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('modal_price')}
                  className="py-3 px-3.5 text-right cursor-pointer hover:text-neutral-900 select-none font-bold"
                >
                  <div className="flex items-center justify-end gap-1 text-emerald-950">
                    <span>Modal Price</span>
                    {sortBy === 'modal_price' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                  </div>
                </th>
                <th className="py-3 px-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-neutral-400">
                    Loading mandi price records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center">
                    <p className="text-neutral-500 font-medium">{t('messages.no_records')}</p>
                    <button
                      onClick={handleClearFilters}
                      className="mt-2 text-xs font-semibold text-emerald-800 underline"
                    >
                      {t('labels.clear_filters')}
                    </button>
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => handleRowClick(r.id)}
                    className="hover:bg-emerald-50/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3.5 font-semibold text-neutral-900">{r.crop}</td>
                    <td className="py-3 px-3.5 text-neutral-600">{r.state}</td>
                    <td className="py-3 px-3.5 text-neutral-600">{r.district}</td>
                    <td className="py-3 px-3.5 font-medium text-neutral-800">{r.market}</td>
                    <td className="py-3 px-3.5 text-neutral-500 hidden md:table-cell">
                      {r.variety} · <span className="text-[10px]">{r.grade}</span>
                    </td>
                    <td className="py-3 px-3.5 text-neutral-500 font-mono text-[11px]">
                      {r.arrival_date}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-neutral-600">
                      {formatPrice(r.min_price).formatted}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-neutral-600">
                      {formatPrice(r.max_price).formatted}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-900">
                      {formatPrice(r.modal_price).formatted}
                    </td>
                    <td className="py-3 px-2 text-center text-neutral-400">
                      <ChevronRight className="w-4 h-4 mx-auto" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Server-side Pagination Footer */}
        <div className="px-4 py-3 bg-neutral-50 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="text-neutral-500">
            Showing{' '}
            <strong className="text-neutral-800 font-mono">
              {Math.min(pagination.total, (pagination.page - 1) * pagination.pageSize + 1)}
            </strong>{' '}
            to{' '}
            <strong className="text-neutral-800 font-mono">
              {Math.min(pagination.total, pagination.page * pagination.pageSize)}
            </strong>{' '}
            of <strong className="text-neutral-800 font-mono">{pagination.total}</strong> records
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-neutral-500">
              <span>Rows per page:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-white border border-neutral-300 rounded px-1.5 py-0.5 text-xs font-medium"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-2.5 py-1 bg-white border border-neutral-200 rounded font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-100"
              >
                Prev
              </button>
              <span className="px-2 font-mono font-semibold text-neutral-700">
                {page} / {pagination.totalPages || 1}
              </span>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-2.5 py-1 bg-white border border-neutral-200 rounded font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-100"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Record Detail Drawer Modal */}
      {activeRecordId && detailData && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-end p-0">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl p-6 overflow-y-auto space-y-5 animate-in slide-in-from-right duration-200">
            <div className="flex items-start justify-between pb-3 border-b border-neutral-200">
              <div>
                <span className="text-[11px] font-semibold text-neutral-400 font-mono">
                  {detailData.record.id}
                </span>
                <h3 className="text-xl font-bold text-neutral-900 mt-0.5">
                  {detailData.record.crop} · {detailData.record.market}
                </h3>
                <div className="text-xs text-neutral-500">
                  {detailData.record.district}, {detailData.record.state}
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveRecordId(null);
                  setDetailData(null);
                }}
                className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Price Metric Cards */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
                <span className="text-[10px] text-neutral-500 uppercase font-medium">Min Price</span>
                <div className="text-sm font-bold font-mono mt-0.5">
                  {formatPrice(detailData.record.min_price).formatted}
                </div>
              </div>
              <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                <span className="text-[10px] text-emerald-800 uppercase font-bold">Modal Price</span>
                <div className="text-base font-bold font-mono text-emerald-950 mt-0.5">
                  {formatPrice(detailData.record.modal_price).formatted}
                </div>
              </div>
              <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
                <span className="text-[10px] text-neutral-500 uppercase font-medium">Max Price</span>
                <div className="text-sm font-bold font-mono mt-0.5">
                  {formatPrice(detailData.record.max_price).formatted}
                </div>
              </div>
            </div>

            {/* Detailed Metadata Grid */}
            <div className="space-y-2 text-xs bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
              <div className="flex justify-between py-1 border-b border-neutral-200/60">
                <span className="text-neutral-500">Variety</span>
                <span className="font-semibold text-neutral-800">{detailData.record.variety}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-200/60">
                <span className="text-neutral-500">Grade</span>
                <span className="font-semibold text-neutral-800">{detailData.record.grade}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-200/60">
                <span className="text-neutral-500">Arrival Date</span>
                <span className="font-mono text-neutral-800">{detailData.record.arrival_date}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-200/60">
                <span className="text-neutral-500">Price Spread (Max - Min)</span>
                <span className="font-mono font-semibold text-neutral-800">
                  {formatPrice(detailData.record.price_range).formatted}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-neutral-500">Source Feed</span>
                <span className="font-medium text-emerald-800 capitalize">
                  {detailData.record.source.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Mini Trend for this Market */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-neutral-800">
                Recent 10-Day Mandi Price Trend
              </h4>
              <div className="h-44 w-full bg-neutral-50 p-2 rounded-xl border border-neutral-200">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={detailData.mini_trend}>
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={(d) => d.slice(5)} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip
                      formatter={(v: any) => [formatPrice(v).formatted, 'Modal Price']}
                    />
                    <Line
                      type="monotone"
                      dataKey="modal_price"
                      stroke="#166534"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() =>
                  handleAddToWatchlist(
                    detailData.record.crop,
                    detailData.record.market,
                    detailData.record.state
                  )
                }
                className="flex-1 py-2 text-xs font-semibold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded-lg flex items-center justify-center gap-1.5 transition"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span>Watchlist</span>
              </button>
              <button
                onClick={() =>
                  handleSetAlert(
                    detailData.record.crop,
                    detailData.record.market,
                    detailData.record.state,
                    detailData.record.modal_price
                  )
                }
                className="flex-1 py-2 text-xs font-semibold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg flex items-center justify-center gap-1.5 transition"
              >
                <BellRing className="w-3.5 h-3.5 text-emerald-800" />
                <span>Set Price Alert</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
