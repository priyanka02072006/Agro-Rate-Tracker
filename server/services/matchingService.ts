import { db } from '../db.js';
import {
  CustomerRequirement,
  FarmerListing,
  DealProposal,
  ScoreBreakdown,
  UnitType,
} from '../types.js';
import { findDistrictCentroid, haversineDistanceKm } from '../data/districtCentroids.js';

export function normalizeQuantityToTonnes(quantity: number, unit: UnitType): number {
  if (unit === 'tonne') return quantity;
  if (unit === 'quintal') return quantity * 0.1; // 1 quintal = 100 kg = 0.1 tonne
  return quantity * 0.001; // 1 kg = 0.001 tonne
}

export function normalizePricePerUnit(
  price: number,
  fromUnit: UnitType,
  toUnit: UnitType
): number {
  if (fromUnit === toUnit) return price;
  // Convert fromUnit to per kg first
  let pricePerKg = price;
  if (fromUnit === 'quintal') pricePerKg = price / 100;
  else if (fromUnit === 'tonne') pricePerKg = price / 1000;

  // Convert kg to toUnit
  if (toUnit === 'kg') return pricePerKg;
  if (toUnit === 'quintal') return pricePerKg * 100;
  return pricePerKg * 1000;
}

export function calculateDeliveryCostEstimate(
  distanceKm: number,
  tonnes: number
): { deliveryCost: number; baseFee: number; perKmTonneRate: number } {
  const baseFee = db.settings.delivery_base_fee;
  const perKmTonneRate = db.settings.delivery_per_km_tonne;
  // Formula: base_fee + (per_km_tonne * distance * tonnes)
  const variableFee = perKmTonneRate * distanceKm * Math.max(tonnes, 0.1);
  const total = Math.round(baseFee + variableFee);
  return { deliveryCost: total, baseFee, perKmTonneRate };
}

export function getMarketModalReference(crop: string, state: string): { latestModal: number; avg7dModal: number } {
  const normCrop = crop.trim().toLowerCase();
  const normState = state.trim().toLowerCase();

  const prices = db.agroPrices.filter(
    (p) => p.crop.toLowerCase() === normCrop && p.state.toLowerCase() === normState
  );

  if (prices.length === 0) {
    const nationalPrices = db.agroPrices.filter((p) => p.crop.toLowerCase() === normCrop);
    if (nationalPrices.length === 0) return { latestModal: 2200, avg7dModal: 2200 };
    const latest = nationalPrices[nationalPrices.length - 1].modal_price;
    return { latestModal: latest, avg7dModal: latest };
  }

  // Sort by arrival date desc
  prices.sort((a, b) => b.arrival_date.localeCompare(a.arrival_date));
  const latestModal = prices[0].modal_price;
  const last7 = prices.slice(0, 7);
  const avg7dModal = Math.round(
    last7.reduce((acc, curr) => acc + curr.modal_price, 0) / last7.length
  );

  return { latestModal, avg7dModal };
}

interface CandidateEvaluation {
  listing: FarmerListing;
  distanceKm: number;
  deliveryCost: number;
  normalizedPrice: number; // in customer's required unit
  rawPrice: number;
  rawDistance: number;
  rawQuantityFit: number;
  rawAvailabilityFit: number;
  rawFeasibility: number;
}

