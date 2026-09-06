import React, { useState, useEffect } from 'react';
import {
  Search, SlidersHorizontal, Bed, Bath, DollarSign, Home,
  RotateCcw, PlusCircle, Sparkles, Filter, Check
} from 'lucide-react';
import { api } from '../services/api';
import ListingCard from '../components/ListingCard';
import CryptoBadge from '../components/CryptoBadge';
import { useAuth } from '../context/AuthContext';

export default function Listings({ onSelectListing, setTab }) {
  const { isAuthenticated } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [minRent, setMinRent] = useState('');
  const [maxRent, setMaxRent] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [furnished, setFurnished] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [petAllowed, setPetAllowed] = useState(false);
  const [genderPreference, setGenderPreference] = useState('');

  // Mobile filters toggle
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    fetchListings();
  }, [city, minRent, maxRent, bedrooms, bathrooms, furnished, propertyType, petAllowed, genderPreference]);

  async function fetchListings() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (city) params.append('city', city);
      if (minRent) params.append('minRent', minRent);
      if (maxRent) params.append('maxRent', maxRent);
      if (bedrooms) params.append('bedrooms', bedrooms);
      if (bathrooms) params.append('bathrooms', bathrooms);
      if (furnished) params.append('furnished', furnished);
      if (propertyType) params.append('propertyType', propertyType);
      if (petAllowed) params.append('petAllowed', 'true');
      if (genderPreference) params.append('genderPreference', genderPreference);

      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const res = await api.getListings(queryStr);
      if (res.success) {
        setListings(res.listings || []);
      }
    } catch (err) {
      console.error('Fetch listings error:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleResetFilters() {
    setSearch('');
    setCity('');
    setMinRent('');
    setMaxRent('');
    setBedrooms('');
    setBathrooms('');
    setFurnished('');
    setPropertyType('');
    setPetAllowed(false);
    setGenderPreference('');
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Housing Listings</h1>
            <CryptoBadge type="rsa" label="RSA Encrypted" size="xs" />
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Search verified off-campus apartments, rooms, and shared student housing.
          </p>
        </div>

        {isAuthenticated && (
          <button
            onClick={() => setTab('create-listing')}
            className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Listing</span>
          </button>
        )}
      </div>

      {/* Main Layout: Filters Sidebar + Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Mobile Filter Button */}
        <div className="lg:hidden flex items-center justify-between">
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-sm"
          >
            <SlidersHorizontal className="w-4 h-4 text-brand-600" />
            <span>{showMobileFilters ? 'Hide Filters' : 'Filter Listings'}</span>
          </button>
          <span className="text-xs text-slate-500 font-mono">{listings.length} results</span>
        </div>

        {/* Sidebar Filters */}
        <div className={`lg:block ${showMobileFilters ? 'block' : 'hidden'} bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-6`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-brand-600" />
              <span>Search Filters</span>
            </h3>
            <button
              onClick={handleResetFilters}
              className="text-xs text-brand-600 hover:text-brand-800 font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Keyword search */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Keywords</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Title or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchListings()}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          {/* Location / Campus Area */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Campus Area / Location</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
            >
              <option value="">All Locations</option>
              <option value="Campus District">Campus District</option>
              <option value="North Campus">North Campus (Engineering)</option>
              <option value="South Campus">South Campus (Business)</option>
              <option value="Downtown">Downtown</option>
              <option value="Eastside">Eastside (Medical)</option>
            </select>
          </div>

          {/* Rent Range */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Monthly Rent ($)</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min ($)"
                value={minRent}
                onChange={(e) => setMinRent(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-mono"
              />
              <input
                type="number"
                placeholder="Max ($)"
                value={maxRent}
                onChange={(e) => setMaxRent(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-mono"
              />
            </div>
          </div>

          {/* Bedrooms */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Bedrooms</label>
            <div className="grid grid-cols-4 gap-1">
              {['', '1', '2', '3'].map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBedrooms(b)}
                  className={`py-1.5 rounded-lg text-xs font-semibold border transition ${
                    bedrooms === b
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {b === '' ? 'Any' : b === '3' ? '3+' : b}
                </button>
              ))}
            </div>
          </div>

          {/* Furnished */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Furnished Status</label>
            <select
              value={furnished}
              onChange={(e) => setFurnished(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white capitalize"
            >
              <option value="">Any Status</option>
              <option value="furnished">Furnished</option>
              <option value="semi-furnished">Semi-Furnished</option>
              <option value="unfurnished">Unfurnished</option>
            </select>
          </div>

          {/* Property Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Property Type</label>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white capitalize"
            >
              <option value="">Any Type</option>
              <option value="apartment">Apartment</option>
              <option value="house">House / Townhome</option>
              <option value="studio">Private Studio</option>
              <option value="shared-room">Shared Room</option>
            </select>
          </div>

          {/* Checkboxes */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={petAllowed}
                onChange={(e) => setPetAllowed(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
              />
              <span>Pet Friendly Only</span>
            </label>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
              Showing {listings.length} available housing options
            </p>
          </div>

          {loading ? (
            <div className="py-20 text-center text-slate-400">
              <Home className="w-8 h-8 mx-auto mb-2 text-slate-300 animate-bounce" />
              <p className="text-xs font-semibold">Decrypting housing listings with RSA...</p>
            </div>
          ) : listings.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
              <Home className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-base">No listings match your criteria</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try widening your rent range or clearing some filters to see more results.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map(l => (
                <ListingCard
                  key={l._id}
                  listing={l}
                  onSelect={onSelectListing}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
