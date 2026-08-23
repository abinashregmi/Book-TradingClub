import Transaction from '../models/transaction.model.js';
import User from '../models/user.model.js';
import Listing from '../models/listing.model.js';
import { errorHandler } from '../utils/error.js';

/**
 * GET /api/admin/escrows
 * Retrieves all escrow ledger records with populated buyer & property metadata
 */
export const getAllEscrows = async (req, res, next) => {
  try {
    const escrows = await Transaction.find()
      .populate('userId', 'username email avatar role')
      .populate(
        'listingId',
        'name address regularPrice discountPrice imageUrls lalpurjaReference governmentRegistrationNum isRegistryVerified municipalTaxAmount bookingStatus auditStatus'
      )
      .sort({ createdAt: -1 });

    return res.status(200).json(Array.isArray(escrows) ? escrows : []);
  } catch (error) {
    if (typeof next === 'function') {
      return next(error);
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal Server Error fetching escrows.',
    });
  }
};

// Aliased export for backwards compatibility
export const getAuditEscrows = getAllEscrows;

/**
 * POST /api/admin/escrows/:id/audit
 * Executes statutory governance actions (verify Lalpurja, release escrow, flag discrepancy)
 */
export const auditEscrowTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, listingId } = req.body;

    const escrow = await Transaction.findById(id);
    if (!escrow) {
      const notFoundErr = errorHandler
        ? errorHandler(404, 'Escrow transaction record not found.')
        : new Error('Escrow record not found.');
      return typeof next === 'function'
        ? next(notFoundErr)
        : res.status(404).json({ success: false, message: 'Escrow record not found.' });
    }

    const targetListingId = listingId || escrow.listingId;
    let listing = null;

    if (targetListingId) {
      listing = await Listing.findById(targetListingId);
    }

    if (action === 'verify_lalpurja') {
      escrow.status = 'completed';
      await escrow.save();

      if (listing) {
        listing.isRegistryVerified = true;
        listing.auditStatus = 'verified';
        listing.verifiedBy = req.user?.id || null;
        listing.verifiedAt = new Date();
        await listing.save();
      }

      return res.status(200).json({
        success: true,
        message: 'Lalpurja verified and recorded in statutory registry.',
        escrow,
        listing,
      });
    }

    if (action === 'flag_compliance') {
      escrow.status = 'failed';
      await escrow.save();

      if (listing) {
        listing.auditStatus = 'rejected';
        listing.isRegistryVerified = false;
        await listing.save();
      }

      return res.status(200).json({
        success: true,
        message: 'Escrow transaction flagged for statutory discrepancy.',
        escrow,
        listing,
      });
    }

    if (action === 'release_escrow') {
      escrow.status = 'completed';
      await escrow.save();

      return res.status(200).json({
        success: true,
        message: 'Escrow funds successfully released under civic guarantee protocol.',
        escrow,
      });
    }

    const invalidActionErr = errorHandler
      ? errorHandler(400, 'Invalid audit action specified.')
      : new Error('Invalid audit action.');
    return typeof next === 'function'
      ? next(invalidActionErr)
      : res.status(400).json({ success: false, message: 'Invalid audit action specified.' });
  } catch (error) {
    if (typeof next === 'function') {
      return next(error);
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal Server Error auditing escrow.',
    });
  }
};

/**
 * GET /api/admin/users
 * Returns registered users for clearance inspection
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return res.status(200).json(Array.isArray(users) ? users : []);
  } catch (error) {
    if (typeof next === 'function') {
      return next(error);
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal Server Error fetching users.',
    });
  }
};

/**
 * PATCH /api/admin/users/:id/role
 * Updates clearance role for a user account
 */
export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const { id } = req.params;

    if (!['citizen', 'agent', 'admin', 'user', 'Government_Officer'].includes(role)) {
      const invalidRoleErr = errorHandler
        ? errorHandler(400, 'Invalid clearance role provided.')
        : new Error('Invalid role.');
      return typeof next === 'function'
        ? next(invalidRoleErr)
        : res.status(400).json({ success: false, message: 'Invalid clearance role provided.' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: { role } },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      const userNotFoundErr = errorHandler
        ? errorHandler(404, 'User not found!')
        : new Error('User not found.');
      return typeof next === 'function'
        ? next(userNotFoundErr)
        : res.status(404).json({ success: false, message: 'User not found!' });
    }

    return res.status(200).json({
      success: true,
      message: `Clearance successfully updated to ${updatedUser.role}`,
      user: updatedUser,
    });
  } catch (error) {
    if (typeof next === 'function') {
      return next(error);
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal Server Error updating user role.',
    });
  }
};