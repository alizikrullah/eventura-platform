import { Request, Response } from 'express';
import type { User } from '@prisma/client';
import * as transactionService from '../services/transactionService';
import { verifySignature } from '../config/midtrans';
import prisma from '../config/prisma';
import type { MidtransNotification, TransactionStatus } from '../types/transaction';

/**
 * Transaction Controller
 * 
 * HTTP request handlers for transaction endpoints
 * Pattern: Same as eventController and voucherController
 */

/**
 * AuthRequest interface
 * 
 * CRITICAL: Express Request doesn't have user property by default
 * Same pattern as eventController.ts and voucherController.ts
 */
interface AuthRequest extends Request {
  user?: User;
}

/**
 * POST /api/transactions
 * 
 * Create new transaction with Midtrans integration
 * 
 * Middleware: auth (required)
 * Role: Any authenticated user (customer or organizer)
 */
export const createTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const payload = req.body;

    const result = await transactionService.createTransaction(userId, payload);

    return res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: result
    });
  } catch (error: any) {
    console.error('Create transaction error:', error);

    // Handle specific error messages
    if (
      error.message.includes('not found') ||
      error.message.includes('Not enough')
    ) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    if (
      error.message.includes('not valid') ||
      error.message.includes('inactive') ||
      error.message.includes('expired') ||
      error.message.includes('used')
    ) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create transaction',
      error: error.message
    });
  }
};

/**
 * GET /api/transactions
 * 
 * Get user's transactions with filters
 * 
 * Query params:
 * - status (optional)
 * - page (default: 1)
 * - limit (default: 10)
 * 
 * Middleware: auth (required)
 */
export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { status, page, limit } = req.query;

    const filters = {
      status: status as string | undefined,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10
    };

    const result = await transactionService.getUserTransactions(
      userId,
      filters
    );

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Get transactions error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve transactions',
      error: error.message
    });
  }
};

export const getOrganizerTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const organizerId = req.user!.id;
    const { status, page, limit } = req.query;

    const result = await transactionService.getOrganizerTransactions(organizerId, {
      status: status as string | undefined,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 10,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Get organizer transactions error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve organizer transactions',
      error: error.message,
    });
  }
};

/**
 * GET /api/transactions/:id
 * 
 * Get transaction detail by ID
 * 
 * Middleware: auth (required)
 */
export const getTransactionById = async (req: AuthRequest, res: Response) => {
  try {
    const transactionId = parseInt(req.params.id as string);
    const userId = req.user!.id;

    const transaction = await transactionService.getTransactionDetail(
      transactionId,
      userId
    );

    return res.status(200).json({
      success: true,
      data: {
        transaction
      }
    });
  } catch (error: any) {
    console.error('Get transaction detail error:', error);

    if (
      error.message === 'Transaction not found' ||
      error.message === 'Unauthorized access to this transaction'
    ) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve transaction',
      error: error.message
    });
  }
};

/**
 * GET /api/transactions/discounts
 * 
 * Get user's available points and coupons
 * 
 * Used in checkout page to show available discounts
 * 
 * Middleware: auth (required)
 */
export const getAvailableDiscounts = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user!.id;

    const discounts = await transactionService.getUserAvailableDiscounts(
      userId
    );

    return res.status(200).json({
      success: true,
      data: discounts
    });
  } catch (error: any) {
    console.error('Get available discounts error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve available discounts',
      error: error.message
    });
  }
};

/**
 * PATCH /api/transactions/:id/cancel
 * 
 * Cancel a waiting_payment transaction
 * 
 * Middleware: auth (required)
 */
export const cancelTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const transactionId = parseInt(req.params.id as string);
    const userId = req.user!.id;

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    if (transaction.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (transaction.status !== 'waiting_payment') {
      return res.status(400).json({
        success: false,
        message: 'Hanya transaksi dengan status menunggu pembayaran yang bisa dibatalkan'
      });
    }

    await transactionService.transitionTransactionToStatus(transactionId, 'canceled');

    return res.status(200).json({
      success: true,
      message: 'Transaction canceled successfully'
    });
  } catch (error: any) {
    console.error('Cancel transaction error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel transaction',
      error: error.message
    });
  }
};

