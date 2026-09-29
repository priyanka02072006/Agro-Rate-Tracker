import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { Profile, Role } from '../types.js';
import { findDistrictCentroid } from '../data/districtCentroids.js';

export const authRouter = Router();

// Middleware to extract user from session header (Bearer or X-User-Id)
export function getAuthenticatedUser(req: Request): Profile | null {
  const authHeader = req.headers.authorization;
  let userId: string | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    userId = authHeader.substring(7).trim();
  } else if (req.headers['x-user-id']) {
    userId = String(req.headers['x-user-id']);
  }

  if (!userId) return null;
  return db.profiles.find((p) => p.id === userId || p.user_id === userId) || null;
}

// POST /api/auth/login
authRouter.post('/login', (req: Request, res: Response) => {
  const { email, password, phone, identifier } = req.body;
  const loginId = String(identifier || email || phone || '').trim();

  if (!loginId || !password) {
    return res.status(400).json({ error: 'Please provide email or mobile number and password.' });
  }

  const cleanDigits = loginId.replace(/\D/g, '');

  const user = db.profiles.find((p) => {
    const matchesEmail = p.email && p.email.toLowerCase() === loginId.toLowerCase();
    const matchesPhone = cleanDigits.length >= 6 && p.phone && p.phone.replace(/\D/g, '').includes(cleanDigits);
    return matchesEmail || matchesPhone;
  });

  if (!user || user.password_hash !== String(password)) {
    return res.status(401).json({ error: 'Incorrect email/mobile number or password.' });
  }

  const { password_hash, ...safeUser } = user;
  return res.json({
    token: user.id,
    user: safeUser,
    message: `Welcome back, ${safeUser.name}!`,
  });
});

// POST /api/auth/register
authRouter.post('/register', (req: Request, res: Response) => {
  let { name, email, password, role, state, district, phone, language, adminPasscode, organization } = req.body;

  if (!name || !password || !role) {
    return res.status(400).json({ error: 'Name, password, and role are required.' });
  }

  const normalizedRole = String(role).toLowerCase() as Role;
  if (!['farmer', 'customer', 'trader', 'admin'].includes(normalizedRole)) {
    return res.status(400).json({ error: 'Invalid role specified. Must be farmer, customer, trader, or admin.' });
  }

  // Admin verification code check
  if (normalizedRole === 'admin') {
    const validCodes = ['ADMIN2025', 'admin123', 'AGRO-ADMIN-2025', 'ROOT'];
    if (adminPasscode && !validCodes.includes(String(adminPasscode).trim())) {
      return res.status(403).json({
        error: 'Invalid Admin Security Key. Use the authorized government administrative passkey (ADMIN2025).',
      });
    }
  }

  // For farmers without email, auto-create a clean phone-based alias
  if (normalizedRole === 'farmer' && (!email || !String(email).trim())) {
    if (!phone) {
      return res.status(400).json({ error: 'Farmers must provide either a mobile number or an email address.' });
    }
    const cleanNum = String(phone).replace(/\D/g, '');
    email = `farmer.${cleanNum || Date.now()}@agrorate.in`;
  } else if (!email) {
    return res.status(400).json({ error: 'Email address is required.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  const existing = db.profiles.find(
    (p) => p.email.toLowerCase() === normalizedEmail
  );
  if (existing) {
    return res.status(409).json({ error: 'An account with this email address already exists. Please sign in.' });
  }

  const userState = state ? String(state).trim() : 'Tamil Nadu';
  const userDistrict = district ? String(district).trim() : 'Dindigul';
  const centroid = findDistrictCentroid(userState, userDistrict);

  const newUser: Profile = {
    id: `user-${normalizedRole}-${Date.now()}`,
    user_id: `user-${normalizedRole}-${Date.now()}`,
    name: String(name).trim() + (organization ? ` (${String(organization).trim()})` : ''),
    email: normalizedEmail,
    password_hash: String(password),
    role: normalizedRole,
    state: userState,
    district: userDistrict,
    latitude: centroid.latitude,
    longitude: centroid.longitude,
    phone: phone ? String(phone).trim() : undefined,
    language: (language as 'en' | 'hi' | 'ta') || (normalizedRole === 'farmer' ? 'ta' : 'en'),
    created_at: new Date().toISOString(),
  };

  db.profiles.push(newUser);
  db.persist();

  const { password_hash, ...safeUser } = newUser;
  return res.status(201).json({
    token: newUser.id,
    user: safeUser,
    message: `Account created successfully for ${safeUser.name} as ${normalizedRole}.`,
  });
});

// GET /api/auth/me
authRouter.get('/me', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }
  const { password_hash, ...safeUser } = user;
  return res.json({ user: safeUser });
});

// PUT /api/auth/profile
authRouter.put('/profile', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }

  const { name, state, district, phone, language } = req.body;
  if (name) user.name = String(name).trim();
  if (state) user.state = String(state).trim();
  if (district) {
    user.district = String(district).trim();
    const c = findDistrictCentroid(user.state, user.district);
    user.latitude = c.latitude;
    user.longitude = c.longitude;
  }
  if (phone !== undefined) user.phone = String(phone).trim();
  if (language && ['en', 'hi', 'ta'].includes(language)) {
    user.language = language;
  }

  db.persist();
  const { password_hash, ...safeUser } = user;
  return res.json({ user: safeUser, message: 'Profile updated successfully.' });
});

// POST /api/auth/switch-demo
// Convenient fast role switch for evaluation
authRouter.post('/switch-demo', (req: Request, res: Response) => {
  const { role } = req.body;
  let targetUser: Profile | undefined;

  if (role === 'farmer') {
    targetUser = db.profiles.find((p) => p.email === 'farmer.ramesh@agrorate.in');
  } else if (role === 'customer') {
    targetUser = db.profiles.find((p) => p.email === 'customer.priya@agrorate.in');
  } else if (role === 'trader') {
    targetUser = db.profiles.find((p) => p.email === 'trader.anand@agrorate.in');
  } else if (role === 'admin') {
    targetUser = db.profiles.find((p) => p.email === 'admin@agrorate.gov.in');
  }

  if (!targetUser) {
    return res.status(404).json({ error: `Demo user for role ${role} not found.` });
  }

  const { password_hash, ...safeUser } = targetUser;
  return res.json({
    token: targetUser.id,
    user: safeUser,
    message: `Switched to ${safeUser.name} (${safeUser.role}).`,
  });
});
