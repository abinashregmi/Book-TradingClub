import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  FaBuilding,
  FaPlus,
  FaEdit,
  FaTrashAlt,
  FaCheckCircle,
  FaShieldAlt,
  FaExternalLinkAlt,
  FaMapMarkerAlt,
  FaBed,
  FaBath,
  FaExclamationTriangle,
  FaSearch,
} from 'react-icons/fa';
import { formatPrice } from '../utils/formatPrice';
import { getCoverImageUrl } from '../utils/getCoverImageUrl';

export default function AgentListings() {
  const { currentUser } = useSelector((state) => state.user);
  const [userListings, setUserListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch agent's property listings
  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/user/listings/${currentUser?._id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();

      if (data.success === false) {
        setError(data.message || 'Failed to retrieve agent property portfolio.');
        setLoading(false);
        return;
      }

      setUserListings(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Network error fetching property portfolio.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?._id) {
      fetchListings();
    }
  }, [currentUser]);

  // Handle listing deletion
  const handleListingDelete = async (listingId, listingName) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently remove "${listingName || 'this listing'}" from the marketplace?`
      )
    ) {
      return;
    }

    try {
      setDeleteLoadingId(listingId);
      setError(null);
      setSuccessMessage(null);

      const res = await fetch(`/api/listing/delete/${listingId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      setDeleteLoadingId(null);

      if (data.success === false) {
        setError(data.message || 'Failed to delete listing.');
        return;
      }

      setSuccessMessage(`"${listingName || 'Property'}" was removed from your portfolio.`);
      setUserListings((prev) => prev.filter((item) => item._id !== listingId));

      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setError(err.message || 'Error occurred while deleting listing.');
      setDeleteLoadingId(null);
    }
  };

  // Filter listings by search and booking status
  const filteredListings = userListings.filter((listing) => {
    const name = listing.name || '';
    const address = listing.address || '';
    const regNum = listing.governmentRegistrationNum || '';

    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      regNum.toLowerCase().includes(searchTerm.toLowerCase());

    const isBooked = Boolean(listing.isBooked || listing.bookingStatus === 'booked');
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'booked' && isBooked) ||
      (statusFilter === 'available' && !isBooked) ||
      (statusFilter === 'verified' && listing.isRegistryVerified);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider mb-1">
              <FaBuilding />
              <span>Licensed Broker Management Console</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Agent Property Portfolio
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Manage your verified civic real estate listings, pricing, Lalpurja verification, and active escrow holds.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/create-listing"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-md shadow-emerald-950/50 transition cursor-pointer"
            >
              <FaPlus className="text-xs" />
              <span>Add New Property</span>
            </Link>
          </div>
        </div>

        {/* Notifications */}
        {successMessage && (
          <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-sm rounded-xl font-medium shadow-sm flex items-center gap-2 animate-fadeIn">
            <FaCheckCircle className="text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-red-950/80 border border-red-500/50 text-red-300 text-sm rounded-xl font-medium shadow-sm flex items-center gap-2">
            <FaExclamationTriangle className="text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Search & Status Filters */}
        <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-lg">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search by title, location, or Lalpurja..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
            <FaSearch className="absolute left-3 top-3.5 text-slate-500 text-xs" />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs font-semibold text-slate-400 whitespace-nowrap">
              Filter Portfolio:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs sm:text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Properties ({userListings.length})</option>
              <option value="available">Active / Available</option>
              <option value="booked">Under Escrow Hold</option>
              <option value="verified">Malpot Registry Certified</option>
            </select>
          </div>
        </div>

        {/* Listings Display Grid / Empty State */}
        {loading ? (
          /* Loading Skeletons */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="bg-slate-850 border border-slate-800 rounded-2xl p-4 flex gap-4 animate-pulse"
              >
                <div className="w-28 h-28 bg-slate-800 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2.5 py-1">
                  <div className="h-4 bg-slate-800 rounded w-3/4" />
                  <div className="h-3 bg-slate-800 rounded w-1/2" />
                  <div className="h-4 bg-slate-800 rounded w-1/3" />
                  <div className="h-6 bg-slate-800 rounded w-full mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredListings.length === 0 ? (
          /* High-End Empty State Component */
          <div className="bg-slate-850 border-2 border-dashed border-slate-800 rounded-2xl p-8 sm:p-14 text-center space-y-4">
            <div className="w-16 h-16 bg-blue-950/80 border border-blue-500/40 text-blue-400 rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-inner">
              <FaBuilding />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {userListings.length === 0
                  ? 'No Property Listings in Your Portfolio'
                  : 'No Properties Match Your Filter'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mt-1">
                {userListings.length === 0
                  ? 'You have not listed any properties under your broker profile yet. Add your first property to start receiving citizen inquiries and escrow bookings.'
                  : 'Try searching with a different term or reset your portfolio filter.'}
              </p>
            </div>
            {userListings.length === 0 && (
              <Link
                to="/create-listing"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-5 py-3 rounded-xl text-xs sm:text-sm shadow-lg shadow-emerald-950/60 transition cursor-pointer"
              >
                <FaPlus />
                <span>+ Create Your First Listing</span>
              </Link>
            )}
          </div>
        ) : (
          /* Portfolio Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredListings.map((listing) => {
              const isBooked = Boolean(
                listing.isBooked || listing.bookingStatus === 'booked'
              );
              const isDeleting = deleteLoadingId === listing._id;

              return (
                <div
                  key={listing._id}
                  className="bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex flex-col justify-between shadow-lg transition"
                >
                  <div className="flex gap-4 items-start">
                    {/* Thumbnail */}
                    <Link to={`/listing/${listing._id}`} className="shrink-0 relative">
                      <img
                        src={getCoverImageUrl(listing.imageUrls)}
                        alt={listing.name}
                        className="h-24 w-28 sm:h-28 sm:w-32 object-cover rounded-xl border border-slate-750 bg-slate-900"
                        onError={(e) => {
                          e.currentTarget.src = getCoverImageUrl([]);
                        }}
                      />
                      <span className="absolute top-1.5 left-1.5 bg-slate-900/90 text-slate-300 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase backdrop-blur-xs">
                        {listing.type === 'rent' ? 'Rent' : 'Sale'}
                      </span>
                    </Link>

                    {/* Listing Summary Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-1">
                        <Link
                          to={`/listing/${listing._id}`}
                          className="text-sm sm:text-base font-bold text-white hover:text-emerald-400 transition truncate"
                          title={listing.name}
                        >
                          {listing.name}
                        </Link>
                        <Link
                          to={`/listing/${listing._id}`}
                          target="_blank"
                          className="text-slate-500 hover:text-slate-300 text-xs shrink-0 p-1"
                          title="View Live Listing"
                        >
                          <FaExternalLinkAlt />
                        </Link>
                      </div>

                      <p className="text-xs text-slate-400 flex items-center gap-1 truncate">
                        <FaMapMarkerAlt className="text-emerald-400 text-[10px] shrink-0" />
                        <span className="truncate">{listing.address}</span>
                      </p>

                      {/* Pricing */}
                      <p className="text-sm font-extrabold text-emerald-400">
                        {formatPrice(
                          listing.offer ? listing.discountPrice : listing.regularPrice
                        )}
                        {listing.type === 'rent' && (
                          <span className="text-[11px] text-slate-400 font-normal"> / mo</span>
                        )}
                      </p>

                      {/* Lalpurja Reference */}
                      <div className="pt-1">
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-purple-300 bg-purple-950/80 border border-purple-800/60 px-2 py-0.5 rounded">
                          Ref: {listing.governmentRegistrationNum || 'GOV-RE-2081-XXXX'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Badges and Quick Action Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    {/* Status Badges */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {listing.isRegistryVerified ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                          <FaCheckCircle className="text-[10px] text-emerald-400" />
                          <span>Audit Verified</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-950 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
                          <FaShieldAlt className="text-[10px] text-amber-400" />
                          <span>Audit Pending</span>
                        </span>
                      )}

                      {isBooked && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-blue-950 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded-full">
                          <span>Token Locked</span>
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/update-listing/${listing._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/50 rounded-lg transition"
                      >
                        <FaEdit />
                        <span>Edit</span>
                      </Link>

                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => handleListingDelete(listing._id, listing.name)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-300 bg-red-950/80 hover:bg-red-900 border border-red-600/50 rounded-lg transition disabled:opacity-40 cursor-pointer"
                      >
                        <FaTrashAlt />
                        <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}