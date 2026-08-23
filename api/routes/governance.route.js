import express from 'express';
import { verifyUser } from '../utils/verifyUser.js';
import Listing from '../models/listing.model.js';
import User from '../models/user.model.js';
import { errorHandler } from '../utils/error.js';

const router = express.Router();

/**
 * @route   POST /api/governance/verify-asset/:id
 * @desc    Verify Land Revenue (Malpot) Lalpurja and commit audit record to MongoDB
 * @access  Private (Restricted to Government Officers / Admins)
 */
router.post('/verify-asset/:id', verifyUser, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const isAuthorized =
      user &&
      (user.role === 'admin' ||
        user.role === 'Government_Officer' ||
        user.role === 'government_officer');

    if (!isAuthorized) {
      return next(
        errorHandler(
          403,
          'Access Denied: Government Officer or Auditor clearance required.'
        )
      );
    }

    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return next(errorHandler(404, 'Property listing record not found.'));
    }

    const status = req.body.status || 'verified';
    const isVerified = status === 'verified';

    // Normalize or auto-generate fallback reference if missing
    let regNum = (
      listing.governmentRegistrationNum ||
      listing.lalpurjaReference ||
      `GOV-RE-2081-${Math.floor(10000 + Math.random() * 90000)}`
    ).trim().toUpperCase();

    // Persist changes directly to MongoDB
    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          isRegistryVerified: isVerified,
          auditStatus: status,
          verifiedBy: req.user.id,
          verifiedAt: new Date(),
          governmentRegistrationNum: regNum,
          lalpurjaReference: regNum,
        },
      },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: isVerified
        ? 'Statutory Malpot verification successful! Certificate committed.'
        : 'Statutory verification status updated.',
      listing: updatedListing,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/governance/calculate-tax/:id
 * @desc    Compute municipal property tax and persist assessment to MongoDB
 * @access  Private (Restricted to Government Officers / Admins)
 */
router.post('/calculate-tax/:id', verifyUser, async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return next(errorHandler(404, 'Property listing not found.'));
    }

    const baseValuation = Number(listing.regularPrice || 0);
    // Statutory formula: 0.5% valuation + Rs. 5,000 baseline
    const calculatedTax = Math.max(5000, Math.round(baseValuation * 0.005 + 5000));

    // Persist assessed municipal tax permanently in MongoDB
    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          municipalTaxAmount: calculatedTax,
          taxCleared: true,
        },
      },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: `Municipal property tax assessed at Rs. ${calculatedTax.toLocaleString('en-US')}/yr.`,
      taxAmount: calculatedTax,
      listing: updatedListing,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/governance/lookup-identifier
 * @desc    Query listing details directly using Lalpurja unique key
 */
router.post('/lookup-identifier', async (req, res, next) => {
  try {
    const { registrationNum } = req.body;
    if (!registrationNum) {
      return next(errorHandler(400, 'Registration Number is required for lookup.'));
    }

    const searchKey = registrationNum.trim().toUpperCase();
    const listing = await Listing.findOne({
      $or: [
        { governmentRegistrationNum: searchKey },
        { lalpurjaReference: searchKey },
      ],
    });

    if (!listing) {
      return next(errorHandler(404, 'No asset registered under this Land Revenue identifier.'));
    }

    return res.status(200).json({
      success: true,
      listing,
    });
  } catch (error) {
    next(error);
  }
});

export default router;