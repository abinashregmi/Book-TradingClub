import Listing from '../models/listing.model.js';
import { errorHandler } from '../utils/error.js';

export const createListing = async (req, res, next) => {
  try {
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = req.files.map((file) => file.path);
    }

    // Safely parse or extract string/array data sent from frontend
    const listingData = {
      ...req.body,
      imageUrls: imageUrls.length > 0 ? imageUrls : req.body.imageUrls,
      userRef: req.user.id, // Securely bind the listing to the authenticated user
    };

    const listing = await Listing.create(listingData);
    return res.status(201).json(listing);
  } catch (error) {
    next(error);
  }
};

export const deleteListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return next(errorHandler(404, 'Listing not found!'));
    }
    if (req.user.id !== listing.userRef.toString()) {
      return next(errorHandler(403, 'You can delete only your listing!'));
    }

    await Listing.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: 'Listing deleted successfully!' });
  } catch (error) {
    next(error);
  }
};

export const updateListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return next(errorHandler(404, 'Listing not found!'));
    }
    if (req.user.id !== listing.userRef.toString()) {
      return next(errorHandler(403, 'You can only update your own listing!'));
    }

    const updateData = { ...req.body };

    // Append new images instead of wiping out old ones completely
    if (req.files && req.files.length > 0) {
      const newImageUrls = req.files.map((file) => file.path);
      const existingUrls = req.body.imageUrls ? (Array.isArray(req.body.imageUrls) ? req.body.imageUrls : [req.body.imageUrls]) : [];
      updateData.imageUrls = [...existingUrls, ...newImageUrls];
    }

    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true } // Ensures data types match schema rules
    );
    return res.status(200).json(updatedListing);
  } catch (error) {
    next(error);
  }
};

export const getListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return next(errorHandler(404, 'Listing not found!'));
    }
    return res.status(200).json(listing);
  } catch (error) {
    next(error);
  }
};

export const getListings = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 9;
    const startIndex = parseInt(req.query.startIndex) || 0;

    // Direct Boolean mappings for exact query matching
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
    const order = req.query.order === 'asc' ? 1 : -1; // MongoDB sort order mapping

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

    return res.status(200).json(listings);
  } catch (error) {
    next(error);
  }
};
