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

  const params = useParams();
  const { currentUser } = useSelector((state) => state.user);

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

  // Simulate confirming secure booking token
  const handleConfirmBooking = () => {
    setBookingProcessing(true);
    setTimeout(() => {
      setBookingProcessing(false);
      setBookingSuccess(true);
      // Simulate booking update locally on the listing state
      setListing((prev) => ({
        ...prev,
        bookingStatus: 'booked',
      }));
    }, 1200);
  };

  const handleCloseModal = () => {
    setShowBookingModal(false);
    setBookingSuccess(false);
  };

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

              {/* REQUIREMENT 2: PROMINENT CIVIC AUDIT BADGE */}
              {listing.isRegistryVerified ? (
                <span className='bg-green-700 text-white font-bold text-sm px-3.5 py-1.5 rounded-md shadow-xs flex items-center gap-1.5'>
                  ✓ CivicEstate Verified Asset
                </span>
              ) : (
                <span className='bg-amber-400 text-slate-900 font-bold text-sm px-3.5 py-1.5 rounded-md shadow-xs flex items-center gap-1.5'>
                  ⚠️ Pending Civil Audit
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

            {/* REQUIREMENT 3: SECURE BOOKING TOKEN BUTTON & CONTACT LANDLORD */}
            <div className='flex flex-col gap-3 mt-4'>
              {listing.bookingStatus === 'booked' ? (
                <div className='bg-green-100 border border-green-300 text-green-800 p-3 rounded-lg text-center font-bold'>
                  ✓ This property currently has a confirmed Civic Booking Token!
                </div>
              ) : (
                <button
                  type='button'
                  onClick={() => setShowBookingModal(true)}
                  className='bg-green-700 text-white font-bold p-3.5 uppercase rounded-lg hover:bg-green-800 transition shadow-md'
                >
                  Process Secure Booking Token (Rs. 50,000)
                </button>
              )}

              {currentUser && listing.userRef !== currentUser._id && !contact && (
                <button
                  onClick={() => setContact(true)}
                  className='bg-slate-700 text-white rounded-lg uppercase hover:opacity-95 p-3'
                >
                  Contact landlord
                </button>
              )}
            </div>

            {contact && <Contact listing={listing} />}
          </div>

          {/* REQUIREMENT 3: CLEAN MODAL OVERLAY TOGGLE WINDOW */}
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

                    {/* EXACT TEXTUAL COST BREAKDOWN */}
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

                    <div className='flex gap-3'>
                      <button
                        type='button'
                        onClick={handleCloseModal}
                        disabled={bookingProcessing}
                        className='flex-1 py-2.5 px-4 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 text-sm'
                      >
                        Cancel
                      </button>
                      <button
                        type='button'
                        onClick={handleConfirmBooking}
                        disabled={bookingProcessing}
                        className='flex-1 py-2.5 px-4 rounded-lg bg-green-700 hover:bg-green-800 text-white font-bold text-sm transition'
                      >
                        {bookingProcessing ? 'Processing Escrow...' : 'Confirm'}
                      </button>
                    </div>
                  </>
                ) : (
                  /* SIMULATED SUCCESSFUL TRANSACTION STATE */
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
                      <p>• <strong>Transaction Ref:</strong> TXN-CIVIC-{Date.now().toString().slice(-6)}</p>
                    </div>
                    <button
                      type='button'
                      onClick={handleCloseModal}
                      className='w-full py-2.5 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 transition'
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