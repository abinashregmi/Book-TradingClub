import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import SwiperCore from 'swiper';
import { useSelector } from 'react-redux';
import { Navigation } from 'swiper/modules';
import 'swiper/css/bundle';
import {
  FaBath,
  FaBed,
  FaChair,
  FaMapMarkerAlt,
  FaParking,
  FaShare,
  FaShieldAlt,
  FaCalculator,
  FaFileContract,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaEnvelope,
  FaTimes,
  FaPrint,
  FaStamp,
  FaQrcode,
  FaBuilding,
  FaUserCheck,
} from 'react-icons/fa';
import Contact from '../components/Contact';
import { formatPrice } from '../utils/formatPrice';
import { getCoverImageUrl } from '../utils/getCoverImageUrl';

export default function Listing() {
  SwiperCore.use([Navigation]);
  const params = useParams();
  const listingId = params.id || params.listingId;

  if (!listingId) {
    return null;
  }

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [contact, setContact] = useState(false);
  const [landlordInfo, setLandlordInfo] = useState(null);

  // Modal State Management for Official Lalpurja Deed Certificate
  const [isLalpurjaModalOpen, setIsLalpurjaModalOpen] = useState(false);

  // Escrow Token Booking Modal State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingProcessing, setBookingProcessing] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState(null);

  // Auditor Governance Actions State
  const [adminActionLoading, setAdminActionLoading] = useState(false);
  const [adminMessage, setAdminMessage] = useState(null);
  const [adminError, setAdminError] = useState(null);

  const { currentUser } = useSelector((state) => state.user);

  // Normalize user clearance role
  const normalizeRole = (role) => {
    if (!role) return 'citizen';
    const r = String(role).trim().toLowerCase();
    if (
      r === 'admin' ||
      r === 'government_officer' ||
      r === 'government officer' ||
      r === 'gov_auditor'
    ) {
      return 'admin';
    }
    if (r === 'agent') return 'agent';
    return 'citizen';
  };

  const isAdmin = normalizeRole(currentUser?.role) === 'admin';

  // Fetch listing data
  useEffect(() => {
    let isMounted = true;

    const fetchListing = async () => {
      try {
        setLoading(true);
        setError(false);
        const res = await fetch(`/api/listing/get/${listingId}`);
        const data = await res.json();

        if (!isMounted) return;

        if (data.success === false || !data || !data._id) {
          setError(true);
          setLoading(false);
          return;
        }

        setListing(data);
        setLoading(false);
        setError(false);

        if (data.userRef) {
          try {
            const userRes = await fetch(`/api/user/${data.userRef}`);
            const userData = await userRes.json();
            if (isMounted && userData && !userData.message) {
              setLandlordInfo(userData);
            }
          } catch {
            // Non-blocking fallback
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    };

    fetchListing();

    return () => {
      isMounted = false;
    };
  }, [listingId]);

  // Auditor verify Lalpurja handler with complete persistence
  const handleVerifyAsset = async (status = 'verified') => {
    if (!isAdmin || !listing?._id) {
      setAdminError('Unauthorized: Government Auditor clearance required.');
      return;
    }

    try {
      setAdminActionLoading(true);
      setAdminError(null);
      setAdminMessage(null);

      let res = await fetch(`/api/governance/verify-asset/${listing._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!res.ok && res.status === 404) {
        res = await fetch(`/api/listing/verify/${listing._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });
      }

      const data = await res.json();
      setAdminActionLoading(false);

      if (data.success === false) {
        setAdminError(data.message || 'Lalpurja asset verification failed.');
        return;
      }

      setAdminMessage(
        data.message ||
          'Statutory Malpot verification successful! Registry certificate committed.'
      );

      // Permanently sync state with returned MongoDB document
      if (data.listing) {
        setListing(data.listing);
      } else {
        setListing((prev) => ({
          ...prev,
          auditStatus: status,
          isRegistryVerified: status === 'verified',
          verifiedBy: currentUser?._id,
          verifiedAt: new Date().toISOString(),
        }));
      }

      setTimeout(() => setAdminMessage(null), 5000);
    } catch (err) {
      setAdminError(err.message || 'Network error executing verification request.');
      setAdminActionLoading(false);
    }
  };

  // Municipal Tax Assessment Action with complete persistence
  const handleCalculateTax = async () => {
    if (!isAdmin || !listing?._id) return;

    try {
      setAdminActionLoading(true);
      setAdminError(null);
      setAdminMessage(null);

      let res = await fetch(`/api/governance/calculate-tax/${listing._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok && res.status === 404) {
        res = await fetch(`/api/listing/calculate-tax/${listing._id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const data = await res.json();
      setAdminActionLoading(false);

      if (data.success === false) {
        setAdminError(data.message || 'Municipal tax assessment failed.');
        return;
      }

      setAdminMessage(
        data.message ||
          `Municipal property tax assessed at Rs. ${Number(data.taxAmount).toLocaleString(
            'en-US'
          )}/yr.`
      );

      // Permanently sync state with returned MongoDB document
      if (data.listing) {
        setListing(data.listing);
      } else {
        setListing((prev) => ({
          ...prev,
          municipalTaxAmount: data.taxAmount,
          taxCleared: true,
        }));
      }

      setTimeout(() => setAdminMessage(null), 5000);
    } catch (err) {
      setAdminError(err.message || 'Failed to calculate municipal tax.');
      setAdminActionLoading(false);
    }
  };

  // Escrow Token Booking Action
  const handleConfirmBooking = async () => {
    if (!listing?._id) return;

    try {
      setBookingProcessing(true);
      setBookingError(null);

      const res = await fetch('/api/transaction/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: listing._id }),
      });

      const data = await res.json();
      if (data.success === false) {
        setBookingError(data.message || 'Failed to process escrow booking.');
        setBookingProcessing(false);
        return;
      }

      setBookingSuccess(true);
      setBookingProcessing(false);
      setListing(data.listing || { ...listing, isBooked: true, bookingStatus: 'booked' });
    } catch (err) {
      setBookingError(err.message || 'Escrow communication error.');
      setBookingProcessing(false);
    }
  };

  const isPropertyBooked = Boolean(
    listing?.isBooked || listing?.bookingStatus === 'booked'
  );

  const isVerified = Boolean(
    listing?.isRegistryVerified || listing?.auditStatus === 'verified'
  );

  const isRejected = listing?.auditStatus === 'rejected';

  // Safe fallback values for all e-governance properties
  const regIdentifier =
    listing?.lalpurjaReference ||
    listing?.governmentRegistrationNum ||
    'GOV-RE-2081-PENDING';

  const ownerDisplayName =
    landlordInfo?.username ||
    listing?.ownerName ||
    (currentUser?._id === listing?.userRef ? currentUser?.username : 'Registered Property Owner');

  const plotKittaNumber =
    listing?.plotNumber ||
    listing?.kittaNumber ||
    (typeof regIdentifier === 'string' && regIdentifier.includes('-')
      ? `Kitta No. ${regIdentifier.split('-').pop()}`
      : `Kitta No. ${String(regIdentifier).slice(-4)}`);

  const issueOrVerifyDate = listing?.verifiedAt
    ? new Date(listing.verifiedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date(listing?.createdAt || Date.now()).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 pb-16">
      {loading && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent shadow-lg shadow-emerald-950/50" />
          <p className="text-slate-300 font-semibold text-sm animate-pulse tracking-wide">
            Retrieving verified property and Lalpurja registry record...
          </p>
        </div>
      )}

      {!loading && (error || !listing) && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-950/80 border border-red-500/50 flex items-center justify-center text-red-400 text-3xl mb-4 shadow-lg">
            <FaExclamationTriangle />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Listing Record Not Found
          </h2>
          <p className="text-slate-400 text-sm max-w-md mt-2 mb-6">
            The requested civic asset could not be located in our land revenue registry or may have been deregistered.
          </p>
          <Link
            to="/search"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl transition shadow-md cursor-pointer"
          >
            ← Browse Active Listings
          </Link>
        </div>
      )}

      {!loading && !error && listing && (
        <div>
          {/* Swiper Gallery */}
          <div className="relative max-w-5xl mx-auto pt-4 px-3 sm:px-6">
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-850">
              <Swiper navigation className="h-[340px] sm:h-[480px] w-full">
                {(Array.isArray(listing.imageUrls) && listing.imageUrls.length > 0
                  ? listing.imageUrls
                  : [getCoverImageUrl([])]
                ).map((url, idx) => (
                  <SwiperSlide key={url || idx}>
                    <div className="relative h-full w-full bg-slate-950">
                      <img
                        src={url || getCoverImageUrl(listing.imageUrls)}
                        alt={listing.name || 'Property Image'}
                        className="h-full w-full object-cover"
                        loading="eager"
                        onError={(e) => {
                          e.currentTarget.src = getCoverImageUrl(listing.imageUrls);
                        }}
                      />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            {/* Share Quick Action */}
            <div
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setCopied(true);
                setTimeout(() => setCopied(false), 2500);
              }}
              title="Copy property link"
              className="absolute top-8 right-8 z-20 border border-slate-700 rounded-xl w-10 h-10 flex justify-center items-center bg-slate-900/90 hover:bg-slate-800 text-slate-300 cursor-pointer shadow-lg backdrop-blur-xs transition"
            >
              <FaShare className="text-sm" />
            </div>
            {copied && (
              <p className="absolute top-20 right-8 z-20 rounded-lg bg-emerald-950 border border-emerald-500/50 text-emerald-300 px-3 py-1.5 shadow-xl text-xs font-bold animate-fadeIn">
                Link copied to clipboard!
              </p>
            )}
          </div>

          {/* Core Content Container */}
          <div className="flex flex-col max-w-5xl mx-auto px-4 sm:px-6 my-8 gap-6">
            {/* Header: Title & Pricing */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {listing.name}
                </h1>
                <p className="flex items-center mt-2 gap-2 text-slate-400 text-sm">
                  <FaMapMarkerAlt className="text-emerald-400 shrink-0" />
                  <span>{listing.address || 'Address unlisted'}</span>
                </p>
              </div>

              <div className="sm:text-right">
                <p className="text-2xl sm:text-3xl font-black text-emerald-400">
                  {formatPrice(
                    listing.offer ? listing.discountPrice : listing.regularPrice
                  )}
                  {listing.type === 'rent' && (
                    <span className="text-sm text-slate-400 font-normal"> / month</span>
                  )}
                </p>
                {listing.offer && (
                  <p className="text-xs text-amber-400 font-semibold mt-0.5">
                    Save {formatPrice(Number(listing.regularPrice || 0) - Number(listing.discountPrice || 0))}
                  </p>
                )}
              </div>
            </div>

            {/* DYNAMIC REGISTRY BADGES */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="bg-slate-800 border border-slate-700 text-slate-200 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider">
                {listing.type === 'rent' ? 'For Rent' : 'For Sale'}
              </span>

              {isVerified ? (
                <span className="bg-emerald-950 border border-emerald-500/60 text-emerald-300 font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5">
                  <FaCheckCircle className="text-emerald-400 text-sm" />
                  <span>CivicEstate Verified Asset (Malpot Registry Certified)</span>
                </span>
              ) : isRejected ? (
                <span className="bg-red-950 border border-red-500/60 text-red-300 font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5">
                  <FaTimesCircle className="text-red-400 text-sm" />
                  <span>Statutory Clearance Rejected</span>
                </span>
              ) : (
                <span className="bg-amber-950 border border-amber-500/60 text-amber-300 font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5">
                  <FaShieldAlt className="text-amber-400 text-sm" />
                  <span>⚠️ Pending Civil Audit Sign-off</span>
                </span>
              )}

              {isAdmin && (
                <span className="bg-purple-950 border border-purple-500/50 text-purple-300 text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs flex items-center gap-1">
                  <FaShieldAlt /> Auditor Mode Active
                </span>
              )}
            </div>

            {/* Civic Land Registry & Municipal Tax Card with Trigger to Lalpurja Modal */}
            <div className="bg-slate-850 p-5 rounded-2xl border border-slate-800 shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider">
                  <FaFileContract />
                  <span>Government Land Registry Identifier (Lalpurja Reference)</span>
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono font-bold text-slate-100 text-base sm:text-lg bg-slate-900 px-3 py-1 rounded-lg border border-slate-700/80">
                    {regIdentifier}
                  </span>

                  <button
                    type="button"
                    onClick={() => setIsLalpurjaModalOpen(true)}
                    className="inline-flex items-center gap-2 bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-500/60 hover:border-emerald-400 text-emerald-300 text-xs font-bold px-3.5 py-1.5 rounded-lg transition duration-150 shadow-sm hover:scale-[1.02] cursor-pointer"
                  >
                    <FaFileContract className="text-emerald-400 text-xs" />
                    <span>View Official Lalpurja Registry</span>
                  </button>
                </div>

                {listing.verifiedAt && (
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <FaCheckCircle className="text-[10px]" />
                    <span>
                      Audited & verified on{' '}
                      {new Date(listing.verifiedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </p>
                )}
              </div>

              {Number(listing.municipalTaxAmount) > 0 && (
                <div className="text-left sm:text-right bg-slate-900/80 p-3 rounded-xl border border-slate-700/80">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Assessed Municipal Property Tax
                  </p>
                  <p className="font-bold text-emerald-400 text-sm sm:text-base mt-0.5">
                    {formatPrice(listing.municipalTaxAmount)} / yr
                  </p>
                </div>
              )}
            </div>

            {/* Description Card */}
            <div className="bg-slate-850 p-5 rounded-2xl border border-slate-800 shadow-md">
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2">
                Property Overview & Specs
              </h2>
              <p className="text-slate-300 leading-relaxed text-sm whitespace-pre-line">
                {listing.description || 'No description provided.'}
              </p>

              {/* Specs Grid */}
              <ul className="mt-5 pt-4 border-t border-slate-800 text-slate-300 font-semibold text-xs sm:text-sm flex flex-wrap items-center gap-4 sm:gap-6">
                <li className="flex items-center gap-1.5 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
                  <FaBed className="text-emerald-400 text-base" />
                  <span>
                    {Number(listing.bedrooms) > 1
                      ? `${listing.bedrooms} Beds`
                      : `${listing.bedrooms || 1} Bed`}
                  </span>
                </li>
                <li className="flex items-center gap-1.5 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
                  <FaBath className="text-emerald-400 text-base" />
                  <span>
                    {Number(listing.bathrooms) > 1
                      ? `${listing.bathrooms} Baths`
                      : `${listing.bathrooms || 1} Bath`}
                  </span>
                </li>
                <li className="flex items-center gap-1.5 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
                  <FaParking className="text-emerald-400 text-base" />
                  <span>{listing.parking ? 'Parking Included' : 'No Parking'}</span>
                </li>
                <li className="flex items-center gap-1.5 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
                  <FaChair className="text-emerald-400 text-base" />
                  <span>{listing.furnished ? 'Furnished' : 'Unfurnished'}</span>
                </li>
              </ul>
            </div>

            {/* AUDITOR CONTROL PANEL */}
            {isAdmin ? (
              <div className="bg-slate-850 p-6 rounded-2xl shadow-xl border border-purple-500/40 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold flex items-center gap-2 text-purple-300">
                    <FaShieldAlt className="text-purple-400" />
                    <span>Government Auditor & Regulatory Sign-Off</span>
                  </h3>
                  <span className="text-xs bg-purple-950 text-purple-300 border border-purple-800 px-2.5 py-1 rounded-full font-semibold">
                    Auditor Clearance Active
                  </span>
                </div>

                <p className="text-xs text-slate-400">
                  Statutory Land Revenue verification controls for document{' '}
                  <strong className="text-slate-200 font-mono">
                    {regIdentifier}
                  </strong>
                  .
                </p>

                {adminMessage && (
                  <div className="p-3.5 bg-emerald-950/90 border border-emerald-500 text-emerald-300 text-xs rounded-xl font-semibold flex items-center gap-2">
                    <FaCheckCircle className="text-emerald-400 shrink-0 text-sm" />
                    <span>{adminMessage}</span>
                  </div>
                )}

                {adminError && (
                  <div className="p-3.5 bg-red-950/90 border border-red-500 text-red-300 text-xs rounded-xl font-semibold flex items-center gap-2">
                    <FaExclamationTriangle className="text-red-400 shrink-0 text-sm" />
                    <span>{adminError}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  {!isVerified ? (
                    <button
                      type="button"
                      onClick={() => handleVerifyAsset('verified')}
                      disabled={adminActionLoading}
                      className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition text-xs uppercase shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      <FaCheckCircle />
                      <span>
                        {adminActionLoading
                          ? 'Validating Registry...'
                          : 'Verify Lalpurja Registry (Malpot)'}
                      </span>
                    </button>
                  ) : (
                    <div className="flex-1 py-3 px-4 bg-emerald-950 border border-emerald-500/80 text-emerald-300 font-bold rounded-xl text-xs uppercase text-center flex items-center justify-center gap-2 shadow-xs">
                      <FaCheckCircle className="text-emerald-400" />
                      <span>Certified on Malpot Registry</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleCalculateTax}
                    disabled={adminActionLoading}
                    className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-bold rounded-xl transition text-xs uppercase shadow flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <FaCalculator className="text-purple-400" />
                    <span>
                      {adminActionLoading ? 'Assessing...' : 'Assess Municipal Tax'}
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              /* CITIZEN & BUYER VIEW */
              <div className="flex flex-col gap-3">
                {isPropertyBooked ? (
                  <div className="bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 p-4 rounded-xl text-center font-bold text-sm shadow-md flex items-center justify-center gap-2">
                    <FaCheckCircle className="text-emerald-400" />
                    <span>
                      This property currently has a confirmed Civic Escrow Booking Token!
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowBookingModal(true)}
                    className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm sm:text-base uppercase tracking-wider shadow-lg shadow-emerald-950/60 transition cursor-pointer"
                  >
                    Process Secure Booking Token (Rs. 50,000)
                  </button>
                )}

                {currentUser && listing.userRef !== currentUser._id && !contact && (
                  <button
                    type="button"
                    onClick={() => setContact(true)}
                    className="w-full py-3.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-bold text-xs sm:text-sm uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FaEnvelope />
                    <span>Contact Landlord / Agent</span>
                  </button>
                )}
              </div>
            )}

            {contact && <Contact listing={listing} />}
          </div>

          {/* SIMULATED OFFICIAL LALPURJA DEED CERTIFICATE MODAL */}
          {isLalpurjaModalOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => setIsLalpurjaModalOpen(false)}
            >
              <div
                className="relative bg-slate-900 border border-emerald-500/40 text-slate-100 rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 overflow-hidden transform transition-all duration-300"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Subtle Watermark Seal */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                  <div className="flex flex-col items-center justify-center text-center rotate-[-20deg]">
                    <FaStamp className="text-[260px] text-emerald-400" />
                    <span className="text-xl font-black uppercase tracking-widest text-emerald-400">
                      VERIFIED BY CIVICESTATE AUDIT
                    </span>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setIsLalpurjaModalOpen(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/90 border border-slate-700 hover:border-slate-500 transition cursor-pointer z-20"
                  aria-label="Close modal"
                >
                  <FaTimes className="text-base" />
                </button>

                {/* Document Title & Header */}
                <div className="text-center border-b border-slate-800 pb-5 space-y-1.5 relative z-10">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-950 border border-emerald-500/50 text-emerald-400 text-xl mb-1 shadow-inner">
                    <FaFileContract />
                  </div>
                  <h4 className="text-[11px] uppercase font-extrabold text-purple-400 tracking-widest">
                    Government of Nepal • Ministry of Land Management & Records
                  </h4>
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    LAND OWNERSHIP CERTIFICATE (LALPURJA)
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Tracking Registry ID: <span className="text-emerald-400 font-bold">{regIdentifier}</span>
                  </p>
                </div>

                {/* Dynamic Metadata Grid */}
                <div className="my-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm relative z-10">
                  <div className="bg-slate-850 border border-slate-800 p-3.5 rounded-xl space-y-1">
                    <span className="text-[11px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                      <FaUserCheck className="text-emerald-400" />
                      <span>Registered Owner Name</span>
                    </span>
                    <p className="font-bold text-white truncate text-base">{ownerDisplayName}</p>
                  </div>

                  <div className="bg-slate-850 border border-slate-800 p-3.5 rounded-xl space-y-1">
                    <span className="text-[11px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                      <FaBuilding className="text-emerald-400" />
                      <span>Plot / Kitta Number</span>
                    </span>
                    <p className="font-mono font-bold text-purple-300 text-base">{plotKittaNumber}</p>
                  </div>

                  <div className="bg-slate-850 border border-slate-800 p-3.5 rounded-xl space-y-1">
                    <span className="text-[11px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                      <FaMapMarkerAlt className="text-emerald-400" />
                      <span>Ward & Municipality</span>
                    </span>
                    <p className="font-bold text-white truncate">{listing.address || 'Municipal Ward Jurisdiction'}</p>
                  </div>

                  <div className="bg-slate-850 border border-slate-800 p-3.5 rounded-xl space-y-1">
                    <span className="text-[11px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                      <FaCheckCircle className="text-emerald-400" />
                      <span>Issue / Verification Date</span>
                    </span>
                    <p className="font-bold text-emerald-400">{issueOrVerifyDate}</p>
                  </div>
                </div>

                {/* Verification Seal & Audit Stamp */}
                <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-300 text-2xl shrink-0">
                      <FaQrcode />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        {isVerified ? (
                          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                            <FaCheckCircle /> Malpot Verified & Certified
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                            <FaShieldAlt /> Digital Copy • Audit Pending
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Civil Cryptographic Hash: {String(listing._id || '').slice(0, 16).toUpperCase()}
                      </p>
                    </div>
                  </div>

                  <div className="text-center sm:text-right border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0 w-full sm:w-auto">
                    <span className="text-[10px] text-slate-500 uppercase font-mono block">
                      Land Revenue Officer Sign-off
                    </span>
                    <span className="text-xs font-bold text-slate-200 font-serif">
                      {isVerified ? '✓ Electronic Signature Verified' : 'Pending Formal Sign-off'}
                    </span>
                  </div>
                </div>

                {/* Modal Controls */}
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-end gap-3 relative z-10">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <FaPrint />
                    <span>Print Certificate</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsLalpurjaModalOpen(false)}
                    className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md"
                  >
                    Close Certificate
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECURE ESCROW BOOKING MODAL */}
          {showBookingModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm transition-opacity duration-300">
              <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative space-y-4">
                {!bookingSuccess ? (
                  <>
                    <div className="border-b border-slate-800 pb-3">
                      <h3 className="text-lg font-bold text-white">
                        Civic Token Deposit (Rs. 50,000)
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Secure reservation under CivicEstate Escrow Guarantee.
                      </p>
                    </div>

                    <div className="bg-slate-850 border border-slate-800 rounded-xl p-4 space-y-2.5 text-xs sm:text-sm">
                      <div className="flex justify-between items-center text-slate-300">
                        <span>Platform Escrow Fee (2% Commission):</span>
                        <span className="font-bold text-slate-100">Rs. 1,000</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300">
                        <span>Seller Reservation Payout:</span>
                        <span className="font-bold text-slate-100">Rs. 49,000</span>
                      </div>
                      <div className="border-t border-slate-750 pt-2 flex justify-between items-center font-bold">
                        <span className="text-slate-200">Total Escrow Amount:</span>
                        <span className="text-emerald-400 text-base">Rs. 50,000</span>
                      </div>
                    </div>

                    {bookingError && (
                      <p className="text-red-300 text-xs bg-red-950/80 p-3 rounded-xl border border-red-500/50">
                        {bookingError}
                      </p>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowBookingModal(false)}
                        disabled={bookingProcessing}
                        className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 text-slate-300 font-semibold hover:bg-slate-800 text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmBooking}
                        disabled={bookingProcessing}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition disabled:opacity-60 cursor-pointer shadow-md shadow-emerald-950/50"
                      >
                        {bookingProcessing ? 'Processing Escrow...' : 'Confirm Deposit'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4 space-y-3">
                    <div className="w-14 h-14 bg-emerald-950 border border-emerald-500/60 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-2xl">
                      ✓
                    </div>
                    <h3 className="text-xl font-bold text-white">Escrow Confirmed!</h3>
                    <p className="text-xs text-slate-300 max-w-sm mx-auto">
                      Your token deposit of{' '}
                      <span className="font-bold text-emerald-400">Rs. 50,000</span> has been
                      placed into civic escrow and recorded in the audit registry.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowBookingModal(false)}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-white font-bold rounded-xl text-xs transition cursor-pointer mt-4"
                    >
                      Close Window
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}