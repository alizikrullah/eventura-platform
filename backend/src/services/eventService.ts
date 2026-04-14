import prisma from '../config/prisma'
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary'
import { deleteLocalFile } from '../middlewares/upload'
import type { CreateEventPayload, UpdateEventPayload, EventFilters } from '../types/event'

/**
 * Get all events with filters, search, sort, pagination
 */
export const getAllEvents = async (filters: EventFilters) => {
  const {
    page = 1,
    limit = 10,
    category,
    location,
    search,
    sort = 'newest',
    date_from,
    date_to,
  } = filters

  const skip = (Number(page) - 1) * Number(limit)
  const take = Number(limit)

  // Build where clause
  const where: any = {
    is_active: true,
  }

  if (category) {
    where.category_id = Number(category)
  }

  if (location) {
    where.location = {
      contains: location,
      mode: 'insensitive',
    }
  }

  if (search) {
    where.OR = [
      {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        description: {
          contains: search,
          mode: 'insensitive',
        },
      },
    ]
  }

  if (date_from || date_to) {
    where.start_date = {}
    if (date_from) where.start_date.gte = new Date(date_from + 'T00:00:00+07:00')
    if (date_to)   where.start_date.lte = new Date(date_to + 'T23:59:59+07:00')
  }

  // Build orderBy
  let orderBy: any = { created_at: 'desc' } // default: newest

  if (sort === 'price_low') {
    // Sort by lowest ticket type price
    orderBy = { ticket_types: { _min: { price: 'asc' } } }
  } else if (sort === 'price_high') {
    // Sort by highest ticket type price
    orderBy = { ticket_types: { _max: { price: 'desc' } } }
  } else if (sort === 'popular') {
    // Popular = least available seats (most sold)
    orderBy = { available_seats: 'asc' }
  }

  // Fetch events with relations
  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        ticket_types: {
          select: {
            price: true,
          },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
    }),
    prisma.event.count({ where }),
  ])

  // Calculate average rating for each event
  const eventsWithRating = await Promise.all(
    events.map(async (event) => {
      const avgRating = await prisma.review.aggregate({
        where: { event_id: event.id },
        _avg: { rating: true },
      })

      return {
        ...event,
        average_rating: avgRating._avg.rating || 0,
        total_reviews: event._count.reviews,
        min_price: event.ticket_types.length > 0
          ? Math.min(...event.ticket_types.map(tt => tt.price))
          : 0,
      }
    }),
  )

  return {
    events: eventsWithRating,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  }
}

/**
 * Get event by ID with full details
 */
export const getEventById = async (eventId: number) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      organizer: {
        select: {
          id: true,
          name: true,
          email: true,
          profile_picture: true,
        },
      },
      ticket_types: {
        select: {
          id: true,
          name: true,
          price: true,
          quantity: true,
          available_quantity: true,
          description: true,
        },
      },
      reviews: {
        take: 5, // Latest 5 reviews
        orderBy: { created_at: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profile_picture: true,
            },
          },
        },
      },
      _count: {
        select: {
          reviews: true,
        },
      },
    },
  })

  if (!event) {
    throw new Error('Event not found')
  }

  // Calculate average rating
  const avgRating = await prisma.review.aggregate({
    where: { event_id: eventId },
    _avg: { rating: true },
  })

  return {
    ...event,
    average_rating: avgRating._avg.rating || 0,
    total_reviews: event._count.reviews,
  }
}

/**
 * Create new event
 */
export const createEvent = async (
  organizerId: number,
  payload: CreateEventPayload,
  imagePath?: string,
) => {
  const {
    name,
    description,
    location,
    venue,
    category_id,
    total_seats,
    start_date,
    end_date,
    ticket_types,
  } = payload

  // Parse ticket_types if it's a JSON string (from FormData)
  const ticketTypesArray: any[] = typeof ticket_types === 'string' 
    ? JSON.parse(ticket_types) 
    : ticket_types

  // Upload image to Cloudinary if provided
  let image_url: string | undefined

  if (imagePath) {
    const uploadResult = await uploadToCloudinary(imagePath, 'events')
    image_url = uploadResult.secure_url

    // Delete local file after upload
    deleteLocalFile(imagePath)
  }

  // Create event with ticket types
  const event = await prisma.event.create({
    data: {
      organizer_id: organizerId,
      category_id: category_id ? Number(category_id) : null,
      name,
      description,
      location,
      venue,
      total_seats: Number(total_seats),
      available_seats: Number(total_seats), // Initially all seats available
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      image_url,
      is_active: true,
      // Create ticket types if provided
      ...(ticketTypesArray && ticketTypesArray.length > 0 && {
        ticket_types: {
          create: ticketTypesArray.map((tt) => ({
            name: tt.name,
            price: Number(tt.price),
            quantity: Number(tt.available_quantity), // Total quantity
            available_quantity: Number(tt.available_quantity), // Initially same as quantity
            description: tt.description,
          })),
        },
      }),
    },
    include: {
      category: true,
      organizer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      ticket_types: true, // Include ticket types in response
    },
  })

  return event
}

