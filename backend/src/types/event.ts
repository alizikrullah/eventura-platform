import { Event, Category, User } from '@prisma/client'

export interface CreateEventPayload {
  name: string
  description?: string
  location: string
  venue?: string
  category_id: number
  total_seats?: number
  start_date: string
  end_date: string
  image?: Express.Multer.File
  ticket_types?: Array<{
    name: string
    price: number
    available_quantity: number
    description?: string
  }> | string
}

export interface UpdateEventPayload {
  name?: string
  description?: string
  location?: string
  venue?: string
  category_id?: number
  total_seats?: number
  start_date?: string
  end_date?: string
  image?: Express.Multer.File
  ticket_types?: Array<{
    db_id?: number
    name: string
    price: number
    available_quantity: number
    description?: string
  }> | string
}

export interface EventFilters {
  page?: number
  limit?: number
  category?: number
  location?: string
  search?: string
  sort?: 'newest' | 'oldest' | 'price_low' | 'price_high' | 'popular'
  date_from?: string
  date_to?: string
}

export type EventWithRelations = Event & {
  category: Category | null
  organizer: Pick<User, 'id' | 'name' | 'email'>
  _count?: {
    reviews: number
  }
  average_rating?: number
}