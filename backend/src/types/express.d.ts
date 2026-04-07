import type { User } from '@prisma/client'
import type { Request } from 'express'

export interface AuthenticatedRequest extends Request {
  user: User
}

declare global {
  namespace Express {
    interface Request {
      user?: User
    }
  }
}

export {}
