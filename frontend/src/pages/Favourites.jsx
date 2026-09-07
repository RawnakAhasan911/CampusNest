import React, { useState, useEffect } from 'react';
import { Heart, Home, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import ListingCard from '../components/ListingCard';
import CryptoBadge from '../components/CryptoBadge';

export default function Favourites({ onSelectListing, setTab }) {
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavourites();
  }, []);

  async function loadFavourites() {
    setLoading(true);
    try {
      const res = await api.getFavourites();
      if (res.success) {
        setFavourites(res.listings || []);
      }
    } catch (err) {
      console.error('Failed to load favourites:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleToggleSaved(listingId, nowSaved) {
    if (!nowSaved) {
      setFavourites(prev => prev.filter(f => f.listing._id !== listingId));
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="pb-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Saved Housing Listings</h1>
            <CryptoBadge type="rsa" label="RSA Decrypted" size="xs" />
          </div>
          <p className="text-xs text-slate-500">
            Properties you've bookmarked for your upcoming university semester.
          </p>
        </div>

        <button
          onClick={() => setTab('listings')}
          className="text-xs font-bold text-brand-600 hover:text-brand-800"
        >
          Browse more listings →
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs font-semibold">Loading saved listings...</p>
        </div>
      ) : favourites.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-slate-200 shadow-sm space-y-3">
          <Heart className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">No saved listings yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Click the heart icon on any housing card to bookmark it to your dashboard.
          </p>
          <button
            onClick={() => setTab('listings')}
            className="px-4 py-2 rounded-xl bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-600/20"
          >
            Explore Listings
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favourites.map(fav => (
            <ListingCard
              key={fav.favouriteId}
              listing={fav.listing}
              onSelect={onSelectListing}
              isSavedInitial={true}
              onToggleSaved={handleToggleSaved}
            />
          ))}
        </div>
      )}
    </div>
  );
}
