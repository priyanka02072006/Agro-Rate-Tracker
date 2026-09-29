import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { getAuthenticatedUser } from './auth.js';
import {
  FarmerListing,
  CustomerRequirement,
  Order,
  OrderEvent,
  Notification,
  UnitType,
} from '../types.js';
import { findDistrictCentroid } from '../data/districtCentroids.js';
import {
  matchFarmersForRequirement,
  getMarketModalReference,
  normalizePricePerUnit,
} from '../services/matchingService.js';
import { getSupplyDemandOverview, getSalesAnalytics } from '../services/analyticsService.js';

export const marketplaceRouter = Router();

// GET /api/marketplace/market-reference
marketplaceRouter.get('/market-reference', (req: Request, res: Response) => {
  const { crop = 'Tomato', state = 'Tamil Nadu' } = req.query;
  const ref = getMarketModalReference(String(crop), String(state));
  return res.json({
    crop,
    state,
    latestModal: ref.latestModal,
    avg7dModal: ref.avg7dModal,
    unit: 'Rs per quintal',
    note: 'Informational mandi benchmark from recent Agmarknet records.',
  });
});

// GET /api/marketplace/listings
marketplaceRouter.get('/listings', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  const { crop, farmerId } = req.query;

  let listings = db.farmerListings;

  // If user is a farmer and didn't specify other filters, show their own listings first
  if (farmerId) {
    listings = listings.filter((l) => l.farmer_id === String(farmerId));
  } else if (user && user.role === 'farmer' && !req.query.all) {
    listings = listings.filter((l) => l.farmer_id === user.id);
  }

  if (crop) {
    listings = listings.filter((l) => l.crop.toLowerCase() === String(crop).toLowerCase());
  }

  return res.json({ listings });
});

// POST /api/marketplace/listings
// Farmer adds new produce listing
marketplaceRouter.post('/listings', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== 'farmer') {
    return res.status(403).json({ error: 'Only registered farmers can create produce listings.' });
  }

  const {
    crop,
    variety,
    grade,
    quantity,
    unit = 'quintal',
    asking_price_per_unit,
    available_from,
    available_until,
    state,
    district,
  } = req.body;

  if (!crop || !quantity || !asking_price_per_unit || !available_from || !available_until) {
    return res.status(400).json({ error: 'Please provide all required listing details.' });
  }

  const listingState = state || user.state || 'Tamil Nadu';
  const listingDistrict = district || user.district || 'Krishnagiri';
  const centroid = findDistrictCentroid(listingState, listingDistrict);

  const newListing: FarmerListing = {
    id: `listing-${Date.now()}`,
    farmer_id: user.id,
    farmer_name: user.name,
    crop: String(crop).trim(),
    variety: String(variety || 'FAQ').trim(),
    grade: String(grade || 'FAQ').trim(),
    quantity_available: Number(quantity),
    initial_quantity: Number(quantity),
    unit: unit as UnitType,
    asking_price_per_unit: Number(asking_price_per_unit),
    state: listingState,
    district: listingDistrict,
    latitude: centroid.latitude,
    longitude: centroid.longitude,
    available_from: String(available_from),
    available_until: String(available_until),
    status: 'active',
    is_demo: false,
    created_at: new Date().toISOString(),
  };

  db.farmerListings.unshift(newListing);
  db.persist();

  return res.status(201).json({
    listing: newListing,
    message: 'Produce listing created successfully.',
  });
});

// PUT /api/marketplace/listings/:id/status
marketplaceRouter.put('/listings/:id/status', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  const { status } = req.body;

  const listing = db.farmerListings.find((l) => l.id === req.params.id);
  if (!listing) {
    return res.status(404).json({ error: 'Listing not found.' });
  }

  if (user && user.role !== 'admin' && listing.farmer_id !== user.id) {
    return res.status(403).json({ error: 'You do not have permission to modify this listing.' });
  }

  if (!['active', 'paused', 'sold_out'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value.' });
  }

  listing.status = status;
  db.persist();

  return res.json({ listing, message: `Listing is now ${status}.` });
});

