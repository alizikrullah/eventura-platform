import { Request, Response, NextFunction } from 'express'
import type { User } from '@prisma/client'
import jwt from 'jsonwebtoken'
import prisma from '../config/prisma'

type AuthRequest = Request & { user?: User }

export async function auth(req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> {
  const header = req.headers.authorization
  if (!header) return res.status(401).json({ message: 'Unauthorized' })
  const token = header.replace('Bearer ', '')
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev') as { userId: number }
    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user) return res.status(401).json({ message: 'Unauthorized' })
    req.user = user
    next()
  } catch (e) {
    return res.status(401).json({ message: 'Unauthorized' })
  }
}

export function requireRole(roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): Response | void => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' })
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' })
    next()
  }
}

