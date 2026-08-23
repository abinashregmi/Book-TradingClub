import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import SwiperCore from 'swiper';
import { Navigation, Autoplay, EffectFade } from 'swiper/modules';
import 'swiper/css/bundle';
import {
  FaShieldAlt,
  FaCheckCircle,
  FaSearch,
  FaArrowRight,
  FaHome,
  FaFileContract,
  FaCoins,
  FaAward,
} from 'react-icons/fa';
import ListingItem from '../components/ListingItem';
import { getCoverImageUrl } from '../utils/getCoverImageUrl';

export default function Home() {
  const [offerListings, setOfferListings] = useState([]);
  const [saleListings, setSaleListings] = useState([]);
  const [rentListings, setRentListings] = useState([]);
  const [loading, setLoading] = useState(true);

  SwiperCore.use([Navigation, Autoplay, EffectFade]);

  useEffect(() => {
    const fetchOfferListings = async () => {
      try {
        const res = await fetch('/api/listing/get?offer=true&limit=4');
        const data = await res.json();
        setOfferListings(Array.isArray(data) ? data : []);
        fetchRentListings();
      } catch (error) {
        console.error('Error fetching offers:', error);
        fetchRentListings();
      }
    };

    const fetchRentListings = async () => {
      try {
        const res = await fetch('/api/listing/get?type=rent&limit=4');
        const data = await res.json();
        setRentListings(Array.isArray(data) ? data : []);
        fetchSaleListings();
      } catch (error) {
        console.error('Error fetching rent listings:', error);
        fetchSaleListings();
      }
    };

    const fetchSaleListings = async () => {
      try {
        const res = await fetch('/api/listing/get?type=sale&limit=4');
        const data = await res.json();
        setSaleListings(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching sale listings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOfferListings();
  }, []);

  return (
    <div className="bg-slate-900 min-h-screen text-slate-100">
      {/* HERO SECTION */}
      <section className="relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900 text-white overflow-hidden py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-6xl mx-auto flex flex-col items-center text-center relative z-10">
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-semibold mb-6 shadow-inner backdrop-blur-sm">
            <FaShieldAlt className="text-emerald-400 text-sm" />
            <span>Verified Land Revenue & Escrow Assured Properties</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl leading-tight">
            Discover Verified Real Estate with{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Civic Confidence
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed">
            Nepal’s premier transparent real estate network. Connect directly with licensed agents, verify statutory Lalpurja credentials, and secure transparent property deals.
          </p>

          {/* Quick CTA Actions */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3.5 w-full justify-center">
            <Link
              to="/search"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-950/50 transition transform hover:-translate-y-0.5 cursor-pointer"
            >
              <FaSearch className="text-xs" />
              <span>Explore Verified Listings</span>
            </Link>
            <Link
              to="/about"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-semibold text-sm sm:text-base transition cursor-pointer"
            >
              <span>Our Governance Standards</span>
              <FaArrowRight className="text-xs" />
            </Link>
          </div>

          {/* Feature Highlights Grid */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 w-full text-left">
            <div className="bg-slate-850/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 backdrop-blur-xs transition">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/70 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <FaFileContract className="text-lg" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Lalpurja Verification</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Registered against Land Revenue records with verified document numbers.
                </p>
              </div>
            </div>

            <div className="bg-slate-850/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 backdrop-blur-xs transition">
              <div className="w-10 h-10 rounded-xl bg-teal-950/70 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
                <FaShieldAlt className="text-lg" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Escrow Protection</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Standardized token deposits held under civic guarantee protocols.
                </p>
              </div>
            </div>

            <div className="bg-slate-850/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 backdrop-blur-xs transition">
              <div className="w-10 h-10 rounded-xl bg-cyan-950/70 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <FaCheckCircle className="text-lg" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Licensed Clearances</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Transact securely with verified municipal auditors and authorized brokers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CIVIC TRANSPARENCY & LAND REGISTRY METRICS BANNER */}
      <section className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 -mt-8">
        <div className="bg-slate-850 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <FaAward />
                <span>Civil Land Revenue Index</span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white">
                Civic Transparency & Compliance Metrics
              </h2>
              <p className="text-xs text-slate-400">
                Real-time registry inspection statistics committed across municipal wards.
              </p>
            </div>

            {/* Metrics Counters Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full md:w-auto">
              <div className="bg-slate-900 border border-slate-750 p-3.5 rounded-xl text-center hover:border-emerald-500/50 transition">
                <p className="text-xl sm:text-2xl font-black text-emerald-400">100%</p>
                <p className="text-[11px] font-semibold text-slate-300 mt-0.5">Verified Lalpurja</p>
              </div>

              <div className="bg-slate-900 border border-slate-750 p-3.5 rounded-xl text-center hover:border-purple-500/50 transition">
                <p className="text-xl sm:text-2xl font-black text-purple-300">Rs. 50K</p>
                <p className="text-[11px] font-semibold text-slate-300 mt-0.5">Guaranteed Escrow</p>
              </div>

              <div className="bg-slate-900 border border-slate-750 p-3.5 rounded-xl text-center hover:border-teal-500/50 transition">
                <p className="text-xl sm:text-2xl font-black text-teal-300">0.5%</p>
                <p className="text-[11px] font-semibold text-slate-300 mt-0.5">Tax Assessed</p>
              </div>

              <div className="bg-slate-900 border border-slate-750 p-3.5 rounded-xl text-center hover:border-cyan-500/50 transition">
                <p className="text-xl sm:text-2xl font-black text-cyan-300">24/7</p>
                <p className="text-[11px] font-semibold text-slate-300 mt-0.5">Auditor Sign-off</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SWIPER GALLERY CAROUSEL */}
      {offerListings && offerListings.length > 0 && (
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-10 z-10">
          <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-850">
            <Swiper
              navigation
              autoplay={{ delay: 4500, disableOnInteraction: false }}
              loop={true}
              className="h-[320px] sm:h-[460px] w-full"
            >
              {offerListings.map((listing) => (
                <SwiperSlide key={listing._id}>
                  <div className="relative h-full w-full">
                    <img
                      src={getCoverImageUrl(listing.imageUrls)}
                      alt={listing.name}
                      className="h-full w-full object-cover"
                      loading="eager"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/30 to-transparent flex items-end p-6 sm:p-8">
                      <div className="text-white">
                        <span className="bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider mb-2 inline-block shadow-sm">
                          Featured Verified Estate
                        </span>
                        <h2 className="text-xl sm:text-2xl font-bold text-white drop-shadow-sm">
                          {listing.name}
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-300 mt-1">
                          {listing.address}
                        </p>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      )}

      {/* MAIN PROPERTY LISTINGS SECTIONS */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 space-y-12">
        {/* 1. SPECIAL OFFERS */}
        {offerListings && offerListings.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <span>🏷️</span>
                  <span>Special Verified Offers</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  Properties with exclusive price adjustments and immediate availability.
                </p>
              </div>
              <Link
                to="/search?offer=true"
                className="text-xs sm:text-sm font-bold text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 shrink-0"
              >
                <span>View all offers</span>
                <FaArrowRight className="text-[10px]" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {offerListings.map((listing) => (
                <ListingItem key={listing._id} listing={listing} />
              ))}
            </div>
          </div>
        )}

        {/* 2. PLACES FOR RENT */}
        {rentListings && rentListings.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <FaHome className="text-emerald-400 text-lg" />
                  <span>Recent Places for Rent</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  Verified residential and commercial rentals ready for tenancy.
                </p>
              </div>
              <Link
                to="/search?type=rent"
                className="text-xs sm:text-sm font-bold text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 shrink-0"
              >
                <span>View all rentals</span>
                <FaArrowRight className="text-[10px]" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {rentListings.map((listing) => (
                <ListingItem key={listing._id} listing={listing} />
              ))}
            </div>
          </div>
        )}

        {/* 3. PLACES FOR SALE */}
        {saleListings && saleListings.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <span>🏢</span>
                  <span>Recent Places for Sale</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  Civil audit inspected homes, plots, and commercial units for purchase.
                </p>
              </div>
              <Link
                to="/search?type=sale"
                className="text-xs sm:text-sm font-bold text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 shrink-0"
              >
                <span>View all sales</span>
                <FaArrowRight className="text-[10px]" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {saleListings.map((listing) => (
                <ListingItem key={listing._id} listing={listing} />
              ))}
            </div>
          </div>
        )}

        {/* LOADING SKELETON */}
        {loading && (
          <div className="py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent" />
            <p className="text-sm font-semibold text-slate-400 mt-3">
              Loading verified civic listings...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}