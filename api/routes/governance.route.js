import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';
import Listing from '../models/listing.model.js';
import User from '../models/user.model.js';
import { errorHandler } from '../utils/error.js';

const router = express.Router();

// 1. POST /verify-asset/:id -> Verify the property registry with Lalpurja pattern matching & audit trail
router.post('/verify-asset/:id', verifyToken, async (req, res, next) => {
  try {
    // Fetch user from DB to check role (since JWT only contains user ID)
    const user = await User.findById(req.user.id);

    if (!user || user.role !== 'Government_Officer') {
      return next(errorHandler(403, 'Forbidden: Only Government Officers can verify assets.'));
    }

    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return next(errorHandler(404, 'Listing not found!'));
    }

    // 2. Lalpurja Pattern Matching Check (GOV-RE-2083-)
    if (
      !listing.governmentRegistrationNum ||
      !listing.governmentRegistrationNum.startsWith('GOV-RE-2083-')
    ) {
      return next(
        errorHandler(
          400,
          'Invalid Document Structure. Assets must be registered via official Land Revenue (Malpot) tracking codes.'
        )
      );
    }

    // 3. Digital Audit Trail Updates
    listing.isRegistryVerified = true;
    listing.verifiedBy = req.user.id;
    listing.verifiedAt = new Date();

    await listing.save();

    res.status(200).json({
      success: true,
      message: 'Property registry has been verified successfully.',
      listing,
    });
  } catch (error) {
    next(error);
  }
});

// 2. POST /calculate-tax/:id -> Calculate and save municipal tax
router.post('/calculate-tax/:id', verifyToken, async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return next(errorHandler(404, 'Listing not found!'));
    }

    // Mathematical algorithm: (regularPrice * 0.5%) + 5000 flat fee
    const calculatedTax = listing.regularPrice * 0.005 + 5000;

    listing.municipalTaxAmount = calculatedTax;
    await listing.save();

    res.status(200).json({
      success: true,
      message: 'Municipal tax calculated and updated.',
      taxAmount: calculatedTax,
      listing,
    });
  } catch (error) {
    next(error);
  }
});

export default router;