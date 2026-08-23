import Listing from '../models/listing.model.js';
import { errorHandler } from '../utils/error.js';

/**
 * POST /api/listing/create
 * Creates a new property listing with robust type casting, default fallbacks, and error logging
 */
export const createListing = async (req, res, next) => {
  try {
    const {
      name,
      description,
      address,
      regularPrice,
      discountPrice,
      bathrooms,
      bedrooms,
      furnished,
      parking,
      type,
      offer,
      governmentRegistrationNum,
      lalpurjaReference,
      imageUrls,
      userRef,
    } = req.body;

    // 1. Validate required text fields
    if (!name || !description || !address) {
      return next(
        errorHandler(400, 'Property name, description, and address are required.')
      );
    }

    // 2. Safe user identity resolution (from auth token or payload fallback)
    const resolvedUserRef = req.user?.id || req.user?._id || userRef;
    if (!resolvedUserRef) {
      return next(
        errorHandler(401, 'Unauthorized: User authentication is required to create a listing.')
      );
    }

    // 3. Process and sanitize image URLs
    let finalImageUrls = [];
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      finalImageUrls = req.files.map((file) => file.path);
    } else if (Array.isArray(imageUrls) && imageUrls.length > 0) {
      finalImageUrls = imageUrls.filter((url) => typeof url === 'string' && url.trim());
    } else if (typeof imageUrls === 'string' && imageUrls.trim()) {
      finalImageUrls = [imageUrls.trim()];
    }

    // Fallback default image placeholder if none uploaded
    if (finalImageUrls.length === 0) {
      finalImageUrls = [
        'https://53.fs1.hubspotusercontent-na1.net/hub/53/hubfs/Sales_Blog/real-estate-compressor.jpg',
      ];
    }

    // 4. Generate or normalize statutory Lalpurja reference
    const resolvedRegNum = (
      governmentRegistrationNum ||
      lalpurjaReference ||
      `GOV-RE-2081-${Math.floor(10000 + Math.random() * 90000)}`
    ).trim().toUpperCase();

    // 5. Cast and sanitize all payload properties to match Mongoose schema types exactly
    const parsedListingData = {
      name: String(name).trim(),
      description: String(description).trim(),
      address: String(address).trim(),
      regularPrice: Math.max(0, Number(regularPrice) || 0),
      discountPrice: Math.max(0, Number(discountPrice) || 0),
      bathrooms: Math.max(1, Number(bathrooms) || 1),
      bedrooms: Math.max(1, Number(bedrooms) || 1),
      furnished: Boolean(furnished),
      parking: Boolean(parking),
      type: String(type).trim().toLowerCase() === 'rent' ? 'rent' : 'sale',
      offer: Boolean(offer),
      imageUrls: finalImageUrls,
      userRef: String(resolvedUserRef),
      governmentRegistrationNum: resolvedRegNum,
      lalpurjaReference: resolvedRegNum,
      auditStatus: 'pending',
      isRegistryVerified: false,
      bookingStatus: 'available',
      isBooked: false,
    };

    const newListing = await Listing.create(parsedListingData);
    return res.status(201).json(newListing);
  } catch (error) {
    console.error('Error inside createListing controller:', error);
    next(error);
  }
};

/**
 * POST /api/listing/update/:id
 * Updates an existing listing document
 */
export const updateListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return next(errorHandler(404, 'Property listing record not found!'));
    }

    const currentUserId = req.user?.id || req.user?._id;
    const isOwner = listing.userRef && currentUserId && listing.userRef.toString() === currentUserId.toString();
    const isAdmin = req.user?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return next(errorHandler(403, 'Forbidden: You can only update your own property listing.'));
    }

    const updatePayload = { ...req.body };

    if (updatePayload.governmentRegistrationNum || updatePayload.lalpurjaReference) {
      const reg = (updatePayload.governmentRegistrationNum || updatePayload.lalpurjaReference).trim().toUpperCase();
      updatePayload.governmentRegistrationNum = reg;
      updatePayload.lalpurjaReference = reg;
    }

    if (updatePayload.regularPrice !== undefined) updatePayload.regularPrice = Number(updatePayload.regularPrice);
    if (updatePayload.discountPrice !== undefined) updatePayload.discountPrice = Number(updatePayload.discountPrice);
    if (updatePayload.bedrooms !== undefined) updatePayload.bedrooms = Number(updatePayload.bedrooms);
    if (updatePayload.bathrooms !== undefined) updatePayload.bathrooms = Number(updatePayload.bathrooms);

    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      { $set: updatePayload },
      { new: true, runValidators: true }
    );

    return res.status(200).json(updatedListing);
  } catch (error) {
    console.error('Error inside updateListing controller:', error);
    next(error);
  }
};

