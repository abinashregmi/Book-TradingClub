import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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
} from 'react-icons/fa';
import Contact from '../components/Contact';
import { formatPrice } from '../utils/formatPrice';
import { getCoverImageUrl } from '../utils/getCoverImageUrl';

export default function Listing() {
  SwiperCore.use([Navigation]);
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [contact, setContact] = useState(false);

  // Booking Modal State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingProcessing, setBookingProcessing] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState(null);

  // Admin Governance Actions State
  const [adminActionLoading, setAdminActionLoading] = useState(false);
  const [adminMessage, setAdminMessage] = useState(null);
  const [adminError, setAdminError] = useState(null);

  const params = useParams();
  const { currentUser } = useSelector((state) => state.user);

  // Determine user role for RBAC
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'Government_Officer';

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/listing/get/${params.listingId}`);
        const data = await res.json();
        if (data.success === false) {
          setError(true);
          setLoading(false);
          return;
        }
        setListing(data);
        setLoading(false);
        setError(false);
      } catch (error) {
        setError(true);
        setLoading(false);
      }
    };
    fetchListing();
  }, [params.listingId]);

  // Real backend booking persistence
  const handleConfirmBooking = async () => {
    try {
      setBookingProcessing(true);
      setBookingError(null);

      const res = await fetch('/api/transaction/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId: listing._id,
        }),
      });

      const data = await res.json();

      if (data.success === false) {
        setBookingError(data.message || 'Failed to process booking');
        setBookingProcessing(false);
        return;
      }

      setBookingSuccess(true);
      setBookingProcessing(false);

      setListing(data.listing || {
        ...listing,
        isBooked: true,
        bookingStatus: 'booked',
      });
    } catch (err) {
      setBookingError(err.message || 'An unexpected error occurred during booking.');
      setBookingProcessing(false);
    }
  };

  // ADMIN ACTION 1: Verify Lalpurja Asset with Government Pattern Match
  const handleVerifyAsset = async () => {
    try {
      setAdminActionLoading(true);
      setAdminError(null);
      setAdminMessage(null);

      const res = await fetch(`/api/governance/verify-asset/${listing._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      setAdminActionLoading(false);

      if (data.success === false) {
        setAdminError(data.message || 'Asset verification failed.');
        return;
      }

      setAdminMessage('Property successfully verified under Nepal Land Revenue Registry!');
      setListing((prev) => ({
        ...prev,
        isRegistryVerified: true,
        verifiedAt: data.listing?.verifiedAt || new Date().toISOString(),
      }));
    } catch (err) {
      setAdminError(err.message || 'Failed to execute verification request.');
      setAdminActionLoading(false);
    }
  };

  // ADMIN ACTION 2: Calculate and assess municipal property tax
  const handleCalculateTax = async () => {
    try {
      setAdminActionLoading(true);
      setAdminError(null);
      setAdminMessage(null);

      const res = await fetch(`/api/governance/calculate-tax/${listing._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      setAdminActionLoading(false);

      if (data.success === false) {
        setAdminError(data.message || 'Tax calculation failed.');
        return;
      }

      setAdminMessage(`Municipal tax successfully assessed at Rs. ${Number(data.taxAmount).toLocaleString('en-US')}/yr`);
      setListing((prev) => ({
        ...prev,
        municipalTaxAmount: data.taxAmount,
      }));
    } catch (err) {
      setAdminError(err.message || 'Failed to calculate tax.');
      setAdminActionLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowBookingModal(false);
    setBookingSuccess(false);
    setBookingError(null);
  };

  const isPropertyBooked = Boolean(
    listing?.isBooked || listing?.bookingStatus === 'booked'
  );

  return (
    <main>
      {loading && <p className='text-center my-7 text-2xl'>Loading...</p>}
      {error && (
        <p className='text-center my-7 text-2xl'>Something went wrong!</p>
      )}
      {listing && !loading && !error && (
        <div>
          {/* Swiper Image Gallery */}
          <Swiper navigation>
            {listing.imageUrls.map((url) => (
              <SwiperSlide key={url}>
                <div className='h-[550px] w-full'>
                  <img
                    src={url || getCoverImageUrl(listing.imageUrls)}
                    alt={listing.name}
                    className='h-full w-full object-cover'
                    loading='eager'
                    onError={(event) => {
                      event.currentTarget.src = getCoverImageUrl(listing.imageUrls);
                    }}
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Share Button */}
          <div className='fixed top-[13%] right-[3%] z-10 border rounded-full w-12 h-12 flex justify-center items-center bg-slate-100 cursor-pointer shadow-md'>
            <FaShare
              className='text-slate-500'
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setCopied(true);
                setTimeout(() => {
                  setCopied(false);
                }, 2000);
              }}
            />
          </div>
          {copied && (
            <p className='fixed top-[23%] right-[5%] z-10 rounded-md bg-slate-100 p-2 shadow-md text-xs font-semibold'>
              Link copied!
            </p>
          )}

          <div className='flex flex-col max-w-4xl mx-auto p-3 my-7 gap-4'>
            {/* Title & Price */}
            <p className='text-2xl font-semibold'>
              {listing.name} - {formatPrice(listing.offer ? listing.discountPrice : listing.regularPrice)}
              {listing.type === 'rent' && ' / month'}
            </p>

            {/* Address */}
            <p className='flex items-center mt-2 gap-2 text-slate-600 text-sm'>
              <FaMapMarkerAlt className='text-green-700' />
              {listing.address}
            </p>

            {/* Property Badges & Civic Audit Verification */}
            <div className='flex flex-wrap items-center gap-3'>
              <p className='bg-red-900 w-full max-w-[140px] text-white text-center p-1.5 rounded-md text-sm font-semibold'>
                {listing.type === 'rent' ? 'For Rent' : 'For Sale'}
              </p>

              {listing.offer && (
                <p className='bg-green-900 w-full max-w-[160px] text-white text-center p-1.5 rounded-md text-sm font-semibold'>
                  {formatPrice(+listing.regularPrice - +listing.discountPrice)} OFF
                </p>
              )}

              {/* CIVIC AUDIT BADGE */}
              {listing.isRegistryVerified ? (
                <span className='bg-green-700 text-white font-bold text-sm px-3.5 py-1.5 rounded-md shadow-xs flex items-center gap-1.5'>
                  ✓ CivicEstate Verified Asset
                </span>
              ) : (
                <span className='bg-amber-400 text-slate-900 font-bold text-sm px-3.5 py-1.5 rounded-md shadow-xs flex items-center gap-1.5'>
                  ⚠️ Pending Civil Audit
                </span>
              )}

              {/* ADMIN ROLE BADGE */}
              {isAdmin && (
                <span className='bg-purple-800 text-white text-xs font-bold px-3 py-1.5 rounded-md shadow-xs flex items-center gap-1'>
                  <FaShieldAlt /> Auditor Mode Active
                </span>
              )}
            </div>

            {/* Civic Land Registry & Municipal Tax info */}
            <div className='bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3'>
              <div>
                <p className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>
                  Government Land Registry Identifier (Lalpurja Reference)
                </p>
                <p className='font-mono font-bold text-slate-800 text-base'>
                  {listing.governmentRegistrationNum || 'GOV-RE-PENDING'}
                </p>
              </div>
              {listing.municipalTaxAmount > 0 && (
                <div className='text-left sm:text-right'>
                  <p className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>
                    Municipal Property Tax
                  </p>
                  <p className='font-semibold text-green-800 text-sm'>
                    {formatPrice(listing.municipalTaxAmount)} / yr
                  </p>
                </div>
              )}
            </div>

            {/* Description */}
            <p className='text-slate-800 leading-relaxed'>
              <span className='font-semibold text-black'>Description - </span>
              {listing.description}
            </p>

            {/* Specifications List */}
            <ul className='text-green-900 font-semibold text-sm flex flex-wrap items-center gap-4 sm:gap-6'>
              <li className='flex items-center gap-1 whitespace-nowrap '>
                <FaBed className='text-lg' />
                {listing.bedrooms > 1
                  ? `${listing.bedrooms} beds `
                  : `${listing.bedrooms} bed `}
              </li>
              <li className='flex items-center gap-1 whitespace-nowrap '>
                <FaBath className='text-lg' />
                {listing.bathrooms > 1
                  ? `${listing.bathrooms} baths `
                  : `${listing.bathrooms} bath `}
              </li>
              <li className='flex items-center gap-1 whitespace-nowrap '>
                <FaParking className='text-lg' />
                {listing.parking ? 'Parking spot' : 'No Parking'}
              </li>
              <li className='flex items-center gap-1 whitespace-nowrap '>
                <FaChair className='text-lg' />
                {listing.furnished ? 'Furnished' : 'Unfurnished'}
              </li>
            </ul>

            {/* ============================================================ */}
            {/* RBAC SECTION: CONDITIONAL CONTROLS BASED ON USER ROLE       */}
            {/* ============================================================ */}

            {/* 1. ADMIN / GOVERNMENT AUDITOR PANEL */}
            {isAdmin ? (
              <div className='bg-slate-900 text-white p-5 rounded-xl mt-4 shadow-lg border border-slate-700 flex flex-col gap-3'>
                <div className='flex items-center justify-between border-b border-slate-700 pb-2'>
                  <h3 className='text-lg font-bold flex items-center gap-2 text-purple-300'>
                    <FaShieldAlt /> Land Revenue Governance & Civil Audit Controls
                  </h3>
                  <span className='text-xs bg-purple-900 text-purple-200 px-2.5 py-1 rounded font-semibold'>
                    Auditor Clearance: Active
                  </span>
                </div>

                <p className='text-xs text-slate-300'>
                  Official audit operations for Lalpurja validation and property tax assessment for{' '}
                  <strong className='text-white font-mono'>{listing.governmentRegistrationNum}</strong>.
                </p>

                {adminMessage && (
                  <div className='p-3 bg-green-900/60 border border-green-500 text-green-200 text-xs rounded-lg font-semibold'>
                    ✓ {adminMessage}
                  </div>
                )}

                {adminError && (
                  <div className='p-3 bg-red-900/60 border border-red-500 text-red-200 text-xs rounded-lg font-semibold'>
                    ⚠️ {adminError}
                  </div>
                )}

                <div className='flex flex-col sm:flex-row gap-3 mt-1'>
                  {!listing.isRegistryVerified ? (
                    <button
                      type='button'
                      onClick={handleVerifyAsset}
                      disabled={adminActionLoading}
                      className='flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition text-xs uppercase shadow flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer'
                    >
                      <FaShieldAlt /> {adminActionLoading ? 'Verifying...' : 'Verify Lalpurja Registry (Malpot)'}
                    </button>
                  ) : (
                    <div className='flex-1 py-3 px-4 bg-emerald-950 border border-emerald-500 text-emerald-300 font-bold rounded-lg text-xs uppercase text-center flex items-center justify-center gap-2'>
                      ✓ Verified on Registry
                    </div>
                  )}

                  <button
                    type='button'
                    onClick={handleCalculateTax}
                    disabled={adminActionLoading}
                    className='flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition text-xs uppercase shadow flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer'
                  >
                    <FaCalculator /> {adminActionLoading ? 'Calculating...' : 'Recalculate Municipal Tax'}
                  </button>
                </div>
              </div>
            ) : (
              /* 2. STANDARD BUYER VIEW (SECURE BOOKING TOKEN & CONTACT) */
              <div className='flex flex-col gap-3 mt-4'>
                {isPropertyBooked ? (
                  <div className='bg-green-100 border border-green-300 text-green-800 p-4 rounded-lg text-center font-bold text-base shadow-xs'>
                    ✓ This property currently has a confirmed Civic Booking Token!
                  </div>
                ) : (
                  <button
                    type='button'
                    onClick={() => setShowBookingModal(true)}
                    className='bg-green-700 text-white font-bold p-3.5 uppercase rounded-lg hover:bg-green-800 transition shadow-md cursor-pointer'
                  >
                    Process Secure Booking Token (Rs. 50,000)
                  </button>
                )}

                {currentUser && listing.userRef !== currentUser._id && !contact && (
                  <button
                    onClick={() => setContact(true)}
                    className='bg-slate-700 text-white rounded-lg uppercase hover:opacity-95 p-3 cursor-pointer'
                  >
                    Contact landlord
                  </button>
                )}
              </div>
            )}

            {contact && <Contact listing={listing} />}
          </div>

          {/* SECURE BOOKING MODAL */}
          {showBookingModal && (
            <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs'>
              <div className='bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 relative'>
                {!bookingSuccess ? (
                  <>
                    <h3 className='text-xl font-bold text-slate-800 mb-2 border-b pb-3'>
                      Process Secure Booking Token (Rs. 50,000)
                    </h3>
                    <p className='text-xs text-slate-500 mb-4'>
                      Lock in this verified listing under CivicEstate Escrow Guarantee.
                    </p>

                    <div className='bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4 space-y-2 text-sm'>
                      <div className='flex justify-between items-center text-slate-700'>
                        <span className='font-medium'>
                          Marketplace Service Fee (2% Platform Commission):
                        </span>
                        <span className='font-bold text-slate-900'>Rs. 1,000</span>
                      </div>
                      <div className='flex justify-between items-center text-slate-700'>
                        <span className='font-medium'>Seller Payout:</span>
                        <span className='font-bold text-slate-900'>Rs. 49,000</span>
                      </div>
                      <div className='border-t border-slate-200 pt-2 flex justify-between items-center font-bold text-slate-900'>
                        <span>Total Booking Token:</span>
                        <span className='text-green-700 text-base'>Rs. 50,000</span>
                      </div>
                    </div>

                    {bookingError && (
                      <p className='text-red-700 text-sm mb-3 bg-red-50 p-2.5 rounded border border-red-200'>
                        {bookingError}
                      </p>
                    )}

                    <div className='flex gap-3'>
                      <button
                        type='button'
                        onClick={handleCloseModal}
                        disabled={bookingProcessing}
                        className='flex-1 py-2.5 px-4 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 text-sm cursor-pointer'
                      >
                        Cancel
                      </button>
                      <button
                        type='button'
                        onClick={handleConfirmBooking}
                        disabled={bookingProcessing}
                        className='flex-1 py-2.5 px-4 rounded-lg bg-green-700 hover:bg-green-800 text-white font-bold text-sm transition disabled:opacity-80 cursor-pointer'
                      >
                        {bookingProcessing ? 'Processing Escrow...' : 'Confirm'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className='text-center py-4'>
                    <div className='text-green-600 text-5xl mb-3'>✓</div>
                    <h3 className='text-xl font-bold text-slate-800 mb-1'>
                      Transaction Confirmed!
                    </h3>
                    <p className='text-sm text-slate-600 mb-4'>
                      Your token payment of <span className='font-bold'>Rs. 50,000</span> has been successfully placed in civic escrow.
                    </p>
                    <div className='bg-green-50 border border-green-200 text-xs text-green-800 p-3 rounded-lg mb-4 text-left space-y-1'>
                      <p>• <strong>Marketplace Fee (2% Commission):</strong> Rs. 1,000</p>
                      <p>• <strong>Seller Payout:</strong> Rs. 49,000</p>
                      <p>• <strong>Status:</strong> Permanently Locked & Recorded</p>
                    </div>
                    <button
                      type='button'
                      onClick={handleCloseModal}
                      className='w-full py-2.5 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 transition cursor-pointer'
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