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

  // Build orderBy — price sort ditangani di memory setelah fetch
  let orderBy: any = { created_at: 'desc' } // default: newest

  if (sort === 'oldest') {
    orderBy = { created_at: 'asc' }
  } else if (sort === 'popular') {
    // Popular = least available seats (most sold)
    orderBy = { available_seats: 'asc' }
  }
  // price_low dan price_high tidak pakai orderBy di query karena Prisma tidak support
  // aggregate orderBy pada relasi. Dihandle di memory setelah min_price dihitung.

  const isPriceSort = sort === 'price_low' || sort === 'price_high'

  // Fetch events with relations
  // Untuk price sort: skip/take di-set undefined agar ambil semua data dulu, paginate di memory
  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      skip: isPriceSort ? undefined : skip,
      take: isPriceSort ? undefined : take,
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

  // Calculate average rating and min_price for each event
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

  // Sort by price di memory (setelah min_price dihitung), lalu paginate manual
  if (isPriceSort) {
    eventsWithRating.sort((a, b) =>
      sort === 'price_low'
        ? a.min_price - b.min_price
        : b.min_price - a.min_price
    )
    const paginatedEvents = eventsWithRating.slice(skip, skip + take)
    return {
      events: paginatedEvents,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    }
  }

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
        take: 5, // Latest 5 reviews, load more via /events/:id/reviews endpoint
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

  // Calculate average rating for this event
  const avgRating = await prisma.review.aggregate({
    where: { event_id: eventId },
    _avg: { rating: true },
  })

  // Calculate organizer's overall rating across all their events
  const organizerRating = await prisma.review.aggregate({
    where: {
      event: { organizer_id: event.organizer_id },
    },
    _avg: { rating: true },
    _count: { rating: true },
  })

  return {
    ...event,
    average_rating: avgRating._avg.rating || 0,
    total_reviews: event._count.reviews,
    organizer: {
      ...event.organizer,
      overall_rating: organizerRating._avg.rating || 0,
      total_reviews: organizerRating._count.rating || 0,
    },
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
    : (ticket_types || [])

  // Auto-calculate total_seats dari sum kuantitas semua ticket types
  const computedTotalSeats = ticketTypesArray.length > 0
    ? ticketTypesArray.reduce((sum: number, tt: any) => sum + Number(tt.available_quantity), 0)
    : Number(total_seats || 0)

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
      total_seats: computedTotalSeats,
      available_seats: computedTotalSeats,
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

  // Handle ticket_types update if provided
  const ticketTypesRaw = payload.ticket_types
  const ticketTypesArray: any[] | undefined = ticketTypesRaw
    ? (typeof ticketTypesRaw === 'string' ? JSON.parse(ticketTypesRaw) : ticketTypesRaw)
    : undefined

  if (ticketTypesArray && ticketTypesArray.length > 0) {
    // Jalankan semua update ticket types + event dalam satu transaction
    await prisma.$transaction(async (tx) => {
      for (const tt of ticketTypesArray) {
        if (tt.db_id) {
          const existingTt = await tx.ticketType.findUnique({
            where: { id: Number(tt.db_id) },
          })

          if (existingTt) {
            // Math.max(0,...) untuk handle data inconsistency (available > quantity)
            const soldQty = Math.max(0, existingTt.quantity - existingTt.available_quantity)
            const newQty = Number(tt.available_quantity)

            if (newQty < soldQty) {
              throw new Error(
                `Kuantitas tiket "${tt.name}" tidak bisa dikurangi di bawah jumlah yang sudah terjual (${soldQty} terjual)`
              )
            }

            await tx.ticketType.update({
              where: { id: Number(tt.db_id) },
              data: {
                name: tt.name,
                price: Number(tt.price),
                description: tt.description || null,
                quantity: newQty,
                available_quantity: newQty - soldQty,
              },
            })
          }
        } else {
          // Ticket type baru — create
          await tx.ticketType.create({
            data: {
              event_id: eventId,
              name: tt.name,
              price: Number(tt.price),
              quantity: Number(tt.available_quantity),
              available_quantity: Number(tt.available_quantity),
              description: tt.description || null,
            },
          })
        }
      }

      // Recalculate total_seats dan available_seats setelah semua update selesai
      const allTickets = await tx.ticketType.findMany({ where: { event_id: eventId } })
      const newTotalSeats = allTickets.reduce((sum, t) => sum + t.quantity, 0)
      const newAvailableSeats = allTickets.reduce((sum, t) => sum + t.available_quantity, 0)

      await tx.event.update({
        where: { id: eventId },
        data: {
          ...updateData,
          total_seats: newTotalSeats,
          available_seats: newAvailableSeats,
        },
      })
    })

    // Return updated event after transaction
    const updatedEvent = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        category: true,
        organizer: { select: { id: true, name: true, email: true } },
      },
    })
    return updatedEvent

  } else if (payload.total_seats !== undefined) {
    // Fallback: handle total_seats manual jika ticket_types tidak dikirim
    const newTotalSeats = Number(payload.total_seats)
    const seatsSold = existingEvent.total_seats - existingEvent.available_seats
    const newAvailableSeats = newTotalSeats - seatsSold
    if (newAvailableSeats < 0) {
      throw new Error(`Cannot reduce seats below sold amount. Already sold: ${seatsSold} seats`)
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

/**
 * Get past events (is_active = false) with search and category filter
 */
export const getPastEvents = async (filters: {
  page?: number
  limit?: number
  category?: number
  location?: string
  search?: string
}) => {
  const { page = 1, limit = 9, category, location, search } = filters
  const skip = (Number(page) - 1) * Number(limit)
  const take = Number(limit)

  const where: any = { is_active: false }

  if (category) where.category_id = Number(category)
  if (location) where.location = { contains: location, mode: 'insensitive' }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      skip,
      take,
      orderBy: { end_date: 'desc' },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        organizer: { select: { id: true, name: true, email: true } },
        ticket_types: { select: { price: true } },
        _count: { select: { reviews: true } },
      },
    }),
    prisma.event.count({ where }),
  ])

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
 * Get organizer public profile
 * Returns organizer info + active events + past events
 */
