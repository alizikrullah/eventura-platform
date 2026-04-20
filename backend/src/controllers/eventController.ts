import { Request, Response } from 'express'
import type { User } from '@prisma/client'
import * as eventService from '../services/eventService'
import type { EventFilters } from '../types/event'
import prisma from '../config/prisma';

// Extend Request type to include user from auth middleware
interface AuthRequest extends Request {
  user?: User
}

/**
 * GET /api/events
 * Browse events with filters
 */
export const getAllEvents = async (req: Request, res: Response) => {
  try {
    const filters: EventFilters = {
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 10,
      category: req.query.category ? Number(req.query.category) : undefined,
      location: req.query.location as string,
      search: req.query.search as string,
      sort: req.query.sort as any,
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string,
    }

    const result = await eventService.getAllEvents(filters)

    return res.status(200).json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Get events error:', error)
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch events',
    })
  }
}

/**
 * GET /api/events/:id
 * Get event detail
 */
export const getEventById = async (req: Request, res: Response) => {
  try {
    const eventId = Number(req.params.id)

    if (isNaN(eventId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID',
      })
    }

    const event = await eventService.getEventById(eventId)

    return res.status(200).json({
      success: true,
      data: { event },
    })
  } catch (error) {
    console.error('Get event error:', error)

    if (error instanceof Error && error.message === 'Event not found') {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      })
    }

    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch event',
    })
  }
}

/**
 * POST /api/events
 * Create new event (organizer only)
 */
export const createEvent = async (req: AuthRequest, res: Response) => {
  try {
    const organizerId = req.user!.id
    const imagePath = req.file?.path

    const event = await eventService.createEvent(organizerId, req.body, imagePath)

    return res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: { event },
    })
  } catch (error) {
    console.error('Create event error:', error)
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create event',
    })
  }
}

/**
 * PUT /api/events/:id
 * Update event (organizer only)
 */
export const updateEvent = async (req: AuthRequest, res: Response) => {
  try {
    const eventId = Number(req.params.id)
    const organizerId = req.user!.id
    const imagePath = req.file?.path

    if (isNaN(eventId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID',
      })
    }

    const event = await eventService.updateEvent(eventId, organizerId, req.body, imagePath)

    return res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: { event },
    })
  } catch (error) {
    console.error('Update event error:', error)

    if (error instanceof Error) {
      if (error.message === 'Event not found') {
        return res.status(404).json({
          success: false,
          message: 'Event not found',
        })
      }

      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({
          success: false,
          message: error.message,
        })
      }

      if (error.message.includes('Cannot reduce seats')) {
        return res.status(400).json({
          success: false,
          message: error.message,
        })
      }
    }

    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update event',
    })
  }
}

/**
 * DELETE /api/events/:id
 * Delete event (organizer only)
 */
export const deleteEvent = async (req: AuthRequest, res: Response) => {
  try {
    const eventId = Number(req.params.id)
    const organizerId = req.user!.id

    if (isNaN(eventId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID',
      })
    }

    const result = await eventService.deleteEvent(eventId, organizerId)

    return res.status(200).json({
      success: true,
      message: result.message,
    })
  } catch (error) {
    console.error('Delete event error:', error)

    if (error instanceof Error) {
      if (error.message === 'Event not found') {
        return res.status(404).json({
          success: false,
          message: 'Event not found',
        })
      }

      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({
          success: false,
          message: error.message,
        })
      }

      if (error.message.includes('Cannot delete event')) {
        return res.status(400).json({
          success: false,
          message: error.message,
        })
      }
    }

    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete event',
    })
  }
}
export const getOrganizerEvents = async (req: AuthRequest, res: Response) => {
  try {
    const organizerId = req.user!.id;
    const events = await prisma.event.findMany({
      where: { organizer_id: organizerId },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        ticket_types: { select: { price: true } },
        _count: { select: { reviews: true } },
      },
      orderBy: { created_at: 'desc' },
    });
    return res.status(200).json({ success: true, data: { events } });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/events/organizer/:id/profile
 * Get organizer public profile (public)
 */
export const getOrganizerProfile = async (req: Request, res: Response) => {
  try {
    const organizerId = Number(req.params.id)

    if (isNaN(organizerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid organizer ID',
      })
    }

    const result = await eventService.getOrganizerPublicProfile(organizerId)

    return res.status(200).json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Get organizer profile error:', error)

    if (error instanceof Error && error.message === 'Organizer not found') {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found',
      })
    }

    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch organizer profile',
    })
  }
}