// POST /api/marketplace/requirements
// Customer submits requirement -> trigger matching
marketplaceRouter.post('/requirements', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user || (user.role !== 'customer' && user.role !== 'admin')) {
    return res.status(403).json({ error: 'Please sign in as a customer to submit produce requirements.' });
  }

  const {
    crop,
    quantity,
    unit = 'quintal',
    delivery_state,
    delivery_district,
    required_by_date,
    max_budget_per_unit,
    preferred_farmer_id,
  } = req.body;

  if (!crop || !quantity || !required_by_date) {
    return res.status(400).json({ error: 'Crop, quantity, and required delivery date are required.' });
  }

  const dState = delivery_state || user.state || 'Tamil Nadu';
  const dDistrict = delivery_district || user.district || 'Chennai';
  const centroid = findDistrictCentroid(dState, dDistrict);

  const reqId = `req-${Date.now()}`;
  const requirement: CustomerRequirement = {
    id: reqId,
    customer_id: user.id,
    customer_name: user.name,
    crop: String(crop).trim(),
    quantity: Number(quantity),
    unit: unit as UnitType,
    delivery_state: dState,
    delivery_district: dDistrict,
    latitude: centroid.latitude,
    longitude: centroid.longitude,
    required_by_date: String(required_by_date),
    max_budget_per_unit: max_budget_per_unit ? Number(max_budget_per_unit) : undefined,
    preferred_farmer_id: preferred_farmer_id || undefined,
    status: 'open',
    rejected_farmer_ids: [],
    created_at: new Date().toISOString(),
  };

  // Run matching
  const matchResult = matchFarmersForRequirement(requirement);

  if (matchResult.proposals.length > 0) {
    requirement.status = 'matched';
    // Save proposals in DB
    for (const prop of matchResult.proposals) {
      db.dealProposals.push(prop);
    }
  } else {
    requirement.status = 'no_match';
  }

  db.customerRequirements.unshift(requirement);
  db.persist();

  return res.status(201).json({
    requirement,
    proposals: matchResult.proposals,
    preferredMatchFound: matchResult.preferredMatchFound,
    note: matchResult.note,
  });
});

// GET /api/marketplace/requirements/my
marketplaceRouter.get('/requirements/my', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Please sign in to view your requirements.' });
  }

  const reqs =
    user.role === 'admin'
      ? db.customerRequirements
      : db.customerRequirements.filter((r) => r.customer_id === user.id);

  return res.json({ requirements: reqs });
});

// GET /api/marketplace/proposals/:requirementId
marketplaceRouter.get('/proposals/:requirementId', (req: Request, res: Response) => {
  const proposals = db.dealProposals.filter(
    (p) => p.requirement_id === req.params.requirementId && p.status === 'proposed'
  );
  return res.json({ proposals });
});

// POST /api/marketplace/proposals/:id/accept
// Concurrency safe accept with listing row-lock
marketplaceRouter.post('/proposals/:id/accept', async (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }

  const proposal = db.dealProposals.find((p) => p.id === req.params.id);
  if (!proposal) {
    return res.status(404).json({ error: 'Deal proposal not found.' });
  }

  if (proposal.status !== 'proposed') {
    return res.status(400).json({ error: `This deal proposal is already ${proposal.status}.` });
  }

  // Row-level lock on listing to prevent overselling race conditions
  try {
    const result = await db.withListingLock(proposal.listing_id, async () => {
      const listing = db.farmerListings.find((l) => l.id === proposal.listing_id);
      if (!listing) {
        throw new Error('Associated farmer listing no longer exists.');
      }

      if (listing.status !== 'active') {
        throw new Error('This listing has been paused or is no longer active.');
      }

      if (listing.quantity_available < proposal.quantity) {
        throw new Error(
          `Insufficient inventory: remaining stock is ${listing.quantity_available} ${listing.unit}, but deal requested ${proposal.quantity} ${proposal.unit}.`
        );
      }

      // Decrement inventory atomically
      listing.quantity_available -= proposal.quantity;
      if (listing.quantity_available <= 0) {
        listing.quantity_available = 0;
        listing.status = 'sold_out';
      }

      proposal.status = 'accepted';

      // Create Order
      const orderId = `ORD-${Date.now().toString().slice(-6)}`;
      const newOrder: Order = {
        id: orderId,
        deal_id: proposal.id,
        customer_id: proposal.customer_id,
        customer_name: proposal.customer_name,
        farmer_id: proposal.farmer_id,
        farmer_name: proposal.farmer_name,
        crop: proposal.crop,
        variety: proposal.variety,
        grade: proposal.grade,
        quantity: proposal.quantity,
        unit: proposal.unit,
        price_per_unit: proposal.price_per_unit,
        delivery_cost: proposal.delivery_cost_estimate,
        total_amount: proposal.total_cost,
        status: 'confirmed',
        expected_delivery_date: new Date(Date.now() + 3 * 24 * 3600 * 1000)
          .toISOString()
          .split('T')[0],
        is_demo: listing.is_demo,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      db.orders.unshift(newOrder);

      // Create initial order event
      const initialEvent: OrderEvent = {
        id: `ev-${Date.now()}`,
        order_id: orderId,
        status: 'confirmed',
        note: `Deal accepted. Order created for ${proposal.quantity} ${proposal.unit} of ${proposal.crop} from ${proposal.farmer_name}.`,
        actor_role: 'customer',
        created_at: new Date().toISOString(),
      };
      db.orderEvents.push(initialEvent);

      // Notify Farmer
      db.notifications.unshift({
        id: `notif-${Date.now()}-1`,
        user_id: proposal.farmer_id,
        type: 'deal',
        title: 'New Deal Confirmed!',
        message: `${proposal.customer_name} accepted your deal for ${proposal.quantity} ${proposal.unit} of ${proposal.crop}. Order ${orderId} confirmed.`,
        read: false,
        created_at: new Date().toISOString(),
      });

      // Notify Customer
      db.notifications.unshift({
        id: `notif-${Date.now()}-2`,
        user_id: proposal.customer_id,
        type: 'order',
        title: 'Purchase Order Confirmed',
        message: `Your order ${orderId} with ${proposal.farmer_name} has been placed. Inventory secured.`,
        read: false,
        created_at: new Date().toISOString(),
      });

      db.persist();
      return { order: newOrder };
    });

    return res.json({
      success: true,
      message: 'Deal accepted successfully! Inventory locked and order confirmed.',
      order: result.order,
    });
  } catch (err: any) {
    return res.status(409).json({ error: err.message || 'Deal acceptance failed.' });
  }
});