export const getOrganizerPublicProfile = async (organizerId: number) => {
  // Get organizer info
  const organizer = await prisma.user.findUnique({
    where: { id: organizerId, role: 'organizer' },
    select: {
      id: true,
      name: true,
      email: true,
      profile_picture: true,
      created_at: true,
    },
  })

  if (!organizer) {
    throw new Error('Organizer not found')
  }

  // Get active events (is_active = true)
  const activeEvents = await prisma.event.findMany({
    where: { organizer_id: organizerId, is_active: true },
    orderBy: { start_date: 'asc' },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      ticket_types: { select: { price: true } },
      _count: { select: { reviews: true } },
    },
  })

  // Get past events (is_active = false)
  const pastEvents = await prisma.event.findMany({
    where: { organizer_id: organizerId, is_active: false },
    orderBy: { end_date: 'desc' },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      ticket_types: { select: { price: true } },
      _count: { select: { reviews: true } },
    },
  })

  // Helper to add min_price and average_rating
  const enrichEvents = async (events: typeof activeEvents) =>
    Promise.all(
      events.map(async (event) => {
        const avgRating = await prisma.review.aggregate({
          where: { event_id: event.id },
          _avg: { rating: true },
        })
        return {
          ...event,
          min_price:
            event.ticket_types.length > 0
              ? Math.min(...event.ticket_types.map((tt) => tt.price))
              : 0,
          average_rating: avgRating._avg.rating || 0,
          total_reviews: event._count.reviews,
        }
      }),
    )

  const [enrichedActive, enrichedPast, organizerRating] = await Promise.all([
    enrichEvents(activeEvents),
    enrichEvents(pastEvents),
    prisma.review.aggregate({
      where: { event: { organizer_id: organizerId } },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ])

  return {
    organizer: {
      ...organizer,
      overall_rating: organizerRating._avg.rating || 0,
      total_reviews: organizerRating._count.rating || 0,
    },
    activeEvents: enrichedActive,
    pastEvents: enrichedPast,
  }
}