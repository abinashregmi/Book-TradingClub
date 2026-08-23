import Listing from '../models/listing.model.js';
import Transaction from '../models/transaction.model.js';
import { errorHandler } from '../utils/error.js';

export const createBookingToken = async (req, res, next) => {
  try {
    const { listingId } = req.body;

    if (!listingId) {
      return next(errorHandler(400, 'Listing ID is required.'));
    }

    // 1. Fetch listing from database
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return next(errorHandler(404, 'Property listing not found!'));
    }

    const authenticatedBuyerId = req.user.id;

    // 2. Self-Booking Protection
    if (listing.userRef.toString() === authenticatedBuyerId.toString()) {
      return next(
        errorHandler(400, 'You cannot book your own property listing.')
      );
    }

    // 3. Double-Booking Protection
    if (listing.isBooked || listing.bookingStatus === 'booked') {
      return next(
        errorHandler(400, 'Property already booked! An active escrow token is already confirmed.')
      );
    }

    // 4. Compute Financials (Rs. 50,000 token)
    const tokenAmount = 50000;
    const platformFee = 1000; // 2% commission
    const sellerPayout = 49000;

    // 5. Create Transaction Record
    const newTransaction = new Transaction({
      userId: authenticatedBuyerId,
      listingId: listing._id,
      pidx: `CIVIC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      amount: tokenAmount,
      status: 'completed',
    });

    await newTransaction.save();

    // 6. Persist Booked State to MongoDB Listing Document
    listing.isBooked = true;
    listing.bookingStatus = 'booked';
    listing.bookedBy = authenticatedBuyerId;
    await listing.save();

    res.status(201).json({
      success: true,
      message: 'Escrow booking token confirmed successfully!',
      transaction: newTransaction,
      listing,
    });
  } catch (error) {
    next(error);
  }
};