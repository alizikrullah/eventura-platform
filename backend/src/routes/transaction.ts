import { Router } from 'express';
import * as transactionController from '../controllers/transactionController';
import { auth } from '../middlewares/auth';
import { createTransactionValidator } from '../validators/transactionValidator';

/**
 * Transaction Routes
 * 
 * Pattern: Same as event.ts and voucher.ts
 * Middleware chain: auth → validator → controller
 */

const router = Router();

/**
 * POST /api/transactions
 * 
 * Create new transaction
 * 
 * Middleware:
 * - auth: Verify JWT and attach user to req.user
 * - createTransactionValidator: Validate request body
 */
router.post(
  '/',
  auth,
  createTransactionValidator,
  transactionController.createTransaction
);

/**
 * GET /api/transactions
 * 
 * Get user's transactions with filters
 * 
 * Query params:
 * - status (optional): waiting_payment, paid, expired, canceled
 * - page (optional, default: 1)
 * - limit (optional, default: 10)
 */
router.get('/', auth, transactionController.getTransactions);

/**
 * GET /api/transactions/discounts
 * 
 * Get user's available points and coupons
 * 
 * IMPORTANT: This route must come BEFORE /:id
 * Otherwise Express will treat "discounts" as an ID parameter
 */
router.get('/discounts', auth, transactionController.getAvailableDiscounts);

/**
 * GET /api/transactions/:id
 * 
 * Get transaction detail by ID
 * 
 * Params:
 * - id: Transaction ID
 */
router.get('/:id', auth, transactionController.getTransactionById);

/**
 * POST /api/transactions/webhook
 * 
 * Midtrans webhook handler
 * 
 * NO AUTH MIDDLEWARE
 * - Midtrans doesn't send JWT token
 * - Authentication via signature verification in controller
 * 
 * Security:
 * - Signature verification is MANDATORY
 * - Prevents unauthorized status updates
 */
router.post('/webhook', transactionController.handleWebhook);
router.patch('/:id/cancel', auth, transactionController.cancelTransaction);

export default router;
