import React, { useState, useEffect } from 'react';
import {
  User, Shield, Lock, Eye, EyeOff, Save, CheckCircle2,
  AlertCircle, Star, Sparkles, Moon, Wind, Volume2, Coffee, ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import CryptoBadge from '../components/CryptoBadge';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState('New');

  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [bio, setBio] = useState('');
  const [preferredLocation, setPreferredLocation] = useState('');
  const [ageRange, setAgeRange] = useState('20-22');
  const [preferredRentMin, setPreferredRentMin] = useState(600);
  const [preferredRentMax, setPreferredRentMax] = useState(1100);
  const [targetMoveInDate, setTargetMoveInDate] = useState('2026-09-01');

  // Lifestyle
  const [smoking, setSmoking] = useState('non-smoker');
  const [pets, setPets] = useState('no-pets');
  const [sleepSchedule, setSleepSchedule] = useState('flexible');
  const [cleanliness, setCleanliness] = useState('average');
  const [noisePreference, setNoisePreference] = useState('quiet');
  const [studyHabits, setStudyHabits] = useState('quiet-study');
  const [cookingHabits, setCookingHabits] = useState('occasional');
  const [guestPreference, setGuestPreference] = useState('weekends');

  // Privacy controls
  const [showPhone, setShowPhone] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [showAge, setShowAge] = useState(true);
  const [showBudget, setShowBudget] = useState(true);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const res = await api.getMyProfile();
      if (res.success) {
        const u = res.user;
        const p = res.profile;
        setProfileData(p);

        setName(u.name || '');
        setPhone(u.phone || '');
        setDepartment(u.department || '');
        setYearOfStudy(u.yearOfStudy || '');

        if (p) {
          setBio(p.bio || '');
          setPreferredLocation(p.preferredLocation || '');
          setAgeRange(p.ageRange || '20-22');
          setPreferredRentMin(p.preferredRentMin || 600);
          setPreferredRentMax(p.preferredRentMax || 1100);
          setTargetMoveInDate(p.targetMoveInDate || '2026-09-01');

          if (p.lifestyle) {
            setSmoking(p.lifestyle.smoking || 'non-smoker');
            setPets(p.lifestyle.pets || 'no-pets');
            setSleepSchedule(p.lifestyle.sleepSchedule || 'flexible');
            setCleanliness(p.lifestyle.cleanliness || 'average');
            setNoisePreference(p.lifestyle.noisePreference || 'quiet');
            setStudyHabits(p.lifestyle.studyHabits || 'quiet-study');
            setCookingHabits(p.lifestyle.cookingHabits || 'occasional');
            setGuestPreference(p.lifestyle.guestPreference || 'weekends');
          }

          if (p.privacy) {
            setShowPhone(p.privacy.showPhone || false);
            setShowEmail(p.privacy.showEmail || false);
            setShowAge(p.privacy.showAge ?? true);
            setShowBudget(p.privacy.showBudget ?? true);
          }
        }

        // Load reviews received
        const revRes = await api.getUserReviews(u._id);
        if (revRes.success) {
          setReviews(revRes.reviews || []);
          setAvgRating(revRes.averageRating || 'New');
        }
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setFeedback('');
    setError('');

    try {
      const res = await api.updateProfile({
        name,
        phone,
        department,
        yearOfStudy,
        bio,
        preferredLocation,
        ageRange,
        preferredRentMin,
        preferredRentMax,
        targetMoveInDate,
        lifestyle: {
          smoking,
          pets,
          sleepSchedule,
          cleanliness,
          noisePreference,
          studyHabits,
          cookingHabits,
          guestPreference,
        },
        privacy: {
          showPhone,
          showEmail,
          showAge,
          showBudget,
        },
      });

      if (res.success) {
        setFeedback('Profile successfully updated & securely re-encrypted with RSA!');
        await refreshUser();
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Profile Header Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-sky-500 text-white flex items-center justify-center font-bold text-2xl shadow-md shadow-brand-500/20">
            {name ? name.charAt(0) : 'U'}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">{name}</h1>
            <p className="text-xs text-slate-500">{department} • {yearOfStudy}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <CryptoBadge type="rsa" label="RSA-512 Encrypted" size="xs" />
              <CryptoBadge type="ecc" label="ECC Ready" size="xs" />
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                2FA Verified
              </span>
            </div>
          </div>
        </div>

        {/* Rating Metric */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
          <Star className="w-6 h-6 text-amber-500 fill-current" />
          <div>
            <span className="text-lg font-bold font-mono text-slate-900">{avgRating}</span>
            <span className="text-[10px] text-slate-400 block font-medium">({reviews.length} roommate reviews)</span>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{feedback}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2 shadow-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-8">
        {/* Section 1: Personal & Academic Info */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-base text-slate-900">Personal & Academic Information</h2>
            <span className="text-[11px] text-slate-400 font-mono">Encrypted with System RSA</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone Number</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Program / Department</label>
              <input
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Year of Study</label>
              <select
                value={yearOfStudy}
                onChange={(e) => setYearOfStudy(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
              >
                <option value="Freshman">Freshman</option>
                <option value="Sophomore">Sophomore</option>
                <option value="Junior">Junior</option>
                <option value="Senior">Senior</option>
                <option value="Graduate">Graduate</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Student Bio & Introduction</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell prospective roommates about your habits, academic schedule, and what you look for in a living space..."
              className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Location</label>
              <input
                type="text"
                value={preferredLocation}
                onChange={(e) => setPreferredLocation(e.target.value)}
                placeholder="e.g. North Campus"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Max Rent Budget ($/mo)</label>
              <input
                type="number"
                value={preferredRentMax}
                onChange={(e) => setPreferredRentMax(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Move-in Date</label>
              <input
                type="date"
                value={targetMoveInDate}
                onChange={(e) => setTargetMoveInDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Lifestyle Preferences (Roommate Matching Inputs) */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-base text-slate-900">Lifestyle Preferences</h2>
              <p className="text-xs text-slate-500">Powers the 0-100% compatibility algorithm with potential roommates.</p>
            </div>
            <Sparkles className="w-5 h-5 text-brand-600" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Cleanliness Habit</label>
              <select
                value={cleanliness}
                onChange={(e) => setCleanliness(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white"
              >
                <option value="very-clean">Very Clean (Clean daily/immediately)</option>
                <option value="average">Average (Weekly cleaning)</option>
                <option value="relaxed">Relaxed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Sleeping Schedule</label>
              <select
                value={sleepSchedule}
                onChange={(e) => setSleepSchedule(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white"
              >
                <option value="early-bird">Early Bird (Sleeps before 11 PM)</option>
                <option value="night-owl">Night Owl (Sleeps after 1 AM)</option>
                <option value="flexible">Flexible Hours</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Smoking Policy</label>
              <select
                value={smoking}
                onChange={(e) => setSmoking(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white"
              >
                <option value="non-smoker">Strict Non-Smoker</option>
                <option value="outside-only">Outside Only</option>
                <option value="smoker">Smoker</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pet Policy</label>
              <select
                value={pets}
                onChange={(e) => setPets(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white"
              >
                <option value="no-pets">No Pets</option>
                <option value="cat">Have or love cats</option>
                <option value="dog">Have or love dogs</option>
                <option value="other">Other pets</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Noise Preference</label>
              <select
                value={noisePreference}
                onChange={(e) => setNoisePreference(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white"
              >
                <option value="quiet">Quiet study atmosphere</option>
                <option value="moderate">Moderate background sounds</option>
                <option value="lively">Lively / Music OK</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Cooking Habits</label>
              <select
                value={cookingHabits}
                onChange={(e) => setCookingHabits(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white"
              >
                <option value="daily">Daily home-cooked meals</option>
                <option value="occasional">Occasional cooking</option>
                <option value="rarely">Rarely cook / Takeout</option>
                <option value="strict-diet">Strict dietary requirements</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Privacy Controls */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-base text-slate-900">Privacy & Visibility Controls</h2>
              <p className="text-xs text-slate-500">
                You control what prospective roommates can see on public searches. Sensitive data is never shown without explicit consent.
              </p>
            </div>
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-slate-100/60">
              <div>
                <span className="font-bold text-slate-900 block">Show Contact Phone Number Publicly</span>
                <span className="text-slate-500 text-[11px]">Default: OFF. Keep hidden until you accept a connection request.</span>
              </div>
              <input
                type="checkbox"
                checked={showPhone}
                onChange={(e) => setShowPhone(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-slate-100/60">
              <div>
                <span className="font-bold text-slate-900 block">Show University Email Publicly</span>
                <span className="text-slate-500 text-[11px]">Default: OFF. Prevent unsolicited email inquiries.</span>
              </div>
              <input
                type="checkbox"
                checked={showEmail}
                onChange={(e) => setShowEmail(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-slate-100/60">
              <div>
                <span className="font-bold text-slate-900 block">Display Target Rent Budget Range</span>
                <span className="text-slate-500 text-[11px]">Shows your min and max budget on roommate match results.</span>
              </div>
              <input
                type="checkbox"
                checked={showBudget}
                onChange={(e) => setShowBudget(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
              />
            </label>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Encrypting & Updating Profile...' : 'Save & Re-Encrypt Profile'}</span>
        </button>
      </form>

      {/* Section 4: Received Roommate Reviews */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-base text-slate-900">Verified Roommate Reviews</h3>
        {reviews.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No reviews received yet. Reviews can be left by students with accepted roommate connections.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map(r => (
              <div key={r._id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{r.reviewerName}</span>
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(r.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-slate-600 italic whitespace-pre-line">"{r.comment}"</p>
                <span className="text-[10px] text-slate-400 font-mono block">
                  {new Date(r.createdAt).toLocaleDateString()} • RSA Decrypted
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