// POST /api/marketplace/proposals/:id/reject
// Customer rejects deal -> search next alternative
marketplaceRouter.post('/proposals/:id/reject', (req: Request, res: Response) => {
  const proposal = db.dealProposals.find((p) => p.id === req.params.id);
  if (!proposal) {
    return res.status(404).json({ error: 'Proposal not found.' });
  }

  proposal.status = 'rejected';

  // Exclude rejected farmer in requirement
  const requirement = db.customerRequirements.find((r) => r.id === proposal.requirement_id);
  if (requirement) {
    if (!requirement.rejected_farmer_ids) requirement.rejected_farmer_ids = [];
    requirement.rejected_farmer_ids.push(proposal.farmer_id);

    // Re-run matching to fetch next alternatives
    const rematch = matchFarmersForRequirement(requirement);
    if (rematch.proposals.length > 0) {
      for (const p of rematch.proposals) {
        db.dealProposals.push(p);
      }
      db.persist();
      return res.json({
        message: 'Deal proposal declined. Found new alternative matching farmers.',
        hasAlternatives: true,
        nextProposals: rematch.proposals,
      });
    } else {
      requirement.status = 'no_match';
      db.persist();
      return res.json({
        message: 'Deal proposal declined. No further alternative farmers found matching your criteria.',
        hasAlternatives: false,
        nextProposals: [],
      });
    }
  }

  db.persist();
  return res.json({ message: 'Deal rejected.', hasAlternatives: false, nextProposals: [] });
});

// GET /api/marketplace/orders
marketplaceRouter.get('/orders', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Please sign in to view orders.' });
  }

  let orders = db.orders;
  if (user.role === 'farmer') {
    orders = orders.filter((o) => o.farmer_id === user.id);
  } else if (user.role === 'customer') {
    orders = orders.filter((o) => o.customer_id === user.id);
  }
  // Admin and Trader can view all orders for market transparency

  return res.json({ orders });
});

// GET /api/marketplace/orders/:id
marketplaceRouter.get('/orders/:id', (req: Request, res: Response) => {
  const order = db.orders.find((o) => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  const events = db.orderEvents
    .filter((e) => e.order_id === order.id)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  return res.json({ order, events });
});

// POST /api/marketplace/orders/:id/update-status
// Farmer updates logistics status
marketplaceRouter.post('/orders/:id/update-status', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  const { status, note } = req.body;

  const order = db.orders.find((o) => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  const validStatuses = ['packed', 'dispatched', 'in_transit', 'delivered', 'completed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid order tracking status.' });
  }

  order.status = status;
  order.updated_at = new Date().toISOString();

  const event: OrderEvent = {
    id: `ev-${Date.now()}`,
    order_id: order.id,
    status,
    note: note || `Status updated to ${status}.`,
    actor_role: user ? user.role : 'farmer',
    created_at: new Date().toISOString(),
  };

  db.orderEvents.push(event);

  // Notify customer
  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    user_id: order.customer_id,
    type: 'order',
    title: `Order ${order.id}: ${status.replace('_', ' ').toUpperCase()}`,
    message: event.note,
    read: false,
    created_at: new Date().toISOString(),
  });

  db.persist();
  return res.json({ order, event, message: 'Order status updated successfully.' });
});

// POST /api/marketplace/orders/:id/confirm-receipt
// Customer completes order
marketplaceRouter.post('/orders/:id/confirm-receipt', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  const order = db.orders.find((o) => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  order.status = 'completed';
  order.updated_at = new Date().toISOString();

  const event: OrderEvent = {
    id: `ev-${Date.now()}`,
    order_id: order.id,
    status: 'completed',
    note: 'Customer confirmed receipt of produce in good condition. Transaction completed.',
    actor_role: 'customer',
    created_at: new Date().toISOString(),
  };

  db.orderEvents.push(event);

  // Notify farmer
  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    user_id: order.farmer_id,
    type: 'order',
    title: `Order ${order.id} Completed`,
    message: `${order.customer_name} confirmed receipt. Transaction is complete!`,
    read: false,
    created_at: new Date().toISOString(),
  });

  db.persist();
  return res.json({ order, message: 'Receipt confirmed and order completed.' });
});

// GET /api/marketplace/supply-demand
marketplaceRouter.get('/supply-demand', (req: Request, res: Response) => {
  const data = getSupplyDemandOverview();
  return res.json({ data, includes_demo_data: true });
});

// GET /api/marketplace/sales-analytics
marketplaceRouter.get('/sales-analytics', (req: Request, res: Response) => {
  const data = getSalesAnalytics();
  return res.json(data);
});
