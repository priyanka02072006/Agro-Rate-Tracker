import { db } from '../db.js';
import { Notification } from '../types.js';

export function evaluatePriceAlerts(): number {
  let triggeredCount = 0;
  const now = new Date().toISOString();

  for (const alert of db.priceAlerts) {
    if (!alert.active) continue;

    const matchedPrices = db.agroPrices.filter(
      (p) =>
        p.crop.toLowerCase() === alert.crop.toLowerCase() &&
        (!alert.state || p.state.toLowerCase() === alert.state.toLowerCase()) &&
        (!alert.market || p.market.toLowerCase() === alert.market.toLowerCase())
    );

    if (matchedPrices.length === 0) continue;

    // Get latest modal price
    matchedPrices.sort((a, b) => b.arrival_date.localeCompare(a.arrival_date));
    const latest = matchedPrices[0];

    let triggered = false;
    let reason = '';

    if (alert.condition === 'above' && latest.modal_price >= alert.threshold) {
      triggered = true;
      reason = `${alert.crop} modal price reached ₹${latest.modal_price}/quintal in ${latest.market}, above your alert threshold of ₹${alert.threshold}`;
    } else if (alert.condition === 'below' && latest.modal_price <= alert.threshold) {
      triggered = true;
      reason = `${alert.crop} modal price dropped to ₹${latest.modal_price}/quintal in ${latest.market}, below your alert threshold of ₹${alert.threshold}`;
    } else if (alert.condition === 'change_pct' && matchedPrices.length >= 2) {
      const prev = matchedPrices[1];
      const pct = Math.abs(((latest.modal_price - prev.modal_price) / prev.modal_price) * 100);
      if (pct >= alert.threshold) {
        triggered = true;
        reason = `${alert.crop} modal price shifted by ${Math.round(pct)}% (₹${prev.modal_price} → ₹${latest.modal_price}) in ${latest.market}`;
      }
    }

    if (triggered) {
      alert.last_triggered_at = now;
      triggeredCount++;

      const notif: Notification = {
        id: `notif-alert-${Date.now()}-${triggeredCount}`,
        user_id: alert.user_id,
        type: 'price_alert',
        title: `Mandi Price Alert: ${alert.crop}`,
        message: reason,
        read: false,
        created_at: now,
      };

      db.notifications.unshift(notif);
    }
  }

  if (triggeredCount > 0) {
    db.persist();
  }

  return triggeredCount;
}
