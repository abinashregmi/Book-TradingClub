import express from 'express';
import multer from 'multer';
import { storage } from '../utils/cloudinary.js'; // Import your new Cloudinary config
import {
  createListing,
  deleteListing,
  updateListing,
  getListing,
  getListings,
} from '../controllers/listing.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

// Initialize multer with Cloudinary storage settings
// Change '6' to the maximum number of images allowed per listing
const upload = multer({ storage }).array('images', 6); 

const router = express.Router();

// Middleware execution order: 1st Verify User -> 2nd Upload Images -> 3rd Save to Database
router.post('/create', verifyToken, upload, createListing);
router.delete('/delete/:id', verifyToken, deleteListing);
router.post('/update/:id', verifyToken, upload, updateListing);
router.get('/get/:id', getListing);
router.get('/get', getListings);

export default router;
