import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { DealProposal, FarmerListing } from '../types/client.js';
import {
  ShoppingBag,
  Search,
  Sparkles,
  MapPin,
  Truck,
  CheckCircle,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ShieldCheck,
  Wheat,
  Clock,
  ArrowRight,
} from 'lucide-react';

export const FindProducePage: React.FC = () => {
  const { t } = useTranslation();
  const { user, formatPrice } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [crop, setCrop] = useState('Tomato');
  const [quantity, setQuantity] = useState('10');
  const [unit, setUnit] = useState<'quintal' | 'kg' | 'tonne'>('quintal');
  const [deliveryState, setDeliveryState] = useState(user?.state || 'Tamil Nadu');
  const [deliveryDistrict, setDeliveryDistrict] = useState(user?.district || 'Chennai');
  const [requiredByDate, setRequiredByDate] = useState('2026-10-04');
  const [maxBudget, setMaxBudget] = useState('2400');
  const [preferredFarmerId, setPreferredFarmerId] = useState('');

  const [farmersList, setFarmersList] = useState<FarmerListing[]>([]);
  const [matchingState, setMatchingState] = useState<'idle' | 'searching' | 'results' | 'no_match'>('idle');
  const [proposals, setProposals] = useState<DealProposal[]>([]);
  const [preferredMatchFound, setPreferredMatchFound] = useState(false);
  const [statusNote, setStatusNote] = useState<string | null>(null);

  // Expanded score breakdowns
  const [expandedBreakdown, setExpandedBreakdown] = useState<Record<string, boolean>>({});
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successOrder, setSuccessOrder] = useState<any | null>(null);

  useEffect(() => {
    api.getListings({ all: true }).then((res) => {
      setFarmersList(res.listings.filter((l) => l.status === 'active'));
    });
  }, []);

  const handleSearchDeals = async (e: React.FormEvent) => {
    e.preventDefault();
    setMatchingState('searching');
    setErrorMessage(null);
    setSuccessOrder(null);

    try {
      // Simulate quick search feedback
      setTimeout(async () => {
        try {
          const res = await api.submitRequirement({
            crop,
            quantity: Number(quantity),
            unit,
            delivery_state: deliveryState,
            delivery_district: deliveryDistrict,
            required_by_date: requiredByDate,
            max_budget_per_unit: maxBudget ? Number(maxBudget) : undefined,
            preferred_farmer_id: preferredFarmerId || undefined,
          });

          if (res.proposals && res.proposals.length > 0) {
            setProposals(res.proposals);
            setPreferredMatchFound(res.preferredMatchFound);
            setStatusNote(res.note || null);
            setMatchingState('results');
          } else {
            setProposals([]);
            setStatusNote(
              res.note ||
                'No matching farmer found for your requirements. Try adjusting the quantity, date, or location.'
            );
            setMatchingState('no_match');
          }
        } catch (err: any) {
          setErrorMessage(err.message || 'Matching request failed.');
          setMatchingState('idle');
        }
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message);
      setMatchingState('idle');
    }
  };

  const handleAcceptDeal = async (proposalId: string) => {
    setAcceptingId(proposalId);
    setErrorMessage(null);

    try {
      const res = await api.acceptProposal(proposalId);
      setSuccessOrder(res.order);
      setMatchingState('idle');
    } catch (err: any) {
      setErrorMessage(err.message || 'Deal acceptance failed.');
    } finally {
      setAcceptingId(null);
    }
  };

  const handleRejectDeal = async (proposalId: string) => {
    setRejectingId(proposalId);
    setErrorMessage(null);

    try {
      const res = await api.rejectProposal(proposalId);
      if (res.hasAlternatives && res.nextProposals.length > 0) {
        setProposals(res.nextProposals);
        setStatusNote('Proposal declined. Displaying next best alternative candidate.');
      } else {
        setProposals([]);
        setMatchingState('no_match');
        setStatusNote('All available farmer candidates for this requirement were evaluated.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reject deal.');
    } finally {
      setRejectingId(null);
    }
  };

  const toggleBreakdown = (id: string) => {
    setExpandedBreakdown((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900">
              {t('nav.find_produce')}
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold border border-emerald-300">
              Direct Farmer Matching
            </span>
          </div>
          <p className="text-xs text-neutral-500">
            Submit required commodities to discover verified farm lots with transparent delivery costing
          </p>
        </div>
      </div>

      {/* Payment Prototype Honesty Pill */}
      <div className="bg-neutral-100 border border-neutral-200 rounded-xl px-4 py-2 text-xs text-neutral-600 flex items-center justify-between">
        <span>
          <strong>Notice:</strong> {t('messages.payment_notice')} Confirmed purchase deals directly lock inventory and initiate logistics fulfillment tracking.
        </span>
      </div>

      {/* Success Order Confirmation Card */}
      {successOrder && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-5 shadow-sm space-y-3 animate-in fade-in">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-emerald-900">
              <CheckCircle className="w-5 h-5 text-emerald-700" />
              <h2 className="text-base font-bold">
                Order {successOrder.id} Placed & Inventory Secured!
              </h2>
            </div>
            <button
              onClick={() => setSuccessOrder(null)}
              className="text-neutral-400 hover:text-neutral-900"
            >
              ×
            </button>
          </div>

          <p className="text-xs text-emerald-950 leading-relaxed">
            Congratulations! Your deal with{' '}
            <strong className="font-semibold">{successOrder.farmer_name}</strong> for{' '}
            <strong className="font-mono font-semibold">
              {successOrder.quantity} {successOrder.unit} of {successOrder.crop}
            </strong>{' '}
            has been confirmed. Farmer inventory was decremented inside an atomic transaction.
          </p>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => navigate('/orders')}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
            >
              <Truck className="w-4 h-4" />
              <span>Track Delivery Logistics</span>
            </button>
            <button
              onClick={() => setSuccessOrder(null)}
              className="px-4 py-2 border border-emerald-300 text-emerald-900 rounded-lg text-xs font-semibold hover:bg-emerald-100"
            >
              Submit Another Requirement
            </button>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-300 text-rose-900 px-4 py-3 rounded-lg text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="font-bold">
            ×
          </button>
        </div>
      )}

      {/* Requirement Input Form */}
      <form
        onSubmit={handleSearchDeals}
        className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs space-y-4"
      >
        <div className="border-b border-neutral-100 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-neutral-900">
              Submit Required Agricultural Produce
            </h2>
            <p className="text-xs text-neutral-500">
              Specify your quantity, destination, and deadline. The algorithm searches registered farmers.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* Commodity */}
          <div>
            <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">
              Produce Crop
            </label>
            <select
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 font-semibold text-neutral-900"
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

          {/* Quantity */}
          <div>
            <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">
              Quantity Required
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 font-mono font-bold"
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

          {/* Delivery Location: State */}
          <div>
            <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">
              Delivery Destination State
            </label>
            <input
              type="text"
              value={deliveryState}
              onChange={(e) => setDeliveryState(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 font-medium"
              required
            />
          </div>

          {/* Delivery Location: District */}
          <div>
            <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">
              Delivery Destination District
            </label>
            <input
              type="text"
              value={deliveryDistrict}
              onChange={(e) => setDeliveryDistrict(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 font-medium"
              required
            />
          </div>

          {/* Required By Date */}
          <div>
            <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">
              Delivery Deadline (Required By)
            </label>
            <input
              type="date"
              value={requiredByDate}
              onChange={(e) => setRequiredByDate(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 font-mono"
              required
            />
          </div>

          {/* Max Budget (Optional) */}
          <div>
            <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">
              Maximum Budget per {unit} (₹, Optional)
            </label>
            <input
              type="number"
              value={maxBudget}
              onChange={(e) => setMaxBudget(e.target.value)}
              placeholder="e.g. 2500"
              className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 font-mono"
            />
          </div>

          {/* Preferred Farmer (Optional) */}
          <div className="md:col-span-2">
            <label className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">
              Preferred Farmer (Optional)
            </label>
            <select
              value={preferredFarmerId}
              onChange={(e) => setPreferredFarmerId(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2"
            >
              <option value="">No preference (Automatic Multi-Factor Search)</option>
              {farmersList.map((f) => (
                <option key={f.id} value={f.farmer_id}>
                  {f.farmer_name} ({f.crop} · {f.district}, {f.state})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-neutral-100">
          <button
            type="submit"
            disabled={matchingState === 'searching'}
            className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-2 transition disabled:opacity-50"
          >
            <Search className="w-4 h-4" />
            <span>
              {matchingState === 'searching'
                ? 'Matching Verified Farmers...'
                : 'Find & Match Farmer Deals'}
            </span>
          </button>
        </div>
      </form>

      {/* Searching State */}
      {matchingState === 'searching' && (
        <div className="bg-white p-12 text-center rounded-xl border border-neutral-200 shadow-xs space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-800 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="font-bold text-neutral-900 text-sm">
            Consulting Mandi Price Data & Farmer Inventories...
          </div>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            Evaluating active farm lots, computing Haversine transit distances, scoring pricing against
            market benchmarks, and running 7-day price forecasts.
          </p>
        </div>
      )}

      {/* No Match Notification */}
      {matchingState === 'no_match' && (
        <div className="bg-white p-8 text-center rounded-xl border border-neutral-200 shadow-xs space-y-3">
          <AlertCircle className="w-10 h-10 text-amber-600 mx-auto" />
          <h3 className="font-bold text-neutral-900 text-base">No Matching Farmer Found</h3>
          <p className="text-xs text-neutral-600 max-w-md mx-auto leading-relaxed">
            {statusNote ||
              'No matching farmer found for your requirements. Try adjusting the quantity, date, or location.'}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setMatchingState('idle')}
              className="px-4 py-2 border border-neutral-300 text-neutral-800 text-xs font-semibold rounded-lg hover:bg-neutral-50"
            >
              Edit Requirement Criteria
            </button>
          </div>
        </div>
      )}

      {/* Results: Top 3 Matching Deal Cards */}
      {matchingState === 'results' && proposals.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <span>Top Candidate Deals ({proposals.length} Found)</span>
                {preferredMatchFound && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Preferred Farmer Matched
                  </span>
                )}
              </h2>
              <p className="text-xs text-neutral-500">
                Sorted by transparent multi-factor matching score. Examine landed costs and score breakdowns.
              </p>
            </div>
            <span className="text-xs text-neutral-400 font-mono">
              Expires: {new Date(proposals[0].expires_at).toLocaleDateString()}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {proposals.map((prop, idx) => {
              const isExpanded = Boolean(expandedBreakdown[prop.id]);
              const score = prop.match_score;
              const b = prop.score_breakdown;

              return (
                <div
                  key={prop.id}
                  className="bg-white rounded-xl border-2 border-emerald-800/20 hover:border-emerald-800 shadow-md p-5 space-y-4 flex flex-col justify-between transition-all"
                >
                  <div className="space-y-3">
                    {/* Header: Farmer & Match Score */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-emerald-800">
                            Rank #{idx + 1} Candidate
                          </span>
                          {prop.is_alternative && (
                            <span className="text-[10px] font-semibold text-neutral-500 bg-neutral-100 px-1.5 py-0.2 rounded">
                              Alternative Match
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-neutral-900 mt-0.5">
                          {prop.farmer_name}
                        </h3>
                        <div className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{t('labels.approx_distance')}: </span>
                          <strong className="text-neutral-800 font-mono">{prop.distance_km} km</strong>
                        </div>
                      </div>

                      {/* Match Score Badge */}
                      <div className="text-center bg-emerald-50 border border-emerald-200 rounded-xl p-2 min-w-[62px]">
                        <span className="text-[9px] uppercase font-bold text-emerald-800 block">
                          Match
                        </span>
                        <span className="text-lg font-bold font-mono text-emerald-950">
                          {score}
                        </span>
                        <span className="text-[9px] text-emerald-700 block">/ 100</span>
                      </div>
                    </div>

                    {/* Produce Specifications */}
                    <div className="bg-neutral-50 rounded-lg p-3 text-xs space-y-1.5 border border-neutral-100">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Commodity</span>
                        <span className="font-bold text-neutral-900">{prop.crop}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Variety & Grade</span>
                        <span className="font-semibold text-neutral-800">
                          {prop.variety} ({prop.grade})
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Lot Quantity</span>
                        <span className="font-mono font-bold text-neutral-900">
                          {prop.quantity} {prop.unit}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Price per {prop.unit}</span>
                        <span className="font-mono font-bold text-emerald-900">
                          ₹{prop.price_per_unit.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Cost Breakdown */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between text-neutral-600">
                        <span>Produce Subtotal ({prop.quantity} {prop.unit})</span>
                        <span className="font-mono">
                          ₹{(prop.price_per_unit * prop.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between text-neutral-600">
                        <span className="flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5 text-neutral-400" />
                          <span>Delivery Cost (Estimate)</span>
                        </span>
                        <span className="font-mono">
                          ₹{prop.delivery_cost_estimate.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-neutral-200 flex justify-between items-baseline">
                        <span className="font-bold text-neutral-900 text-sm">TOTAL LANDED COST</span>
                        <span className="font-bold font-mono text-emerald-950 text-base">
                          ₹{prop.total_cost.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Market Benchmark Comparison Fact */}
                    <div className="bg-neutral-50 p-2.5 rounded text-[11px] text-neutral-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Market Reference Modal:</span>
                        <span className="font-mono font-semibold text-neutral-800">
                          ₹{b.marketModalReference}/{prop.unit}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Factual Difference:</span>
                        <span
                          className={`font-mono font-bold ${
                            b.priceDeltaVsMarket <= 0 ? 'text-emerald-700' : 'text-neutral-800'
                          }`}
                        >
                          {b.priceDeltaVsMarket > 0 ? `+₹${b.priceDeltaVsMarket}` : `-₹${Math.abs(b.priceDeltaVsMarket)}`}/{prop.unit}
                        </span>
                      </div>
                      <div className="text-[10px] text-neutral-400 italic pt-0.5">
                        {prop.forecast_trend_note}
                      </div>
                    </div>

                    {/* Expandable Why This Match */}
                    <div>
                      <button
                        onClick={() => toggleBreakdown(prop.id)}
                        className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1 hover:underline"
                      >
                        <HelpCircle className="w-3 h-3" />
                        <span>Why this match? (Score Breakdown)</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 bg-neutral-50 p-3 rounded-lg text-[11px] space-y-2 border border-neutral-200">
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span>Price Competitiveness (wt {b.priceWeight}%)</span>
                              <span className="font-mono font-bold">{b.priceScore}/100</span>
                            </div>
                            <div className="w-full bg-neutral-200 h-1 rounded-full overflow-hidden">
                              <div className="bg-emerald-600 h-full" style={{ width: `${b.priceScore}%` }} />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span>Proximity & Distance (wt {b.distanceWeight}%)</span>
                              <span className="font-mono font-bold">{b.distanceScore}/100</span>
                            </div>
                            <div className="w-full bg-neutral-200 h-1 rounded-full overflow-hidden">
                              <div className="bg-emerald-600 h-full" style={{ width: `${b.distanceScore}%` }} />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span>Stock Quantity Fit (wt {b.quantityWeight}%)</span>
                              <span className="font-mono font-bold">{b.quantityScore}/100</span>
                            </div>
                            <div className="w-full bg-neutral-200 h-1 rounded-full overflow-hidden">
                              <div className="bg-emerald-600 h-full" style={{ width: `${b.quantityScore}%` }} />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span>Delivery Feasibility (wt {b.feasibilityWeight}%)</span>
                              <span className="font-mono font-bold">{b.feasibilityScore}/100</span>
                            </div>
                            <div className="w-full bg-neutral-200 h-1 rounded-full overflow-hidden">
                              <div className="bg-emerald-600 h-full" style={{ width: `${b.feasibilityScore}%` }} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Accept / Reject Action Buttons */}
                  <div className="pt-3 border-t border-neutral-100 flex items-center gap-2">
                    <button
                      onClick={() => handleRejectDeal(prop.id)}
                      disabled={rejectingId === prop.id || acceptingId === prop.id}
                      className="px-3 py-2 border border-neutral-300 text-neutral-700 hover:bg-neutral-50 rounded-lg text-xs font-semibold transition disabled:opacity-40"
                    >
                      {rejectingId === prop.id ? 'Declining...' : 'Decline'}
                    </button>
                    <button
                      onClick={() => handleAcceptDeal(prop.id)}
                      disabled={acceptingId === prop.id || rejectingId === prop.id}
                      className="flex-1 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition disabled:opacity-40"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>{acceptingId === prop.id ? 'Securing Stock...' : 'Accept & Lock Deal'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
