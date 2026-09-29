import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { Order, OrderEvent } from '../types/client.js';
import {
  Truck,
  CheckCircle2,
  PackageCheck,
  Clock,
  MapPin,
  Calendar,
  AlertCircle,
  Check,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export const OrdersPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadOrders = () => {
    setLoading(true);
    api
      .getOrders()
      .then((res) => {
        setOrders(res.orders);
        if (res.orders.length > 0 && !selectedOrder) {
          loadOrderDetail(res.orders[0].id);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const loadOrderDetail = (orderId: string) => {
    api
      .getOrderDetail(orderId)
      .then((res) => {
        setSelectedOrder(res.order);
        setEvents(res.events);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    loadOrders();
  }, [user]);

  const handleConfirmReceipt = async (orderId: string) => {
    setConfirmingId(orderId);
    try {
      const res = await api.confirmReceipt(orderId);
      setMessage(`Receipt confirmed for Order ${orderId}! Transaction completed.`);
      loadOrders();
      loadOrderDetail(orderId);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setConfirmingId(null);
    }
  };

  const statusOrder = ['confirmed', 'packed', 'dispatched', 'in_transit', 'delivered', 'completed'];

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900">
            {t('nav.my_orders')}
          </h1>
          <p className="text-xs text-neutral-500">
            End-to-end logistics tracking and milestone verifications from farm gate to delivery
          </p>
        </div>
      </div>

      {message && (
        <div className="bg-emerald-100 text-emerald-900 px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between border border-emerald-300">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="font-bold">
            ×
          </button>
        </div>
      )}

      {/* Main Grid: Orders List (Left) + Tracking Stepper (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Orders Cards List */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider px-1">
            Active & Past Orders ({orders.length})
          </div>

          {loading ? (
            <div className="bg-white p-8 rounded-xl border border-neutral-200 text-center text-xs text-neutral-400">
              Loading orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-neutral-200 text-center text-xs text-neutral-500">
              No orders found. Accept a deal in 'Find Produce' to initiate your first order.
            </div>
          ) : (
            orders.map((ord) => {
              const isSelected = selectedOrder?.id === ord.id;
              const isCompleted = ord.status === 'completed' || ord.status === 'delivered';

              return (
                <div
                  key={ord.id}
                  onClick={() => loadOrderDetail(ord.id)}
                  className={`bg-white p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-emerald-800 ring-2 ring-emerald-800/10 shadow-sm'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-neutral-900 text-xs">
                          {ord.id}
                        </span>
                        {ord.is_demo && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900">
                            Demo
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-neutral-900 mt-1">
                        {ord.crop} ({ord.quantity} {ord.unit})
                      </h4>
                      <div className="text-xs text-neutral-500 mt-0.5">
                        Farmer: {ord.farmer_name}
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        ord.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : ord.status === 'in_transit'
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {ord.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="pt-2 mt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
                    <span className="text-neutral-500">Total Landed:</span>
                    <span className="font-mono font-bold text-emerald-950">
                      ₹{ord.total_amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Detailed Tracking Stepper Timeline */}
        <div className="lg:col-span-2">
          {selectedOrder ? (
            <div className="bg-white rounded-xl border border-neutral-200 shadow-xs p-5 md:p-6 space-y-6">
              {/* Stepper Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-neutral-900">
                      Logistics Timeline: {selectedOrder.id}
                    </h2>
                    {selectedOrder.is_demo && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                        Demo Data
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {selectedOrder.crop} ({selectedOrder.variety} · {selectedOrder.grade}) —{' '}
                    <strong className="text-neutral-800 font-mono">
                      {selectedOrder.quantity} {selectedOrder.unit}
                    </strong>
                  </p>
                </div>

                {/* Customer Confirm Receipt Button */}
                {selectedOrder.status === 'delivered' && (
                  <button
                    onClick={() => handleConfirmReceipt(selectedOrder.id)}
                    disabled={confirmingId === selectedOrder.id}
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {confirmingId === selectedOrder.id
                        ? 'Completing...'
                        : 'Confirm Produce Receipt & Complete'}
                    </span>
                  </button>
                )}
              </div>

              {/* Order Meta Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                <div>
                  <span className="text-[10px] text-neutral-400 block">Buyer</span>
                  <span className="font-semibold text-neutral-900 mt-0.5 block">
                    {selectedOrder.customer_name}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block">Grower / Farmer</span>
                  <span className="font-semibold text-neutral-900 mt-0.5 block">
                    {selectedOrder.farmer_name}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block">Expected Arrival</span>
                  <span className="font-mono font-semibold text-neutral-900 mt-0.5 block">
                    {selectedOrder.expected_delivery_date}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block">Total Amount</span>
                  <span className="font-mono font-bold text-emerald-900 mt-0.5 block">
                    ₹{selectedOrder.total_amount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Vertical Stepper Timeline */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-bold uppercase text-neutral-400 tracking-wider">
                  Transit Events & Milestones
                </h3>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-200">
                  {events.map((ev, idx) => (
                    <div key={ev.id || idx} className="relative group">
                      {/* Stepper Dot */}
                      <span className="absolute -left-[27px] top-0.5 w-4 h-4 rounded-full bg-emerald-800 border-2 border-white shadow-xs flex items-center justify-center text-white">
                        <Check className="w-2.5 h-2.5" />
                      </span>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-neutral-900 capitalize">
                            {ev.status.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            {new Date(ev.created_at).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold capitalize">
                            by {ev.actor_role}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-600 mt-1 bg-white p-2.5 rounded-lg border border-neutral-200 leading-relaxed shadow-xs">
                          {ev.note}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center text-xs text-neutral-400">
              Select an order on the left to inspect its timeline and logistics events.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