/**
 * DELETE /api/listing/delete/:id
 * Deletes a property listing
 */
export const deleteListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return next(errorHandler(404, 'Property listing record not found!'));
    }

    const currentUserId = req.user?.id || req.user?._id;
    const isOwner = listing.userRef && currentUserId && listing.userRef.toString() === currentUserId.toString();
    const isAdmin = req.user?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return next(errorHandler(403, 'Forbidden: You can only delete your own property listing.'));
    }

    await Listing.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: 'Property listing deleted successfully.' });
  } catch (error) {
    console.error('Error inside deleteListing controller:', error);
    next(error);
  }
};

/**
 * GET /api/listing/get/:id
 * Retrieves a single listing by ID
 */
export const getListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return next(errorHandler(404, 'Property listing record not found!'));
    }
    return res.status(200).json(listing);
  } catch (error) {
    console.error('Error inside getListing controller:', error);
    next(error);
  }
};

/**
 * GET /api/listing/get
 * Searches and paginates through active property listings
 */
export const getListings = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 9;
    const startIndex = parseInt(req.query.startIndex, 10) || 0;

    let offer = req.query.offer;
    if (offer === undefined || offer === 'all') {
      offer = { $in: [false, true] };
    } else {
      offer = offer === 'true';
    }

    let furnished = req.query.furnished;
    if (furnished === undefined || furnished === 'all') {
      furnished = { $in: [false, true] };
    } else {
      furnished = furnished === 'true';
    }

    let parking = req.query.parking;
    if (parking === undefined || parking === 'all') {
      parking = { $in: [false, true] };
    } else {
      parking = parking === 'true';
    }

    let type = req.query.type;
    if (type === undefined || type === 'all') {
      type = { $in: ['sale', 'rent'] };
    }

    const searchTerm = req.query.searchTerm || '';
    const sort = req.query.sort || 'createdAt';
    const order = req.query.order === 'asc' ? 1 : -1;

    const listings = await Listing.find({
      name: { $regex: searchTerm, $options: 'i' },
      offer,
      furnished,
      parking,
      type,
    })
      .sort({ [sort]: order })
      .limit(limit)
      .skip(startIndex);

    return res.status(200).json(Array.isArray(listings) ? listings : []);
  } catch (error) {
    console.error('Error inside getListings controller:', error);
    next(error);
  }
};

/**
 * PATCH /api/listing/verify/:id
 * Direct auditor verification route
 */
export const verifyListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const listing = await Listing.findById(id);
    if (!listing) {
      return next(errorHandler(404, 'Property listing record not found!'));
    }

    const isVerified = status === 'verified';
    const regNum = (
      listing.governmentRegistrationNum ||
      listing.lalpurjaReference ||
      `GOV-RE-2081-${Math.floor(10000 + Math.random() * 90000)}`
    ).trim().toUpperCase();

    const updatedListing = await Listing.findByIdAndUpdate(
      id,
      {
        $set: {
          auditStatus: status || 'verified',
          isRegistryVerified: isVerified,
          verifiedBy: req.user?.id || req.user?._id,
          verifiedAt: new Date(),
          governmentRegistrationNum: regNum,
          lalpurjaReference: regNum,
        },
      },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Malpot registry verification committed successfully.',
      listing: updatedListing,
    });
  } catch (error) {
    console.error('Error inside verifyListing controller:', error);
    next(error);
  }
};

/**
 * POST /api/listing/calculate-tax/:id
 * Computes and persists municipal tax assessment
 */
export const calculateTax = async (req, res, next) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
      return next(errorHandler(404, 'Property listing record not found!'));
    }

    const valuation = Number(listing.regularPrice || 0);
    const taxAmount = Math.max(5000, Math.round(valuation * 0.005 + 5000));

    const updatedListing = await Listing.findByIdAndUpdate(
      id,
      {
        $set: {
          municipalTaxAmount: taxAmount,
          taxCleared: true,
        },
      },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: `Municipal tax assessed at Rs. ${taxAmount.toLocaleString('en-US')}/yr.`,
      taxAmount,
      listing: updatedListing,
    });
  } catch (error) {
    console.error('Error inside calculateTax controller:', error);
    next(error);
  }
};