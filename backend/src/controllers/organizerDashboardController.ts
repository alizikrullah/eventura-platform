import { Request, Response } from 'express'
import * as organizerDashboardService from '../services/organizerDashboardService'
import type { OrganizerChartPeriod } from '../types/organizerDashboard'

const parsePositiveNumber = (value: unknown) => {
  if (typeof value !== 'string' || value.trim() === '') {
    return { value: undefined as number | undefined, isProvided: false, isValid: true }
  }

  const parsed = Number.parseInt(value, 10)

  return {
    value: Number.isNaN(parsed) || parsed <= 0 ? undefined : parsed,
    isProvided: true,
    isValid: !Number.isNaN(parsed) && parsed > 0,
  }
}

const isValidPeriod = (period: unknown): period is OrganizerChartPeriod =>
  period === 'year' || period === 'month' || period === 'day'

const getDaysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate()

export const getSummary = async (req: Request, res: Response) => {
  try {
    const organizerId = req.user!.id
    const summary = await organizerDashboardService.getOrganizerSummary(organizerId)

    return res.status(200).json({
      success: true,
      data: {
        summary,
      },
    })
  } catch (error: any) {
    console.error('Get organizer summary error:', error)

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve organizer summary',
      error: error.message,
    })
  }
}

export const getCharts = async (req: Request, res: Response) => {
  try {
    const organizerId = req.user!.id
    const period = req.query.period ?? 'month'
    const yearParam = parsePositiveNumber(req.query.year)
    const monthParam = parsePositiveNumber(req.query.month)
    const dayParam = parsePositiveNumber(req.query.day)

    if (!isValidPeriod(period)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid period. Use year, month, or day',
      })
    }

    if (!yearParam.isValid || !monthParam.isValid || !dayParam.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Year, month, and day must be positive integers when provided',
      })
    }

    const now = new Date()
    const resolvedYear = yearParam.value ?? now.getFullYear()
    const resolvedMonth = monthParam.value ?? now.getMonth() + 1

    if (monthParam.isProvided && (resolvedMonth < 1 || resolvedMonth > 12)) {
      return res.status(400).json({
        success: false,
        message: 'Month must be between 1 and 12',
      })
    }

    const maxDays = getDaysInMonth(resolvedYear, resolvedMonth)
    if (dayParam.isProvided && ((dayParam.value ?? 0) < 1 || (dayParam.value ?? 0) > maxDays)) {
      return res.status(400).json({
        success: false,
        message: `Day must be between 1 and ${maxDays} for the selected month`,
      })
    }

    const data = await organizerDashboardService.getOrganizerChartData(organizerId, {
      period,
      year: yearParam.value,
      month: monthParam.value,
      day: dayParam.value,
    })

    return res.status(200).json({
      success: true,
      data,
    })
  } catch (error: any) {
    console.error('Get organizer chart error:', error)

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve organizer chart data',
      error: error.message,
    })
  }
}

export const getAttendees = async (req: Request, res: Response) => {
  try {
    const organizerId = req.user!.id
    const pageParam = parsePositiveNumber(req.query.page)
    const limitParam = parsePositiveNumber(req.query.limit)
    const eventIdParam = parsePositiveNumber(req.query.eventId)

    if (!pageParam.isValid || !limitParam.isValid || !eventIdParam.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Page, limit, and eventId must be positive integers when provided',
      })
    }

    const data = await organizerDashboardService.getOrganizerAttendees(organizerId, {
      page: pageParam.value,
      limit: limitParam.value,
      eventId: eventIdParam.value,
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
    })

    return res.status(200).json({
      success: true,
      data,
    })
  } catch (error: any) {
    console.error('Get organizer attendees error:', error)

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve organizer attendees',
      error: error.message,
    })
  }
}