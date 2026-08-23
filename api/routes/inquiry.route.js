
import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';
import Inquiry from '../models/inquiry.model.js';
import Listing from '../models/listing.model.js';
import { errorHandler } from '../utils/error.js';

const router = express.Router();

// 1. POST /api/inquiry -> Save new inquiry to database
router.post('/', verifyToken, async (req, res, next) => {
  try {
    const { listingId, message } = req.body;

    if (!listingId || !message?.trim()) {
      return next(errorHandler(400, 'Listing ID and message are required.'));
    }

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return next(errorHandler(404, 'Listing not found.'));
    }

    // Prevent landlord from inquiring on their own listing
    if (listing.userRef.toString() === req.user.id.toString()) {
      return next(errorHandler(400, 'You cannot send an inquiry to your own listing.'));
    }

    const newInquiry = new Inquiry({
      listingId: listing._id,
      landlordId: listing.userRef,
      senderId: req.user.id,
      senderName: req.body.senderName || '',
      senderEmail: req.body.senderEmail || '',
      message: message.trim(),
    });

    await newInquiry.save();

    res.status(201).json({
      success: true,
      message: 'Inquiry sent to landlord successfully!',
      inquiry: newInquiry,
    });
  } catch (error) {
    next(error);
  }
});

// 2. GET /api/inquiry/my-received -> Landlord view of inquiries received
router.get('/my-received', verifyToken, async (req, res, next) => {
  try {
    const inquiries = await Inquiry.find({ landlordId: req.user.id })
      .populate('listingId', 'name address imageUrls regularPrice')
      .populate('senderId', 'username email avatar')
      .sort({ createdAt: -1 });

    res.status(200).json(inquiries);
  } catch (error) {
    next(error);
  }
});

export default router;