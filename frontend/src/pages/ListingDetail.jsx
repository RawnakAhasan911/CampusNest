import React, { useState, useEffect } from "react";
import {
  ArrowLeft, MapPin, Bed, Bath, DollarSign, Calendar, Check,
  Heart, ShieldAlert, AlertTriangle, ShieldCheck, User, MessageSquare, Trash2, CheckCircle2
} from "lucide-react";
import { api } from "../services/api";
import CryptoBadge from "../components/CryptoBadge";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";

export default function ListingDetail({ listingId, onBack, onConnectOwner, setTab }) {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [listing, setListing] = useState(null);
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("Misleading or inaccurate details");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await api.getListing(listingId);
        if (res.success) {
          setListing(res.listing);
          setOwner(res.owner);
        }
        if (isAuthenticated) {
          const favRes = await api.checkFavourite(listingId);
          setIsSaved(favRes.isFavourite);
        }
      } catch (err) {
        console.error("Failed to load listing:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [listingId, isAuthenticated]);

  async function handleToggleFavourite() {
    if (!isAuthenticated) {
      alert("Please log in to save listings.");
      return;
    }
    try {
      if (isSaved) {
        await api.removeFavourite(listingId);
        setIsSaved(false);
      } else {
        await api.saveFavourite(listingId);
        setIsSaved(true);
      }
    } catch (e) {}
  }

  async function handleToggleStatus() {
    const nextStatus = listing.status === "available" ? "rented" : "available";
    try {
      const res = await api.updateListingStatus(listingId, nextStatus);
      if (res.success) {
        setListing(prev => ({ ...prev, status: nextStatus }));
      }
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  }

  async function handleDeleteListing() {
    if (!window.confirm("Are you sure you want to remove this housing listing?")) return;
    try {
      await api.deleteListing(listingId);
      alert("Listing removed successfully.");
      onBack();
    } catch (err) {
      alert("Failed to delete listing: " + err.message);
    }
  }

  async function handleReportSubmit(e) {
    e.preventDefault();
    setReportSubmitting(true);
    try {
      await api.submitReport({
        targetType: "listing",
        reportedListingId: listingId,
        reason: reportReason,
        details: reportDetails,
      });
      alert("Report submitted securely. Thank you for keeping our community safe.");
      setReportModalOpen(false);
      setReportDetails("");
    } catch (err) {
      alert("Failed to submit report: " + err.message);
    } finally {
      setReportSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-semibold">Decrypting listing data with RSA...</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center space-y-4">
        <p className="text-slate-600 text-sm">Listing not found or has been removed.</p>
        <button onClick={onBack} className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold">
          Back to Listings
        </button>
      </div>
    );
  }

  const isOwner = user && owner && user._id === owner._id;
  const canManage = isOwner || isAdmin;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Listings</span>
        </button>

        <div className="flex items-center gap-2">
          {canManage && (
            <>
              <button
                onClick={handleToggleStatus}
                className={"px-3 py-1.5 rounded-xl text-xs font-bold border transition " + (
                  listing.status === "available"
                    ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                )}
              >
                {listing.status === "available" ? "Mark as Rented (Hide)" : "Mark as Available"}
              </button>
              <button
                onClick={handleDeleteListing}
                className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 transition"
                title="Delete listing"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            onClick={handleToggleFavourite}
            className={"flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition " + (
              isSaved
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            )}
          >
            <Heart className={"w-3.5 h-3.5 " + (isSaved ? "fill-current text-rose-500" : "")} />
            <span>{isSaved ? "Saved" : "Save to Favourites"}</span>
          </button>

          <button
            onClick={() => setReportModalOpen(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition"
            title="Report this listing"
          >
            <ShieldAlert className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-3">
            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
              <img
                src={listing.images && listing.images.length > 0 ? (listing.images[0].url || listing.images[0].data) : ""}
                alt={listing.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80";
                }}
              />
              <div className="absolute top-3 left-3">
                <div className="px-3 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md text-white font-bold text-base shadow-md">
                  ${listing.rent}<span className="text-xs font-normal text-slate-300">/month</span>
                </div>
              </div>

              <div className="absolute bottom-3 left-3">
                <CryptoBadge type="cbc" label="CBC-MAC Media Verified" size="xs" />
              </div>
            </div>

            {listing.images && listing.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {listing.images.map((img, idx) => (
                  <div key={idx} className="w-20 h-14 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                    <img src={img.url || img.data} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <CryptoBadge type="rsa" label="RSA-512 Encrypted Payload" size="xs" />
              {listing.status === "rented" && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                  Rented / Unavailable
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{listing.title}</h1>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1.5">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>{listing.address ? listing.address + ", " : ""}{listing.neighborhood ? listing.neighborhood + ", " : ""}{listing.city}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-y border-slate-200 text-xs">
            <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Bedrooms</span>
              <span className="font-bold text-slate-900 text-sm">{listing.bedrooms} Beds</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Bathrooms</span>
              <span className="font-bold text-slate-900 text-sm">{listing.bathrooms} Baths</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Furnished</span>
              <span className="font-bold text-slate-900 text-sm capitalize">{listing.furnished}</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Move-In</span>
              <span className="font-bold text-slate-900 text-sm">{listing.moveInDate || "Flexible"}</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-900">About this Property</h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {listing.description || "No additional description provided."}
            </p>
          </div>

          {listing.amenities && listing.amenities.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-slate-900">Included Amenities</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-700">
                {listing.amenities.map((am, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{am}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Host Information</h3>

            {owner ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-sky-500 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-brand-500/20">
                    {owner.name ? owner.name.charAt(0) : "U"}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{owner.name}</h4>
                    <p className="text-xs text-slate-500">{owner.department} • {owner.yearOfStudy}</p>
                    <span className="inline-block mt-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                      Verified University Student
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 text-slate-600 border border-slate-100">
                  <p>• Contact phone is protected by student privacy controls.</p>
                  <p>• Send an encrypted connection request to message this host.</p>
                </div>

                {!isOwner && (
                  <button
                    onClick={() => onConnectOwner(owner)}
                    className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Contact Host via Encrypted Request</span>
                  </button>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">Host details hidden.</p>
            )}
          </div>

          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md border border-slate-800 space-y-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-sky-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Cryptographic Guarantee</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              This listing data was encrypted using custom RSA-512 before database storage. Images are authenticated using custom Cipher Block Chaining MAC (CBC-MAC).
            </p>
          </div>
        </div>
      </div>

      <Modal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title="Report Housing Listing"
      >
        <form onSubmit={handleReportSubmit} className="space-y-4">
          <div className="text-xs text-slate-600">
            Submit a security report if this listing is fraudulent, abusive, or inaccurate.
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Report</label>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
            >
              <option value="Misleading or inaccurate details">Misleading or inaccurate details</option>
              <option value="Suspicious / Potential Scam">Suspicious / Potential Scam</option>
              <option value="Offensive content or images">Offensive content or images</option>
              <option value="Property no longer available">Property no longer available</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Details (Encrypted with RSA)</label>
            <textarea
              required
              rows={4}
              placeholder="Describe the issue in detail..."
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <button
            type="submit"
            disabled={reportSubmitting}
            className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition flex items-center justify-center gap-2"
          >
            <span>Submit Security Report</span>
          </button>
        </form>
      </Modal>
    </div>
  );
}