/**
 * Update event
 */
export const updateEvent = async (
  eventId: number,
  organizerId: number,
  payload: UpdateEventPayload,
  imagePath?: string,
) => {
  // Check if event exists and belongs to organizer
  const existingEvent = await prisma.event.findUnique({
    where: { id: eventId },
  })

  if (!existingEvent) {
    throw new Error('Event not found')
  }

  if (existingEvent.organizer_id !== organizerId) {
    throw new Error('Unauthorized: You can only update your own events')
  }

  // Upload new image if provided
  let image_url = existingEvent.image_url

  if (imagePath) {
    // Delete old image from Cloudinary if exists
    if (existingEvent.image_url) {
      // Extract public_id from URL (format: .../eventura/xxxxx.jpg)
      const urlParts = existingEvent.image_url.split('/')
      const filename = urlParts[urlParts.length - 1].split('.')[0]
      const folder = urlParts[urlParts.length - 2]
      const oldPublicId = `${folder}/${filename}`

      try {
        await deleteFromCloudinary(oldPublicId)
      } catch (error) {
        console.error('Failed to delete old image:', error)
      }
    }

    // Upload new image
    const uploadResult = await uploadToCloudinary(imagePath, 'events')
    image_url = uploadResult.secure_url

    // Delete local file
    deleteLocalFile(imagePath)
  }

  // Update event
  const updateData: any = {}

  if (payload.name !== undefined) updateData.name = payload.name
  if (payload.description !== undefined) updateData.description = payload.description
  if (payload.location !== undefined) updateData.location = payload.location
  if (payload.venue !== undefined) updateData.venue = payload.venue
  if (payload.category_id !== undefined) updateData.category_id = payload.category_id ? Number(payload.category_id) : null
  if (payload.start_date !== undefined) updateData.start_date = new Date(payload.start_date)
  if (payload.end_date !== undefined) updateData.end_date = new Date(payload.end_date)
  if (image_url !== existingEvent.image_url) updateData.image_url = image_url

  // Handle total_seats update
  if (payload.total_seats !== undefined) {
    const newTotalSeats = Number(payload.total_seats)
    const seatsSold = existingEvent.total_seats - existingEvent.available_seats
    const newAvailableSeats = newTotalSeats - seatsSold

    if (newAvailableSeats < 0) {
      throw new Error(
        `Cannot reduce seats below sold amount. Already sold: ${seatsSold} seats`,
      )
    }

    updateData.total_seats = newTotalSeats
    updateData.available_seats = newAvailableSeats
  }

  const updatedEvent = await prisma.event.update({
    where: { id: eventId },
    data: updateData,
    include: {
      category: true,
      organizer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  return updatedEvent
}

/**
 * Delete event (hard delete)
 */
export const deleteEvent = async (eventId: number, organizerId: number) => {
  // Check if event exists and belongs to organizer
  const existingEvent = await prisma.event.findUnique({
    where: { id: eventId },
  })

  if (!existingEvent) {
    throw new Error('Event not found')
  }

  if (existingEvent.organizer_id !== organizerId) {
    throw new Error('Unauthorized: You can only delete your own events')
  }

  // Check if there are active transactions
  const activeTransactions = await prisma.transaction.count({
    where: {
      event_id: eventId,
      status: {
        in: ['waiting_payment', 'paid'],
      },
    },
  })

  if (activeTransactions > 0) {
    throw new Error('Cannot delete event with active transactions')
  }

  // Delete image from Cloudinary if exists
  if (existingEvent.image_url) {
    const urlParts = existingEvent.image_url.split('/')
    const filename = urlParts[urlParts.length - 1].split('.')[0]
    const folder = urlParts[urlParts.length - 2]
    const publicId = `${folder}/${filename}`

    try {
      await deleteFromCloudinary(publicId)
    } catch (error) {
      console.error('Failed to delete image from Cloudinary:', error)
    }
  }

  // Delete all related data first (to avoid foreign key constraint errors)
  await prisma.$transaction(async (tx) => {
    // Delete reviews
    await tx.review.deleteMany({
      where: { event_id: eventId },
    })

    // Delete vouchers
    await tx.voucher.deleteMany({
      where: { event_id: eventId },
    })

    // Delete ticket types
    await tx.ticketType.deleteMany({
      where: { event_id: eventId },
    })

    // Delete transaction items (if any)
    await tx.transactionItem.deleteMany({
      where: {
        transaction: {
          event_id: eventId,
        },
      },
    })

    // Delete transactions
    await tx.transaction.deleteMany({
      where: { event_id: eventId },
    })

    // Finally, delete the event itself
    await tx.event.delete({
      where: { id: eventId },
    })
  })

  return { message: 'Event deleted successfully' }
}