export function matchFarmersForRequirement(
  requirement: CustomerRequirement
): { proposals: DealProposal[]; preferredMatchFound: boolean; note?: string } {
  const customerCentroid = findDistrictCentroid(
    requirement.delivery_state,
    requirement.delivery_district
  );

  const reqDate = new Date(requirement.required_by_date);
  const tonnes = normalizeQuantityToTonnes(requirement.quantity, requirement.unit);

  const marketRef = getMarketModalReference(
    requirement.crop,
    requirement.delivery_state
  );
  // Convert market reference to requirement unit (market price is in per quintal)
  const marketRefForReqUnit = normalizePricePerUnit(
    marketRef.latestModal,
    'quintal',
    requirement.unit
  );

  const rejectedIds = new Set(requirement.rejected_farmer_ids || []);

  // 1. Check Preferred Farmer first if provided
  if (requirement.preferred_farmer_id) {
    const preferredListing = db.farmerListings.find(
      (l) =>
        l.farmer_id === requirement.preferred_farmer_id &&
        l.crop.toLowerCase() === requirement.crop.toLowerCase() &&
        l.status === 'active' &&
        l.quantity_available >= requirement.quantity &&
        l.available_from <= requirement.required_by_date &&
        l.available_until >= requirement.required_by_date &&
        (!requirement.max_budget_per_unit ||
          normalizePricePerUnit(l.asking_price_per_unit, l.unit, requirement.unit) <=
            requirement.max_budget_per_unit)
    );

    if (preferredListing) {
      const farmerCentroid = findDistrictCentroid(
        preferredListing.state,
        preferredListing.district
      );
      const dist = haversineDistanceKm(
        farmerCentroid.latitude,
        farmerCentroid.longitude,
        customerCentroid.latitude,
        customerCentroid.longitude
      );
      const { deliveryCost } = calculateDeliveryCostEstimate(dist, tonnes);
      const unitPrice = normalizePricePerUnit(
        preferredListing.asking_price_per_unit,
        preferredListing.unit,
        requirement.unit
      );
      const totalCost = Math.round(unitPrice * requirement.quantity + deliveryCost);

      const expiresAt = new Date(
        Date.now() + db.settings.proposal_expiry_hours * 3600 * 1000
      ).toISOString();

      const proposal: DealProposal = {
        id: `DEAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        requirement_id: requirement.id,
        listing_id: preferredListing.id,
        farmer_id: preferredListing.farmer_id,
        farmer_name: preferredListing.farmer_name,
        customer_id: requirement.customer_id,
        customer_name: requirement.customer_name,
        crop: preferredListing.crop,
        variety: preferredListing.variety,
        grade: preferredListing.grade,
        quantity: requirement.quantity,
        unit: requirement.unit,
        price_per_unit: unitPrice,
        distance_km: dist,
        delivery_cost_estimate: deliveryCost,
        total_cost: totalCost,
        match_score: 95,
        score_breakdown: {
          priceScore: 95,
          distanceScore: 90,
          quantityScore: 100,
          availabilityScore: 100,
          feasibilityScore: 95,
          priceWeight: db.settings.weight_price,
          distanceWeight: db.settings.weight_distance,
          quantityWeight: db.settings.weight_quantity,
          availabilityWeight: db.settings.weight_availability,
          feasibilityWeight: db.settings.weight_feasibility,
          marketModalReference: marketRefForReqUnit,
          priceDeltaVsMarket: Math.round(unitPrice - marketRefForReqUnit),
        },
        is_alternative: false,
        forecast_trend_note: 'Stable market price estimated over next 7 days based on recent arrivals.',
        status: 'proposed',
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
      };

      return { proposals: [proposal], preferredMatchFound: true };
    }
  }

  // 2. Alternative Farmer Search (Matching Algorithm)
  const normCrop = requirement.crop.toLowerCase();
  const eligibleListings = db.farmerListings.filter((l) => {
    if (l.crop.toLowerCase() !== normCrop) return false;
    if (l.status !== 'active') return false;
    if (l.quantity_available < requirement.quantity) return false; // hard filter: adequate stock
    if (l.available_from > requirement.required_by_date) return false; // hard filter: available in time
    if (l.available_until < requirement.required_by_date) return false;
    if (rejectedIds.has(l.farmer_id)) return false; // exclude rejected farmers

    const priceInReqUnit = normalizePricePerUnit(l.asking_price_per_unit, l.unit, requirement.unit);
    if (requirement.max_budget_per_unit && priceInReqUnit > requirement.max_budget_per_unit) {
      return false; // budget respected
    }
    return true;
  });

  if (eligibleListings.length === 0) {
    return {
      proposals: [],
      preferredMatchFound: false,
      note: 'No matching farmer found for your requirements. Try adjusting the quantity, date, or location.',
    };
  }

  // Evaluate candidates
  const evaluated: CandidateEvaluation[] = eligibleListings.map((l) => {
    const fCoord = findDistrictCentroid(l.state, l.district);
    const dist = haversineDistanceKm(
      fCoord.latitude,
      fCoord.longitude,
      customerCentroid.latitude,
      customerCentroid.longitude
    );
    const { deliveryCost } = calculateDeliveryCostEstimate(dist, tonnes);
    const priceInReqUnit = normalizePricePerUnit(
      l.asking_price_per_unit,
      l.unit,
      requirement.unit
    );

    // Raw metrics
    const rawPrice = priceInReqUnit; // lower is better
    const rawDistance = dist; // lower is better
    // Quantity fit: ratio of requested to available (closer to 1.0 or exact stock without excess waste)
    const rawQuantityFit = Math.min(requirement.quantity / l.quantity_available, 1.0);
    // Availability fit: days buffer before required date
    const availStart = new Date(l.available_from).getTime();
    const daysBuffer = Math.max(0, (reqDate.getTime() - availStart) / (1000 * 3600 * 24));
    const rawAvailabilityFit = Math.min(daysBuffer / 10, 1.0);
    // Feasibility: transit time based on distance (assume 400km/day). If dist <= 800km feasibility is high
    const rawFeasibility = Math.max(0, 1 - dist / 2000);

    return {
      listing: l,
      distanceKm: dist,
      deliveryCost,
      normalizedPrice: priceInReqUnit,
      rawPrice,
      rawDistance,
      rawQuantityFit,
      rawAvailabilityFit,
      rawFeasibility,
    };
  });

  // Min-max normalization bounds
  const minPrice = Math.min(...evaluated.map((e) => e.rawPrice));
  const maxPrice = Math.max(...evaluated.map((e) => e.rawPrice));
  const minDistance = Math.min(...evaluated.map((e) => e.rawDistance));
  const maxDistance = Math.max(...evaluated.map((e) => e.rawDistance));

  const proposals: DealProposal[] = evaluated.map((cand) => {
    // Normalization (0 - 100, where higher is better)
    const priceScore =
      maxPrice === minPrice ? 100 : Math.round(((maxPrice - cand.rawPrice) / (maxPrice - minPrice)) * 100);

    const distanceScore =
      maxDistance === minDistance
        ? 100
        : Math.round(((maxDistance - cand.rawDistance) / (maxDistance - minDistance)) * 100);

    const quantityScore = Math.round(cand.rawQuantityFit * 100);
    const availabilityScore = Math.round(cand.rawAvailabilityFit * 100);
    const feasibilityScore = Math.round(cand.rawFeasibility * 100);

    const wPrice = db.settings.weight_price;
    const wDist = db.settings.weight_distance;
    const wQty = db.settings.weight_quantity;
    const wAvail = db.settings.weight_availability;
    const wFeas = db.settings.weight_feasibility;
    const totalWeights = wPrice + wDist + wQty + wAvail + wFeas;

    const weightedScore = Math.round(
      (priceScore * wPrice +
        distanceScore * wDist +
        quantityScore * wQty +
        availabilityScore * wAvail +
        feasibilityScore * wFeas) /
        totalWeights
    );

    const totalCost = Math.round(cand.normalizedPrice * requirement.quantity + cand.deliveryCost);
    const expiresAt = new Date(
      Date.now() + db.settings.proposal_expiry_hours * 3600 * 1000
    ).toISOString();

    const priceDelta = Math.round(cand.normalizedPrice - marketRefForReqUnit);

    return {
      id: `DEAL-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      requirement_id: requirement.id,
      listing_id: cand.listing.id,
      farmer_id: cand.listing.farmer_id,
      farmer_name: cand.listing.farmer_name,
      customer_id: requirement.customer_id,
      customer_name: requirement.customer_name,
      crop: cand.listing.crop,
      variety: cand.listing.variety,
      grade: cand.listing.grade,
      quantity: requirement.quantity,
      unit: requirement.unit,
      price_per_unit: cand.normalizedPrice,
      distance_km: cand.distanceKm,
      delivery_cost_estimate: cand.deliveryCost,
      total_cost: totalCost,
      match_score: weightedScore,
      score_breakdown: {
        priceScore,
        distanceScore,
        quantityScore,
        availabilityScore,
        feasibilityScore,
        priceWeight: wPrice,
        distanceWeight: wDist,
        quantityWeight: wQty,
        availabilityWeight: wAvail,
        feasibilityWeight: wFeas,
        marketModalReference: marketRefForReqUnit,
        priceDeltaVsMarket: priceDelta,
      },
      is_alternative: true,
      forecast_trend_note: 'Estimated price trend based on historical mandi arrivals (Estimate, not guaranteed).',
      status: 'proposed',
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    };
  });

  // Sort by match_score descending, return top 3
  proposals.sort((a, b) => b.match_score - a.match_score);
  const top3 = proposals.slice(0, 3);

  return { proposals: top3, preferredMatchFound: false };
}
