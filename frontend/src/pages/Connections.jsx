import React, { useState, useEffect } from 'react';
import {
  Users, CheckCircle2, XCircle, Clock, MessageSquare, ShieldCheck,
  ArrowRight, Check, X, Ban, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import CryptoBadge from '../components/CryptoBadge';

export default function Connections({ onStartChat, onViewProfile }) {
  const [activeTab, setActiveTab] = useState('received'); // 'received' | 'sent'
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);
    try {
      const [rRes, sRes] = await Promise.all([
        api.getReceivedRequests(),
        api.getSentRequests(),
      ]);
      if (rRes.success) setReceivedRequests(rRes.requests || []);
      if (sRes.success) setSentRequests(sRes.requests || []);
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept(requestId) {
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

  async function handleDecline(requestId) {
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

  async function handleCancel(requestId) {
    if (!window.confirm('Cancel this connection request?')) return;
    setActionLoading(prev => ({ ...prev, [requestId]: true }));
    try {
      const res = await api.cancelRequest(requestId);
      if (res.success) {
        setSentRequests(prev =>
          prev.map(r => r._id === requestId ? { ...r, status: 'cancelled' } : r)
        );
      }
    } catch (err) {
      alert('Failed to cancel request: ' + err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [requestId]: false }));
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Roommate Requests</h1>
            <CryptoBadge type="ecc" label="ECC Protected" size="xs" />
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Manage your incoming and outgoing roommate connection requests. Once accepted, end-to-end encrypted messaging is unlocked.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('received')}
            className={`px-4 py-2 rounded-lg transition ${
              activeTab === 'received'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Received ({receivedRequests.filter(r => r.status === 'pending').length} pending)
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`px-4 py-2 rounded-lg transition ${
              activeTab === 'sent'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sent ({sentRequests.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 mx-auto mb-2 text-brand-500 animate-spin" />
          <p className="text-xs font-semibold">Decrypting connection requests...</p>
        </div>
      ) : activeTab === 'received' ? (
        /* Received Requests List */
        <div className="space-y-4">
          {receivedRequests.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="font-bold text-slate-800 text-sm">No connection requests received</h3>
              <p className="text-xs text-slate-500 mt-1">
                When students request to connect with you, they will appear here with ECC-decrypted intro notes.
              </p>
            </div>
          ) : (
            receivedRequests.map(req => (
              <div
                key={req._id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-sky-500 text-white flex items-center justify-center font-bold text-base shadow-sm">
                    {req.sender.name ? req.sender.name.charAt(0) : 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4
                        onClick={() => onViewProfile(req.sender._id)}
                        className="font-bold text-slate-900 text-sm hover:text-brand-600 transition cursor-pointer"
                      >
                        {req.sender.name}
                      </h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                        req.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                        req.status === 'declined' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                      {req.sender.department} • {req.sender.yearOfStudy}
                    </p>

                    {req.note && (
                      <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 italic">
                        "{req.note}"
                      </div>
                    )}

                    <span className="text-[10px] text-slate-400 font-mono block mt-1">
                      Received: {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {req.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => handleAccept(req._id)}
                        disabled={actionLoading[req._id]}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        <span>Accept</span>
                      </button>
                      <button
                        onClick={() => handleDecline(req._id)}
                        disabled={actionLoading[req._id]}
                        className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 font-bold text-xs transition disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        <span>Decline</span>
                      </button>
                    </>
                  ) : req.status === 'accepted' ? (
                    <button
                      onClick={() => onStartChat(req.sender._id)}
                      className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Start Encrypted Chat</span>
                    </button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Sent Requests List */
        <div className="space-y-4">
          {sentRequests.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="font-bold text-slate-800 text-sm">No outgoing requests sent yet</h3>
              <p className="text-xs text-slate-500 mt-1">
                Browse roommates on the Find Roommates tab and send your first connection request!
              </p>
            </div>
          ) : (
            sentRequests.map(req => (
              <div
                key={req._id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-base shadow-sm">
                    {req.receiver.name ? req.receiver.name.charAt(0) : 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4
                        onClick={() => onViewProfile(req.receiver._id)}
                        className="font-bold text-slate-900 text-sm hover:text-brand-600 transition cursor-pointer"
                      >
                        {req.receiver.name}
                      </h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                        req.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                        req.status === 'declined' ? 'bg-rose-100 text-rose-800' :
                        req.status === 'cancelled' ? 'bg-slate-100 text-slate-600' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                      {req.receiver.department} • {req.receiver.yearOfStudy}
                    </p>

                    <span className="text-[10px] text-slate-400 font-mono block mt-1">
                      Sent: {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {req.status === 'pending' ? (
                    <button
                      onClick={() => handleCancel(req._id)}
                      disabled={actionLoading[req._id]}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition disabled:opacity-50"
                    >
                      Cancel Request
                    </button>
                  ) : req.status === 'accepted' ? (
                    <button
                      onClick={() => onStartChat(req.receiver._id)}
                      className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Open Encrypted Chat</span>
                    </button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