export const approveTransactionByOrganizer = async (req: AuthRequest, res: Response) => {
  try {
    const transactionId = parseInt(req.params.id as string, 10);
    const organizerId = req.user!.id;

    const result = await transactionService.approveTransactionByOrganizer(transactionId, organizerId);

    return res.status(200).json({
      success: true,
      message: 'Transaction approved successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Approve organizer transaction error:', error);

    if (
      error.message === 'Transaction not found' ||
      error.message === 'Unauthorized access to this transaction'
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes('cannot') || error.message.includes('already') || error.message.includes('Wait for Midtrans')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to approve transaction',
      error: error.message,
    });
  }
};

export const rejectTransactionByOrganizer = async (req: AuthRequest, res: Response) => {
  try {
    const transactionId = parseInt(req.params.id as string, 10);
    const organizerId = req.user!.id;

    const result = await transactionService.rejectTransactionByOrganizer(transactionId, organizerId);

    return res.status(200).json({
      success: true,
      message: 'Transaction canceled successfully before Midtrans confirmation',
      data: result,
    });
  } catch (error: any) {
    console.error('Reject organizer transaction error:', error);

    if (
      error.message === 'Transaction not found' ||
      error.message === 'Unauthorized access to this transaction'
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes('cannot') || error.message.includes('already')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to reject transaction',
      error: error.message,
    });
  }
};

/**
 * POST /api/transactions/webhook
 * 
 * Midtrans webhook handler
 * 
 * Receives payment notifications from Midtrans
 * Updates transaction status based on payment result
 * 
 * Security: ALWAYS verify signature
 * 
 * NO AUTH MIDDLEWARE - Midtrans doesn't send JWT
 * Authentication via signature verification instead
 * 
 * Docs: https://docs.midtrans.com/en/after-payment/http-notification
 */
export const handleWebhook = async (req: Request, res: Response) => {
  try {
    const notification: MidtransNotification = req.body;

    console.log('Midtrans webhook received:', {
      order_id: notification.order_id,
      transaction_status: notification.transaction_status,
      fraud_status: notification.fraud_status
    });

    // ========================================
    // 1. VERIFY SIGNATURE (Security)
    // ========================================
    const shouldSkipSignatureValidation = process.env.MIDTRANS_DISABLE_SIGNATURE_VALIDATION === 'true';

    if (!shouldSkipSignatureValidation) {
      const isValid = verifySignature(
        notification.order_id,
        notification.status_code,
        notification.gross_amount,
        notification.signature_key
      );

      if (!isValid) {
        console.error('Invalid Midtrans signature!');
        return res.status(401).json({
          success: false,
          message: 'Invalid signature'
        });
      }
    } else {
      console.log('⚠️ Midtrans signature verification skipped via MIDTRANS_DISABLE_SIGNATURE_VALIDATION=true');
    }

    // ========================================
    // 2. FIND TRANSACTION
    // ========================================
    const transaction = await prisma.transaction.findUnique({
      where: { invoice_number: notification.order_id }
    });

    if (!transaction) {
      console.error('Transaction not found:', notification.order_id);
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // ========================================
    // 3. UPDATE STATUS BASED ON NOTIFICATION
    // ========================================
    const { transaction_status, fraud_status } = notification;

    let targetStatus: Extract<TransactionStatus, 'paid' | 'expired' | 'canceled'> | null = null;

    if (transaction_status === 'settlement') {
      targetStatus = 'paid';
    } else if (transaction_status === 'capture' && fraud_status === 'accept') {
      targetStatus = 'paid';
    } else if (transaction_status === 'expire') {
      targetStatus = 'expired';
    } else if (
      transaction_status === 'cancel' ||
      transaction_status === 'deny' ||
      transaction_status === 'failure'
    ) {
      targetStatus = 'canceled';
    }

    if (targetStatus && targetStatus !== transaction.status) {
      await transactionService.transitionTransactionToStatus(transaction.id, targetStatus);

      console.log(
        `Transaction ${transaction.invoice_number} status updated: ${transaction.status} -> ${targetStatus}`
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Webhook processed'
    });
  } catch (error: any) {
    console.error('Webhook handler error:', error);

    return res.status(500).json({
      success: false,
      message: 'Webhook processing failed',
      error: error.message
    });
  }
};
