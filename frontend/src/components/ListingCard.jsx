import React, { useState } from 'react';
import { Bed, Bath, MapPin, Heart, ShieldCheck, Check, Sparkles } from 'lucide-react';
import CryptoBadge from './CryptoBadge';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ListingCard({ listing, onSelect, isSavedInitial = false, onToggleSaved }) {
  const { isAuthenticated } = useAuth();
  const [isSaved, setIsSaved] = useState(isSavedInitial);
  const [saving, setSaving] = useState(false);

  async function handleToggleFavourite(e) {
    e.stopPropagation();
    if (!isAuthenticated) {
      alert('Please log in to save listings to your favourites!');
      return;
    }
    setSaving(true);
    try {
      if (isSaved) {
        await api.removeFavourite(listing._id);
        setIsSaved(false);
      } else {
        await api.saveFavourite(listing._id);
        setIsSaved(true);
      }
      if (onToggleSaved) onToggleSaved(listing._id, !isSaved);
    } catch (err) {
      console.warn('Toggle favourite error:', err);
    } finally {
      setSaving(false);
    }
  }

  const primaryImage = listing.images && listing.images.length > 0
    ? (listing.images[0].url || listing.images[0].data)
    : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80';

  const isCbcVerified = listing.images && listing.images.length > 0
    ? listing.images[0].integrityVerified !== false
    : true;

  return (
    <div
      onClick={() => onSelect(listing._id)}
      className="group bg-white rounded-2xl overflow-hidden border border-slate-200/90 hover:border-brand-300 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer"
    >
      {/* Property Image & Overlays */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        <img
          src={primaryImage}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80';
          }}
        />

        {/* Rent Badge */}
        <div className="absolute top-3 left-3 px-3 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md text-white font-bold text-sm shadow-md">
          ${listing.rent}<span className="text-xs font-normal text-slate-300">/mo</span>
        </div>

        {/* Save to Favourites Button */}
        <button
          onClick={handleToggleFavourite}
          disabled={saving}
          className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md transition shadow-md ${
            isSaved
              ? 'bg-rose-500 text-white'
              : 'bg-white/80 text-slate-700 hover:text-rose-500 hover:bg-white'
          }`}
          title={isSaved ? 'Remove from favourites' : 'Save to favourites'}
        >
          <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
        </button>

        {/* CBC-MAC Media Tag */}
        <div className="absolute bottom-2.5 left-3">
          <CryptoBadge
            type="cbc"
            label={isCbcVerified ? 'CBC-MAC Valid' : 'MAC Mismatch'}
            size="xs"
          />
        </div>

        {/* Furnished Pill */}
        <div className="absolute bottom-2.5 right-3">
          <span className="px-2 py-0.5 rounded-lg bg-white/90 backdrop-blur-md text-[10px] font-bold text-slate-700 uppercase tracking-wider shadow-sm">
            {listing.furnished}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Cryptography Badge */}
          <div className="mb-2 flex items-center justify-between">
            <CryptoBadge type="rsa" label="RSA-512 Encrypted" size="xs" />
            <span className="text-[11px] font-semibold text-slate-400 font-mono capitalize">
              {listing.propertyType}
            </span>
          </div>

          <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-brand-600 transition line-clamp-1 mb-1">
            {listing.title}
          </h3>

          <p className="text-xs text-slate-500 flex items-center gap-1 mb-3">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{listing.neighborhood ? `${listing.neighborhood}, ` : ''}{listing.city}</span>
          </p>

          {/* Quick Specs */}
          <div className="flex items-center gap-3 text-xs text-slate-600 pb-3 border-b border-slate-100 font-medium">
            <div className="flex items-center gap-1">
              <Bed className="w-3.5 h-3.5 text-slate-400" />
              <span>{listing.bedrooms} {listing.bedrooms === 1 ? 'bed' : 'beds'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Bath className="w-3.5 h-3.5 text-slate-400" />
              <span>{listing.bathrooms} {listing.bathrooms === 1 ? 'bath' : 'baths'}</span>
            </div>
            {listing.petAllowed && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">
                Pets OK
              </span>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-3 flex items-center justify-between text-[11px] text-slate-400">
          <span>Move-in: {listing.moveInDate || 'Flexible'}</span>
          <span className="font-bold text-brand-600 group-hover:underline">View Details →</span>
        </div>
      </div>
    </div>
  );
}
