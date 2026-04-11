import { requireRole } from './auth'

/**
 * Alias for requireRole from auth middleware
 * Usage: roleCheck(['organizer'])
 */
export const roleCheck = requireRole
