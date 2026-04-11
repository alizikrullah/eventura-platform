// backend/src/routes/voucher.ts

import { Router } from 'express';
import * as voucherController from '../controllers/voucherController';
import {
  createVoucherValidator,
  updateVoucherValidator,
  validateVoucherValidator,
  getVouchersValidator,
  deleteVoucherValidator
} from '../validators/voucherValidator';
import { auth } from '../middlewares/auth';
import { roleCheck } from '../middlewares/role';

const router = Router();

/**
 * POST /api/vouchers
 * Create voucher (organizer only)
 */
router.post(
  '/',
  auth,
  roleCheck(['organizer']),
  createVoucherValidator,
  voucherController.createVoucher
);

/**
 * GET /api/vouchers
 * Get organizer's vouchers (organizer only)
 */
router.get(
  '/',
  auth,
  roleCheck(['organizer']),
  getVouchersValidator,
  voucherController.getVouchers
);

/**
 * GET /api/vouchers/:code/validate
 * Validate voucher code (public)
 */
router.get(
  '/:code/validate',
  validateVoucherValidator,
  voucherController.validateVoucher
);

/**
 * PUT /api/vouchers/:id
 * Update voucher (organizer only)
 */
router.put(
  '/:id',
  auth,
  roleCheck(['organizer']),
  updateVoucherValidator,
  voucherController.updateVoucher
);

/**
 * DELETE /api/vouchers/:id
 * Soft delete voucher (organizer only)
 */
router.delete(
  '/:id',
  auth,
  roleCheck(['organizer']),
  deleteVoucherValidator,
  voucherController.deleteVoucher
);

export default router;
