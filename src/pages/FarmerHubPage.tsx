import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { FarmerListing, Order } from '../types/client.js';
import {
  Wheat,
  PlusCircle,
  PackageCheck,
  PauseCircle,
  PlayCircle,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  Calendar,
  AlertCircle,
  ShieldCheck,
  Info,
} from 'lucide-react';

export const FarmerHubPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, formatPrice } = useAuth();

  const [listings, setListings] = useState<FarmerListing[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [crop, setCrop] = useState('Tomato');
  const [variety, setVariety] = useState('Hybrid / Deshi');
  const [grade, setGrade] = useState('FAQ');
  const [quantity, setQuantity] = useState('50');
  const [unit, setUnit] = useState<'quintal' | 'kg' | 'tonne'>('quintal');
  const [askingPrice, setAskingPrice] = useState('2200');
  const [availableFrom, setAvailableFrom] = useState('2026-09-28');
  const [availableUntil, setAvailableUntil] = useState('2026-10-15');
  const [state, setState] = useState(user?.state || 'Tamil Nadu');
  const [district, setDistrict] = useState(user?.district || 'Krishnagiri');

  // Market reference chip data
  const [marketRef, setMarketRef] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Order status update state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<string>('packed');
  const [statusNote, setStatusNote] = useState<string>('');

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.getListings({ farmerId: user?.id, all: true }),
      api.getOrders(),
    ])
      .then(([lRes, oRes]) => {
        setListings(lRes.listings);
        setOrders(oRes.orders.filter((o) => o.farmer_id === user?.id || user?.role === 'admin'));
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Load market reference when crop or state changes
  useEffect(() => {
    api
      .getMarketReference(crop, state)
      .then(setMarketRef)
      .catch(() => setMarketRef(null));
  }, [crop, state]);

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createListing({
        crop,
        variety,
        grade,
        quantity: Number(quantity),
        unit,
        asking_price_per_unit: Number(askingPrice),
        available_from: availableFrom,
        available_until: availableUntil,
        state,
        district,
      });
      setMessage('Produce listed successfully! Buyers can now discover your lot.');
      setShowAddForm(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to list produce');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (listingId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      await api.updateListingStatus(listingId, nextStatus);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateOrderStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      await api.updateOrderStatus(selectedOrder.id, newStatus, statusNote);
      setSelectedOrder(null);
      setStatusNote('');
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900">
              {t('nav.farmer_hub')}
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold border border-emerald-300">
              விவசாயி மையம் (Farmer Hub)
            </span>
          </div>
          <p className="text-xs text-neutral-500">
            List fresh harvested crops, check real-time mandi benchmark prices, and fulfill buyer purchase orders
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{showAddForm ? 'Close Form' : 'Add Produce Listing (பயிர் சேர்க்கவும்)'}</span>
        </button>
      </div>

      {/* Microsoft Edge Local Storage Confirmation Notice */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-2.5 text-xs text-emerald-950">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-emerald-800 text-white flex items-center justify-center text-sm shrink-0">
            🌾
          </span>
          <div>
            <div className="font-bold flex items-center gap-1.5">
              <span>Microsoft Edge Local Storage Active</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-900 text-[10px] font-semibold">
                Auto-Login Permanent
              </span>
            </div>
            <div className="text-[11px] text-emerald-800">
              உங்கள் கணக்கு இந்த சாதனத்தில் (Microsoft Edge) சேமிக்கப்பட்டுள்ளது — மீண்டும் உள்நுழைய வேண்டியதில்லை!
            </div>
          </div>
        </div>
        <div className="text-[11px] font-medium text-emerald-800 bg-white/80 border border-emerald-200 px-2.5 py-1 rounded-lg">
          Logged in as: <strong>{user?.name}</strong> ({user?.district || 'Tamil Nadu'})
        </div>
      </div>

      {message && (
        <div className="bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs px-4 py-2.5 rounded-lg flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="font-bold">
            ×
          </button>
        </div>
      )}

      {/* Produce Listing Wizard / Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreateListing}
          className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm space-y-4"
        >
          <div className="border-b border-neutral-100 pb-3">
            <h2 className="text-sm font-bold text-neutral-900">List Produce for Direct Sale</h2>
            <p className="text-xs text-neutral-500">
              List available harvest stock. The system matches buyers without middleman cuts.
            </p>
          </div>

          {/* Market Reference Benchmark Chip */}
          {marketRef && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-950 font-medium">
                <Info className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  <strong>Market Reference Benchmark:</strong> Latest {crop} modal rate in {state} is{' '}
                  <strong className="font-mono text-emerald-900">
                    {formatPrice(marketRef.latestModal).formatted}
                  </strong>{' '}
                  (7-Day Avg: {formatPrice(marketRef.avg7dModal).formatted})
                </span>
              </div>
              <span className="text-[10px] text-emerald-700 italic">Informational only</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {/* Commodity */}
            <div>
              <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">
                Commodity / Crop
              </label>
              <select
                value={crop}
                onChange={(e) => setCrop(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 font-medium"
              >
                {['Tomato', 'Onion', 'Potato', 'Wheat', 'Rice (Paddy)', 'Green Chilli', 'Cotton', 'Mustard', 'Banana', 'Turmeric'].map(
                  (c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* Variety */}
            <div>
              <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">
                Variety
              </label>
              <input
                type="text"
                value={variety}
                onChange={(e) => setVariety(e.target.value)}
                placeholder="e.g. Hybrid / Deshi"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2"
                required
              />
            </div>

            {/* Grade */}
            <div>
              <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">
                Quality Grade
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2"
              >
                <option value="FAQ">FAQ (Fair Average Quality)</option>
                <option value="A-Grade">A-Grade / Premium</option>
                <option value="Organic Certified">Organic Certified</option>
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">
                Available Quantity
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 font-mono"
                required
              />
            </div>

            {/* Unit */}
            <div>
              <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as any)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 font-medium"
              >
                <option value="quintal">Quintal (100 kg)</option>
                <option value="kg">Kilogram (kg)</option>
                <option value="tonne">Metric Tonne (1,000 kg)</option>
              </select>
            </div>

            {/* Asking Price */}
            <div>
              <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">
                Asking Price per {unit} (₹)
              </label>
              <input
                type="number"
                min="1"
                value={askingPrice}
                onChange={(e) => setAskingPrice(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 font-mono font-bold text-emerald-950"
                required
              />
            </div>

            {/* Available From */}
            <div>
              <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">
                Harvest Available From
              </label>
              <input
                type="date"
                value={availableFrom}
                onChange={(e) => setAvailableFrom(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 font-mono"
                required
              />
            </div>

            {/* Available Until */}
            <div>
              <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">
                Available Until
              </label>
              <input
                type="date"
                value={availableUntil}
                onChange={(e) => setAvailableUntil(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 font-mono"
                required
              />
            </div>

            {/* Location (State & District) */}
            <div>
              <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">
                Farm District & State
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="District"
                  className="w-1/2 bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-2"
                  required
                />
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="State"
                  className="w-1/2 bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-2"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-neutral-200 text-neutral-600 rounded-lg text-xs font-semibold hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Save & Publish Listing'}
            </button>
          </div>
        </form>
      )}

      {/* Active Listings Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-neutral-900">Your Active & Listed Produce Lots</h2>
          <span className="text-xs text-neutral-400">Total Listings: {listings.length}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((l) => (
            <div
              key={l.id}
              className="bg-white rounded-xl border border-neutral-200 shadow-xs p-4 space-y-3 hover:border-emerald-300 transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-neutral-900 text-sm">{l.crop}</h3>
                    {l.is_demo && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                        {t('labels.demo_badge')}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-neutral-500 mt-0.5">
                    {l.variety} · {l.grade}
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    l.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : l.status === 'paused'
                      ? 'bg-neutral-100 text-neutral-700 border border-neutral-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}
                >
                  {l.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-neutral-50 p-2.5 rounded-lg border border-neutral-100">
                <div>
                  <span className="text-[10px] text-neutral-400 block">Stock Remaining</span>
                  <span className="font-mono font-bold text-neutral-900 mt-0.5 block">
                    {l.quantity_available} {l.unit}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block">Asking Rate</span>
                  <span className="font-mono font-bold text-emerald-800 mt-0.5 block">
                    ₹{l.asking_price_per_unit}/{l.unit}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-neutral-500 space-y-1">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                  <span>
                    {l.district}, {l.state}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[10px]">
                  <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                  <span>
                    Window: {l.available_from} to {l.available_until}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
                <button
                  onClick={() => handleToggleStatus(l.id, l.status)}
                  className="text-neutral-600 hover:text-neutral-900 font-semibold flex items-center gap-1"
                >
                  {l.status === 'active' ? (
                    <>
                      <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Pause Listing</span>
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Resume Listing</span>
                    </>
                  )}
                </button>
                <span className="text-[10px] text-neutral-400 font-mono">ID: {l.id}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Orders & Logistics Stepper Section */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div>
            <h2 className="text-sm font-bold text-neutral-900">Purchase Orders & Logistics Fulfillment</h2>
            <p className="text-xs text-neutral-500">
              Orders confirmed by buyers. Update transit milestones as harvest is packed and dispatched.
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
            {orders.length} Orders Active
          </span>
        </div>

        {orders.length === 0 ? (
          <p className="text-xs text-neutral-400 py-6 text-center">
            No confirmed orders yet. Buyers will appear here when they accept matching deals.
          </p>
        ) : (
          <div className="space-y-4">
            {orders.map((ord) => (
              <div
                key={ord.id}
                className="bg-neutral-50/70 border border-neutral-200 rounded-xl p-4 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-neutral-900 font-mono text-sm">{ord.id}</span>
                      <span className="text-xs font-semibold text-neutral-700">· {ord.crop}</span>
                      {ord.is_demo && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                          Demo Order
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-neutral-500 mt-0.5">
                      Buyer: <strong className="text-neutral-800">{ord.customer_name}</strong> · Qty:{' '}
                      <strong className="font-mono text-neutral-900">
                        {ord.quantity} {ord.unit}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs font-bold font-mono text-emerald-900 block">
                        ₹{ord.total_amount.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-neutral-400">Total Landed Amount</span>
                    </div>

                    <button
                      onClick={() => setSelectedOrder(ord)}
                      className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Update Logistics</span>
                    </button>
                  </div>
                </div>

                {/* Progress Stepper */}
                <div className="pt-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-500">
                    <span className={ord.status === 'confirmed' ? 'text-emerald-700 font-bold' : ''}>
                      1. Confirmed
                    </span>
                    <span className={ord.status === 'packed' ? 'text-emerald-700 font-bold' : ''}>
                      2. Packed
                    </span>
                    <span className={ord.status === 'dispatched' ? 'text-emerald-700 font-bold' : ''}>
                      3. Dispatched
                    </span>
                    <span className={ord.status === 'in_transit' ? 'text-emerald-700 font-bold' : ''}>
                      4. In Transit
                    </span>
                    <span className={ord.status === 'delivered' ? 'text-emerald-700 font-bold' : ''}>
                      5. Delivered
                    </span>
                    <span className={ord.status === 'completed' ? 'text-emerald-700 font-bold' : ''}>
                      6. Completed
                    </span>
                  </div>
                  <div className="w-full bg-neutral-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-700 h-full rounded-full transition-all duration-300"
                      style={{
                        width:
                          ord.status === 'confirmed'
                            ? '16%'
                            : ord.status === 'packed'
                            ? '35%'
                            : ord.status === 'dispatched'
                            ? '52%'
                            : ord.status === 'in_transit'
                            ? '70%'
                            : ord.status === 'delivered'
                            ? '88%'
                            : '100%',
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Logistics Update Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleUpdateOrderStatus}
            className="w-full max-w-md bg-white rounded-xl shadow-2xl p-5 border border-neutral-200 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Update Logistics Milestone</h3>
                <span className="text-[11px] text-neutral-500 font-mono">
                  Order {selectedOrder.id} ({selectedOrder.crop})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="text-neutral-400 hover:text-neutral-900 font-bold"
              >
                ×
              </button>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">
                New Tracking Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 font-semibold"
              >
                <option value="packed">Packed (Graded & Crating Complete)</option>
                <option value="dispatched">Dispatched (Loaded on Agricultural Transport)</option>
                <option value="in_transit">In Transit (Vehicle on Highway)</option>
                <option value="delivered">Delivered (Arrived at Destination Mandi / Buyer)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">
                Logistics Dispatch Note
              </label>
              <textarea
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="e.g. 50 boxes sorted and loaded on vehicle TN-24-B-8891 leaving Krishnagiri hub."
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 h-20"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-3 py-1.5 border border-neutral-200 text-neutral-600 rounded-lg font-semibold hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg font-semibold"
              >
                Save & Notify Buyer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
