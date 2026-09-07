import React, { useState, useEffect } from 'react';
import {
  Users, Home as HomeIcon, MessageSquare, Heart, PlusCircle,
  CheckCircle2, Clock, ArrowRight, ShieldCheck, Lock, Cpu,
  Sparkles, Star, MapPin, DollarSign, AlertCircle, RefreshCw,
  Send, User, ThumbsUp, Check, X, Shield, ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import CryptoBadge from '../components/CryptoBadge';
import ListingCard from '../components/ListingCard';
import RoommateCard from '../components/RoommateCard';
import Modal from '../components/Modal';

export default function Dashboard({ setTab, onSelectListing, onStartChat, onViewProfile }) {
  const { user, refreshUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [myListings, setMyListings] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [favourites, setFavourites] = useState([]);
  const [recentListings, setRecentListings] = useState([]);

  // Connect request modal
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [targetStudent, setTargetStudent] = useState(null);
  const [connectNote, setConnectNote] = useState('');
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectSuccess, setConnectSuccess] = useState('');
  const [connectError, setConnectError] = useState('');

  // Action loading for request response
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const [
        pRes,
        lRes,
        sRes,
        rRes,
        cRes,
        fRes,
        allListingsRes,
      ] = await Promise.all([
        api.getMyProfile().catch(() => ({ success: false })),
        api.getMyListings().catch(() => ({ success: false, listings: [] })),
        api.getSuggestedRoommates('?limit=4').catch(() => ({ success: false, suggestions: [] })),
        api.getReceivedRequests().catch(() => ({ success: false, requests: [] })),
        api.getConversations().catch(() => ({ success: false, conversations: [] })),
        api.getFavourites().catch(() => ({ success: false, listings: [] })),
        api.getListings('?limit=3').catch(() => ({ success: false, listings: [] })),
      ]);

      if (pRes.success && pRes.profile) setProfile(pRes.profile);
      if (lRes.success) setMyListings(lRes.listings || []);
      if (sRes.success) setSuggestions(sRes.suggestions || []);
      if (rRes.success) setReceivedRequests(rRes.requests || []);
      if (cRes.success) setConversations(cRes.conversations || []);
      if (fRes.success) setFavourites(fRes.listings || []);
      if (allListingsRes.success) setRecentListings(allListingsRes.listings || []);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAcceptRequest(requestId) {
    setActionLoading(prev => ({ ...prev, [requestId]: true }));
    try {
      const res = await api.acceptRequest(requestId);
      if (res.success) {
        setReceivedRequests(prev =>
          prev.map(r => r._id === requestId ? { ...r, status: 'accepted' } : r)
        );
      }
    } catch (err) {
      alert('Failed to accept request: ' + err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [requestId]: false }));
    }
  }

  async function handleDeclineRequest(requestId) {
    setActionLoading(prev => ({ ...prev, [requestId]: true }));
    try {
      const res = await api.declineRequest(requestId);
      if (res.success) {
        setReceivedRequests(prev =>
          prev.map(r => r._id === requestId ? { ...r, status: 'declined' } : r)
        );
      }
    } catch (err) {
      alert('Failed to decline request: ' + err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [requestId]: false }));
    }
  }

  function handleOpenConnectModal(student) {
    setTargetStudent(student);
    setConnectNote(`Hi ${student.name}, I noticed our high compatibility score on CampusNest and would love to connect about housing for next semester!`);
    setConnectError('');
    setConnectSuccess('');
    setConnectModalOpen(true);
  }

  async function handleSendConnectRequest(e) {
    e.preventDefault();
    if (!targetStudent) return;
    setConnectLoading(true);
    setConnectError('');

    try {
      const res = await api.sendRequest({
        receiverId: targetStudent._id,
        note: connectNote,
      });

      if (res.success) {
        setConnectSuccess('Encrypted roommate request dispatched successfully!');
        setTimeout(() => {
          setConnectModalOpen(false);
          loadDashboardData();
        }, 1200);
      }
    } catch (err) {
      setConnectError(err.message || 'Failed to dispatch request.');
    } finally {
      setConnectLoading(false);
    }
  }

  const pendingRequests = receivedRequests.filter(r => r.status === 'pending');
  const topMatch = suggestions[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Personalized Header */}
      <div className="bg-gradient-to-r from-brand-900 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified Student (.edu)
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-semibold">
                <Lock className="w-3.5 h-3.5" />
                2FA Active (ECC OTP)
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold">
                <Cpu className="w-3.5 h-3.5" />
                RSA-512 + ECC secp256k1
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Welcome back, {user?.name || 'Student'}! 👋
              </h1>
              <p className="text-sm text-slate-300 mt-1 font-medium">
                {user?.department || 'Department'} • {user?.yearOfStudy || 'Student'} • <span className="font-mono text-slate-400">{user?.email}</span>
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setTab('create-listing')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-600/30 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Post Listing</span>
            </button>
            <button
              onClick={() => setTab('profile')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/15 transition backdrop-blur-sm"
            >
              <User className="w-4 h-4 text-slate-300" />
              <span>Edit Profile</span>
            </button>
            <button
              onClick={loadDashboardData}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition"
              title="Refresh Dashboard Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Metric 1: Roommate Matches */}
        <div
          onClick={() => setTab('roommates')}
          className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-brand-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Top Matches</span>
            <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600 group-hover:bg-brand-50 group-hover:text-brand-600 transition">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 font-mono">{suggestions.length}</span>
            {topMatch && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-mono">
                {topMatch.compatibilityScore}% peak
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Compatible students</span>
        </div>

        {/* Metric 2: Pending Requests */}
        <div
          onClick={() => setTab('connections')}
          className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-brand-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Requests</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-100 transition">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 font-mono">{pendingRequests.length}</span>
            {pendingRequests.length > 0 && (
              <span className="text-xs font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-mono">
                Action needed
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Awaiting response</span>
        </div>

        {/* Metric 3: Encrypted Messages */}
        <div
          onClick={() => setTab('messages')}
          className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-brand-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Encrypted Chat</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 font-mono">{conversations.length}</span>
            <span className="text-xs font-semibold text-emerald-600 font-mono">secp256k1</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Active roommate threads</span>
        </div>

        {/* Metric 4: Saved Listings */}
        <div
          onClick={() => setTab('favourites')}
          className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-brand-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Saved Places</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 group-hover:bg-rose-100 transition">
              <Heart className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 font-mono">{favourites.length}</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Bookmarked housing</span>
        </div>

        {/* Metric 5: My Listings */}
        <div
          onClick={() => setTab(myListings.length > 0 ? 'listings' : 'create-listing')}
          className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-brand-300 transition cursor-pointer group col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">My Listings</span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-100 transition">
              <HomeIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 font-mono">{myListings.length}</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Posted properties</span>
        </div>
      </div>

      {/* 3. Pending Connection Requests Alert (if any) */}
      {pendingRequests.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <h2 className="text-base font-bold text-amber-900">
                Pending Roommate Connection Requests ({pendingRequests.length})
              </h2>
            </div>
            <button
              onClick={() => setTab('connections')}
              className="text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingRequests.slice(0, 2).map(req => (
              <div key={req._id} className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-slate-900">{req.sender?.name || 'Fellow Student'}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {req.sender?.department || 'University Student'}
                    </span>
                  </div>
                  {req.note && (
                    <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-2">
                      "{req.note}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleAcceptRequest(req._id)}
                    disabled={actionLoading[req._id]}
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Accept</span>
                  </button>
                  <button
                    onClick={() => handleDeclineRequest(req._id)}
                    disabled={actionLoading[req._id]}
                    className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Decline</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Top Compatible Roommates Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900">Recommended Roommate Matches</h2>
              <CryptoBadge type="ecc" label="Multi-Attribute Match" size="xs" />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Ranked by deterministic lifestyle compatibility (cleanliness, sleep, noise, pets, study habits)
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

        {suggestions.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-3">
            <Sparkles className="w-8 h-8 text-brand-500 mx-auto" />
            <h3 className="font-bold text-sm text-slate-900">No Roommate Matches Available Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Complete your lifestyle preferences in your profile to enable the compatibility matching algorithm!
            </p>
            <button
              onClick={() => setTab('profile')}
              className="px-4 py-2 rounded-xl bg-brand-600 text-white font-bold text-xs shadow-sm"
            >
              Update Lifestyle Profile
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {suggestions.map(s => {
              const u = s.user;
              const p = s.profile;
              const isHigh = s.compatibilityScore >= 80;

              return (
                <div
                  key={u._id}
                  className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-600 to-sky-500 text-white flex items-center justify-center font-bold text-base shadow-sm">
                          {u.name?.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 leading-tight">{u.name}</h4>
                          <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                            {u.department}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-1 rounded-xl text-xs font-mono font-bold ${
                          isHigh
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-brand-50 text-brand-700 border border-brand-200'
                        }`}
                      >
                        {s.compatibilityScore}%
                      </span>
                    </div>

                    {/* Shared Factors Highlight */}
                    {s.matchedFactors && s.matchedFactors.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Compatibility Factors
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {s.matchedFactors.slice(0, 2).map((factor, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-medium border border-emerald-100"
                            >
                              ✓ {factor}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {p?.bio && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed italic">
                        "{p.bio}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenConnectModal(u)}
                      className="flex-1 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Connect</span>
                    </button>
                    <button
                      onClick={() => {
                        if (onViewProfile) onViewProfile(u._id);
                        else setTab('roommates');
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                      title="View Profile"
                    >
                      <User className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Featured Housing Listings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900">Recent Campus Housing</h2>
              <CryptoBadge type="mac" label="CBC-MAC Verified" size="xs" />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Verified listings near university campus</p>
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
          {recentListings.map(listing => (
            <ListingCard
              key={listing._id}
              listing={listing}
              onSelect={onSelectListing}
            />
          ))}
        </div>
      </div>

      {/* 6. Two-Column Bottom Row: My Housing & My Lifestyle Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Card: My Housing Listings */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HomeIcon className="w-5 h-5 text-brand-600" />
              <h3 className="font-bold text-base text-slate-900">My Posted Housing ({myListings.length})</h3>
            </div>
            <button
              onClick={() => setTab('create-listing')}
              className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Listing</span>
            </button>
          </div>

          {myListings.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-2">
              <p className="text-xs text-slate-500">You haven't posted any housing listings yet.</p>
              <button
                onClick={() => setTab('create-listing')}
                className="px-4 py-2 rounded-xl bg-brand-600 text-white font-bold text-xs shadow-sm hover:bg-brand-700 transition"
              >
                Post Your Apartment or Room
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myListings.map(l => (
                <div
                  key={l._id}
                  onClick={() => onSelectListing && onSelectListing(l._id)}
                  className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-100 transition cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{l.title}</h4>
                    <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="font-mono font-semibold text-brand-600">${l.rent}/mo</span>
                      <span>•</span>
                      <span>{l.neighborhood || l.city}</span>
                      <span>•</span>
                      <span>{l.bedrooms} Bed, {l.bathrooms} Bath</span>
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    l.status === 'available' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {l.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Card: My Lifestyle Attributes & Compatibility Profile */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-base text-slate-900">My Lifestyle Preferences</h3>
            </div>
            <button
              onClick={() => setTab('profile')}
              className="text-xs font-bold text-brand-600 hover:underline"
            >
              Update Preferences
            </button>
          </div>

          <p className="text-xs text-slate-500">
            These preferences are used by our matching algorithm to compute compatibility scores with potential roommates.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Cleanliness</span>
              <span className="text-xs font-bold text-slate-800 capitalize mt-0.5 block">
                {profile?.lifestyle?.cleanliness || 'Average'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Sleep Hours</span>
              <span className="text-xs font-bold text-slate-800 capitalize mt-0.5 block">
                {profile?.lifestyle?.sleepSchedule || 'Flexible'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Noise Tolerance</span>
              <span className="text-xs font-bold text-slate-800 capitalize mt-0.5 block">
                {profile?.lifestyle?.noisePreference || 'Quiet'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Pets</span>
              <span className="text-xs font-bold text-slate-800 capitalize mt-0.5 block">
                {profile?.lifestyle?.pets || 'No-Pets'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Smoking</span>
              <span className="text-xs font-bold text-slate-800 capitalize mt-0.5 block">
                {profile?.lifestyle?.smoking || 'Non-Smoker'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Study Habits</span>
              <span className="text-xs font-bold text-slate-800 capitalize mt-0.5 block">
                {profile?.lifestyle?.studyHabits || 'Quiet-Study'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Cooking</span>
              <span className="text-xs font-bold text-slate-800 capitalize mt-0.5 block">
                {profile?.lifestyle?.cookingHabits || 'Occasional'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Guests</span>
              <span className="text-xs font-bold text-slate-800 capitalize mt-0.5 block">
                {profile?.lifestyle?.guestPreference || 'Weekends'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 7. Connect Roommate Request Modal */}
      <Modal
        isOpen={connectModalOpen}
        onClose={() => setConnectModalOpen(false)}
        title={targetStudent ? `Connect with ${targetStudent.name}` : 'Connect with Roommate'}
      >
        <form onSubmit={handleSendConnectRequest} className="space-y-4">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>ECC-ElGamal Encrypted Connection Request</span>
            </div>
            <p className="text-[11px] text-emerald-700 leading-relaxed">
              Your note will be encrypted using <strong>{targetStudent?.name}</strong>'s public secp256k1 curve point.
              Only their private key can decrypt this message.
            </p>
          </div>

          {connectError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{connectError}</span>
            </div>
          )}

          {connectSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{connectSuccess}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Introduction Note to {targetStudent?.name}
            </label>
            <textarea
              required
              rows={4}
              value={connectNote}
              onChange={(e) => setConnectNote(e.target.value)}
              placeholder="Introduce yourself, mention shared classes, housing preferences, or target move-in dates..."
              className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setConnectModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={connectLoading}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition flex items-center gap-2 disabled:opacity-50"
            >
              {connectLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Send Encrypted Request</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
