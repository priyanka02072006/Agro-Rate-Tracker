import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, Role } from '../types/client.js';
import { changeLanguage } from '../i18n/i18n.js';

export interface SavedFarmerData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  district?: string;
  state?: string;
  language?: 'en' | 'hi' | 'ta';
  autoLoginEnabled: boolean;
  savedAt: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  unitMode: 'quintal' | 'kg';
  setUnitMode: (mode: 'quintal' | 'kg') => void;
  formatPrice: (pricePerQuintal: number) => { formatted: string; raw: number; unitLabel: string };
  login: (identifier: string, password: string, rememberFarmer?: boolean) => Promise<UserProfile>;
  register: (data: any, rememberFarmer?: boolean) => Promise<UserProfile>;
  logout: (clearSavedFarmer?: boolean) => void;
  switchDemoRole: (role: Role) => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  savedFarmer: SavedFarmerData | null;
  quickFarmerLogin: () => Promise<void>;
  clearSavedFarmer: () => void;
  isEdgeBrowser: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [unitMode, setUnitModeState] = useState<'quintal' | 'kg'>('quintal');
  const [savedFarmer, setSavedFarmer] = useState<SavedFarmerData | null>(null);
  const [isEdgeBrowser, setIsEdgeBrowser] = useState(false);

  // Check Edge browser and inspect stored farmer credentials
  useEffect(() => {
    try {
      const isEdge = typeof navigator !== 'undefined' && /Edg\//.test(navigator.userAgent);
      setIsEdgeBrowser(isEdge);

      const rawFarmer = localStorage.getItem('agro_farmer_profile');
      if (rawFarmer) {
        setSavedFarmer(JSON.parse(rawFarmer));
      }
    } catch {
      // Ignore JSON parse errors
    }
  }, []);

  // Sync saved farmer profile to localStorage
  const persistFarmerProfile = useCallback((profile: UserProfile, password?: string) => {
    try {
      const farmerData: SavedFarmerData = {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        district: profile.district,
        state: profile.state,
        language: profile.language,
        autoLoginEnabled: true,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem('agro_farmer_profile', JSON.stringify(farmerData));
      localStorage.setItem('agro_farmer_auto_login', 'true');
      if (password) {
        localStorage.setItem(
          'agro_farmer_credentials',
          JSON.stringify({
            identifier: profile.phone || profile.email,
            password,
          })
        );
      }
      setSavedFarmer(farmerData);
    } catch (e) {
      console.warn('Failed to persist farmer profile to localStorage:', e);
    }
  }, []);

  const clearSavedFarmer = useCallback(() => {
    try {
      localStorage.removeItem('agro_farmer_profile');
      localStorage.removeItem('agro_farmer_auto_login');
      localStorage.removeItem('agro_farmer_credentials');
      setSavedFarmer(null);
    } catch (e) {
      console.warn('Failed to clear saved farmer profile:', e);
    }
  }, []);

  // Startup session recovery: Prioritize farmer auto-login if saved on this device (Microsoft Edge/Local)
  useEffect(() => {
    const initAuth = async () => {
      const savedUnit = localStorage.getItem('agro_unit_mode') as 'quintal' | 'kg';
      if (savedUnit) setUnitModeState(savedUnit);

      const isFarmerAutoLogin = localStorage.getItem('agro_farmer_auto_login') === 'true';
      const savedToken = localStorage.getItem('agro_token');

      // 1. If farmer auto-login is active, try validating the current session first
      if (savedToken) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${savedToken}` },
          });
          if (res.ok) {
            const data = await res.json();
            setToken(savedToken);
            setUser(data.user);
            if (data.user?.language) changeLanguage(data.user.language);

            // If user is a farmer, ensure their profile is up to date in Edge storage
            if (data.user?.role === 'farmer') {
              persistFarmerProfile(data.user);
            }
            setLoading(false);
            return;
          }
        } catch {
          // Token network error or expired, attempt fallback
        }
      }

      // 2. If token validation failed but farmer credentials are saved in local storage, perform silent auto-login
      if (isFarmerAutoLogin) {
        try {
          const credsRaw = localStorage.getItem('agro_farmer_credentials');
          if (credsRaw) {
            const creds = JSON.parse(credsRaw);
            if (creds.identifier && creds.password) {
              const loginRes = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  identifier: creds.identifier,
                  password: creds.password,
                }),
              });
              if (loginRes.ok) {
                const loginData = await loginRes.json();
                setToken(loginData.token);
                setUser(loginData.user);
                localStorage.setItem('agro_token', loginData.token);
                if (loginData.user?.language) changeLanguage(loginData.user.language);
                persistFarmerProfile(loginData.user, creds.password);
                setLoading(false);
                return;
              }
            }
          }
        } catch {
          // Fall through
        }
      }

      // 3. Fallback: If regular saved token exists
      if (savedToken) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${savedToken}` },
          });
          if (res.ok) {
            const data = await res.json();
            setToken(savedToken);
            setUser(data.user);
            if (data.user?.language) changeLanguage(data.user.language);
            setLoading(false);
            return;
          }
        } catch {
          localStorage.removeItem('agro_token');
        }
      }

      // 4. Default persona for initial exploration if none saved
      await loginAsDemo('customer').catch(() => {});
      setLoading(false);
    };

    initAuth();
  }, [persistFarmerProfile]);

  const setUnitMode = (mode: 'quintal' | 'kg') => {
    setUnitModeState(mode);
    localStorage.setItem('agro_unit_mode', mode);
  };

  const formatPrice = (pricePerQuintal: number) => {
    if (unitMode === 'kg') {
      const perKg = Math.round((pricePerQuintal / 100) * 10) / 10;
      return {
        formatted: `₹${perKg.toLocaleString('en-IN')}`,
        raw: perKg,
        unitLabel: '/kg',
      };
    }
    return {
      formatted: `₹${Math.round(pricePerQuintal).toLocaleString('en-IN')}`,
      raw: pricePerQuintal,
      unitLabel: '/quintal',
    };
  };

  const login = async (identifier: string, password: string, rememberFarmer = true): Promise<UserProfile> => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('agro_token', data.token);
    if (data.user.language) changeLanguage(data.user.language);

    // If farmer alone: persist login details permanently in Edge / local storage so they don't have to log in again
    if (data.user.role === 'farmer' && rememberFarmer) {
      persistFarmerProfile(data.user, password);
    }

    return data.user;
  };

  const register = async (userData: any, rememberFarmer = true): Promise<UserProfile> => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('agro_token', data.token);
    if (data.user.language) changeLanguage(data.user.language);

    // If farmer alone: store login details in Edge local storage automatically
    if (data.user.role === 'farmer' && rememberFarmer) {
      persistFarmerProfile(data.user, userData.password);
    }

    return data.user;
  };

  const quickFarmerLogin = async () => {
    const credsRaw = localStorage.getItem('agro_farmer_credentials');
    if (!credsRaw) {
      // If demo farmer exists, fallback to demo farmer
      await switchDemoRole('farmer');
      return;
    }
    const creds = JSON.parse(credsRaw);
    await login(creds.identifier, creds.password, true);
  };

  const logout = (clearFarmerData = false) => {
    localStorage.removeItem('agro_token');
    setToken(null);
    setUser(null);
    if (clearFarmerData) {
      clearSavedFarmer();
    }
  };

  const switchDemoRole = async (role: Role) => {
    await loginAsDemo(role);
  };

  const loginAsDemo = async (role: Role) => {
    const res = await fetch('/api/auth/switch-demo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      const data = await res.json();
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('agro_token', data.token);
      if (data.user?.language) changeLanguage(data.user.language);

      // If switching to farmer demo, also offer local persistence for effortless farmer exploration
      if (role === 'farmer') {
        persistFarmerProfile(data.user, 'farmer123');
      }
    }
  };

  const updateProfile = async (profileData: any) => {
    if (!token) return;
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Profile update failed');
    setUser(data.user);
    if (data.user.language) changeLanguage(data.user.language);

    if (data.user.role === 'farmer') {
      persistFarmerProfile(data.user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        unitMode,
        setUnitMode,
        formatPrice,
        login,
        register,
        logout,
        switchDemoRole,
        updateProfile,
        savedFarmer,
        quickFarmerLogin,
        clearSavedFarmer,
        isEdgeBrowser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

