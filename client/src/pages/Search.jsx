import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FaSearch,
  FaShieldAlt,
  FaFilter,
  FaHome,
  FaBuilding,
  FaCheckCircle,
} from 'react-icons/fa';
import ListingItem from '../components/ListingItem';

export default function Search() {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebardata, setSidebardata] = useState({
    searchTerm: '',
    type: 'all',
    parking: false,
    furnished: false,
    offer: false,
    sort: 'createdAt',
    order: 'desc',
    // Civic & Compliance Filters
    isRegistryVerified: false,
    taxAssessed: false,
  });

  const [loading, setLoading] = useState(false);
  const [listings, setListings] = useState([]);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchTermFromUrl = urlParams.get('searchTerm');
    const typeFromUrl = urlParams.get('type');
    const parkingFromUrl = urlParams.get('parking');
    const furnishedFromUrl = urlParams.get('furnished');
    const offerFromUrl = urlParams.get('offer');
    const sortFromUrl = urlParams.get('sort');
    const orderFromUrl = urlParams.get('order');
    const isRegistryVerifiedFromUrl = urlParams.get('isRegistryVerified');
    const taxAssessedFromUrl = urlParams.get('taxAssessed');

    if (
      searchTermFromUrl !== null ||
      typeFromUrl !== null ||
      parkingFromUrl !== null ||
      furnishedFromUrl !== null ||
      offerFromUrl !== null ||
      sortFromUrl !== null ||
      orderFromUrl !== null ||
      isRegistryVerifiedFromUrl !== null ||
      taxAssessedFromUrl !== null
    ) {
      setSidebardata({
        searchTerm: searchTermFromUrl || '',
        type: typeFromUrl || 'all',
        parking: parkingFromUrl === 'true',
        furnished: furnishedFromUrl === 'true',
        offer: offerFromUrl === 'true',
        sort: sortFromUrl || 'createdAt',
        order: orderFromUrl || 'desc',
        isRegistryVerified: isRegistryVerifiedFromUrl === 'true',
        taxAssessed: taxAssessedFromUrl === 'true',
      });
    }

    const fetchListings = async () => {
      setLoading(true);
      setShowMore(false);
      const searchQuery = urlParams.toString();
      
      try {
        const res = await fetch(`/api/listing/get?${searchQuery}`);
        const data = await res.json();
        const safeData = Array.isArray(data) ? data.filter(Boolean) : [];

        // Apply client-side filters for civic parameters if not directly handled by MongoDB backend
        let filtered = safeData;
        if (isRegistryVerifiedFromUrl === 'true') {
          filtered = filtered.filter((l) => l.isRegistryVerified === true);
        }
        if (taxAssessedFromUrl === 'true') {
          filtered = filtered.filter((l) => Number(l.municipalTaxAmount) > 0);
        }

        if (filtered.length > 8) {
          setShowMore(true);
        } else {
          setShowMore(false);
        }

        setListings(filtered);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch filtered listings:', err);
        setListings([]);
        setLoading(false);
      }
    };

    fetchListings();
  }, [location.search]);

  const handleChange = (e) => {
    if (
      e.target.id === 'all' ||
      e.target.id === 'rent' ||
      e.target.id === 'sale'
    ) {
      setSidebardata({ ...sidebardata, type: e.target.id });
    }

    if (e.target.id === 'searchTerm') {
      setSidebardata({ ...sidebardata, searchTerm: e.target.value });
    }

    if (
      e.target.id === 'parking' ||
      e.target.id === 'furnished' ||
      e.target.id === 'offer' ||
      e.target.id === 'isRegistryVerified' ||
      e.target.id === 'taxAssessed'
    ) {
      setSidebardata({
        ...sidebardata,
        [e.target.id]:
          e.target.checked || e.target.checked === 'true',
      });
    }

    if (e.target.id === 'sort_order') {
      const sort = e.target.value.split('_')[0] || 'createdAt';
      const order = e.target.value.split('_')[1] || 'desc';
      setSidebardata({ ...sidebardata, sort, order });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const urlParams = new URLSearchParams();
    urlParams.set('searchTerm', sidebardata.searchTerm);
    urlParams.set('type', sidebardata.type);
    urlParams.set('parking', sidebardata.parking);
    urlParams.set('furnished', sidebardata.furnished);
    urlParams.set('offer', sidebardata.offer);
    urlParams.set('sort', sidebardata.sort);
    urlParams.set('order', sidebardata.order);
    urlParams.set('isRegistryVerified', sidebardata.isRegistryVerified);
    urlParams.set('taxAssessed', sidebardata.taxAssessed);

    const searchQuery = urlParams.toString();
    navigate(`/search?${searchQuery}`);
  };

  const onShowMoreClick = async () => {
    const numberOfListings = listings.length;
    const startIndex = numberOfListings;
    const urlParams = new URLSearchParams(location.search);
    urlParams.set('startIndex', startIndex);
    const searchQuery = urlParams.toString();

    try {
      const res = await fetch(`/api/listing/get?${searchQuery}`);
      const data = await res.json();
      const safeData = Array.isArray(data) ? data.filter(Boolean) : [];

      let filtered = safeData;
      if (sidebardata.isRegistryVerified) {
        filtered = filtered.filter((l) => l.isRegistryVerified === true);
      }
      if (sidebardata.taxAssessed) {
        filtered = filtered.filter((l) => Number(l.municipalTaxAmount) > 0);
      }

      if (filtered.length < 9) {
        setShowMore(false);
      }
      setListings([...listings, ...filtered]);
    } catch (err) {
      console.error('Failed to load more listings:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row">
      {/* SIDEBAR FILTER PANEL */}
      <div className="p-6 md:w-84 lg:w-96 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-850 shrink-0">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-4 mb-6">
          <FaFilter className="text-emerald-400 text-base" />
          <h1 className="text-lg font-bold text-white tracking-tight">
            Search & Civic Filters
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 text-xs sm:text-sm">
          {/* Keyword Search */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">Property Keywords</label>
            <div className="relative">
              <input
                type="text"
                id="searchTerm"
                placeholder="Search Lalpurja, city, neighborhood..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                value={sidebardata.searchTerm}
                onChange={handleChange}
              />
              <FaSearch className="absolute left-3 top-3.5 text-slate-500 text-xs" />
            </div>
          </div>

          {/* Core Civic Verification Filters */}
          <div className="bg-slate-900/90 border border-slate-750 p-4 rounded-xl space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400 uppercase tracking-wider">
              <FaShieldAlt />
              <span>Civic Compliance</span>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <input
                type="checkbox"
                id="isRegistryVerified"
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 accent-emerald-500 cursor-pointer"
                onChange={handleChange}
                checked={sidebardata.isRegistryVerified}
              />
              <span className="text-slate-300 font-medium">
                Verified Lalpurja Only (Malpot)
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="taxAssessed"
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 accent-emerald-500 cursor-pointer"
                onChange={handleChange}
                checked={sidebardata.taxAssessed}
              />
              <span className="text-slate-300 font-medium">
                Assessed Municipal Tax Only
              </span>
            </div>
          </div>

          {/* Transaction Type */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-300">Transaction Type</label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="all"
                  className="w-4 h-4 rounded border-slate-700 bg-slate-800 accent-emerald-500 cursor-pointer"
                  onChange={handleChange}
                  checked={sidebardata.type === 'all'}
                />
                <span className="text-slate-300">All (Rent & Sale)</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rent"
                  className="w-4 h-4 rounded border-slate-700 bg-slate-800 accent-emerald-500 cursor-pointer"
                  onChange={handleChange}
                  checked={sidebardata.type === 'rent'}
                />
                <span className="text-slate-300">Rent Only</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sale"
                  className="w-4 h-4 rounded border-slate-700 bg-slate-800 accent-emerald-500 cursor-pointer"
                  onChange={handleChange}
                  checked={sidebardata.type === 'sale'}
                />
                <span className="text-slate-300">Sale Only</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="offer"
                  className="w-4 h-4 rounded border-slate-700 bg-slate-800 accent-emerald-500 cursor-pointer"
                  onChange={handleChange}
                  checked={sidebardata.offer}
                />
                <span className="text-slate-300">Special Offer</span>
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-300">Features & Amenities</label>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="parking"
                  className="w-4 h-4 rounded border-slate-700 bg-slate-800 accent-emerald-500 cursor-pointer"
                  onChange={handleChange}
                  checked={sidebardata.parking}
                />
                <span className="text-slate-300">Parking Spot</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="furnished"
                  className="w-4 h-4 rounded border-slate-700 bg-slate-800 accent-emerald-500 cursor-pointer"
                  onChange={handleChange}
                  checked={sidebardata.furnished}
                />
                <span className="text-slate-300">Furnished</span>
              </div>
            </div>
          </div>

          {/* Sort Order */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">Sort Results</label>
            <select
              onChange={handleChange}
              value={`${sidebardata.sort}_${sidebardata.order}`}
              id="sort_order"
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="createdAt_desc">Latest Verified</option>
              <option value="createdAt_asc">Oldest Listed</option>
              <option value="regularPrice_desc">Price: High to Low</option>
              <option value="regularPrice_asc">Price: Low to High</option>
            </select>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/60 uppercase tracking-wider text-xs transition cursor-pointer"
          >
            Apply Filters & Search
          </button>
        </form>
      </div>

      {/* RESULTS DISPLAY PANEL */}
      <div className="flex-1 p-6 sm:p-8 space-y-6">
        {/* Results Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              Civic Real Estate Catalog
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Showing {listings.length} verified listings matching your statutory criteria.
            </p>
          </div>

          {/* Quick Active Filter Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {sidebardata.isRegistryVerified && (
              <span className="inline-flex items-center gap-1 bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold px-2.5 py-1 rounded-full">
                <FaCheckCircle className="text-[10px]" /> Lalpurja Verified
              </span>
            )}
            {sidebardata.taxAssessed && (
              <span className="inline-flex items-center gap-1 bg-purple-950 text-purple-300 border border-purple-500/40 text-[11px] font-bold px-2.5 py-1 rounded-full">
                Tax Assessed
              </span>
            )}
          </div>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="py-24 text-center space-y-3">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent" />
            <p className="text-sm font-semibold text-slate-400">
              Querying verified real estate catalog...
            </p>
          </div>
        )}

        {/* No Results Empty State */}
        {!loading && listings.length === 0 && (
          <div className="py-20 text-center space-y-3 bg-slate-850 border border-slate-800 rounded-2xl p-8 max-w-xl mx-auto">
            <FaBuilding className="mx-auto text-4xl text-slate-600" />
            <h3 className="text-lg font-bold text-white">No Properties Found</h3>
            <p className="text-xs sm:text-sm text-slate-400">
              No civic listings match your search criteria. Try relaxing your filters or searching with different keywords.
            </p>
          </div>
        )}

        {/* Property Listings Grid */}
        {!loading && listings.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {listings.map((listing) => (
              <ListingItem key={listing._id} listing={listing} />
            ))}
          </div>
        )}

        {/* Show More Pagination Button */}
        {showMore && (
          <div className="pt-6 text-center">
            <button
              onClick={onShowMoreClick}
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-emerald-400 font-bold rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
            >
              Load More Listings
            </button>
          </div>
        )}
      </div>
    </div>
  );
}