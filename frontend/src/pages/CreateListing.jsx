import React, { useState } from "react";
import { PlusCircle, Upload, Check, AlertCircle, ArrowLeft, Image, ShieldCheck, Home, CheckCircle2 } from 'lucide-react';
import { api } from "../services/api";
import CryptoBadge from "../components/CryptoBadge";

export default function CreateListing({ onBack, onListingCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("North Campus");
  const [neighborhood, setNeighborhood] = useState("");
  const [rent, setRent] = useState("");
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [availableRooms, setAvailableRooms] = useState(1);
  const [moveInDate, setMoveInDate] = useState("2026-09-01");
  const [utilitiesIncluded, setUtilitiesIncluded] = useState(true);
  const [furnished, setFurnished] = useState("furnished");
  const [propertyType, setPropertyType] = useState("apartment");
  const [petAllowed, setPetAllowed] = useState(false);
  const [genderPreference, setGenderPreference] = useState("any");

  const [amenitiesList, setAmenitiesList] = useState([
    "High-Speed WiFi", "In-Unit Washer/Dryer", "Air Conditioning", "Dishwasher", "Bike Storage", "Gym Access"
  ]);
  const [selectedAmenities, setSelectedAmenities] = useState(["High-Speed WiFi", "In-Unit Washer/Dryer"]);

  const [imageUrl, setImageUrl] = useState("https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80");
  const [images, setImages] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggleAmenity(am) {
    if (selectedAmenities.includes(am)) {
      setSelectedAmenities(selectedAmenities.filter(a => a !== am));
    } else {
      setSelectedAmenities([...selectedAmenities, am]);
    }
  }

  function handleAddImageUrl() {
    if (!imageUrl.trim()) return;
    setImages([...images, { url: imageUrl.trim() }]);
    setImageUrl("");
  }

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setImages([...images, { data: reader.result, url: "" }]);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const allImages = images.length > 0 ? images : [{ url: imageUrl.trim() }];
      const res = await api.createListing({
        title,
        description,
        address,
        city,
        neighborhood,
        rent: Number(rent),
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        availableRooms: Number(availableRooms),
        moveInDate,
        utilitiesIncluded,
        furnished,
        propertyType,
        petAllowed,
        genderPreference,
        amenities: selectedAmenities,
        images: allImages,
      });

      if (res.success) {
        alert("Listing published successfully with RSA payload encryption and CBC-MAC authentication!");
        if (onListingCreated) onListingCreated(res.listing._id);
        else onBack();
      }
    } catch (err) {
      setError(err.message || "Failed to create listing");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Cancel & Back</span>
      </button>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Create Housing Listing</h1>
            <CryptoBadge type="rsa" label="RSA Encrypted" size="xs" />
          </div>
          <p className="text-xs text-slate-500">
            Publish your apartment, room, or sublease for fellow university students.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Listing Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Listing Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Spacious 2BR Apartment near Engineering Quad"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          {/* Location details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Campus Area *</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
              >
                <option value="North Campus">North Campus</option>
                <option value="South Campus">South Campus</option>
                <option value="Campus District">Campus District</option>
                <option value="Downtown">Downtown</option>
                <option value="Eastside">Eastside</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Neighborhood / Landmark</label>
              <input
                type="text"
                placeholder="e.g. Elm Street"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Street Address (Encrypted)</label>
              <input
                type="text"
                placeholder="412 University Ave"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          {/* Rent & Rooms */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Rent ($) *</label>
              <input
                type="number"
                required
                min={100}
                placeholder="850"
                value={rent}
                onChange={(e) => setRent(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Total Bedrooms</label>
              <input
                type="number"
                min={1}
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bathrooms</label>
              <input
                type="number"
                min={1}
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Available Rooms</label>
              <input
                type="number"
                min={1}
                value={availableRooms}
                onChange={(e) => setAvailableRooms(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          {/* Furnished, Property Type, Move-In */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Furnished Status</label>
              <select
                value={furnished}
                onChange={(e) => setFurnished(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
              >
                <option value="furnished">Furnished</option>
                <option value="semi-furnished">Semi-Furnished</option>
                <option value="unfurnished">Unfurnished</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Property Type</label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
              >
                <option value="apartment">Apartment</option>
                <option value="house">House / Townhome</option>
                <option value="studio">Private Studio</option>
                <option value="shared-room">Shared Room</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Move-in Date</label>
              <input
                type="date"
                value={moveInDate}
                onChange={(e) => setMoveInDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Description (Encrypted)</label>
            <textarea
              rows={4}
              required
              placeholder="Describe the unit, lighting, neighborhood, distance to campus, and roommate expectations..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          {/* Amenities checklist */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Amenities Included</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {amenitiesList.map(am => (
                <button
                  type="button"
                  key={am}
                  onClick={() => toggleAmenity(am)}
                  className={"px-3 py-2 rounded-xl text-xs font-semibold border text-left flex items-center justify-between transition " + (
                    selectedAmenities.includes(am)
                      ? "bg-sky-50 text-brand-700 border-brand-300"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <span>{am}</span>
                  {selectedAmenities.includes(am) && <Check className="w-3.5 h-3.5 text-brand-600" />}
                </button>
              ))}
            </div>
          </div>

          {/* Images & CBC-MAC Section */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Property Photos & Integrity Verification</span>
              <CryptoBadge type="cbc" label="CBC-MAC Verified Media" size="xs" />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Image URL or Sample Unsplash Link</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="pt-2">
              <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-100">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload File from Device (Base64)</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {images.length > 0 && (
              <div className="flex gap-2 pt-2 overflow-x-auto">
                {images.map((img, idx) => (
                  <div key={idx} className="relative w-20 h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                    <img src={img.url || img.data} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{loading ? "Encrypting & Storing..." : "Publish Housing Listing"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
