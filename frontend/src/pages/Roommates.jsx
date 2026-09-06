import React, { useState, useEffect } from 'react';
import { Users, Sparkles, Filter, RotateCcw, Send, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import RoommateCard from '../components/RoommateCard';
import CryptoBadge from '../components/CryptoBadge';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export default function Roommates({ onConnectUser, onViewProfile, onOpenAuth }) {
  const { isAuthenticated } = useAuth();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [smoking, setSmoking] = useState('');
  const [pets, setPets] = useState('');
  const [sleepSchedule, setSleepSchedule] = useState('');
  const [cleanliness, setCleanliness] = useState('');
  const [department, setDepartment] = useState('');
  const [minRent, setMinRent] = useState('');
  const [maxRent, setMaxRent] = useState('');

  // Connect Request Modal State
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [connectNote, setConnectNote] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestFeedback, setRequestFeedback] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      loadSuggestions();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, smoking, pets, sleepSchedule, cleanliness, department, minRent, maxRent]);

  async function loadSuggestions() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (smoking) params.append('smoking', smoking);
      if (pets) params.append('pets', pets);
      if (sleepSchedule) params.append('sleepSchedule', sleepSchedule);
      if (cleanliness) params.append('cleanliness', cleanliness);
      if (department) params.append('department', department);
      if (minRent) params.append('minRent', minRent);
      if (maxRent) params.append('maxRent', maxRent);

      const q = params.toString() ? '?' + params.toString() : '';
      const res = await api.getSuggestedRoommates(q);
      if (res.success) {
        setSuggestions(res.suggestions || []);
      }
    } catch (err) {
      console.error('Load suggestions error:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenConnect(candidate) {
    setSelectedCandidate(candidate);
    setConnectNote(`Hi ${candidate.name}! I saw our compatibility score and lifestyle match. Would love to discuss fall housing together!`);
    setRequestFeedback('');
  }

  async function handleSendRequestSubmit(e) {
    e.preventDefault();
    if (!selectedCandidate) return;

    setSubmittingRequest(true);
    setRequestFeedback('');

    try {
      const res = await api.sendRequest({
        receiverId: selectedCandidate._id,
        note: connectNote,
      });

      if (res.success) {
        setRequestFeedback('Request successfully encrypted with ECC and sent!');
        setTimeout(() => {
          setSelectedCandidate(null);
          setConnectNote('');
          setRequestFeedback('');
        }, 1500);
      }
    } catch (err) {
      setRequestFeedback('Error: ' + err.message);
    } finally {
      setSubmittingRequest(false);
    }
  }

  function handleResetFilters() {
    setSmoking('');
    setPets('');
    setSleepSchedule('');
    setCleanliness('');
    setDepartment('');
    setMinRent('');
    setMaxRent('');
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto border border-brand-100 shadow-sm">
          <Users className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900">Roommate Matching Engine</h2>
        <p className="text-sm text-slate-600 max-w-lg mx-auto">
          Please log in with your verified university credentials to calculate personalized compatibility percentages with prospective roommates.
        </p>
        <button
          onClick={() => onOpenAuth('login')}
          className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition"
        >
          Log In to View Matches
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Compatible Roommates</h1>
            <CryptoBadge type="ecc" label="ECC-ElGamal Matching" size="xs" />
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Ranked by multi-dimensional compatibility matching your sleeping hours, cleanliness, noise preference, and study habits.
          </p>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Filters Sidebar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-brand-600" />
              <span>Lifestyle Filters</span>
            </h3>
            <button
              onClick={handleResetFilters}
              className="text-xs text-brand-600 hover:text-brand-800 font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Cleanliness */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Cleanliness Standard</label>
            <select
              value={cleanliness}
              onChange={(e) => setCleanliness(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white"
            >
              <option value="">Any Cleanliness</option>
              <option value="very-clean">Very Clean & Organized</option>
              <option value="average">Average / Casual</option>
              <option value="relaxed">Relaxed</option>
            </select>
          </div>

          {/* Sleep Schedule */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Sleeping Schedule</label>
            <select
              value={sleepSchedule}
              onChange={(e) => setSleepSchedule(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white"
            >
              <option value="">Any Schedule</option>
              <option value="early-bird">Early Bird (Before 11 PM)</option>
              <option value="night-owl">Night Owl (After 1 AM)</option>
              <option value="flexible">Flexible</option>
            </select>
          </div>

          {/* Smoking */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Smoking Policy</label>
            <select
              value={smoking}
              onChange={(e) => setSmoking(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white"
            >
              <option value="">Any Policy</option>
              <option value="non-smoker">Non-Smoker</option>
              <option value="outside-only">Outside Only</option>
              <option value="smoker">Smoker</option>
            </select>
          </div>

          {/* Pets */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Pet Preferences</label>
            <select
              value={pets}
              onChange={(e) => setPets(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white"
            >
              <option value="">Any</option>
              <option value="no-pets">No Pets</option>
              <option value="cat">Cat Friendly</option>
              <option value="dog">Dog Friendly</option>
            </select>
          </div>

          {/* Budget Range */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Budget Compatibility ($)</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min Rent"
                value={minRent}
                onChange={(e) => setMinRent(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
              />
              <input
                type="number"
                placeholder="Max Rent"
                value={maxRent}
                onChange={(e) => setMaxRent(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* Roommates Grid */}
        <div className="lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 font-mono uppercase">
              {suggestions.length} Verified Student Candidates
            </span>
          </div>

          {loading ? (
            <div className="py-20 text-center text-slate-400">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-brand-500 animate-spin" />
              <p className="text-xs font-semibold">Calculating lifestyle compatibility matrix...</p>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
              <Users className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-base">No roommates match your filters</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try relaxing some lifestyle preference filters to see more student profiles.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {suggestions.map(s => (
                <RoommateCard
                  key={s.user._id}
                  suggestion={s}
                  onConnect={handleOpenConnect}
                  onViewProfile={onViewProfile}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Send Connection Request Modal */}
      <Modal
        isOpen={Boolean(selectedCandidate)}
        onClose={() => setSelectedCandidate(null)}
        title="Send Roommate Connection Request"
      >
        {selectedCandidate && (
          <form onSubmit={handleSendRequestSubmit} className="space-y-4">
            <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-4 h-4 text-brand-600" />
                <span>Asymmetrically Encrypted Connection Note</span>
              </div>
              <p className="text-[11px] text-sky-700">
                Your message will be encrypted using <strong>{selectedCandidate.name}</strong>'s unique ECC secp256k1 public key. Only they can decrypt and read it.
              </p>
            </div>

            {requestFeedback && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                requestFeedback.includes('Error')
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}>
                {requestFeedback.includes('Error') ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{requestFeedback}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Personalized Note to {selectedCandidate.name}
              </label>
              <textarea
                rows={4}
                required
                value={connectNote}
                onChange={(e) => setConnectNote(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <button
              type="submit"
              disabled={submittingRequest}
              className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{submittingRequest ? 'Encrypting with ECC...' : 'Send Encrypted Request'}</span>
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
}
