import prisma from '../config/prisma';

/**
 * Review Service
 * 
 * Business logic for reviews:
 * - Validate user attended event (transaction status = 'paid')
 * - Check duplicate reviews (one review per user per event)
 * - Calculate average rating after create/update/delete
 */

interface CreateReviewData {
  rating: number;
  comment?: string;
}

interface UpdateReviewData {
  rating?: number;
  comment?: string;
}

// ========================================
// CREATE REVIEW
// ========================================
export const createReview = async (
  userId: number,
  eventId: number,
  data: CreateReviewData
) => {
  const { rating, comment } = data;

  // ========================================
  // 1. VALIDATE EVENT EXISTS
  // ========================================
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, is_active: true, end_date: true },
  });

  if (!event) {
    throw new Error('Event not found');
  }

  // ========================================
  // 2. CHECK EVENT HAS ENDED (is_active = false)
  // Event hanya bisa di-review setelah is_active = false
  // (is_active di-set false oleh cron job saat end_date tercapai)
  // ========================================
  if (event.is_active) {
    throw new Error('You can only review after the event has ended');
  }

  // ========================================
  // 3. CHECK USER HAS ATTENDED (paid transaction)
  // ========================================
  const attendance = await prisma.transaction.findFirst({
    where: {
      user_id: userId,
      event_id: eventId,
      status: 'paid',
    },
  });

  if (!attendance) {
    throw new Error('You must attend the event before writing a review');
  }

  // ========================================
  // 4. CHECK DUPLICATE REVIEW
  // ========================================
  // Check if this transaction already has a review
  const existingReview = await prisma.review.findUnique({
    where: {
      transaction_id: attendance.id
    }
  });

  if (existingReview) {
    throw new Error('You have already reviewed this event');
  }

  // ========================================
  // 5. CREATE REVIEW
  // ========================================
  const review = await prisma.review.create({
    data: {
      user_id: userId,
      event_id: eventId,
      transaction_id: attendance.id, // Link to the transaction
      rating,
      comment: comment || null
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          profile_picture: true
        }
      }
    }
  });

  // ========================================
  // 6. UPDATE EVENT AVERAGE RATING
  // ========================================
  await updateEventAverageRating(eventId);

  return review;
};

// ========================================
// GET EVENT REVIEWS
// ========================================
export const getEventReviews = async (
  eventId: number,
  page: number = 1,
  limit: number = 10
) => {
  const skip = (page - 1) * limit;

  // Get reviews with pagination
  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { event_id: eventId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profile_picture: true
          }
        }
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit
    }),
    prisma.review.count({
      where: { event_id: eventId }
    })
  ]);

  return {
    reviews,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

// ========================================
// GET REVIEW BY ID
// ========================================
export const getReviewById = async (reviewId: number) => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          profile_picture: true
        }
      },
      event: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  if (!review) {
    throw new Error('Review not found');
  }

  return review;
};

// ========================================
// UPDATE REVIEW
// ========================================
export const updateReview = async (
  reviewId: number,
  userId: number,
  data: UpdateReviewData
) => {
  // ========================================
  // 1. GET EXISTING REVIEW
  // ========================================
  const existingReview = await prisma.review.findUnique({
    where: { id: reviewId }
  });

  if (!existingReview) {
    throw new Error('Review not found');
  }

  // ========================================
  // 2. CHECK OWNERSHIP
  // ========================================
  if (existingReview.user_id !== userId) {
    throw new Error('You can only update your own reviews');
  }

  // ========================================
  // 3. UPDATE REVIEW
  // ========================================
  const updatedReview = await prisma.review.update({
    where: { id: reviewId },
    data: {
      ...(data.rating !== undefined && { rating: data.rating }),
      ...(data.comment !== undefined && { comment: data.comment })
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          profile_picture: true
        }
      }
    }
  });

  // ========================================
  // 4. UPDATE EVENT AVERAGE RATING
  // ========================================
  await updateEventAverageRating(existingReview.event_id);

  return updatedReview;
};

// ========================================
// DELETE REVIEW
// ========================================
export const deleteReview = async (reviewId: number, userId: number) => {
  // ========================================
  // 1. GET EXISTING REVIEW
  // ========================================
  const existingReview = await prisma.review.findUnique({
    where: { id: reviewId }
  });

  if (!existingReview) {
    throw new Error('Review not found');
  }

  // ========================================
  // 2. CHECK OWNERSHIP
  // ========================================
  if (existingReview.user_id !== userId) {
    throw new Error('You can only delete your own reviews');
  }

  // ========================================
  // 3. DELETE REVIEW
  // ========================================
  await prisma.review.delete({
    where: { id: reviewId }
  });

  // ========================================
  // 4. UPDATE EVENT AVERAGE RATING
  // ========================================
  await updateEventAverageRating(existingReview.event_id);

  return { message: 'Review deleted successfully' };
};

// ========================================
// HELPER: UPDATE EVENT AVERAGE RATING
// ========================================
const updateEventAverageRating = async (eventId: number) => {
  // Calculate average rating from all reviews for this event
  const result = await prisma.review.aggregate({
    where: { event_id: eventId },
    _avg: { rating: true },
    _count: true
  });

  // Update event (no need to store in DB if calculated on-the-fly)
  // But for performance, we could cache it
  // For now, we'll calculate it on event queries
  
  return result;
};