import express from 'express';
import {
  createListing,
  deleteListing,
  updateListing,
  getListing,
  getListings,
  verifyListing,
  calculateTax,
} from '../controllers/listing.controller.js';
import { verifyUser, verifyToken, authorizeRoles } from '../utils/verifyUser.js';

const router = express.Router();

// 1. Explicit POST route for creating a property listing
router.post('/create', verifyUser || verifyToken, createListing);

// 2. Listing mutation endpoints
router.post('/update/:id', verifyUser || verifyToken, updateListing);
router.delete('/delete/:id', verifyUser || verifyToken, deleteListing);

// 3. Public search and retrieval endpoints
router.get('/get', getListings);
router.get('/get/:id', getListing);

// 4. Auditor governance and tax endpoints
router.patch('/verify/:id', verifyUser || verifyToken, authorizeRoles('admin'), verifyListing);
router.post('/calculate-tax/:id', verifyUser || verifyToken, authorizeRoles('admin'), calculateTax);

export default router;