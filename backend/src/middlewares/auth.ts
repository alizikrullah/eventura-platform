import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../config/prisma'

export async function auth(req: Request & { user?: any }, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header) return res.status(401).json({ message: 'Unauthorized' })
  const token = header.replace('Bearer ', '')
  try {
    const payload: any = jwt.verify(token, process.env.JWT_SECRET || 'dev')
    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user) return res.status(401).json({ message: 'Unauthorized' })
    req.user = user
    next()
  } catch (e) {
    return res.status(401).json({ message: 'Unauthorized' })
  }
}

export function requireRole(roles: string[]) {
  return (req: Request & { user?: any }, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' })
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' })
    next()
  }
}
