import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';
import { createBookingToken } from '../controllers/transaction.controller.js';

const router = express.Router();

// Protected Escrow Booking Route
router.post('/book', verifyToken, createBookingToken);

export default router;