import express from 'express';
import {
  getAllUsers,
  updateUserRole,
  getAllEscrows,
  auditEscrowTransaction,
} from '../controllers/admin.controller.js';
import { verifyUser, authorizeRoles } from '../utils/verifyUser.js';

const router = express.Router();

// Enforce authentication & Auditor clearance across all admin sub-routes
router.use(verifyUser);
router.use(authorizeRoles('admin'));

// Escrow Ledger Routes
router.get('/escrows', getAllEscrows);
router.get('/audit-escrows', getAllEscrows);
router.post('/escrows/:id/audit', auditEscrowTransaction);

// Clearance Management Routes
router.get('/users', getAllUsers);
router.patch('/users/:id/role', updateUserRole);

export default router;