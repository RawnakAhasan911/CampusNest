import React, { useState, useEffect } from 'react';
import {
  Users, Home, ShieldAlert, Star, KeyRound, RefreshCw,
  Trash2, Ban, CheckCircle, AlertTriangle, Layers, Plus, ShieldCheck, Cpu
} from 'lucide-react';
import { api } from '../services/api';
import CryptoBadge from '../components/CryptoBadge';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('kmm'); // 'kmm' | 'users' | 'listings' | 'reports' | 'reviews' | 'categories'
  const [metrics, setMetrics] = useState(null);
  const [cryptoData, setCryptoData] = useState(null);

  // Entities
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [reports, setReports] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Category modal
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState('location');

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    try {
      const dRes = await api.getAdminDashboard();
      if (dRes.success) {
        setMetrics(dRes.metrics);
        setCryptoData(dRes.cryptography);
      }
      loadTabContent(activeTab);
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadTabContent(tab) {
    try {
      if (tab === 'users') {
        const res = await api.getAdminUsers();
        if (res.success) setUsers(res.users);
      } else if (tab === 'listings') {
        const res = await api.getAdminListings();
        if (res.success) setListings(res.listings);
      } else if (tab === 'reports') {
        const res = await api.getAdminReports();
        if (res.success) setReports(res.reports);
      } else if (tab === 'reviews') {
        const res = await api.getAdminReviews();
        if (res.success) setReviews(res.reviews);
      } else if (tab === 'categories') {
        const res = await api.getCategories();
        if (res.success) setCategories(res.categories);
      }
    } catch (err) {
      console.warn('Failed to load tab:', tab, err);
    }
  }

  function handleTabChange(tab) {
    setActiveTab(tab);
    loadTabContent(tab);
  }

  async function handleRotateRsa() {
    if (!window.confirm('Trigger RSA System Key Rotation? A new keypair (v+1) will be generated and archived in the KMM registry.')) return;
    setActionLoading(true);
    try {
      const res = await api.rotateRsaKey('Manual rotation triggered from Admin Panel');
      if (res.success) {
        setStatusMessage(res.message);
        loadDashboard();
      }
    } catch (err) {
      alert('Key rotation failed: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRotateEcc() {
    if (!window.confirm('Trigger ECC System Key Rotation? A new secp256k1 point pair will be created.')) return;
    setActionLoading(true);
    try {
      const res = await api.rotateEccKey('Manual rotation triggered from Admin Panel');
      if (res.success) {
        setStatusMessage(res.message);
        loadDashboard();
      }
    } catch (err) {
      alert('ECC Key rotation failed: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleToggleUserStatus(userId, currentStatus) {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const res = await api.updateUserStatus(userId, nextStatus);
      if (res.success) {
        setUsers(prev => prev.map(u => u._id === userId ? { ...u, status: nextStatus } : u));
      }
    } catch (err) {
      alert('Error updating user status: ' + err.message);
    }
  }

  async function handleDeleteListing(listingId) {
    if (!window.confirm('Permanently remove this listing?')) return;
    try {
      await api.deleteAdminListing(listingId);
      setListings(prev => prev.filter(l => l._id !== listingId));
    } catch (err) {
      alert('Failed to remove listing');
    }
  }

  async function handleResolveReport(reportId, status) {
    try {
      await api.updateReport(reportId, { status, adminNotes: `Action taken by administrator (${status})` });
      setReports(prev => prev.map(r => r._id === reportId ? { ...r, status } : r));
    } catch (err) {
      alert('Failed to update report');
    }
  }

  async function handleDeleteReview(reviewId) {
    if (!window.confirm('Remove this review for violation of community standards?')) return;
    try {
      await api.deleteAdminReview(reviewId);
      setReviews(prev => prev.filter(r => r._id !== reviewId));
    } catch (err) {
      alert('Failed to remove review');
    }
  }

  async function handleCreateCategory(e) {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const res = await api.createCategory({ name: newCatName.trim(), type: newCatType });
      if (res.success) {
        setCategories([...categories, res.category]);
        setNewCatName('');
      }
    } catch (err) {
      alert('Failed to create category');
    }
  }

  async function handleDeleteCategory(id) {
    try {
      await api.deleteCategory(id);
      setCategories(prev => prev.filter(c => c._id !== id));
    } catch (err) {
      alert('Failed to delete category');
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Administration Console</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-800 font-mono">
              RBAC: Admin Role Verified
            </span>
          </div>
          <p className="text-xs text-slate-500">
            System moderation, user safety, listing controls, and Key Management Module (KMM) cryptosystem oversight.
          </p>
        </div>

        {statusMessage && (
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-slate-400 text-[10px] font-bold uppercase block">Total Students</span>
            <span className="text-2xl font-extrabold text-slate-900 font-mono">{metrics.totalUsers}</span>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-slate-400 text-[10px] font-bold uppercase block">Active Listings</span>
            <span className="text-2xl font-extrabold text-brand-600 font-mono">{metrics.totalListings}</span>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-slate-400 text-[10px] font-bold uppercase block">Pending Reports</span>
            <span className="text-2xl font-extrabold text-rose-600 font-mono">{metrics.pendingReports}</span>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-slate-400 text-[10px] font-bold uppercase block">Reported Reviews</span>
            <span className="text-2xl font-extrabold text-amber-600 font-mono">{metrics.reportedReviews}</span>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm col-span-2 sm:col-span-1">
            <span className="text-slate-400 text-[10px] font-bold uppercase block">RSA Active Key</span>
            <span className="text-2xl font-extrabold text-purple-600 font-mono">v{cryptoData?.activeRsaVersion || 1}</span>
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-bold overflow-x-auto gap-1">
        {[
          { id: 'kmm', label: 'Key Management (KMM)', icon: KeyRound },
          { id: 'users', label: 'Manage Users', icon: Users },
          { id: 'listings', label: 'Housing Listings', icon: Home },
          { id: 'reports', label: 'Safety Reports', icon: ShieldAlert },
          { id: 'reviews', label: 'Reviews', icon: Star },
          { id: 'categories', label: 'Categories / Locations', icon: Layers },
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition whitespace-nowrap ${
                isActive
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Key Management Module (KMM) */}
      {activeTab === 'kmm' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* RSA Key Management Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">RSA Asymmetric Cryptosystem</h3>
                    <p className="text-[11px] text-slate-500 font-mono">Algorithm 1 • PKCS#1 v1.5 + HMAC-SHA256</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-xl text-xs font-bold font-mono bg-sky-100 text-sky-800">
                  Active v{cryptoData?.activeRsaVersion || 1}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-xs font-mono space-y-1 text-slate-600">
                <p>• Scope: Encrypts profiles, listings, contact info, and private ECC keys at rest.</p>
                <p>• Key Size: 512-bit modulus (256-bit prime factors p, q).</p>
                <p>• Totient: Euler's totient φ(N) = (p-1)(q-1), e = 65537.</p>
                <p>• Total Historical Keys: {cryptoData?.totalRsaKeys || 1}</p>
              </div>

              <button
                onClick={handleRotateRsa}
                disabled={actionLoading}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${actionLoading ? 'animate-spin' : ''}`} />
                <span>Rotate RSA Asymmetric Key</span>
              </button>
            </div>

            {/* ECC Key Management Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">ECC Asymmetric Cryptosystem</h3>
                    <p className="text-[11px] text-slate-500 font-mono">Algorithm 2 • EC-ElGamal on secp256k1</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-xl text-xs font-bold font-mono bg-emerald-100 text-emerald-800">
                  Active v{cryptoData?.activeEccVersion || 1}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-xs font-mono space-y-1 text-slate-600">
                <p>• Scope: Encrypts 2FA OTP tokens, connection request notes, and peer chat.</p>
                <p>• Curve: y² ≡ x³ + 7 mod p (secp256k1).</p>
                <p>• Ephemeral Point: C₁ = k · G; Shared Secret: S = k · Q.</p>
                <p>• Total Historical Keys: {cryptoData?.totalEccKeys || 1}</p>
              </div>

              <button
                onClick={handleRotateEcc}
                disabled={actionLoading}
                className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${actionLoading ? 'animate-spin' : ''}`} />
                <span>Rotate ECC Asymmetric Key</span>
              </button>
            </div>
          </div>

          {/* Cryptographic Audit Trail */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              <span>Cryptographic Key Rotation & Audit Log</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="p-3">Action</th>
                    <th className="p-3">RSA Version</th>
                    <th className="p-3">ECC Version</th>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Description / Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {(cryptoData?.rotationHistory || []).map((h, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="p-3 font-bold text-slate-900">{h.action}</td>
                      <td className="p-3 text-sky-700">v{h.newVersion || h.rsaVersion || 1}</td>
                      <td className="p-3 text-emerald-700">v{h.eccVersion || 1}</td>
                      <td className="p-3 text-slate-500">{new Date(h.timestamp).toLocaleString()}</td>
                      <td className="p-3 text-slate-600 font-sans">{h.description || h.reason || 'System operation'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Manage Users */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Registered Students & Accounts</h3>
            <span className="text-xs text-slate-400 font-mono">{users.length} Users</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px] border-b border-slate-100">
                <tr>
                  <th className="p-3.5">Student Name</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Phone</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u._id} className="hover:bg-slate-50/60">
                    <td className="p-3.5 font-bold text-slate-900">{u.name}</td>
                    <td className="p-3.5 font-mono text-slate-600">{u.email}</td>
                    <td className="p-3.5 font-mono text-slate-500">{u.phone || 'N/A'}</td>
                    <td className="p-3.5 text-slate-600">{u.department}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                        u.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleUserStatus(u._id, u.status)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                            u.status === 'active'
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {u.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Manage Listings */}
      {activeTab === 'listings' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Housing Listings Moderation</h3>
            <span className="text-xs text-slate-400 font-mono">{listings.length} Listings</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px] border-b border-slate-100">
                <tr>
                  <th className="p-3.5">Title</th>
                  <th className="p-3.5">Location</th>
                  <th className="p-3.5">Rent</th>
                  <th className="p-3.5">Beds/Baths</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listings.map(l => (
                  <tr key={l._id} className="hover:bg-slate-50/60">
                    <td className="p-3.5 font-bold text-slate-900 max-w-xs truncate">{l.title}</td>
                    <td className="p-3.5 text-slate-600">{l.city}</td>
                    <td className="p-3.5 font-mono font-bold text-slate-900">${l.rent}/mo</td>
                    <td className="p-3.5 text-slate-500">{l.bedrooms}B / {l.bathrooms}BA</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                        l.status === 'available' ? 'bg-emerald-100 text-emerald-800' :
                        l.status === 'rented' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleDeleteListing(l._id)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                        title="Remove listing"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Manage Reports */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Safety & Abuse Reports</h3>
            <span className="text-xs text-slate-400 font-mono">{reports.length} Reports</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px] border-b border-slate-100">
                <tr>
                  <th className="p-3.5">Reporter</th>
                  <th className="p-3.5">Target Type</th>
                  <th className="p-3.5">Reason</th>
                  <th className="p-3.5">RSA Decrypted Details</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">No active reports. Community is safe!</td>
                  </tr>
                ) : (
                  reports.map(r => (
                    <tr key={r._id} className="hover:bg-slate-50/60">
                      <td className="p-3.5 font-bold text-slate-900">{r.reporter}</td>
                      <td className="p-3.5 uppercase font-mono text-[10px] font-bold text-slate-600">{r.targetType}</td>
                      <td className="p-3.5 text-rose-700 font-semibold">{r.reason}</td>
                      <td className="p-3.5 text-slate-600 max-w-sm whitespace-pre-line">{r.details || 'No details provided'}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                          r.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        {r.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleResolveReport(r._id, 'resolved')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px]"
                            >
                              Resolve
                            </button>
                            <button
                              onClick={() => handleResolveReport(r._id, 'dismissed')}
                              className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700 font-bold text-[11px]"
                            >
                              Dismiss
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: Manage Reviews */}
      {activeTab === 'reviews' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Roommate Reviews Moderation</h3>
            <span className="text-xs text-slate-400 font-mono">{reviews.length} Reviews</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px] border-b border-slate-100">
                <tr>
                  <th className="p-3.5">Reviewer</th>
                  <th className="p-3.5">Target Student</th>
                  <th className="p-3.5">Rating</th>
                  <th className="p-3.5">RSA Decrypted Comment</th>
                  <th className="p-3.5">Flagged</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reviews.map(rev => (
                  <tr key={rev._id} className="hover:bg-slate-50/60">
                    <td className="p-3.5 font-bold text-slate-900">{rev.reviewer}</td>
                    <td className="p-3.5 text-slate-600">{rev.targetUser}</td>
                    <td className="p-3.5 font-mono font-bold text-amber-600">{rev.rating} ★</td>
                    <td className="p-3.5 text-slate-700 max-w-md italic">"{rev.comment}"</td>
                    <td className="p-3.5">
                      {rev.isReported && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 uppercase font-mono">
                          Reported
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleDeleteReview(rev._id)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                        title="Delete review"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: Manage Categories */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Add New Category / Location</h3>
            <form onSubmit={handleCreateCategory} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Category or Location Name..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900"
              />
              <select
                value={newCatType}
                onChange={(e) => setNewCatType(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white"
              >
                <option value="location">Location / Area</option>
                <option value="property_type">Property Type</option>
                <option value="department">University Department</option>
              </select>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </form>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Active Categories & Locations</h3>
              <span className="text-xs text-slate-400 font-mono">{categories.length} Total</span>
            </div>

            <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {categories.map(c => (
                <div key={c._id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">{c.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono uppercase">{c.type}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteCategory(c._id)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
