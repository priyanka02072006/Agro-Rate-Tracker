import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth, SavedFarmerData } from '../context/AuthContext.js';
import { Role } from '../types/client.js';
import { changeLanguage } from '../i18n/i18n.js';
import {
  Wheat,
  ShoppingBag,
  TrendingUp,
  ShieldCheck,
  UserCheck,
  Check,
  AlertCircle,
  Smartphone,
  KeyRound,
  Volume2,
  HardDrive,
  Sparkles,
  MapPin,
  Building,
  User,
  ArrowRight,
  LogOut,
  RefreshCw,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const {
    user,
    login,
    register,
    switchDemoRole,
    savedFarmer,
    quickFarmerLogin,
    clearSavedFarmer,
    isEdgeBrowser,
  } = useAuth();
  const navigate = useNavigate();

  // Mode: Sign In or Register
  const [isRegister, setIsRegister] = useState(false);

  // Active Role Tab: 'farmer' | 'customer' | 'trader' | 'admin'
  const [selectedRole, setSelectedRole] = useState<Role>('farmer');

  // Form Fields
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState(''); // Email or Phone
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('Tamil Nadu');
  const [district, setDistrict] = useState('Krishnagiri');
  const [organization, setOrganization] = useState('');
  const [adminPasscode, setAdminPasscode] = useState('ADMIN2025');
  const [farmerLanguage, setFarmerLanguage] = useState<'ta' | 'hi' | 'en'>('ta');

  // Farmer Local Edge Storage Toggle (Checked by default for farmers)
  const [rememberOnEdge, setRememberOnEdge] = useState(true);

  // Status
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Sync state & district defaults based on role
  useEffect(() => {
    if (selectedRole === 'farmer') {
      setState('Tamil Nadu');
      setDistrict('Krishnagiri');
      // If a saved farmer exists in local storage, prefill their details
      if (savedFarmer) {
        setIdentifier(savedFarmer.phone || savedFarmer.email);
      }
    } else if (selectedRole === 'customer') {
      setState('Tamil Nadu');
      setDistrict('Chennai');
    } else if (selectedRole === 'trader') {
      setState('Maharashtra');
      setDistrict('Mumbai');
    } else if (selectedRole === 'admin') {
      setState('NCT of Delhi');
      setDistrict('Delhi');
    }
  }, [selectedRole, savedFarmer]);

  // Audio speech assistance for farmers who don't know much English
  const playFarmerVoiceGuide = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    let text = '';
    let lang = 'ta-IN';

    if (farmerLanguage === 'ta') {
      text =
        'வணக்கம் விவசாயி தோழரே. அக்ரோ ரேட் டிராக்கர் வரவேற்கிறது. உங்கள் போன் நம்பர் மற்றும் பின் பதிவிட்டு எளிதாக உள்நுழையலாம். உங்கள் விவரங்கள் இந்த பிரவுசரில் சேமிக்கப்படும், ஒவ்வொரு முறையும் உள்நுழைய தேவையில்லை.';
      lang = 'ta-IN';
    } else if (farmerLanguage === 'hi') {
      text =
        'नमस्ते किसान भाई. एग्रो रेट ट्रैकर में आपका स्वागत है. अपना मोबाइल नंबर डालकर आसानी से लॉगिन करें. आपका लॉगिन इस ब्राउज़र में सुरक्षित रहेगा.';
      lang = 'hi-IN';
    } else {
      text =
        'Welcome farmer! Enter your phone number and simple PIN to log in. Your login is permanently saved on this Microsoft Edge browser so you do not have to type it again.';
      lang = 'en-US';
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.95;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isRegister) {
        const payload: any = {
          name,
          role: selectedRole,
          password,
          state,
          district,
          language: selectedRole === 'farmer' ? farmerLanguage : 'en',
        };

        if (selectedRole === 'farmer') {
          payload.phone = phone || identifier;
          payload.email = identifier.includes('@') ? identifier : undefined;
        } else {
          payload.email = identifier;
          payload.phone = phone;
          payload.organization = organization;
        }

        if (selectedRole === 'admin') {
          payload.adminPasscode = adminPasscode;
        }

        const registeredUser = await register(payload, rememberOnEdge);
        setSuccessMsg(
          selectedRole === 'farmer'
            ? 'Account registered! Your login has been stored locally in Microsoft Edge for automatic access.'
            : `Account created successfully as ${selectedRole}.`
        );

        // Redirect after brief delay
        setTimeout(() => {
          if (registeredUser.role === 'farmer') navigate('/farmer-hub');
          else if (registeredUser.role === 'customer') navigate('/find-produce');
          else if (registeredUser.role === 'trader') navigate('/prices');
          else if (registeredUser.role === 'admin') navigate('/admin');
          else navigate('/');
        }, 600);
      } else {
        // Sign In
        const loggedUser = await login(identifier, password, rememberOnEdge);
        setSuccessMsg(
          selectedRole === 'farmer'
            ? 'Logged in! Stored in Microsoft Edge local storage for automatic 1-tap visits.'
            : `Welcome back, ${loggedUser.name}!`
        );

        setTimeout(() => {
          if (loggedUser.role === 'farmer') navigate('/farmer-hub');
          else if (loggedUser.role === 'customer') navigate('/find-produce');
          else if (loggedUser.role === 'trader') navigate('/prices');
          else if (loggedUser.role === 'admin') navigate('/admin');
          else navigate('/');
        }, 600);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  const handle1TapFarmerLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await quickFarmerLogin();
      navigate('/farmer-hub');
    } catch (err: any) {
      setError(err.message || 'Quick login failed. Please sign in with your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (targetRole: Role) => {
    setLoading(true);
    setError(null);
    try {
      await switchDemoRole(targetRole);
      if (targetRole === 'farmer') navigate('/farmer-hub');
      else if (targetRole === 'customer') navigate('/find-produce');
      else if (targetRole === 'trader') navigate('/prices');
      else if (targetRole === 'admin') navigate('/admin');
      else navigate('/');
    } catch (err: any) {
      setError(err.message || 'Demo persona switch failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-3 md:p-6">
      <div className="w-full max-w-xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center gap-2">
            <span className="w-12 h-12 rounded-2xl bg-emerald-800 text-amber-300 font-bold text-2xl inline-flex items-center justify-center shadow-md">
              🌾
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Agro Rate Authentication Portal
          </h1>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            Role-based access for Farmers, Buyers, APMC Traders, and Govt Mandi Administrators.
          </p>
        </div>

        {/* 1-Click Test Persona Bar */}
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 space-y-2">
          <div className="text-[11px] font-bold text-emerald-950 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
              1-Click Fast Test Personas
            </span>
            <span className="text-[10px] text-emerald-700 font-normal">Frictionless Test</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
            <button
              onClick={() => handleQuickDemo('farmer')}
              className="p-2 bg-white hover:bg-emerald-100/50 border border-emerald-300 rounded-lg text-left shadow-xs transition"
            >
              <div className="font-bold text-neutral-900 flex items-center gap-1">
                🌾 <span>Farmer</span>
              </div>
              <div className="text-[10px] text-neutral-500 truncate">Ramesh · Hub</div>
            </button>
            <button
              onClick={() => handleQuickDemo('customer')}
              className="p-2 bg-white hover:bg-emerald-100/50 border border-emerald-300 rounded-lg text-left shadow-xs transition"
            >
              <div className="font-bold text-neutral-900 flex items-center gap-1">
                🛒 <span>Buyer</span>
              </div>
              <div className="text-[10px] text-neutral-500 truncate">Priya · Chennai</div>
            </button>
            <button
              onClick={() => handleQuickDemo('trader')}
              className="p-2 bg-white hover:bg-emerald-100/50 border border-emerald-300 rounded-lg text-left shadow-xs transition"
            >
              <div className="font-bold text-neutral-900 flex items-center gap-1">
                📊 <span>Trader</span>
              </div>
              <div className="text-[10px] text-neutral-500 truncate">Anand · APMC</div>
            </button>
            <button
              onClick={() => handleQuickDemo('admin')}
              className="p-2 bg-white hover:bg-emerald-100/50 border border-emerald-300 rounded-lg text-left shadow-xs transition"
            >
              <div className="font-bold text-neutral-900 flex items-center gap-1">
                🛡️ <span>Admin</span>
              </div>
              <div className="text-[10px] text-neutral-500 truncate">Govt Mandi</div>
            </button>
          </div>
        </div>

        {/* SPECIAL FARMER PERSISTENCE FEATURE CARD (Microsoft Edge / Local Storage) */}
        {savedFarmer && (
          <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-2xl p-5 shadow-lg border border-emerald-700 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400 text-neutral-900 text-[10px] font-bold">
                  <HardDrive className="w-3 h-3 text-neutral-900" />
                  <span>
                    {isEdgeBrowser ? 'Microsoft Edge Local Storage Active' : 'Local Browser Storage Active'}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>🌾</span>
                  <span>{savedFarmer.name}</span>
                </h2>
                <p className="text-xs text-emerald-100">
                  {savedFarmer.district}, {savedFarmer.state} · {savedFarmer.phone || savedFarmer.email}
                </p>
              </div>

              {/* Clear saved local storage button */}
              <button
                type="button"
                onClick={clearSavedFarmer}
                title="Forget this saved profile from this browser"
                className="text-emerald-300 hover:text-white text-[11px] underline flex items-center gap-1 pt-1"
              >
                Switch Account
              </button>
            </div>

            <div className="bg-emerald-950/60 rounded-xl p-3 border border-emerald-600/40 text-xs space-y-1.5">
              <div className="text-amber-300 font-semibold flex items-center gap-1.5">
                <Check className="w-4 h-4 text-amber-300" />
                <span>எளிதாக நுழையலாம் (No password typing needed!)</span>
              </div>
              <p className="text-[11px] text-emerald-200 leading-relaxed">
                Your farmer credentials are saved permanently on this browser. Simply tap the green button below to enter your Produce Hub directly.
              </p>
            </div>

            <button
              onClick={handle1TapFarmerLogin}
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-emerald-950 font-extrabold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition transform active:scale-98"
            >
              <span>🌾</span>
              <span>1-Tap Open Farmer Hub (விவசாயி மையம் செல்)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main Authentication Card */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-5">
          {/* Sign In vs Register Switcher */}
          <div className="flex border-b border-neutral-200">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setError(null);
              }}
              className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition ${
                !isRegister
                  ? 'border-emerald-800 text-emerald-900'
                  : 'border-transparent text-neutral-400 hover:text-neutral-700'
              }`}
            >
              Sign In to Existing Account
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setError(null);
              }}
              className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition ${
                isRegister
                  ? 'border-emerald-800 text-emerald-900'
                  : 'border-transparent text-neutral-400 hover:text-neutral-700'
              }`}
            >
              Create New Account (Signup)
            </button>
          </div>

          {/* Role Selector Tabs (Farmer, Customer, Trader, Admin) */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
              {isRegister ? 'Step 1: Choose Your Role to Register' : 'Select Role to Access'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Farmer Tab */}
              <button
                type="button"
                onClick={() => setSelectedRole('farmer')}
                className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                  selectedRole === 'farmer'
                    ? 'border-emerald-800 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-800/20'
                    : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 text-sm">
                  🌾
                </div>
                <span className="text-xs">Farmer</span>
                <span className="text-[9px] text-emerald-800 font-medium leading-tight">விவசாயி / किसान</span>
              </button>

              {/* Customer / Buyer Tab */}
              <button
                type="button"
                onClick={() => setSelectedRole('customer')}
                className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                  selectedRole === 'customer'
                    ? 'border-emerald-800 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-800/20'
                    : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 text-sm">
                  🛒
                </div>
                <span className="text-xs">Buyer</span>
                <span className="text-[9px] text-neutral-500 font-normal">Customer / Grocery</span>
              </button>

              {/* Trader Tab */}
              <button
                type="button"
                onClick={() => setSelectedRole('trader')}
                className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                  selectedRole === 'trader'
                    ? 'border-emerald-800 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-800/20'
                    : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 text-sm">
                  📊
                </div>
                <span className="text-xs">Trader</span>
                <span className="text-[9px] text-neutral-500 font-normal">Mandi Wholesaler</span>
              </button>

              {/* Admin Tab */}
              <button
                type="button"
                onClick={() => setSelectedRole('admin')}
                className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                  selectedRole === 'admin'
                    ? 'border-emerald-800 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-800/20'
                    : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 text-sm">
                  🛡️
                </div>
                <span className="text-xs">Admin</span>
                <span className="text-[9px] text-neutral-500 font-normal">Govt Directorate</span>
              </button>
            </div>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-700" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Farmer-Specific Vernacular & Edge Banner */}
          {selectedRole === 'farmer' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Microsoft Edge Local Storage Enabled</span>
                </span>
                <button
                  type="button"
                  onClick={playFarmerVoiceGuide}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-white border border-emerald-300 px-2 py-0.5 rounded-full hover:bg-emerald-100 transition"
                >
                  <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'animate-bounce text-amber-600' : ''}`} />
                  <span>{isSpeaking ? 'Speaking...' : 'கேளுங்கள் (Listen)'}</span>
                </button>
              </div>

              <p className="text-[11px] text-emerald-800 leading-snug">
                விவசாயிகளுக்கு ஆங்கிலம் தெரியாவிட்டாலும் சிரமமின்றி பயன்படும் வகையில், உங்கள் உள்நுழைவு விவரங்கள்
                இந்த பிரவுசரில் (Edge) நிரந்தரமாக சேமிக்கப்படும்.
              </p>

              {/* Language Selector for Farmer */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] font-bold text-emerald-950 uppercase">மொழி / Language:</span>
                {(['ta', 'hi', 'en'] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => {
                      setFarmerLanguage(l);
                      changeLanguage(l);
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                      farmerLanguage === l
                        ? 'bg-emerald-800 text-white'
                        : 'bg-white border border-emerald-200 text-emerald-800'
                    }`}
                  >
                    {l === 'ta' ? 'தமிழ்' : l === 'hi' ? 'हिन्दी' : 'English'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Registration Fields */}
            {isRegister && (
              <>
                <div>
                  <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">
                    {selectedRole === 'farmer'
                      ? 'விவசாயி பெயர் / Full Name'
                      : selectedRole === 'customer'
                      ? 'Buyer / Company Name'
                      : selectedRole === 'trader'
                      ? 'Trader / Wholesaler Business Name'
                      : 'Admin Officer Name'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={
                        selectedRole === 'farmer'
                          ? 'ரமேஷ் குமார் (Ramesh Kumar)'
                          : selectedRole === 'customer'
                          ? 'Priya Sharma (GreenGrocer)'
                          : selectedRole === 'trader'
                          ? 'Anand APMC Mandi Traders'
                          : 'Directorate Admin'
                      }
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-emerald-700"
                      required
                    />
                  </div>
                </div>

                {/* Additional Role Specific Detail */}
                {selectedRole !== 'farmer' && (
                  <div>
                    <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">
                      {selectedRole === 'customer'
                        ? 'Store / Retail Business Type (Optional)'
                        : selectedRole === 'trader'
                        ? 'APMC Mandi Yard / License (Optional)'
                        : 'Directorate / Department'}
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        placeholder={
                          selectedRole === 'customer'
                            ? 'Organic Supermarket Chain'
                            : selectedRole === 'trader'
                            ? 'APMC License #MUM-9842'
                            : 'Directorate of Agricultural Marketing'
                        }
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-emerald-700"
                      />
                    </div>
                  </div>
                )}

                {/* State & District */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">
                      {selectedRole === 'farmer' ? 'மாநிலம் (State)' : 'State'}
                    </label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs focus:outline-emerald-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">
                      {selectedRole === 'farmer' ? 'மாவட்டம் (District)' : 'District'}
                    </label>
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs focus:outline-emerald-700"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email / Mobile Identifier */}
            <div>
              <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">
                {selectedRole === 'farmer'
                  ? 'கைபேசி எண் அல்லது மின்னஞ்சல் (Mobile Number or Email)'
                  : 'Email Address or Mobile Number'}
              </label>
              <div className="relative">
                <Smartphone className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type={selectedRole === 'farmer' ? 'text' : 'text'}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={
                    selectedRole === 'farmer'
                      ? '9840123456 (or farmer@gmail.com)'
                      : selectedRole === 'customer'
                      ? 'customer.priya@agrorate.in'
                      : selectedRole === 'trader'
                      ? 'trader.anand@agrorate.in'
                      : 'admin@agrorate.gov.in'
                  }
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-emerald-700"
                  required
                />
              </div>
            </div>

            {/* Password or PIN */}
            <div>
              <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-1 flex items-center justify-between">
                <span>
                  {selectedRole === 'farmer'
                    ? 'ரகசிய எண் / கடவுச்சொல் (PIN or Password)'
                    : 'Password'}
                </span>
                {selectedRole === 'farmer' && (
                  <span className="text-[10px] text-emerald-700 font-medium">Simple 4-digit PIN works</span>
                )}
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={selectedRole === 'farmer' ? '•••• (e.g. 1234 or farmer123)' : '••••••••'}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-emerald-700"
                  required
                />
              </div>
            </div>

            {/* Admin Security Passkey (Only for Admin Registration) */}
            {selectedRole === 'admin' && isRegister && (
              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">
                  Mandi Directorate Admin Passkey
                </label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={adminPasscode}
                    onChange={(e) => setAdminPasscode(e.target.value)}
                    placeholder="ADMIN2025"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-emerald-700 font-mono"
                    required
                  />
                </div>
                <p className="text-[10px] text-neutral-500 mt-1">
                  Authorized administrative access key. Default test passkey: <code className="bg-neutral-100 px-1 py-0.5 rounded text-neutral-800">ADMIN2025</code>
                </p>
              </div>
            )}

            {/* FARMER ALONE: Local Edge Storage Persistence Checkbox */}
            {selectedRole === 'farmer' && (
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberOnEdge}
                    onChange={(e) => setRememberOnEdge(e.target.checked)}
                    className="mt-0.5 rounded border-neutral-300 text-emerald-700 focus:ring-emerald-700"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-emerald-950 block">
                      Save permanently in Microsoft Edge (ஒவ்வொரு முறையும் உள்நுழைய வேண்டாம்)
                    </span>
                    <span className="text-[10px] text-emerald-800">
                      Stores login locally so the farmer never gets logged out, even when the browser or computer restarts.
                    </span>
                  </div>
                </label>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : isRegister ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>
                    {selectedRole === 'farmer'
                      ? 'Register Farmer Account (விவசாயி கணக்கு உருவாக்கு)'
                      : `Register as ${selectedRole.toUpperCase()}`}
                  </span>
                </>
              ) : (
                <>
                  <span>🌾</span>
                  <span>
                    {selectedRole === 'farmer'
                      ? 'Sign In as Farmer (விவசாயி உள்நுழையவும்)'
                      : `Sign In as ${selectedRole.toUpperCase()}`}
                  </span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Informational Footer */}
        <div className="text-center text-[11px] text-neutral-500">
          <p>
            Agro Rate Tracker connects farmers directly with wholesale buyers and APMC mandis.
          </p>
          <p className="mt-0.5 text-neutral-400">
            Compliant with Microsoft Edge, Chrome, Safari, and PWA offline storage.
          </p>
        </div>
      </div>
    </div>
  );
};
