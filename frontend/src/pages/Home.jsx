import React, { useState, useEffect } from 'react';
import {
  Search, Shield, Lock, Cpu, Sparkles, Users, Home as HomeIcon,
  CheckCircle2, ArrowRight, KeyRound, UserCheck, ShieldAlert
} from 'lucide-react';
import { api } from '../services/api';
import ListingCard from '../components/ListingCard';
import RoommateCard from '../components/RoommateCard';
import CryptoBadge from '../components/CryptoBadge';
import { useAuth } from '../context/AuthContext';

export default function Home({ setTab, onOpenAuth, onSelectListing, onConnectUser, onViewProfile }) {
  const { isAuthenticated, user, complete2FA, login } = useAuth();
  const [featuredListings, setFeaturedListings] = useState([]);
  const [suggestedRoommates, setSuggestedRoommates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickLoginLoading, setQuickLoginLoading] = useState(false);

  // Search input state
  const [searchCity, setSearchCity] = useState('');
  const [searchRent, setSearchRent] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [lRes, rRes] = await Promise.all([
          api.getListings('?limit=3'),
          isAuthenticated ? api.getSuggestedRoommates().catch(() => ({ suggestions: [] })) : Promise.resolve({ suggestions: [] }),
        ]);
        if (lRes.success) setFeaturedListings(lRes.listings.slice(0, 3));
        if (rRes.suggestions) setSuggestedRoommates(rRes.suggestions.slice(0, 3));
      } catch (e) {
        console.warn('Load home data error:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [isAuthenticated]);

  // Demo 1-Click Fast Login
  async function handleDemoLogin(email, password, roleHint = 'student') {
    setQuickLoginLoading(true);
    try {
      const step1 = await login(email, password);
      if (step1.requires2FA && step1.demoOtp) {
        // Complete 2FA with demo OTP
        const res = await complete2FA(step1.tempToken, step1.demoOtp);
        const role = res.user?.role || roleHint;
        setTab(role === 'admin' ? 'admin' : 'dashboard');
      }
    } catch (err) {
      alert('Demo login failed: ' + err.message);
    } finally {
      setQuickLoginLoading(false);
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    setTab('listings');
  }

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-slate-50 pt-16 pb-20 border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Security Protocol Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-xs font-semibold text-slate-700">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Zero-Library Pure Asymmetric Cryptography: RSA + ECC</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Find Safe Student Housing & <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-sky-500">Compatible Roommates</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Exclusively for verified university students. All personal profiles, messages, listings, and photos are secured with custom-written dual asymmetric encryption and tamper-evident MACs.
            </p>

            {/* Quick Search Bar */}
            <form onSubmit={handleSearchSubmit} className="bg-white p-2.5 sm:p-3 rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200 max-w-2xl mx-auto flex flex-col sm:flex-row items-center gap-2">
              <div className="flex items-center gap-2 flex-1 px-3 w-full border-b sm:border-b-0 sm:border-r border-slate-100 py-2 sm:py-0">
                <Search className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Campus area or city (e.g. North Campus)..."
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  className="w-full text-sm text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent"
                />
              </div>

              <div className="flex items-center gap-2 px-3 w-full sm:w-44 py-2 sm:py-0">
                <span className="text-slate-400 font-mono text-sm">$</span>
                <input
                  type="number"
                  placeholder="Max rent..."
                  value={searchRent}
                  onChange={(e) => setSearchRent(e.target.value)}
                  className="w-full text-sm text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md shadow-brand-600/20 transition flex items-center justify-center gap-1.5"
              >
                <span>Search</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Demo Fast Login Banner or Authenticated Welcome Banner */}
            {!isAuthenticated ? (
              <div className="pt-4 max-w-3xl mx-auto">
                <div className="p-3.5 bg-slate-900 text-slate-200 rounded-2xl shadow-md border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-left">
                    <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-bold text-white">Instant Demo 1-Click Login:</span>
                      <p className="text-[11px] text-slate-400">Authenticates with 2FA OTP auto-validation</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      disabled={quickLoginLoading}
                      onClick={() => handleDemoLogin('admin@university.edu', 'AdminPassword123!', 'admin')}
                      className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold font-mono transition"
                    >
                      Admin
                    </button>
                    <button
                      disabled={quickLoginLoading}
                      onClick={() => handleDemoLogin('alex@university.edu', 'StudentPass123!', 'student')}
                      className="px-2.5 py-1 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold font-mono transition"
                    >
                      Alex (CS)
                    </button>
                    <button
                      disabled={quickLoginLoading}
                      onClick={() => handleDemoLogin('brianna@university.edu', 'StudentPass123!', 'student')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold font-mono transition"
                    >
                      Brianna (ME)
                    </button>
                    <button
                      disabled={quickLoginLoading}
                      onClick={() => handleDemoLogin('marcus@university.edu', 'StudentPass123!', 'student')}
                      className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold font-mono transition"
                    >
                      Marcus (Bus)
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="pt-4 max-w-3xl mx-auto">
                <div className="p-3.5 bg-gradient-to-r from-brand-900 to-slate-900 text-slate-200 rounded-2xl shadow-md border border-brand-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-left">
                    <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-bold text-white">Logged in as {user?.name}:</span>
                      <p className="text-[11px] text-slate-300">Access your live housing matches, active listings, and encrypted chat.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setTab(user?.role === 'admin' ? 'admin' : 'dashboard')}
                    className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 shrink-0"
                  >
                    <span>Go to My Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Security Features Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-xs font-bold text-brand-600 tracking-wider uppercase mb-1 font-mono">
            Zero-Compromise Security Architecture
          </h2>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Dual Asymmetric Cryptography Built From Scratch
          </p>
          <p className="text-sm text-slate-500 mt-2">
            No library crypto helpers. Pure mathematical algorithms for BigInt modular arithmetic, Miller-Rabin primes, and Weierstrass curve point operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: RSA */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4 border border-sky-100">
              <Lock className="w-6 h-6" />
            </div>
            <CryptoBadge type="rsa" label="Algorithm 1: Pure RSA" />
            <h3 className="text-lg font-bold text-slate-900 mt-3 mb-2">User Data & Listing Encryption</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Student names, emails, phones, and housing listings are encrypted with custom RSA using PKCS#1 v1.5 block padding and authenticated with HMAC-SHA256 integrity tags before writing to the database.
            </p>
          </div>

          {/* Card 2: ECC */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 border border-emerald-100">
              <Cpu className="w-6 h-6" />
            </div>
            <CryptoBadge type="ecc" label="Algorithm 2: Pure ECC (secp256k1)" />
            <h3 className="text-lg font-bold text-slate-900 mt-3 mb-2">Peer-to-Peer Encrypted Chat</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Private messages between roommates and 2FA OTP codes are encrypted using Elliptic Curve ElGamal over secp256k1. Only authorized participants with private curve points can decrypt conversation history.
            </p>
          </div>

          {/* Card 3: Anti-Hijacking 2FA */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 border border-purple-100">
              <Shield className="w-6 h-6" />
            </div>
            <CryptoBadge type="mac" label="PBKDF2 + Anti-Hijack 2FA" />
            <h3 className="text-lg font-bold text-slate-900 mt-3 mb-2">2-Step Auth & Session Protection</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Passwords are salted and stretched with pure PBKDF2-HMAC-SHA256 (2048 iterations). Two-step OTP verification guards logins, while User-Agent client-bound session tokens prevent session hijacking.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Listings Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Featured Student Housing</h2>
            <p className="text-xs text-slate-500 mt-1">Verified apartments and rooms near campus</p>
          </div>
          <button
            onClick={() => setTab('listings')}
            className="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1 transition"
          >
            <span>View all listings</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredListings.map(l => (
            <ListingCard
              key={l._id}
              listing={l}
              onSelect={onSelectListing}
            />
          ))}
        </div>
      </section>

      {/* Roommate Compatibility Preview Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Top Roommate Matches</h2>
            <p className="text-xs text-slate-500 mt-1">
              {isAuthenticated ? 'Ranked by multi-dimensional lifestyle compatibility score' : 'Log in to see your personalized compatibility percentages'}
            </p>
          </div>
          <button
            onClick={() => setTab('roommates')}
            className="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1 transition"
          >
            <span>Explore all roommates</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {isAuthenticated && suggestedRoommates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {suggestedRoommates.map(s => (
              <RoommateCard
                key={s.user._id}
                suggestion={s}
                onConnect={onConnectUser}
                onViewProfile={onViewProfile}
              />
            ))}
          </div>
        ) : (
          <div className="bg-gradient-to-br from-brand-600 to-sky-700 rounded-3xl p-8 sm:p-12 text-white text-center shadow-xl">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-sky-200" />
            <h3 className="text-2xl sm:text-3xl font-bold mb-3">Find Your Ideal University Roommate</h3>
            <p className="text-sm text-sky-100 max-w-xl mx-auto mb-6">
              Our algorithm compares sleeping hours, cleanliness habits, noise levels, study schedules, and pet policies to compute an exact compatibility percentage.
            </p>
            <div className="flex justify-center gap-3">
              {isAuthenticated ? (
                <button
                  onClick={() => setTab(user?.role === 'admin' ? 'admin' : 'dashboard')}
                  className="px-6 py-3 rounded-xl bg-white text-brand-700 font-bold text-sm shadow-md hover:bg-sky-50 transition flex items-center gap-2"
                >
                  <span>Open My Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => onOpenAuth('register')}
                    className="px-6 py-3 rounded-xl bg-white text-brand-700 font-bold text-sm shadow-md hover:bg-sky-50 transition"
                  >
                    Sign Up (.edu)
                  </button>
                  <button
                    onClick={() => onOpenAuth('login')}
                    className="px-6 py-3 rounded-xl bg-brand-800/60 hover:bg-brand-800 text-white font-bold text-sm border border-white/20 transition"
                  >
                    Log In
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
