import React, { useState } from 'react';
import {
  Sparkles, CheckCircle2, UserPlus, Shield, Heart,
  AlertCircle, Moon, Sun, Wind, Volume2, Coffee, ChevronRight
} from 'lucide-react';
import CryptoBadge from './CryptoBadge';

export default function RoommateCard({ suggestion, onConnect, onViewProfile }) {
  const { user, profile, compatibilityScore, matchedFactors, differingFactors } = suggestion;
  const [showFactors, setShowFactors] = useState(false);

  // Determine score color badge
  const scoreBadge =
    compatibilityScore >= 90
      ? { bg: 'bg-emerald-500 text-white shadow-emerald-500/30', label: 'Exceptional Match' }
      : compatibilityScore >= 75
      ? { bg: 'bg-brand-600 text-white shadow-brand-600/30', label: 'Great Match' }
      : compatibilityScore >= 60
      ? { bg: 'bg-amber-500 text-white shadow-amber-500/30', label: 'Good Match' }
      : { bg: 'bg-slate-600 text-white shadow-slate-600/30', label: 'Moderate Match' };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 p-5 flex flex-col justify-between">
      <div>
        {/* Top Header: Identity & Compatibility Badge */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-brand-500/20">
              {user.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight hover:text-brand-600 transition cursor-pointer" onClick={() => onViewProfile(user._id)}>
                {user.name}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {user.department} • <span className="text-slate-400">{user.yearOfStudy}</span>
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <CryptoBadge type="rsa" label="RSA Profile" size="xs" />
                <CryptoBadge type="ecc" label="ECC Chat Ready" size="xs" />
              </div>
            </div>
          </div>

          {/* Compatibility Badge */}
          <div className="flex flex-col items-end">
            <div className={`px-3 py-1.5 rounded-xl font-mono font-extrabold text-sm flex items-center gap-1 shadow-md ${scoreBadge.bg}`}>
              <Sparkles className="w-3.5 h-3.5" />
              <span>{compatibilityScore}%</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
              {scoreBadge.label}
            </span>
          </div>
        </div>

        {/* Bio Snippet */}
        {profile?.bio && (
          <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-xl mb-4 line-clamp-2 border border-slate-100">
            "{profile.bio}"
          </p>
        )}

        {/* Lifestyle Attribute Pills */}
        <div className="grid grid-cols-2 gap-1.5 mb-4 text-xs">
          <div className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2 text-slate-700">
            <Sparkles className="w-3.5 h-3.5 text-brand-500 shrink-0" />
            <span className="truncate capitalize">{profile?.lifestyle?.cleanliness || 'Average'} Clean</span>
          </div>

          <div className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2 text-slate-700">
            <Moon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="truncate capitalize">{profile?.lifestyle?.sleepSchedule || 'Flexible'}</span>
          </div>

          <div className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2 text-slate-700">
            <Wind className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="truncate capitalize">{profile?.lifestyle?.smoking || 'Non-smoker'}</span>
          </div>

          <div className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2 text-slate-700">
            <Volume2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate capitalize">{profile?.lifestyle?.noisePreference || 'Quiet'} Atmosphere</span>
          </div>
        </div>

        {/* Budget & Target Move-In */}
        <div className="flex items-center justify-between text-xs text-slate-500 py-2.5 border-t border-slate-100 mb-3">
          <span>
            Budget: <strong className="text-slate-800 font-mono">${profile?.preferredRentMin || 600} - ${profile?.preferredRentMax || 1100}</strong>
          </span>
          <span>Target: <strong className="text-slate-800">{profile?.targetMoveInDate || 'Fall 2026'}</strong></span>
        </div>

        {/* Compatibility Breakdown Toggle */}
        <button
          onClick={() => setShowFactors(!showFactors)}
          className="text-xs text-brand-600 hover:text-brand-800 font-semibold flex items-center gap-1 mb-4"
        >
          <span>{showFactors ? 'Hide Compatibility Breakdown' : 'Why are we a match?'}</span>
          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showFactors ? 'rotate-90' : ''}`} />
        </button>

        {/* Breakdown Panel */}
        {showFactors && (
          <div className="p-3 bg-sky-50/60 rounded-xl border border-sky-100 text-xs space-y-2 mb-4">
            {matchedFactors && matchedFactors.length > 0 && (
              <div>
                <p className="font-bold text-sky-900 mb-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Shared Compatibility Factors:
                </p>
                <ul className="list-disc list-inside text-slate-700 space-y-0.5 pl-1">
                  {matchedFactors.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
            )}

            {differingFactors && differingFactors.length > 0 && (
              <div className="pt-2 border-t border-sky-100">
                <p className="font-bold text-amber-900 mb-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  Lifestyle Differences:
                </p>
                <ul className="list-disc list-inside text-slate-700 space-y-0.5 pl-1">
                  {differingFactors.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
        <button
          onClick={() => onViewProfile(user._id)}
          className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition text-center"
        >
          View Profile
        </button>
        <button
          onClick={() => onConnect(user)}
          className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 transition flex items-center justify-center gap-1.5 shadow-sm shadow-brand-600/20"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Connect Request
        </button>
      </div>
    </div>
  );
}
