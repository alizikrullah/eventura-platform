// backend/src/controllers/voucherController.ts

import { Request, Response } from 'express';
import type { User } from '@prisma/client';
import * as voucherService from '../services/voucherService';
import { CreateVoucherPayload, UpdateVoucherPayload, VoucherFilters } from '../types/voucher';

// Extend Request type to include user from auth middleware
interface AuthRequest extends Request {
  user?: User;
}

/**
 * POST /api/vouchers
 * Create new voucher
 */
export const createVoucher = async (req: AuthRequest, res: Response) => {
  try {
    const organizerId = req.user!.id;
    const payload: CreateVoucherPayload = req.body;

    const voucher = await voucherService.createVoucher(organizerId, payload);

    return res.status(201).json({
      success: true,
      message: 'Voucher created successfully',
      data: { voucher }
    });
  } catch (error: any) {
    console.error('Create voucher error:', error);

    if (error.message === 'Event not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (
      error.message === 'You can only create vouchers for your own events' ||
      error.message === 'Voucher code already exists'
    ) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * GET /api/vouchers
 * Get vouchers for organizer's events
 */
export const getVouchers = async (req: AuthRequest, res: Response) => {
  try {
    const organizerId = req.user!.id;
    const filters: VoucherFilters = {
      event_id: req.query.event_id ? parseInt(req.query.event_id as string) : undefined,
      is_active: req.query.is_active ? req.query.is_active === 'true' : undefined,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10
    };

    const result = await voucherService.getVouchers(organizerId, filters);

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Get vouchers error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * GET /api/vouchers/:code/validate
 * Validate voucher code
 */
export const validateVoucher = async (req: Request, res: Response) => {
  try {
    const code = req.params.code as string;
    const eventId = parseInt(req.query.event_id as string);

    const result = await voucherService.validateVoucher(code, eventId);

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Voucher is valid',
      data: result
    });
  } catch (error: any) {
    console.error('Validate voucher error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * PUT /api/vouchers/:id
 * Update voucher
 */
export const updateVoucher = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const organizerId = req.user!.id;
    const payload: UpdateVoucherPayload = req.body;

    const voucher = await voucherService.updateVoucher(id, organizerId, payload);

    return res.status(200).json({
      success: true,
      message: 'Voucher updated successfully',
      data: { voucher }
    });
  } catch (error: any) {
    console.error('Update voucher error:', error);

    if (
      error.message === 'Voucher not found' ||
      error.message === 'Unauthorized access to this voucher'
    ) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * DELETE /api/vouchers/:id
 * Soft delete voucher
 */
export const deleteVoucher = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const organizerId = req.user!.id;

    await voucherService.deleteVoucher(id, organizerId);

    return res.status(200).json({
      success: true,
      message: 'Voucher deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete voucher error:', error);

    if (
      error.message === 'Voucher not found' ||
      error.message === 'Unauthorized access to this voucher'
    ) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message === 'Cannot delete voucher that has been used in transactions') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};